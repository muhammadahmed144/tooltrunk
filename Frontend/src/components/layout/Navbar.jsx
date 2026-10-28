'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Wrench,
  Search,
  MapPin,
  Bell,
  Menu,
  X,
  User,
  LogOut,
  LayoutDashboard,
  Calendar,
  Layers,
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';

export default function Navbar() {
  const { user, token, logout } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const postalCode = user?.postalCode || '75000';

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0b1320] border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Left: Brand Logo & Main Nav */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-900/30 group-hover:bg-emerald-500 transition-colors">
                <Wrench className="w-4 h-4" />
              </div>
              <span className="font-bold text-lg tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                ToolTrunk
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
              <Link href="/" className="hover:text-white transition-colors">
                Browse Tools
              </Link>
              <Link href="/dashboard" className="hover:text-white transition-colors">
                My Rentals
              </Link>
              <Link href="/dashboard" className="hover:text-white transition-colors">
                Dashboard
              </Link>
            </nav>
          </div>

          {/* Right: Search Bar, Location Pill, Notification, User / Auth */}
          <div className="hidden sm:flex items-center gap-4 flex-1 justify-end max-w-md">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-[200px] lg:max-w-[240px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tools..."
                className="w-full bg-[#162032] border border-slate-700/80 rounded-full pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
            </form>

            {/* Postal Code Pill */}
            <div className="flex items-center gap-1.5 bg-[#162032] border border-slate-700/70 rounded-full px-3 py-1.5 text-xs text-slate-300 font-medium whitespace-nowrap">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>{postalCode}</span>
            </div>

            {/* Notification Bell */}
            <button
              type="button"
              className="relative p-2 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-[#0b1320]" />
            </button>

            {/* User Profile / Auth Button */}
            {user && token ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1 rounded-full border border-slate-700 hover:border-emerald-500 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-800 relative">
                    {user.avatarUrl ? (
                      <Image
                        src={user.avatarUrl}
                        alt={user.fullName || 'User'}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-emerald-400">
                        {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                      </div>
                    )}
                  </div>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-[#111a2e] border border-slate-700 rounded-xl shadow-xl py-1 z-50 text-xs">
                    <div className="px-4 py-2 border-b border-slate-800">
                      <p className="font-semibold text-white truncate">{user.fullName || 'User'}</p>
                      <p className="text-slate-400 truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:bg-slate-800 hover:text-white"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-emerald-400" />
                      Dashboard
                    </Link>
                    <Link
                      href="/dashboard/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:bg-slate-800 hover:text-white"
                    >
                      <User className="w-3.5 h-3.5 text-emerald-400" />
                      My Profile
                    </Link>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                        router.push('/');
                      }}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 text-rose-400 hover:bg-slate-800"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-xs font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg shadow-sm shadow-emerald-900/40 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-[#0e1726] border-b border-slate-800 px-4 pt-2 pb-4 space-y-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tools..."
              className="w-full bg-[#162032] border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-400"
            />
          </form>

          <nav className="flex flex-col space-y-2 text-sm font-medium">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200"
            >
              Browse Tools
            </Link>
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200"
            >
              My Rentals
            </Link>
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200"
            >
              Dashboard
            </Link>
          </nav>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Postal Code: {postalCode}</span>
            </div>
            {user ? (
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="text-xs text-rose-400 font-medium"
              >
                Sign Out
              </button>
            ) : (
              <div className="flex gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs px-3 py-1 bg-slate-800 text-white rounded-md"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs px-3 py-1 bg-emerald-600 text-white rounded-md"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
