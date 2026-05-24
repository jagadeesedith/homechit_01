import { describe, expect, it } from "vitest";

import { dedupePaymentsByMember, sumTotalPaid } from "@/lib/monthPayments";
import type { Member, MonthlyPayment } from "@/types";
import {
  calculatePayment,
  resolveOutstandingBalance,
} from "@/lib/paymentMath";

const member = (id: string, balance: number): Member => ({
  id,
  name: `Member ${id}`,
  phone: "",
  joinDate: "",
  balance,
});

const payment = (
  overrides: Partial<MonthlyPayment> & Pick<MonthlyPayment, "memberId" | "month" | "year">,
): MonthlyPayment => ({
  id: "p1",
  previousBalance: 0,
  contribution: 500,
  principalPaid: 0,
  interest: 0,
  totalPaid: 500,
  newBalance: 0,
  givenMoney: 0,
  paidAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

describe("resolveOutstandingBalance", () => {
  it("returns member.balance when there are no payments", () => {
    expect(resolveOutstandingBalance(member("12", 50_000), [])).toBe(50_000);
  });

  it("returns ledger balance when higher than member.balance", () => {
    const payments = [
      payment({
        memberId: "12",
        month: 4,
        year: 2026,
        newBalance: 45_000,
      }),
    ];
    expect(resolveOutstandingBalance(member("12", 30_000), payments)).toBe(45_000);
  });

  it("returns member.balance when loan raised balance above ledger", () => {
    const payments = [
      payment({
        memberId: "12",
        month: 4,
        year: 2026,
        newBalance: 45_000,
      }),
    ];
    expect(resolveOutstandingBalance(member("12", 95_000), payments)).toBe(95_000);
  });
});

describe("calculatePayment", () => {
  it("first month with no loan: interest 0, total = contribution", () => {
    const result = calculatePayment({
      outstanding: 0,
      contribution: 2000,
      principalPaid: 0,
      interestRate: 2,
    });
    expect(result.interest).toBe(0);
    expect(result.totalPaid).toBe(2000);
    expect(result.newBalance).toBe(0);
  });

  it("principal paydown with interest on outstanding", () => {
    const result = calculatePayment({
      outstanding: 50_000,
      contribution: 500,
      principalPaid: 5000,
      interestRate: 2,
    });
    expect(result.interest).toBe(1000);
    expect(result.totalPaid).toBe(6500);
    expect(result.newBalance).toBe(45_000);
  });

  it("mark-all-paid style: principal 0 keeps newBalance at outstanding", () => {
    const result = calculatePayment({
      outstanding: 95_000,
      contribution: 500,
      principalPaid: 0,
      interestRate: 2,
    });
    expect(result.interest).toBe(1900);
    expect(result.totalPaid).toBe(2400);
    expect(result.newBalance).toBe(95_000);
  });
});

describe("six-month scenario", () => {
  it("chains balances month over month with principal paydown", () => {
    let outstanding = 50_000;
    const contribution = 500;
    const rate = 2;

    for (let month = 1; month <= 6; month += 1) {
      const principalPaid = month === 2 ? 5000 : 1000;
      const result = calculatePayment({
        outstanding,
        contribution,
        principalPaid,
        interestRate: rate,
      });
      expect(result.previousBalance).toBe(outstanding);
      expect(result.newBalance).toBe(
        Math.max(0, outstanding - principalPaid),
      );
      outstanding = result.newBalance;
    }

    expect(outstanding).toBe(40_000);
  });
});

describe("month payment dedupe", () => {
  it("sums totalPaid once per member for a month", () => {
    const payments: MonthlyPayment[] = [
      payment({
        id: "2026-04-12",
        memberId: "12",
        month: 4,
        year: 2026,
        totalPaid: 5000,
        paidAt: "2026-04-01T00:00:00.000Z",
      }),
      payment({
        id: "2026-04-12-legacy",
        memberId: "12",
        month: 4,
        year: 2026,
        totalPaid: 9999,
        paidAt: "2026-04-02T00:00:00.000Z",
      }),
      payment({
        id: "2026-04-13",
        memberId: "13",
        month: 4,
        year: 2026,
        totalPaid: 3000,
        paidAt: "2026-04-01T00:00:00.000Z",
      }),
    ];

    const deduped = dedupePaymentsByMember(
      payments.filter((p) => p.month === 4 && p.year === 2026),
    );
    expect(deduped).toHaveLength(2);
    expect(sumTotalPaid(payments, 4, 2026)).toBe(9999 + 3000);
  });
});
