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

  const [isOpen, setIsOpen] =
    useState(false);

  return (

    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-[280px] min-h-screen flex-col fixed left-0 top-0 border-r border-white/10 bg-gradient-to-b from-slate-900 to-blue-950 text-white/90">

        <div className="p-6 border-b border-white/10 bg-white/5">

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">

              <Coins className="w-5 h-5 text-white" />

            </div>

            <span className="text-lg font-semibold text-white">
              Chit Fund Manager
            </span>

          </div>

        </div>

        <nav className="flex-1 p-4 space-y-1">

          {navItems.map((item) => {

            const isActive =
              location.pathname === item.path;

            const Icon = item.icon;

            return (

              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200

                  ${isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'}
                `}
              >

                <Icon className="w-5 h-5" />

                {item.label}

              </Link>
            );
          })}

        </nav>

        <div className="p-4 border-t border-white/10">

          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/70 hover:bg-white/10 hover:text-white transition-all duration-200 w-full"
          >

            <LogOut className="w-5 h-5" />

            Logout

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
          bg-gradient-to-b from-slate-900 to-blue-950
          border-r border-white/10
          transform transition-transform duration-300

          ${isOpen
            ? 'translate-x-0'
            : '-translate-x-full'}
        `}
      >

        <div className="p-6 border-b border-white/10">

          <div className="flex items-center justify-between">

            <div className="flex items-center gap-3">

              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">

                <Coins className="w-5 h-5 text-white" />

              </div>

              <span className="text-lg font-semibold text-white">
                Chit Fund Manager
              </span>

            </div>

            <button
              onClick={() =>
                setIsOpen(false)
              }
              className="text-white"
            >

              <X className="w-6 h-6" />

            </button>

          </div>

        </div>

        <nav className="flex-1 p-4 space-y-1">

          {navItems.map((item) => {

            const isActive =
              location.pathname === item.path;

            const Icon = item.icon;

            return (

              <Link
                key={item.path}
                to={item.path}
                onClick={() =>
                  setIsOpen(false)
                }
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200

                  ${isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'}
                `}
              >

                <Icon className="w-5 h-5" />

                {item.label}

              </Link>
            );
          })}

        </nav>

      </aside>
    </>
  );
}