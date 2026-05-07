import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Coins, Lock, User } from 'lucide-react';

export function LoginPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = login(username, password);
    if (success) {
      navigate('/', { replace: true });
    } else {
      setError('Invalid username or password');
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
            <h1 className="text-2xl font-semibold text-[#1d1d1d]">Chit Fund Manager</h1>
            <p className="text-sm text-[#6c757d] mt-1">Sign in to your dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1d1d1d] mb-1.5">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6c757d]" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-[#e9ecef] focus:outline-none focus:ring-2 focus:ring-[#004b87] focus:border-transparent"
                  placeholder="Enter username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1d1d1d] mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6c757d]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-[#e9ecef] focus:outline-none focus:ring-2 focus:ring-[#004b87] focus:border-transparent"
                  placeholder="Enter password"
                />
              </div>
            </div>

            {error && (
              <div className="bg-[#f8d7da] border border-[#dc3545] rounded-lg p-3 text-sm text-[#dc3545]">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-[#004b87] text-white text-sm font-medium rounded-lg hover:bg-[#003a6b] transition-colors duration-200"
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-[#6c757d]">Default: username <strong>admin</strong> / password <strong>admin</strong></p>
          </div>
        </div>
      </div>
    </div>
  );
}
