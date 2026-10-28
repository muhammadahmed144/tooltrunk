'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { DashboardProvider, useDashboard } from '@/lib/context/DashboardContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Toast from '@/components/ui/Toast';
import LoadingScreen from '@/components/ui/LoadingScreen';

function DashboardShell({ children }) {
  const { toast } = useDashboard();

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col text-slate-800">
      <Toast toast={toast} />
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {children}
      </main>

      <Footer />
    </div>
  );
}

export default function ProtectedDashboardLayout({ children }) {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !token)) {
      router.replace('/login');
    }
  }, [user, token, loading, router]);

  if (loading) {
    return <LoadingScreen message="Loading dashboard..." />;
  }

  if (!user || !token) {
    return <LoadingScreen message="Redirecting to login..." />;
  }

  return (
    <DashboardProvider>
      <DashboardShell>{children}</DashboardShell>
    </DashboardProvider>
  );
}
