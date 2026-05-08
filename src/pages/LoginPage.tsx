import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/hooks/useAuth';

import { Coins } from 'lucide-react';

export function LoginPage() {

  const [error, setError] =
    useState('');

  const { googleLogin } =
    useAuth();

  const navigate =
    useNavigate();

  const handleGoogleLogin =
    async () => {

      setError('');

      const success =
        await googleLogin();

      if (success) {

        navigate('/', {
          replace: true
        });

      } else {

        setError(
          'Google login failed'
        );
      }
    };

  return (

    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">

      <div className="w-full max-w-md">

        <div className="bg-white rounded-xl border border-[#e9ecef] shadow-sm p-8">

          <div className="flex flex-col items-center mb-8">

            <div className="w-14 h-14 bg-[#004b87] rounded-xl flex items-center justify-center mb-4">

              <Coins className="w-7 h-7 text-white" />

            </div>

            <h1 className="text-2xl font-semibold text-[#1d1d1d]">
              Chit Fund Manager
            </h1>

            <p className="text-sm text-[#6c757d] mt-1">
              Sign in to your dashboard
            </p>

          </div>

          {error && (

            <div className="bg-[#ff8e97] border border-[#dc3545] rounded-lg p-3 text-sm text-[#dc3545] mb-4">

              {error}

            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full py-3 bg-[#004b87] text-white text-sm font-medium rounded-lg hover:bg-[#003a6b] transition-colors duration-200"
          >
            Sign in with Google
          </button>

        </div>

      </div>

    </div>
  );
}