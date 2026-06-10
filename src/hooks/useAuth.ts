import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';

import { useEffect, useState } from 'react';

import { auth, googleProvider } from '../lib/firebase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const googleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log('Google login successful:', result.user.email);
      return true;
    } catch (error) {
      console.error('Google login error (signInWithPopup):', error);
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

