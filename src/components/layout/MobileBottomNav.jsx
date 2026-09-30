'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Wrench, Calendar, User } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = [
    {
      label: 'Home',
      icon: Home,
      href: '/',
      active: pathname === '/',
    },
    {
      label: 'Tools',
      icon: Wrench,
      href: '/?tools=all',
      active: pathname.startsWith('/tools'),
    },
    {
      label: 'Rentals',
      icon: Calendar,
      href: '/dashboard?tab=rentals',
      active: pathname.startsWith('/dashboard') && !pathname.includes('/profile'),
    },
    {
      label: 'Profile',
      icon: User,
      href: user ? '/dashboard/profile' : '/login',
      active: pathname.includes('/profile') || pathname.includes('/login') || pathname.includes('/register'),
    },
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/90 py-2 px-6 flex items-center justify-around shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex flex-col items-center gap-1 text-[11px] font-semibold transition-colors ${
              item.active
                ? 'text-emerald-700'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div
              className={`p-1.5 rounded-xl transition-all ${
                item.active ? 'bg-emerald-50 text-emerald-700 shadow-sm' : ''
              }`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
