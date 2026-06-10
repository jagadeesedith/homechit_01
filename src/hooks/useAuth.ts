import {
  signInWithRedirect,
  signOut,
  onAuthStateChanged,
  getRedirectResult,
  type User,
} from 'firebase/auth';

import { useEffect, useRef, useState } from 'react';

import { auth, googleProvider } from '../lib/firebase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const handledRedirectResultRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    const completeRedirectFlow = async () => {
      if (handledRedirectResultRef.current) return;
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          console.log('Google redirect result received (desktop):', {
            providerId: result.providerId,
            operationType: result.operationType,
            hasUser: !!result.user,
          });
        }
      } catch (e) {
        console.error('Google redirect result error (desktop):', e);
      } finally {
        // Don’t block auth listener; it will update user.
        handledRedirectResultRef.current = true;
      }
    };

    // Normal web redirect flow: attempt once on mount.
    // (Firebase will finalize the redirect using the current URL.)
    completeRedirectFlow();

    return () => {
      unsubscribe();
    };
  }, []);

  const googleLogin = async () => {
    try {
      await signInWithRedirect(auth, googleProvider);
      return true;
    } catch (error) {
      console.error('Google login redirect error (signInWithRedirect):', error);
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
    logout,
  };
}

