'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from './store';

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

/**
 * Auto-sync hook — pulls server state on mount (server wins on fresh device),
 * then pushes local state to server 3s after any change.
 */
export function useSync() {
    const [status, setStatus] = useState<SyncStatus>('idle');
    const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const isMountedRef = useRef(false);
    const hasPulledRef = useRef(false);

    const {
        profile, timeEntries, mileageEntries, fuelLogs, dailyNotes,
        savedLocations, vehicles, locationLogs,
        customTags, pinnedNoteIds,
        showToast,
        // Setters for hydrating from server
        setProfile,
        addTimeEntry, addMileageEntry, addFuelLog, addDailyNote,
        addTag,
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

    // Pull from server and hydrate store (server is source of truth on fresh load)
    const pullSync = useCallback(async () => {
        try {
            setStatus('syncing');
            setError(null);
            const res = await fetch('/api/sync');
            if (!res.ok) return false;

            const { success, data } = await res.json();
            if (!success || !data) return false;

            // Hydrate profile
            if (data.profile) {
                setProfile(data.profile);
            }

            // Hydrate tags from settings
            if (data.settings?.customTags && Array.isArray(data.settings.customTags)) {
                for (const tag of data.settings.customTags) {
                    addTag(tag);
                }
            }

            // Hydrate entries — only add if they don't exist locally (avoid duplicates)
            const existingTimeIds = new Set(timeEntries.map((e) => e.id));
            if (Array.isArray(data.timeEntries)) {
                for (const entry of data.timeEntries) {
                    if (!existingTimeIds.has(entry.id)) {
                        addTimeEntry(entry);
                    }
                }
            }

            const existingMileageIds = new Set(mileageEntries.map((e) => e.id));
            if (Array.isArray(data.mileageEntries)) {
                for (const entry of data.mileageEntries) {
                    if (!existingMileageIds.has(entry.id)) {
                        addMileageEntry(entry);
                    }
                }
            }

            const existingFuelIds = new Set(fuelLogs.map((e) => e.id));
            if (Array.isArray(data.fuelLogs)) {
                for (const log of data.fuelLogs) {
                    if (!existingFuelIds.has(log.id)) {
                        addFuelLog(log);
                    }
                }
            }

            const existingNoteIds = new Set(dailyNotes.map((e) => e.id));
            if (Array.isArray(data.dailyNotes)) {
                for (const note of data.dailyNotes) {
                    if (!existingNoteIds.has(note.id)) {
                        addDailyNote(note);
                    }
                }
            }

            setStatus('success');
            setLastSyncedAt(new Date().toISOString());
            return true;
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Pull failed';
            setStatus('error');
            setError(msg);
            console.warn('[sync] Pull error:', msg);
            return false;
        }
    }, [setProfile, addTag, addTimeEntry, addMileageEntry, addFuelLog, addDailyNote,
        timeEntries, mileageEntries, fuelLogs, dailyNotes]);

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

    // On mount: run migrations, then pull from server
    useEffect(() => {
        const init = async () => {
            // Run migrations (idempotent)
            await fetch('/api/migrate', { method: 'POST' }).catch(() => { });
            // Pull server data into local store
            if (!hasPulledRef.current) {
                hasPulledRef.current = true;
                await pullSync();
            }
            isMountedRef.current = true;
        };
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Watch for store changes and auto-push (skip until after initial pull)
    useEffect(() => {
        if (!isMountedRef.current) return;
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

    return {
        status,
        lastSyncedAt,
        error,
        syncNow,
        pullNow: pullSync,
    };
}
