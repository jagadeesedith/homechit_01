# TODO - Google login fix (Firebase Redirect)

## Step 1
- Inspect existing auth flow implementation.

## Step 2
- Update `src/hooks/useAuth.ts`:
  - Replace `signInWithPopup` with `signInWithRedirect`.
  - Add redirect completion via `getRedirectResult(auth)`.

✅ Done

## Step 3
- Update `src/pages/LoginPage.tsx` to not depend on immediate success return for navigation.

✅ Done


## Step 4
- Run `npm run dev` and verify Google login in browser.

## Step 5
- Rebuild Tauri app and test login.

## Step 6
- Rebuild Android APK and test login.

## Step 7
- If still failing, verify Firebase Auth Authorized domains include localhost / 127.0.0.1 / deployed domain.

