# Chit Fund Financial Logic

This document describes how money is calculated in the app. The implementation lives in:

- `src/lib/paymentMath.ts` — formulas (unit-tested)
- `src/context/ChitFundContext.tsx` — Firestore reads/writes
- `src/lib/monthPayments.ts` — per-month dedupe and totals

## Source of truth for outstanding balance

When calculating interest for a new payment:

```
outstanding = max(lastPayment.newBalance, member.balance)
```

- **Ledger** (`payments[].newBalance`) — updated each month when a payment is recorded.
- **Member balance** (`member.balance`) — updated when a **loan/distribution** is given (`addDistribution`).

Using `max()` ensures a loan given after the last payment still increases interest on the next collection.

## Payment formulas

For each collection (`recordPayment` or mark-paid):

```
interest     = outstanding × (interestRate / 100)
totalPaid    = contribution + principalPaid + interest
newBalance   = max(0, outstanding - principalPaid)
```

- **contribution** — `firstMonthAmount` for the configured start month/year, else `monthlyAmount`.
- **principalPaid** — extra paydown entered in the payment modal (0 for mark-all-paid).

### Example

| Field | Value |
|-------|-------|
| Outstanding (after ₹50,000 loan) | ₹95,000 |
| Contribution | ₹500 |
| Principal paid | ₹5,000 |
| Interest rate | 2% |

```
interest   = 95,000 × 0.02 = ₹1,900
totalPaid  = 500 + 5,000 + 1,900 = ₹7,400
newBalance = 95,000 - 5,000 = ₹90,000
```

## Monthly totals (Dashboard, Monthly Summary)

All pages use the same helpers:

| Metric | Rule |
|--------|------|
| Members paid | Unique `memberId` with a payment for that month/year (deduped) |
| Total collected | Sum of `totalPaid` after dedupe |
| Pending | `totalMembers - paidCount` |
| Remaining for distribution | `totalCollected - sum(distributions.amount)` |

Duplicate Firestore docs for the same member/month are collapsed in memory via `normalizePaymentsCatalog` on load and `dedupePaymentsByMember` for month views.

## Distribution (loans)

- One loan per member per calendar month (`distributionDocId`).
- Cannot distribute more than **remaining** pool for that month.
- Increases `member.balance` by loan amount (does not create a payment row).

## Import behavior

`src/lib/importHistory.ts`:

- Document ID: `YYYY-MM-memberId` (zero-padded month)
- Unchanged row → **skipped**
- Changed row → **updated** (`merge: true`)
- New row → **created**
- Re-importing the same file should not corrupt data

## Legacy payment IDs

Older imports may have used `2026-4-12` instead of `2026-04-12`. Use **Settings → Consolidate duplicate payments** to delete legacy duplicates and keep the canonical doc.

## Manual verification checklist

Before production use with real money:

1. Pick one member and month (e.g. Member 12, April 2026).
2. Compare **Total collected**, **paid count**, and **pending** on Dashboard vs Monthly Summary.
3. Record a payment — Member History row must match the modal totals.
4. Give a loan — Distribution remaining decreases; next month’s interest uses the higher outstanding.
5. Re-import the same Excel — mostly **Skipped**.
6. Hard refresh and logout/login — numbers unchanged.

Run automated checks: `npm test`
