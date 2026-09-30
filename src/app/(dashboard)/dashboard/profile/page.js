'use client';

import { useAuth } from '@/lib/context/AuthContext';
import { useDashboard } from '@/lib/context/DashboardContext';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import ProfileTab from '@/components/dashboard/ProfileTab';

export default function DashboardProfilePage() {
  const { user } = useAuth();
  const { tierInfo, showToast } = useDashboard();

  return (
    <div className="flex flex-col md:flex-row gap-8 items-start">
      <DashboardSidebar activeView="profile" />
      <div className="flex-1 w-full min-w-0">
        <ProfileTab
          user={user}
          tierInfo={tierInfo}
          showToast={showToast}
        />
      </div>
    </div>
  );
}
