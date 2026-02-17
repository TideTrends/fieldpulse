'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, MapPin, Coffee, Fuel, Car } from 'lucide-react';
import type { TimeEntry, MileageEntry, FuelLog, LocationLog } from '@/lib/store';
import { getHoursFromEntry, formatHoursMinutes } from '@/lib/store';

interface TimelineEvent {
    id: string;
    type: 'work' | 'break' | 'travel' | 'fuel' | 'location';
    label: string;
    startTime: string; // ISO
    endTime?: string; // ISO
    duration?: number; // minutes
    color: string;
    icon: React.ReactNode;
    meta?: string;
}

interface ShiftTimelineProps {
    date: string; // YYYY-MM-DD
    timeEntries: TimeEntry[];
    mileageEntries: MileageEntry[];
    fuelLogs: FuelLog[];
    locationLogs: LocationLog[];
}

export default function ShiftTimeline({ date, timeEntries, mileageEntries, fuelLogs, locationLogs }: ShiftTimelineProps) {
    const events = useMemo(() => {
        const all: TimelineEvent[] = [];

        // Time entries → work blocks
        timeEntries
            .filter(e => e.date === date)
            .forEach(entry => {
                const hours = getHoursFromEntry(entry);
                all.push({
                    id: `time-${entry.id}`,
                    type: 'work',
                    label: `Work${entry.isOvertime ? ' (OT)' : ''}`,
                    startTime: entry.startTime,
                    endTime: entry.endTime || new Date().toISOString(),
                    duration: hours * 60,
                    color: entry.isOvertime ? 'var(--fp-amber)' : 'var(--fp-success)',
                    icon: <Clock size={12} />,
                    meta: formatHoursMinutes(hours) + (entry.notes ? ` · ${entry.notes}` : ''),
                });

                // Break block
                if (entry.breakMinutes > 0) {
                    const breakStart = new Date(entry.startTime);
                    breakStart.setHours(breakStart.getHours() + Math.floor(hours / 2)); // midpoint estimate
                    all.push({
                        id: `break-${entry.id}`,
                        type: 'break',
                        label: 'Break',
                        startTime: breakStart.toISOString(),
                        duration: entry.breakMinutes,
                        color: 'var(--fp-text-muted)',
                        icon: <Coffee size={12} />,
                        meta: `${entry.breakMinutes} min`,
                    });
                }
            });

        // Mileage → travel blocks
        mileageEntries
            .filter(e => e.date === date)
            .forEach(entry => {
                all.push({
                    id: `mile-${entry.id}`,
                    type: 'travel',
                    label: `Drive (${entry.purpose})`,
                    startTime: new Date(date + 'T08:00:00').toISOString(), // approximate
                    duration: 30, // approximate
                    color: 'var(--fp-info)',
                    icon: <Car size={12} />,
                    meta: `${entry.tripMiles.toFixed(1)} mi`,
                });
            });

        // Fuel → point events
        fuelLogs
            .filter(l => l.date === date)
            .forEach(log => {
                all.push({
                    id: `fuel-${log.id}`,
                    type: 'fuel',
                    label: `Fuel${log.station ? ` @ ${log.station}` : ''}`,
                    startTime: `${date}T${log.time || '12:00'}:00`,
                    duration: 10,
                    color: 'var(--fp-success)',
                    icon: <Fuel size={12} />,
                    meta: `${log.gallons.toFixed(1)} gal · $${log.totalCost.toFixed(2)}`,
                });
            });

        // Location check-ins → point events
        locationLogs
            .filter(l => l.timestamp.startsWith(date))
            .forEach(loc => {
                all.push({
                    id: `loc-${loc.id}`,
                    type: 'location',
                    label: loc.placeName,
                    startTime: loc.timestamp,
                    duration: 5,
                    color: 'var(--fp-purple)',
                    icon: <MapPin size={12} />,
                    meta: loc.weather ? `${loc.weather.icon} ${loc.weather.temp}°F` : undefined,
                });
            });

        // Sort by time
        return all.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    }, [date, timeEntries, mileageEntries, fuelLogs, locationLogs]);

    if (events.length === 0) {
        return (
            <div className="empty-state" style={{ padding: '1.5rem' }}>
                <Clock className="empty-state-icon" />
                <p className="text-body">No activity on this day</p>
            </div>
        );
    }

    return (
        <div style={{ position: 'relative', paddingLeft: '1.5rem' }}>
            {/* Timeline line */}
            <div
                style={{
                    position: 'absolute',
                    left: '0.5rem',
                    top: 0,
                    bottom: 0,
                    width: 2,
                    background: 'var(--fp-border)',
                    borderRadius: 1,
                }}
            />

            {events.map((event, i) => {
                const time = new Date(event.startTime).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                });

                return (
                    <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        style={{
                            position: 'relative',
                            marginBottom: '0.75rem',
                            paddingLeft: '0.75rem',
                        }}
                    >
                        {/* Dot on timeline */}
                        <div
                            style={{
                                position: 'absolute',
                                left: '-1.25rem',
                                top: '0.375rem',
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                background: event.color,
                                border: '2px solid var(--fp-bg)',
                                zIndex: 1,
                            }}
                        />

                        {/* Event card */}
                        <div
                            style={{
                                background: 'var(--fp-surface)',
                                borderRadius: 'var(--fp-radius-md)',
                                padding: '0.5rem 0.75rem',
                                borderLeft: `3px solid ${event.color}`,
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                <span style={{ color: event.color, display: 'flex', alignItems: 'center' }}>{event.icon}</span>
                                <span className="text-body" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{event.label}</span>
                                <span className="text-caption" style={{ marginLeft: 'auto', fontSize: '0.6875rem' }}>{time}</span>
                            </div>
                            {event.meta && (
                                <p className="text-caption" style={{ marginTop: '0.125rem', fontSize: '0.6875rem' }}>{event.meta}</p>
                            )}
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
