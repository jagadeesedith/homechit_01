import * as XLSX from "xlsx";
import { doc, getDoc, writeBatch } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { distributionDocId, paymentDocId } from "@/lib/financialIds";
import type { Distribution, Member, MonthlyPayment } from "@/types";

export type ImportRowResult = "new" | "updated" | "skipped" | "error";

export type ImportReport = {
  newCount: number;
  updatedCount: number;
  skippedCount: number;
  errorCount: number;
  distributionNew: number;
  distributionSkipped: number;
  errors: string[];
};

function emptyReport(): ImportReport {
  return {
    newCount: 0,
    updatedCount: 0,
    skippedCount: 0,
    errorCount: 0,
    distributionNew: 0,
    distributionSkipped: 0,
    errors: [],
  };
}

function parseMonthField(monthValue: unknown): { month: number; year: number } {
  let month = 0;
  let year = 0;

  if (typeof monthValue === "number") {
    const parsedDate = XLSX.SSF.parse_date_code(monthValue);
    if (parsedDate) {
      month = parsedDate.m;
      year = parsedDate.y;
    }
  } else if (typeof monthValue === "string") {
    const date = new Date(monthValue);
    if (!isNaN(date.getTime())) {
      month = date.getMonth() + 1;
      year = date.getFullYear();
    }
  }

  return { month, year };
}

function num(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function paymentPayload(
  row: Record<string, unknown>,
  memberId: string,
  month: number,
  year: number,
  id: string,
): MonthlyPayment {
  return {
    id,
    memberId,
    month,
    year,
    previousBalance: num(row.PreviousBalance),
    contribution: num(row.Contribution),
    principalPaid: num(row.PrincipalPaid),
    interest: num(row.Interest),
    totalPaid: num(row.TotalPaid),
    newBalance: num(row.NewBalance),
    givenMoney: num(row["given amount"]),
    paidAt:
      typeof row.paidAt === "string" && row.paidAt
        ? row.paidAt
        : new Date().toISOString(),
  };
}

function paymentsMatch(
  a: MonthlyPayment,
  b: MonthlyPayment,
): boolean {
  return (
    a.memberId === b.memberId &&
    a.month === b.month &&
    a.year === b.year &&
    a.previousBalance === b.previousBalance &&
    a.contribution === b.contribution &&
    a.principalPaid === b.principalPaid &&
    a.interest === b.interest &&
    a.totalPaid === b.totalPaid &&
    a.newBalance === b.newBalance &&
    a.givenMoney === b.givenMoney
  );
}

const BATCH_LIMIT = 450;

async function commitBatch<T extends object>(
  ops: Array<{
    ref: ReturnType<typeof doc>;
    data: T;
  }>,
): Promise<void> {
  for (let i = 0; i < ops.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    for (const op of ops.slice(i, i + BATCH_LIMIT)) {
      batch.set(op.ref, op.data, { merge: true });
    }
    await batch.commit();
  }
}

export async function importPaymentHistoryFiles(
  files: File[],
  userId: string,
  members: Member[],
): Promise<ImportReport> {
  const report = emptyReport();
  const paymentOps: Array<{
    ref: ReturnType<typeof doc>;
    data: MonthlyPayment;
  }> = [];
  const distributionOps: Array<{
    ref: ReturnType<typeof doc>;
    data: Distribution;
  }> = [];
  const seenDistributionKeys = new Set<string>();

  for (const file of files) {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];

    for (const row of rows) {
      try {
        const memberId = String(row.memberID ?? "").trim();
        if (!memberId) continue;

        if (members.length > 0 && !members.some((m) => m.id === memberId)) {
          report.skippedCount += 1;
          report.errors.push(`Unknown member ID: ${memberId}`);
          continue;
        }

        const { month, year } = parseMonthField(row.Month);
        if (!month || !year) {
          report.skippedCount += 1;
          continue;
        }

        const id = paymentDocId(memberId, month, year);
        const incoming = paymentPayload(row, memberId, month, year, id);

        const existingSnap = await getDoc(
          doc(db, "users", userId, "payments", id),
        );

        if (existingSnap.exists()) {
          const existing = {
            id,
            ...(existingSnap.data() as Omit<MonthlyPayment, "id">),
          };
          if (paymentsMatch(existing, incoming)) {
            report.skippedCount += 1;
          } else {
            paymentOps.push({
              ref: doc(db, "users", userId, "payments", id),
              data: incoming,
            });
            report.updatedCount += 1;
          }
        } else {
          paymentOps.push({
            ref: doc(db, "users", userId, "payments", id),
            data: incoming,
          });
          report.newCount += 1;
        }

        const givenMoney = num(row["given amount"]);
        if (givenMoney > 0) {
          const distKey = `${year}-${month}-${memberId}`;
          if (seenDistributionKeys.has(distKey)) {
            report.distributionSkipped += 1;
          } else {
            seenDistributionKeys.add(distKey);
            const distId = distributionDocId(memberId, month, year);
            const distRef = doc(db, "users", userId, "distributions", distId);
            const distSnap = await getDoc(distRef);

            if (distSnap.exists()) {
              report.distributionSkipped += 1;
            } else {
              distributionOps.push({
                ref: distRef,
                data: {
                  id: distId,
                  memberId,
                  month,
                  year,
                  amount: givenMoney,
                  givenAt: new Date().toISOString(),
                },
              });
              report.distributionNew += 1;
            }
          }
        }
      } catch (err) {
        report.errorCount += 1;
        const message = err instanceof Error ? err.message : String(err);
        report.errors.push(message);
      }
    }
  }

  try {
    if (paymentOps.length > 0) {
      await commitBatch(paymentOps);
    }
    if (distributionOps.length > 0) {
      await commitBatch(distributionOps);
    }
  } catch (err) {
    report.errorCount += paymentOps.length + distributionOps.length;
    const message = err instanceof Error ? err.message : String(err);
    report.errors.push(`Batch write failed: ${message}`);
    throw err;
  }

  return report;
}

export function formatImportReport(report: ImportReport): string {
  const lines = [
    `New payments: ${report.newCount}`,
    `Updated payments: ${report.updatedCount}`,
    `Skipped (unchanged): ${report.skippedCount}`,
    `New distributions: ${report.distributionNew}`,
    `Skipped distributions: ${report.distributionSkipped}`,
  ];
  if (report.errorCount > 0) {
    lines.push(`Errors: ${report.errorCount}`);
    if (report.errors.length > 0) {
      lines.push(report.errors.slice(0, 5).join("\n"));
    }
  }
  return lines.join("\n");
}
