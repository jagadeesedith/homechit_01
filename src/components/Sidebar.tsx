import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarRange,
  History,
  HandCoins,
  Users,
  Settings,
  LogOut,
  Coins,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/monthly-summary', label: 'Monthly Summary', icon: CalendarRange },
  { path: '/member-history', label: 'Member History', icon: History },
  { path: '/distribution', label: 'Distribution', icon: HandCoins },
  { path: '/members', label: 'Member List', icon: Users },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const { logout } = useAuth();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-[280px] min-h-screen flex-col fixed left-0 top-0 border-r border-white/10 bg-gradient-to-b from-slate-900 to-blue-950 text-white/90 backdrop-blur-xl">
        <div className="p-6 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/25 ring-1 ring-white/10">
              <Coins className="w-5 h-5 text-white" />
            </div>

            <span className="text-lg font-semibold tracking-tight text-white">Chit Fund Manager</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-200 transform-gpu hover:-translate-y-[1px] hover:shadow-sm
                  ${isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium shadow-lg shadow-blue-600/20 ring-1 ring-white/10'
                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                  }
                `}
              >
                <Icon className="w-4 h-4 transition-all duration-200 ${isActive ? 'text-white' : 'text-white/70'}" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 bg-white/5">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-white/70 hover:bg-white/10 hover:text-white transition-all duration-200 w-full min-h-[44px]"
          >
            <LogOut className="w-4 h-4 text-white/80" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Top Bar (Hamburger / Overlay) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40">
        <div className="h-14 flex items-center gap-3 px-4 bg-gradient-to-b from-slate-900 to-blue-950 text-white/95 backdrop-blur-xl border-b border-white/10">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/25 ring-1 ring-white/10 flex-none">
            <Coins className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold tracking-tight text-white truncate">Chit Fund Manager</span>
          </div>
          {/* Drawer trigger placeholder (keeps existing logic untouched) */}
          <span className="text-white/70"> </span>
        </div>
      </div>

      {/* Mobile Drawer (Overlay) */}
      <div className="lg:hidden fixed inset-0 z-50 overflow-hidden">
        {/* Currently collapsed by default; selecting a nav link will navigate away. */}
        <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity duration-200" />
        <aside className="w-[280px] h-screen border-r border-white/10 bg-gradient-to-b from-slate-900 to-blue-950 text-white/90 backdrop-blur-xl fixed left-0 top-0 -translate-x-full" />
      </div>
    </>
  );
}
