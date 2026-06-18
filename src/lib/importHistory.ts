import * as XLSX from "xlsx";
import { doc, getDoc, writeBatch, type DocumentReference } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { distributionDocId, paymentDocId } from "@/lib/financialIds";
import type { Distribution, Member, MonthlyPayment } from "@/types";

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

type ParsedRow = {
  memberId: string;
  month: number;
  year: number;
  payment: MonthlyPayment;
  givenMoney: number;
};

async function fetchExistingDocs(
  refs: DocumentReference[],
): Promise<Map<string, Record<string, unknown>>> {
  const map = new Map<string, Record<string, unknown>>();
  const CHUNK = 50;
  for (let i = 0; i < refs.length; i += CHUNK) {
    const chunk = refs.slice(i, i + CHUNK);
    const snaps = await Promise.all(chunk.map((ref) => getDoc(ref)));
    for (const snap of snaps) {
      if (snap.exists()) {
        map.set(snap.id, snap.data());
      }
    }
  }
  return map;
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

  // Phase 1: parse all rows into ParsedRow[], collecting doc refs
  const parsedRows: ParsedRow[] = [];
  const paymentRefs: DocumentReference[] = [];
  const distributionRefs: DocumentReference[] = [];
  const distIdToKey = new Map<string, string>();

  for (const file of files) {
    const buf = await file.arrayBuffer();
    const workbook = XLSX.read(buf);
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
        const payment = paymentPayload(row, memberId, month, year, id);
        const givenMoney = num(row["given amount"]);

        parsedRows.push({ memberId, month, year, payment, givenMoney });
        paymentRefs.push(doc(db, "users", userId, "payments", id));

        if (givenMoney > 0) {
          const distKey = `${year}-${month}-${memberId}`;
          if (!seenDistributionKeys.has(distKey)) {
            seenDistributionKeys.add(distKey);
            const distId = distributionDocId(memberId, month, year);
            distIdToKey.set(distId, distKey);
            distributionRefs.push(
              doc(db, "users", userId, "distributions", distId),
            );
          }
        }
      } catch (err) {
        report.errorCount += 1;
        const message = err instanceof Error ? err.message : String(err);
        report.errors.push(message);
      }
    }
  }

  // Phase 2: batch fetch existing payment and distribution docs
  const [existingPayments, existingDistributions] = await Promise.all([
    fetchExistingDocs(paymentRefs),
    fetchExistingDocs(distributionRefs),
  ]);

  // Phase 3: process rows using pre-fetched data (no more sequential getDoc)
  for (const { memberId, month, year, payment, givenMoney } of parsedRows) {
    const paymentId = paymentDocId(memberId, month, year);
    const paymentRef = doc(db, "users", userId, "payments", paymentId);
    const existingPaymentData = existingPayments.get(paymentId);

    if (existingPaymentData) {
      const existing = {
        id: paymentId,
        ...(existingPaymentData as Omit<MonthlyPayment, "id">),
      };
      if (paymentsMatch(existing, payment)) {
        report.skippedCount += 1;
      } else {
        paymentOps.push({ ref: paymentRef, data: payment });
        report.updatedCount += 1;
      }
    } else {
      paymentOps.push({ ref: paymentRef, data: payment });
      report.newCount += 1;
    }

    // Validation: warn if distributions exceed collections for a month
    // (carry-forward from previous months may legitimately cover the difference)
    // This is a warning only — we trust the Excel source data.
    if (givenMoney > 0) {
      const distId = distributionDocId(memberId, month, year);
      const distKey = distIdToKey.get(distId);
      if (distKey && existingDistributions.has(distId)) {
        report.distributionSkipped += 1;
      } else if (distKey) {
        distributionOps.push({
          ref: doc(db, "users", userId, "distributions", distId),
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

  // Warn if any month's distributions exceed its collections
  const collectedByPeriod = new Map<string, number>();
  const distributedByPeriod = new Map<string, number>();

  for (const { month: m, year: y, payment } of parsedRows) {
    const key = `${y}-${m}`;
    collectedByPeriod.set(key, (collectedByPeriod.get(key) ?? 0) + payment.totalPaid);
  }
  for (const op of distributionOps) {
    const key = `${op.data.year}-${op.data.month}`;
    distributedByPeriod.set(key, (distributedByPeriod.get(key) ?? 0) + op.data.amount);
  }
  for (const [period, distTotal] of distributedByPeriod) {
    const collTotal = collectedByPeriod.get(period) ?? 0;
    if (distTotal > collTotal) {
      report.errors.push(
        `Warning ${period}: distributed ₹${distTotal} > collected ₹${collTotal}. Previous month carry-forward may cover this.`
      );
    }
  }

  // Phase 4: batch write
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
