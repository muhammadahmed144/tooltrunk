'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import LoadingScreen from '@/components/ui/LoadingScreen';

export default function AuthLayoutWrapper({ children }) {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && token) {
      router.replace('/dashboard');
    }
  }, [user, token, loading, router]);

  if (loading) {
    return <LoadingScreen message="Checking session..." />;
  }

  if (user && token) {
    return <LoadingScreen message="Redirecting to dashboard..." />;
  }

  return children;
}
