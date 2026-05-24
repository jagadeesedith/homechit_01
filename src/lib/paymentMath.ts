import type { Member, MonthlyPayment } from "@/types";

export type PaymentCalculationInput = {
  outstanding: number;
  contribution: number;
  principalPaid: number;
  interestRate: number;
};

export type PaymentCalculationResult = {
  previousBalance: number;
  contribution: number;
  principalPaid: number;
  interest: number;
  totalPaid: number;
  newBalance: number;
};

/**
 * Outstanding balance for interest: max(ledger newBalance, member.balance).
 * Loans update member.balance; payments update ledger newBalance.
 */
export function resolveOutstandingBalance(
  member: Member | undefined,
  payments: MonthlyPayment[],
): number {
  const ledger =
    payments.length > 0 ? payments[payments.length - 1].newBalance : 0;
  const stored = member?.balance ?? 0;
  return Math.max(ledger, stored);
}

export function calculatePayment(
  input: PaymentCalculationInput,
): PaymentCalculationResult {
  const outstanding = Math.max(0, input.outstanding);
  const contribution = Math.max(0, input.contribution);
  const principalPaid = Math.max(0, input.principalPaid);
  const interest = (outstanding * input.interestRate) / 100;
  const totalPaid = contribution + principalPaid + interest;
  const newBalance = Math.max(0, outstanding - principalPaid);

  return {
    previousBalance: outstanding,
    contribution,
    principalPaid,
    interest,
    totalPaid,
    newBalance,
  };
}
