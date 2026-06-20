import type { MonthlyPayment } from "@/types";
import { paymentDocId } from "@/lib/financialIds";

/** Collapse legacy + canonical doc IDs for the same member/month/year. */
export function normalizePaymentsCatalog(
  payments: MonthlyPayment[],
): MonthlyPayment[] {
  const byPeriodMember = new Map<string, MonthlyPayment>();

  for (const payment of payments) {
    const canonicalId = paymentDocId(
      payment.memberId,
      payment.month,
      payment.year,
    );
    const key = `${payment.year}-${payment.month}-${payment.memberId}`;
    const normalized: MonthlyPayment = {
      ...payment,
      id: canonicalId,
    };

    const existing = byPeriodMember.get(key);
    if (!existing) {
      byPeriodMember.set(key, normalized);
      continue;
    }

    const existingTime = Date.parse(existing.paidAt || "") || 0;
    const paymentTime = Date.parse(normalized.paidAt || "") || 0;
    if (paymentTime >= existingTime) {
      byPeriodMember.set(key, normalized);
    }
  }

  return Array.from(byPeriodMember.values());
}

/** One payment per member — keeps the row with the latest paidAt. */
export function dedupePaymentsByMember(
  payments: MonthlyPayment[],
): MonthlyPayment[] {
  const byMember = new Map<string, MonthlyPayment>();

  for (const payment of payments) {
    const existing = byMember.get(payment.memberId);
    if (!existing) {
      byMember.set(payment.memberId, payment);
      continue;
    }
    const existingTime = Date.parse(existing.paidAt || "") || 0;
    const paymentTime = Date.parse(payment.paidAt || "") || 0;
    if (paymentTime >= existingTime) {
      byMember.set(payment.memberId, payment);
    }
  }

  return Array.from(byMember.values());
}

export function getPaidMemberIds(
  payments: MonthlyPayment[],
  month: number,
  year: number,
): Set<string> {
  const monthPayments = payments.filter(
    (p) => p.month === month && p.year === year,
  );
  return new Set(dedupePaymentsByMember(monthPayments).map((p) => p.memberId));
}

export function sumTotalPaid(
  payments: MonthlyPayment[],
  month: number,
  year: number,
): number {
  const monthPayments = payments.filter(
    (p) => p.month === month && p.year === year,
  );
  return dedupePaymentsByMember(monthPayments).reduce(
    (sum, p) => sum + p.contribution + p.principalPaid + p.interest,
    0,
  );
}
