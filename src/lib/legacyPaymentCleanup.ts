import {
  collection,
  doc,
  getDocs,
  writeBatch,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { legacyPaymentDocIds, paymentDocId } from "@/lib/financialIds";
import type { MonthlyPayment } from "@/types";

export type LegacyCleanupReport = {
  keptCount: number;
  deletedCount: number;
  groupsProcessed: number;
};

const BATCH_LIMIT = 450;

function periodKey(p: MonthlyPayment): string {
  return `${p.year}-${p.month}-${p.memberId}`;
}

export async function consolidateLegacyPaymentDocs(
  userId: string,
): Promise<LegacyCleanupReport> {
  const snap = await getDocs(collection(db, "users", userId, "payments"));
  const byPeriod = new Map<string, { docIds: string[]; payments: MonthlyPayment[] }>();

  for (const docSnap of snap.docs) {
    const payment: MonthlyPayment = {
      id: docSnap.id,
      ...(docSnap.data() as Omit<MonthlyPayment, "id">),
    };
    const key = periodKey(payment);
    const group = byPeriod.get(key) ?? { docIds: [], payments: [] };
    group.docIds.push(docSnap.id);
    group.payments.push(payment);
    byPeriod.set(key, group);
  }

  const toDelete: string[] = [];
  let keptCount = 0;

  for (const [, group] of byPeriod) {
    const sample = group.payments[0];
    const canonicalId = paymentDocId(
      sample.memberId,
      sample.month,
      sample.year,
    );
    const legacyIds = new Set(
      legacyPaymentDocIds(sample.memberId, sample.month, sample.year),
    );

    const canonicalExists = group.docIds.includes(canonicalId);
    const keepId = canonicalExists
      ? canonicalId
      : group.docIds.find((id) => legacyIds.has(id)) ?? group.docIds[0];

    keptCount += 1;
    for (const docId of group.docIds) {
      if (docId !== keepId) {
        toDelete.push(docId);
      }
    }
  }

  for (let i = 0; i < toDelete.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    for (const docId of toDelete.slice(i, i + BATCH_LIMIT)) {
      batch.delete(doc(db, "users", userId, "payments", docId));
    }
    await batch.commit();
  }

  return {
    keptCount,
    deletedCount: toDelete.length,
    groupsProcessed: byPeriod.size,
  };
}
