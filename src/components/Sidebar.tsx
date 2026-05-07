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
    <aside className="w-[280px] min-h-screen bg-white border-r border-[#e9ecef] flex flex-col fixed left-0 top-0">
      <div className="p-6 border-b border-[#e9ecef]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#004b87] rounded-lg flex items-center justify-center">
            <Coins className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-semibold text-[#1d1d1d]">Chit Fund Manager</span>
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
                flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors duration-200
                ${isActive
                  ? 'bg-[#004b87] text-white font-medium'
                  : 'text-[#6c757d] hover:bg-[#f8f9fa]'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#e9ecef]">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-[#6c757d] hover:bg-[#f8f9fa] transition-colors duration-200 w-full"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
