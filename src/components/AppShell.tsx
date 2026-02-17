'use client';

import BottomNav from '@/components/BottomNav';
import Toast from '@/components/Toast';
import { useSync } from '@/lib/useSync';

function SyncProvider() {
    // This component just activates the sync hook globally
    useSync();
    return null;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
    return (
        <>
            <SyncProvider />
            <Toast />
            {children}
            <BottomNav />
        </>
    );
}
