# Manual cross-page test matrix

Run after `npm test` and `npm run build` pass. Use a **test Firebase project** or backup first.

**Pass rule:** every amount matches across pages. **₹1 mismatch = fail.**

## Setup

| Step | Action | Expected |
|------|--------|----------|
| 1 | Note Settings: first month ₹, monthly ₹, interest % | Record values |
| 2 | Select **April 2026** on Dashboard | Header shows Apr 2026 |

## Member 12 (or any test member)

| Step | Page | Action | Check |
|------|------|--------|-------|
| 3 | Dashboard | Record payment for M12 | Card shows paid |
| 4 | Dashboard | Note Total Collected | Value **A** |
| 5 | Monthly Summary | Same month/year | Total Collected = **A**, paid count matches |
| 6 | Member History | Open M12 | Row totalPaid = modal total |
| 7 | Settings → Data health | View panel | Paid / Collected / Pending match Dashboard |
| 8 | Distribution | Give loan to M12 | Remaining decreases by loan amount |
| 9 | Dashboard | May 2026 → open M12 payment | Interest uses **max(ledger, member.balance)** |
| 10 | Member List | M12 balance column | Matches Member History current balance |

## Import

| Step | Action | Expected |
|------|--------|----------|
| 11 | Import Excel once | new/updated counts shown |
| 12 | Import **same** file again | Mostly **Skipped**, totals unchanged |

## Persistence

| Step | Action | Expected |
|------|--------|----------|
| 13 | Hard refresh (F5) | All numbers identical |
| 14 | Logout → login | All numbers identical |

## Optional cleanup

| Step | Action | Expected |
|------|--------|----------|
| 15 | Settings → Consolidate duplicate payments | Report deleted count; totals unchanged |

## Sign-off

- [ ] All steps passed
- [ ] `npm test` passed
- [ ] Ready for production money use
