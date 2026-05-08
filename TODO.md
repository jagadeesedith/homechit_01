# TODO - Firebase SaaS Upgrade

## Step 0: Prep & dependency plan
- [x] Repo analysis: routing/auth/persistence reviewed
- [ ] Add Firebase dependencies

## Step 1: Firebase scaffolding
- [ ] Create `src/firebase/auth.ts` (Google + email/password helpers)
- [ ] Create `src/firebase/firestore.ts` (Firestore helpers)

## Step 2: Auth pages + routing
- [ ] Replace internals of `src/pages/LoginPage.tsx` with premium fintech UI + Google/email/password
- [ ] Add `src/pages/SignupPage.tsx`
- [ ] Add `src/pages/ForgotPasswordPage.tsx`
- [ ] Update `src/App.tsx` routes for `/signup` and `/forgot-password`

## Step 3: Protected routes & session
- [ ] Replace `src/hooks/useAuth.ts` to use `onAuthStateChanged`
- [ ] Update `src/components/ProtectedRoute.tsx` to use loading state + redirect

## Step 4: Firestore-backed data persistence (preserve business logic)
- [ ] Update `src/context/ChitFundContext.tsx` to:
  - [ ] attach realtime listeners for members/payments/distributions/settings per user
  - [ ] persist mutations to Firestore (batched where needed)
  - [ ] keep reducer/calculation logic unchanged
- [ ] Introduce user-profile in Firestore: `users/{uid}`

## Step 5: Backward compatibility migration
- [ ] Migrate existing localStorage data into Firestore on first login per user (guarded by a migration flag)

## Step 6: Security rules & hardening
- [ ] Add Firestore security rules (tenant isolation by ownerId == request.auth.uid)
- [ ] Validate error handling + toast notifications

## Step 7: Performance polish
- [ ] Reduce Firestore reads where possible (query indexes)
- [ ] Add skeleton/loading states if needed

## Step 8: Test
- [ ] Verify protected routes
- [ ] Verify auth (Google + email/password)
- [ ] Verify realtime sync updates UI
- [ ] Verify calculations/payment formulas unchanged

