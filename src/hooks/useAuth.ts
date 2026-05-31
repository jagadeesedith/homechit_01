import {
  signInWithRedirect,
  signOut,
  onAuthStateChanged,
  getRedirectResult,
  type User,
} from 'firebase/auth';

import { useEffect, useRef, useState } from 'react';

import { auth, googleProvider } from '../lib/firebase';

const CALLBACK_PATH = '/auth/callback';

function hasTauriAuthCallbackUrl(url: string) {
  try {
    // Works for: homechit://auth/callback?...
    // and: http(s)://.../auth/callback?...
    const u = new URL(url);
    return u.pathname === CALLBACK_PATH;
  } catch {
    return false;
  }
}

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

    // 1) If app was launched via the deep-link, URL should be present.
    if (typeof window !== 'undefined') {
      const current = window.location.href;
      if (hasTauriAuthCallbackUrl(current)) {
        completeRedirectFlow();
      }
    }

    // 2) Some platforms dispatch the deep-link after launch.
    // Tauri sends a custom URL to the webview via window location.
    const onPopState = () => {
      if (typeof window === 'undefined') return;
      const current = window.location.href;
      if (hasTauriAuthCallbackUrl(current)) {
        completeRedirectFlow();
      }
    };

    window.addEventListener('popstate', onPopState);

    // Also attempt once on mount (covers cases where callback returns to the same SPA URL).
    // But mark it as handled only after getRedirectResult completes.
    completeRedirectFlow();

    return () => {
      window.removeEventListener('popstate', onPopState);
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

