'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Wrench,
  Clock,
  History,
  User,
  Settings,
  Users,
} from 'lucide-react';

export default function DashboardSidebar({ activeView, setActiveView }) {
  const pathname = usePathname();
  const isProfile = pathname.includes('/profile');

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      onClick: () => setActiveView && setActiveView('borrower'),
      active: !isProfile && activeView === 'borrower',
    },
    {
      id: 'rentals',
      label: 'My Rentals',
      icon: Calendar,
      onClick: () => setActiveView && setActiveView('borrower'),
      active: false,
    },
    {
      id: 'tools',
      label: 'My Tools',
      icon: Wrench,
      onClick: () => setActiveView && setActiveView('owner'),
      active: !isProfile && activeView === 'owner',
    },
    {
      id: 'requests',
      label: 'Requests',
      icon: Clock,
      onClick: () => setActiveView && setActiveView('owner'),
      active: false,
    },
    {
      id: 'history',
      label: 'History',
      icon: History,
      onClick: () => setActiveView && setActiveView('borrower'),
      active: false,
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      href: '/dashboard/profile',
      active: isProfile,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      href: '/dashboard/profile',
      active: false,
    },
  ];

  return (
    <aside className="w-full md:w-64 bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm shrink-0 flex flex-col justify-between space-y-6">
      <div className="space-y-4">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-3 mb-2">
            Navigation
          </span>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              if (item.href) {
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      item.active
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-bold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-emerald-600" />
                    <span>{item.label}</span>
                  </Link>
                );
              }

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.onClick}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    item.active
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4 text-emerald-600" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Community Banner Matching Screenshot */}
      <div className="bg-gradient-to-br from-emerald-900 via-emerald-900 to-[#0b1320] text-white p-4 rounded-2xl relative overflow-hidden shadow-sm">
        <div className="relative z-10 space-y-1.5">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
            <Users className="w-3.5 h-3.5" />
            <span>Community</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-snug">
            Together we build a stronger, safer neighborhood sharing network.
          </p>
        </div>
      </div>
    </aside>
  );
}
