'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';

export default function Home() {
  const router = useRouter();
  const onboardingComplete = useStore((s) => s.profile.onboardingComplete);

  useEffect(() => {
    if (onboardingComplete) {
      router.replace('/dashboard');
    } else {
      router.replace('/onboarding');
    }
  }, [onboardingComplete, router]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100dvh',
      }}
    >
      <div className="animate-pulse-dot" style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--fp-amber)' }} />
    </div>
  );
}
