import { useState } from 'react';
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
  Menu,
  X,
  User,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  {
    path: '/',
    label: 'Dashboard',
    icon: LayoutDashboard
  },
  {
    path: '/monthly-summary',
    label: 'Monthly Summary',
    icon: CalendarRange
  },
  {
    path: '/member-history',
    label: 'Member History',
    icon: History
  },
  {
    path: '/distribution',
    label: 'Distribution',
    icon: HandCoins
  },
  {
    path: '/members',
    label: 'Member List',
    icon: Users
  },
  {
    path: '/settings',
    label: 'Settings',
    icon: Settings
  },
];

export function Sidebar() {
  const location = useLocation();
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-[280px] min-h-screen flex-col fixed left-0 top-0 border-r border-white/10 bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 text-white/90">
        
        {/* Profile Section */}
        <div className="p-6 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Administrator</p>
              <p className="text-xs text-blue-300">admin@chitfund.com</p>
            </div>
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
              <ChevronDown className="w-4 h-4 text-white/60" />
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-blue-300">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span>Active Session</span>
          </div>
        </div>

        {/* Brand Section */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Coins className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-white">
              Chit Fund Manager
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300
                  ${isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-[1.02]'
                    : 'text-white/70 hover:bg-white/10 hover:text-white hover:scale-[1.01] hover:shadow-md'
                  }
                `}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
                )}
                
                <Icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-white' : 'text-white/70'}`} />
                
                <span className="transition-all duration-300">{item.label}</span>
                
                {/* Hover effect */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600/20 to-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
            );
          })}
        </nav>

        {/* Logout Section */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={logout}
            className="group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/70 hover:bg-red-500/20 hover:text-red-300 hover:scale-[1.02] transition-all duration-300 w-full overflow-hidden"
          >
            <LogOut className="w-5 h-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
            <span>Logout</span>
            
            {/* Hover gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
        </div>
      </aside>

      {/* Mobile Topbar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4 bg-gradient-to-b from-slate-900 to-blue-950 border-b border-white/10">

        <div className="flex items-center gap-3">

          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">

            <Coins className="w-5 h-5 text-white" />

          </div>

          <span className="text-sm font-semibold text-white">
            Chit Fund Manager
          </span>

        </div>

        {/* Hamburger Button */}
        <button
          onClick={() =>
            setIsOpen(!isOpen)
          }
          className="text-white"
        >

          {isOpen
            ? <X className="w-6 h-6" />
            : <Menu className="w-6 h-6" />}

        </button>

      </div>

      {/* Overlay */}
      {isOpen && (

        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() =>
            setIsOpen(false)
          }
        />

      )}

      {/* Mobile Sidebar */}
      <aside
        className={`
          lg:hidden fixed top-0 left-0 z-50 h-full w-[280px]
          bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900
          border-r border-white/10
          transform transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Profile Section */}
        <div className="p-6 border-b border-white/10 bg-white/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Administrator</p>
                <p className="text-xs text-blue-300">admin@chitfund.com</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-white/70 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-blue-300">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span>Active Session</span>
          </div>
        </div>

        {/* Brand Section */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Coins className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-white">
              Chit Fund Manager
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`
                  group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300
                  ${isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-[1.02]'
                    : 'text-white/70 hover:bg-white/10 hover:text-white hover:scale-[1.01] hover:shadow-md'
                  }
                `}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
                )}
                
                <Icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-white' : 'text-white/70'}`} />
                
                <span className="transition-all duration-300">{item.label}</span>
                
                {/* Hover effect */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600/20 to-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
            );
          })}
        </nav>

        {/* Logout Section */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={logout}
            className="group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/70 hover:bg-red-500/20 hover:text-red-300 hover:scale-[1.02] transition-all duration-300 w-full overflow-hidden"
          >
            <LogOut className="w-5 h-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
            <span>Logout</span>
            
            {/* Hover gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
        </div>
      </aside>
    </>
  );
}