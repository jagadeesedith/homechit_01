# TODO

- [ ] Step 1: Fix `MemberListPage.tsx` Excel import loop to match required logic (trim, skip empty, required console logs, call `addMember` with correct fields).
- [ ] Step 2: Fix `ChitFundContext.tsx` so `addMember()` dispatch updates state (add reducer `case 'SET_STATE'` or change dispatch to an existing reducer action).
- [ ] Step 3: Verify TypeScript correctness and that manual add member still works.
- [ ] Step 4: Confirm Excel import instantly updates members table in UI.

