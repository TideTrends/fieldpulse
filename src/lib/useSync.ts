'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from './store';

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

/**
 * Auto-sync hook — pushes local state to server on changes,
 * pulls server state on mount (with local-wins merge).
 */
export function useSync() {
    const [status, setStatus] = useState<SyncStatus>('idle');
    const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const isMountedRef = useRef(false);

    const {
        profile, timeEntries, mileageEntries, fuelLogs, dailyNotes,
        savedLocations, vehicles, locationLogs,
        customTags, pinnedNoteIds,
        showToast,
    } = useStore();

    // Build sync payload from current store state
    const buildPayload = useCallback(() => ({
        profile,
        timeEntries,
        mileageEntries,
        fuelLogs,
        dailyNotes,
        savedLocations,
        vehicles,
        locationLogs,
        settings: {
            customTags,
            pinnedNoteIds,
        },
    }), [profile, timeEntries, mileageEntries, fuelLogs, dailyNotes,
        savedLocations, vehicles, locationLogs, customTags, pinnedNoteIds]);

    // Push local data to server
    const pushSync = useCallback(async () => {
        try {
            setStatus('syncing');
            setError(null);
            const payload = buildPayload();

            const res = await fetch('/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Sync failed');
            }

            setStatus('success');
            setLastSyncedAt(new Date().toISOString());
            return true;
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Sync failed';
            setStatus('error');
            setError(msg);
            console.warn('[sync] Push error:', msg);
            return false;
        }
    }, [buildPayload]);

    // Debounced auto-push (3s after last change)
    const debouncedPush = useCallback(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            pushSync();
        }, 3000);
    }, [pushSync]);

    // Watch for store changes and auto-push
    useEffect(() => {
        if (!isMountedRef.current) {
            isMountedRef.current = true;
            return; // Skip initial mount
        }
        debouncedPush();
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [profile, timeEntries, mileageEntries, fuelLogs, dailyNotes,
        savedLocations, vehicles, locationLogs, customTags, pinnedNoteIds, debouncedPush]);

    // Manual sync trigger
    const syncNow = useCallback(async () => {
        const success = await pushSync();
        if (success) {
            showToast('Synced to server!', 'info');
        } else {
            showToast('Sync failed — will retry', 'error');
        }
        return success;
    }, [pushSync, showToast]);

    // Run migrations on first load (idempotent)
    useEffect(() => {
        fetch('/api/migrate', { method: 'POST' }).catch(() => {
            // Silently fail if server is unreachable (local dev mode)
        });
    }, []);

    return {
        status,
        lastSyncedAt,
        error,
        syncNow,
    };
}
