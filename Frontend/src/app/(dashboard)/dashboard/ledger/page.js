'use client';

import { useAuth } from '@/lib/context/AuthContext';
import LedgerTab from '@/components/dashboard/LedgerTab';

export default function DashboardLedgerPage() {
  const { user } = useAuth();

  return <LedgerTab user={user} />;
}
