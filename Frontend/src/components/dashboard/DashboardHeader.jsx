'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LogOut,
  User as UserIcon,
  Settings,
  Package,
  History,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';

export default function DashboardHeader({ totalTools = 0 }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const navItems = [
    { href: '/dashboard', icon: <LayoutDashboard className="w-3.5 h-3.5" />, mobileIcon: <LayoutDashboard className="w-4 h-4" />, label: 'Overview Hub', mobileLabel: 'Hub' },
    { href: '/dashboard/profile', icon: <Settings className="w-3.5 h-3.5" />, mobileIcon: <UserIcon className="w-4 h-4" />, label: 'Profile & Settings', mobileLabel: 'Profile' },
    { href: '/dashboard/shelf', icon: <Package className="w-3.5 h-3.5" />, mobileIcon: <Package className="w-4 h-4" />, label: `My Shelf (${totalTools})`, mobileLabel: 'Shelf' },
    { href: '/dashboard/ledger', icon: <History className="w-3.5 h-3.5" />, mobileIcon: <History className="w-4 h-4" />, label: 'Trust Ledger', mobileLabel: 'Ledger' },
  ];

  return (
    <header className="bg-slate-900/50 border-b border-slate-900 backdrop-blur-xl sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3.5 group">
          <div className="w-11 h-11 rounded-2xl bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            🧰
          </div>
          <div>
            <span className="text-2xl font-black tracking-tight text-white block leading-none">ToolTrunk</span>
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1 block">Neighbor Trust Engine</span>
          </div>
        </Link>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden md:flex bg-slate-950/60 border border-slate-900 rounded-xl p-1 gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
                  isActive ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Info and Logout */}
        <div className="flex items-center gap-4">
          {user && (
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-semibold text-slate-100">{user.fullName}</span>
              <span className="text-xs text-indigo-400/80 font-mono tracking-tight font-medium">#{user.postalCode}</span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800/80 text-slate-300 hover:text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-sm cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <div className="flex md:hidden border-t border-slate-900 bg-slate-950/80 px-2 py-1.5 overflow-x-auto justify-around gap-1.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3.5 py-2 text-[10px] font-bold rounded-lg flex flex-col items-center gap-1 transition-all ${
                isActive ? 'text-indigo-400' : 'text-slate-500'
              }`}
            >
              {item.mobileIcon}
              {item.mobileLabel}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
