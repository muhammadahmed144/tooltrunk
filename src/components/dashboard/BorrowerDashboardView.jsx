'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Wrench,
  Calendar,
  CheckCircle2,
  Clock,
  User,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';
import { updateBookingStatus } from '@/lib/api/bookings';

export default function BorrowerDashboardView({
  bookings = [],
  token,
  onRefresh,
  showToast,
}) {
  const [activeTab, setActiveTab] = useState('Active Rentals'); // 'Active Rentals' | 'Upcoming' | 'History'
  const [updatingId, setUpdatingId] = useState(null);

  // Categorize rentals according to SRS
  const activeRentals = bookings.filter((b) => b.status === 'Borrowed');
  const upcomingRentals = bookings.filter((b) => ['Pending', 'Approved'].includes(b.status));
  const historyRentals = bookings.filter((b) => ['Returned', 'Rejected'].includes(b.status));

  let displayedBookings = [];
  if (activeTab === 'Active Rentals') displayedBookings = activeRentals;
  else if (activeTab === 'Upcoming') displayedBookings = upcomingRentals;
  else if (activeTab === 'History') displayedBookings = historyRentals;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Borrowed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Approved':
        return 'bg-teal-50 text-teal-700 border-teal-300';
      case 'Pending':
        return 'bg-amber-50 text-amber-800 border-amber-300';
      case 'Returned':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'Rejected':
        return 'bg-rose-50 text-rose-700 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const getStatusGuidance = (status) => {
    switch (status) {
      case 'Pending':
        return 'Waiting for owner review and confirmation.';
      case 'Approved':
        return 'Approved! Dates locked. Meet owner for physical handover & cash payment.';
      case 'Borrowed':
        return 'Currently in your possession. Return to owner by end of rental.';
      case 'Returned':
        return 'Tool safely returned to owner. Rental completed!';
      case 'Rejected':
        return 'Request declined by owner.';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Borrower Dashboard
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Manage your tool rentals, check booking dates, and view return status
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Active Rentals</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{activeRentals.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Wrench className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Upcoming Rentals</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{upcomingRentals.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Historical Rentals</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{historyRentals.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold">
        {[
          { id: 'Active Rentals', label: `Active Rentals (${activeRentals.length})` },
          { id: 'Upcoming', label: `Upcoming (${upcomingRentals.length})` },
          { id: 'History', label: `Historical (${historyRentals.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 transition-colors relative ${
              activeTab === tab.id
                ? 'text-emerald-700 font-extrabold'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Rentals List */}
      {displayedBookings.length > 0 ? (
        <div className="space-y-3">
          {displayedBookings.map((b) => (
            <div
              key={b.id}
              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-slate-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                  <Image
                    src={b.toolImage || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&auto=format&fit=crop&q=80'}
                    alt={b.toolTitle}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>

                <div>
                  <h4 className="font-bold text-sm text-slate-900">{b.toolTitle}</h4>
                  <div className="flex items-center gap-2 mt-0.5 text-xs">
                    <span className="font-bold text-slate-900">Total: Rs. {b.totalPrice}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-500">Rs. {b.pricePerDay} / day</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {b.startDate} to {b.endDate} ({b.totalDays} {b.totalDays === 1 ? 'day' : 'days'})
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      Owner: <strong>{b.ownerName || 'Neighbor'}</strong>
                    </span>
                  </div>

                  {/* Guidance snippet */}
                  <p className="mt-1 text-[11px] text-emerald-800 font-medium">
                    {getStatusGuidance(b.status)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(b.status)}`}>
                  {b.status}
                </span>

                <Link
                  href={`/tools/${b.toolId}`}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:border-emerald-500 hover:text-emerald-700 text-xs font-semibold transition-colors"
                >
                  View Tool
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <Wrench className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-sm text-slate-900">No {activeTab.toLowerCase()} found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Browse our neighborhood marketplace to find quality tools for your next home improvement project.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-500 shadow-sm transition-all mt-2"
          >
            <span>Browse Available Tools</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
