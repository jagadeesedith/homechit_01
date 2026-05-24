import { resolveOutstandingBalance } from "@/lib/paymentMath";
import {
  dedupePaymentsByMember,
  getPaidMemberIds,
  sumTotalPaid,
} from "@/lib/monthPayments";
import type { Distribution, Member, MonthlyPayment, Settings } from "@/types";

export type ConsistencyReport = {
  month: number;
  year: number;
  paidCount: number;
  pendingCount: number;
  totalCollected: number;
  totalDistributed: number;
  remainingDistribution: number;
  balanceWarnings: string[];
};

export function buildConsistencyReport(
  members: Member[],
  payments: MonthlyPayment[],
  distributions: Distribution[],
  settings: Settings,
  month: number,
  year: number,
): ConsistencyReport {
  const paidIds = getPaidMemberIds(payments, month, year);
  const paidCount = paidIds.size;
  const pendingCount = Math.max(0, members.length - paidCount);
  const totalCollected = sumTotalPaid(payments, month, year);
  const totalDistributed = distributions
    .filter((d) => d.month === month && d.year === year)
    .reduce((sum, d) => sum + d.amount, 0);
  const remainingDistribution = totalCollected - totalDistributed;

  const balanceWarnings: string[] = [];

  for (const member of members) {
    const memberPayments = payments
      .filter((p) => p.memberId === member.id)
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      });
    const resolved = resolveOutstandingBalance(member, memberPayments);
    const ledger =
      memberPayments.length > 0
        ? memberPayments[memberPayments.length - 1].newBalance
        : 0;

    if ((member.balance ?? 0) > ledger + 0.01) {
      balanceWarnings.push(
        `Member ${member.id}: loan balance ₹${member.balance} exceeds ledger ₹${ledger} (resolved outstanding ₹${resolved})`,
      );
    }
  }

  const monthPayments = payments.filter(
    (p) => p.month === month && p.year === year,
  );
  const rawCount = monthPayments.length;
  const dedupedCount = dedupePaymentsByMember(monthPayments).length;
  if (rawCount > dedupedCount) {
    balanceWarnings.push(
      `Month ${month}/${year}: ${rawCount - dedupedCount} duplicate payment doc(s) in data — run Consolidate duplicate payments`,
    );
  }

  void settings;

  return {
    month,
    year,
    paidCount,
    pendingCount,
    totalCollected,
    totalDistributed,
    remainingDistribution,
    balanceWarnings,
  };
}
