'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { OnboardingTour } from '@/components/onboarding/onboarding-tour';
import { ONBOARDING_STEPS, useOnboarding } from '@/lib/hooks/use-onboarding';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const onboarding = useOnboarding(user?.id);

  React.useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Carregando...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar onHelp={onboarding.start} />
        <main className="flex-1 overflow-x-auto bg-base-200/60 p-6">{children}</main>
      </div>
      <OnboardingTour steps={ONBOARDING_STEPS} open={onboarding.open} onClose={onboarding.close} />
    </div>
  );
}
