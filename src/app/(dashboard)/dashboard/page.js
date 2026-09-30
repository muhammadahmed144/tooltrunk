'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useDashboard } from '@/lib/context/DashboardContext';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import BorrowerDashboardView from '@/components/dashboard/BorrowerDashboardView';
import OwnerDashboardView from '@/components/dashboard/OwnerDashboardView';
import { getTools } from '@/lib/api/tools';
import { getBorrowerBookings, getOwnerBookings } from '@/lib/api/bookings';

export default function DashboardPage() {
  const { user, token } = useAuth();
  const { showToast } = useDashboard();

  const [activeView, setActiveView] = useState('borrower'); // 'borrower' | 'owner'
  const [tools, setTools] = useState([]);
  const [borrowerBookings, setBorrowerBookings] = useState([]);
  const [ownerBookings, setOwnerBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [toolsRes, borrowerRes, ownerRes] = await Promise.all([
        getTools(token).catch(() => ({ tools: [] })),
        getBorrowerBookings(token).catch(() => ({ bookings: [] })),
        getOwnerBookings(token).catch(() => ({ bookings: [] })),
      ]);

      setTools(toolsRes.tools || []);
      setBorrowerBookings(borrowerRes.bookings || []);
      setOwnerBookings(ownerRes.bookings || []);
    } catch (err) {
      console.error('Error fetching dashboard records:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="flex flex-col md:flex-row gap-8 items-start">
      {/* Left Sidebar */}
      <DashboardSidebar activeView={activeView} setActiveView={setActiveView} />

      {/* Main Content Area */}
      <div className="flex-1 w-full min-w-0">
        {/* Role toggle tab bar */}
        <div className="flex items-center gap-2 bg-slate-200/70 p-1 rounded-2xl w-fit mb-6 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveView('borrower')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeView === 'borrower'
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Borrower View ({borrowerBookings.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveView('owner')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeView === 'owner'
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Owner View ({tools.length})
          </button>
        </div>

        {activeView === 'borrower' ? (
          <BorrowerDashboardView
            bookings={borrowerBookings}
            token={token}
            onRefresh={loadData}
            showToast={showToast}
          />
        ) : (
          <OwnerDashboardView
            tools={tools}
            incomingBookings={ownerBookings}
            token={token}
            onRefresh={loadData}
            showToast={showToast}
          />
        )}
      </div>
    </div>
  );
}
