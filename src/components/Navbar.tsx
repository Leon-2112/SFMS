import React, { useState } from 'react';
import { User, Role } from '../types.ts';
import {
  Building2,
  CalendarCheck,
  ShieldCheck,
  Wrench,
  UserCheck,
  LogOut,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

interface NavbarProps {
  user: User | null;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSwitchUser: (user: User) => void;
  onOpenLogin: () => void;
  onLogout: () => void;
  demoUsers: User[];
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  onTabChange,
  onSwitchUser,
  onOpenLogin,
  onLogout,
  demoUsers,
}) => {
  const [showSwitchMenu, setShowSwitchMenu] = useState(false);

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'MAINTENANCE_STAFF':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'MEMBER':
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onTabChange('facilities')}
              className="flex items-center gap-2.5 text-left group focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg text-white tracking-tight">SFMS</span>
                  <span className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Operational
                  </span>
                </div>
                <p className="text-xs text-slate-400 hidden sm:block">Campus Sports Facilities Portal</p>
              </div>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => onTabChange('facilities')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'facilities'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Facilities
            </button>

            {(user?.role === 'MEMBER' || user?.role === 'ADMIN') && (
              <button
                onClick={() => onTabChange('reservations')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'reservations'
                    ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <CalendarCheck className="w-4 h-4" />
                My Bookings
              </button>
            )}

            {user?.role === 'ADMIN' && (
              <button
                onClick={() => onTabChange('admin')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'admin'
                    ? 'bg-slate-800 text-amber-300 border border-amber-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-amber-200 hover:bg-slate-800/50'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                Admin Operations
              </button>
            )}

            {(user?.role === 'MAINTENANCE_STAFF' || user?.role === 'ADMIN') && (
              <button
                onClick={() => onTabChange('staff')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'staff'
                    ? 'bg-slate-800 text-cyan-300 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-cyan-200 hover:bg-slate-800/50'
                }`}
              >
                <Wrench className="w-4 h-4 text-cyan-400" />
                Work Orders
              </button>
            )}
          </nav>

          {/* User & Role Switcher */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowSwitchMenu(!showSwitchMenu)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-left transition-all"
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-200">
                    {user.full_name.charAt(0)}
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-xs font-semibold text-slate-200">{user.full_name}</div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${getRoleBadge(
                          user.role
                        )}`}
                      >
                        {user.role}
                      </span>
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
                </button>

                {showSwitchMenu && (
                  <div
                    className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-800 border border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                    onMouseLeave={() => setShowSwitchMenu(false)}
                  >
                    <div className="px-3 py-2 border-b border-slate-700/60 mb-2">
                      <p className="text-xs font-medium text-slate-400">Signed in as</p>
                      <p className="text-sm font-bold text-white truncate">{user.email}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{user.department || 'Campus Athletics'}</p>
                    </div>

                    <div className="px-2 py-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2 mb-1 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                        Switch Profile
                      </p>
                      <div className="space-y-1">
                        {demoUsers.map((u) => (
                          <button
                            key={u.user_id}
                            onClick={() => {
                              onSwitchUser(u);
                              setShowSwitchMenu(false);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-colors ${
                              u.user_id === user.user_id
                                ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                                : 'text-slate-300 hover:bg-slate-700/60'
                            }`}
                          >
                            <span className="truncate">{u.full_name}</span>
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded border uppercase font-bold ${getRoleBadge(
                                u.role
                              )}`}
                            >
                              {u.role.replace('_', ' ')}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-slate-700/60 mt-2 pt-2 space-y-1">
                      <button
                        onClick={() => {
                          setShowSwitchMenu(false);
                          onOpenLogin();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-700/60 transition-colors"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                        Switch / Custom Login
                      </button>
                      <button
                        onClick={() => {
                          setShowSwitchMenu(false);
                          onLogout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-rose-300 hover:bg-rose-500/10 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-400" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-emerald-600/20"
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800 text-xs">
          <button
            onClick={() => onTabChange('facilities')}
            className={`flex flex-col items-center gap-1 ${
              activeTab === 'facilities' ? 'text-emerald-400 font-bold' : 'text-slate-400'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Facilities
          </button>
          {(user?.role === 'MEMBER' || user?.role === 'ADMIN') && (
            <button
              onClick={() => onTabChange('reservations')}
              className={`flex flex-col items-center gap-1 ${
                activeTab === 'reservations' ? 'text-emerald-400 font-bold' : 'text-slate-400'
              }`}
            >
              <CalendarCheck className="w-4 h-4" />
              Bookings
            </button>
          )}
          {user?.role === 'ADMIN' && (
            <button
              onClick={() => onTabChange('admin')}
              className={`flex flex-col items-center gap-1 ${
                activeTab === 'admin' ? 'text-amber-400 font-bold' : 'text-slate-400'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Admin
            </button>
          )}
          {(user?.role === 'MAINTENANCE_STAFF' || user?.role === 'ADMIN') && (
            <button
              onClick={() => onTabChange('staff')}
              className={`flex flex-col items-center gap-1 ${
                activeTab === 'staff' ? 'text-cyan-400 font-bold' : 'text-slate-400'
              }`}
            >
              <Wrench className="w-4 h-4" />
              Staff
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
