import {
  signInWithRedirect,
  signOut,
  onAuthStateChanged,
  getRedirectResult,
  type User
} from 'firebase/auth';


import {
  useEffect,
  useState
} from 'react';

import {
  auth,
  googleProvider
} from '../lib/firebase';

export function useAuth() {

  const [user, setUser] =
    useState<User | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      }
    );

    // Complete redirect-based sign-in (Tauri/APK friendly flow)
    (async () => {
      try {
        await getRedirectResult(auth);
      } catch (e) {
        console.error('Google redirect result error:', e);
      }
    })();

    return () => unsubscribe();
  }, []);


  const googleLogin = async () => {
    try {
      // Redirect flow: completes after app reload
      await signInWithRedirect(auth, googleProvider);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }; 


  const logout = async () => {

    await signOut(auth);
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    googleLogin,
    logout
  };
}
