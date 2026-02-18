'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Play, Square, Clock, MapPin, Fuel, FileText,
    TrendingUp, Flame, ChevronRight, DollarSign,
    Zap, Calendar, Sun, Moon, BarChart2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/components/ThemeProvider';
import { InsightsCard, WeatherBadge, FloatingActionButton } from '@/components/SmartWidgets';
import {
    useStore,
    getTotalHoursToday,
    getTotalMilesToday,
    getHoursFromEntry,
    getWeeklyHours,
    getWeekEntries,
    getWeeklyMiles,
    getOvertimeHours,
    calculateEarnings,
    formatDuration,
    formatHoursMinutes,
    formatCurrency,
} from '@/lib/store';
import { getCurrentPosition } from '@/lib/geolocation';
import { getWeatherCached, type WeatherData } from '@/lib/weather';
import dynamic from 'next/dynamic';

const ShiftMap = dynamic(() => import('@/components/ShiftMap'), { ssr: false });

export default function DashboardPage() {
    const router = useRouter();
    const { resolvedTheme, toggleTheme } = useTheme();
    const {
        profile, isTimerRunning, activeTimerStart,
        startTimer, stopTimer, showToast,
        timeEntries, mileageEntries, fuelLogs, dailyNotes,
        streakCount, locationLogs, addTimeEntry,
    } = useStore();

    const [elapsed, setElapsed] = useState(0);
    const [mounted, setMounted] = useState(false);
    const [weather, setWeather] = useState<WeatherData | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Fetch weather on mount
    useEffect(() => {
        if (!mounted) return;
        getCurrentPosition()
            .then(pos => getWeatherCached(pos.lat, pos.lng))
            .then(setWeather)
            .catch(() => { /* no location / denied */ });
    }, [mounted]);

    // Live timer
    useEffect(() => {
        if (!isTimerRunning || !activeTimerStart) return;
        const tick = () => {
            setElapsed(Math.floor((Date.now() - new Date(activeTimerStart).getTime()) / 1000));
        };
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [isTimerRunning, activeTimerStart]);

    // Stats
    const todayHours = useMemo(() => getTotalHoursToday(timeEntries), [timeEntries]);
    const todayMiles = useMemo(() => getTotalMilesToday(mileageEntries), [mileageEntries]);
    const weekEntries = useMemo(() => getWeekEntries(timeEntries), [timeEntries]);
    const weeklyHours = useMemo(() => getWeeklyHours(timeEntries), [timeEntries]);
    const totalWeekHours = useMemo(() => weekEntries.reduce((s, e) => s + getHoursFromEntry(e), 0), [weekEntries]);
    const weeklyMiles = useMemo(() => getWeeklyMiles(mileageEntries), [mileageEntries]);

    const overtimeToday = useMemo(() => getOvertimeHours(timeEntries, profile.overtimeThreshold), [timeEntries, profile.overtimeThreshold]);
    const maxBarHours = useMemo(() => Math.max(...weeklyHours.map(d => d.hours), 1), [weeklyHours]);

    // Weekly earnings
    const earnings = useMemo(() => {
        if (!profile.hourlyRate) return null;
        return calculateEarnings(weekEntries, profile.hourlyRate, profile.overtimeMultiplier, profile.overtimeThreshold);
    }, [weekEntries, profile.hourlyRate, profile.overtimeMultiplier, profile.overtimeThreshold]);

    // Recent activity
    const recentActivity = useMemo(() => {
        const all = [
            ...timeEntries.slice(0, 3).map(e => ({
                type: 'time' as const,
                date: e.date,
                label: `Worked ${formatHoursMinutes(getHoursFromEntry(e))}`,
                icon: Clock,
            })),
            ...mileageEntries.slice(0, 3).map(e => ({
                type: 'mileage' as const,
                date: e.date,
                label: `Drove ${e.tripMiles.toFixed(1)} mi`,
                icon: MapPin,
            })),
            ...fuelLogs.slice(0, 3).map(l => ({
                type: 'fuel' as const,
                date: l.date,
                label: `${l.gallons.toFixed(1)} gal at ${l.station || 'Unknown'}`,
                icon: Fuel,
            })),
        ];
        return all.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
    }, [timeEntries, mileageEntries, fuelLogs]);

    const handleTimerToggle = () => {
        if (isTimerRunning) {
            stopTimer();
            showToast('Shift ended!');
        } else {
            startTimer();
            showToast('Shift started!', 'info');
        }
    };

    const handleFABAction = (action: string) => {
        switch (action) {
            case 'time': router.push('/time'); break;
            case 'mileage': router.push('/mileage'); break;
            case 'fuel': router.push('/fuel'); break;
            case 'note': router.push('/notes'); break;
        }
    };

    if (!mounted) return null;

    return (
        <div className="page-container section-gap" style={{ paddingTop: '1rem' }}>
            {/* Header */}
            <div className="page-header">
                <div>
                    <motion.p className="text-caption" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </motion.p>
                    <motion.h1
                        className="text-title"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                    >
                        Hey, {profile.name || 'there'}
                    </motion.h1>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {weather && <WeatherBadge weather={weather} compact />}
                    {streakCount > 0 && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="tag tag-active"
                            style={{ gap: '0.25rem' }}
                        >
                            <Flame size={12} /> {streakCount}
                        </motion.div>
                    )}
                    <button
                        onClick={toggleTheme}
                        className="btn btn-ghost btn-icon"
                        title="Toggle theme"
                        style={{ width: 36, height: 36 }}
                    >
                        {resolvedTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                    </button>
                </div>
            </div>

            {/* Timer Section */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '1rem 0' }}
            >
                <p className="text-caption" style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.6875rem' }}>
                    {isTimerRunning ? 'Shift in Progress' : 'Ready to Work'}
                </p>
                {isTimerRunning && activeTimerStart && (
                    <p className="text-caption" style={{ color: 'var(--fp-text-muted)', marginTop: '-0.5rem' }}>
                        Started {new Date(activeTimerStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                )}
                <motion.p
                    className="text-mono-lg"
                    style={{ color: isTimerRunning ? 'var(--fp-amber)' : 'var(--fp-text-primary)', position: 'relative' }}
                    key={isTimerRunning ? 'running' : 'idle'}
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                >
                    {isTimerRunning && (
                        <motion.span
                            style={{
                                position: 'absolute', left: -18, top: '50%', transform: 'translateY(-50%)',
                                width: 8, height: 8, borderRadius: '50%',
                                background: 'var(--fp-amber)', display: 'block',
                            }}
                            animate={{ opacity: [1, 0.2, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        />
                    )}
                    {isTimerRunning ? formatDuration(elapsed) : '00:00:00'}
                </motion.p>
                <motion.button
                    className={`timer-btn ${isTimerRunning ? 'timer-btn-stop' : 'timer-btn-start'}`}
                    onClick={handleTimerToggle}
                    whileTap={{ scale: 0.93 }}
                >
                    {isTimerRunning ? <Square size={40} fill="white" /> : <Play size={40} fill="#0a0a0b" />}
                </motion.button>
                {isTimerRunning && overtimeToday > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="overtime-badge"
                    >
                        <Zap size={10} /> OT: +{formatHoursMinutes(overtimeToday)}
                    </motion.div>
                )}
                {!isTimerRunning && (
                    <button
                        className="btn btn-ghost"
                        style={{ fontSize: '0.75rem', padding: '0.375rem 0.875rem', border: '1px dashed var(--fp-border)' }}
                        onClick={() => {
                            const today = new Date().toISOString().split('T')[0];
                            const start = new Date(`${today}T${String(profile.defaultStartHour).padStart(2, '0')}:00:00`);
                            const end = new Date(`${today}T${String(profile.defaultEndHour).padStart(2, '0')}:00:00`);
                            const hoursWorked = (end.getTime() - start.getTime()) / 3600000;
                            addTimeEntry({
                                startTime: start.toISOString(),
                                endTime: end.toISOString(),
                                breakMinutes: 30,
                                notes: 'Quick logged',
                                tags: [],
                                date: today,
                                isOvertime: hoursWorked > profile.overtimeThreshold,
                                hourlyRate: profile.hourlyRate || null,
                            });
                            showToast('Shift logged!');
                        }}
                    >
                        <Calendar size={12} /> Quick Log Today
                    </button>
                )}
            </motion.div>

            {/* Today Stats */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="stat-grid"
            >
                <div className="card" style={{ textAlign: 'center' }}>
                    <p className="text-caption">Hours Today</p>
                    <p className="text-mono-md" style={{ color: 'var(--fp-amber)', marginTop: '0.25rem' }}>
                        {formatHoursMinutes(todayHours)}
                    </p>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                    <p className="text-caption">Miles Today</p>
                    <p className="text-mono-md" style={{ color: 'var(--fp-info)', marginTop: '0.25rem' }}>
                        {todayMiles.toFixed(1)}
                    </p>
                </div>
            </motion.div>

            {/* Weather Card (full) */}
            {weather && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
                    <WeatherBadge weather={weather} />
                </motion.div>
            )}

            {/* Smart Insights */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <InsightsCard />
            </motion.div>

            {/* Shift Map (if location logs exist) */}
            {locationLogs.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
                    <div style={{ borderRadius: 'var(--fp-radius-lg)', overflow: 'hidden', border: '1px solid var(--fp-border)' }}>
                        <ShiftMap
                            locations={locationLogs}
                            height="200px"
                        />
                    </div>
                </motion.div>
            )}

            {/* Weekly Summary */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="card"
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <BarChart2 size={16} style={{ color: 'var(--fp-amber)' }} />
                    <p className="text-heading" style={{ fontSize: '0.9375rem' }}>This Week</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', textAlign: 'center' }}>
                    <div style={{ padding: '0.75rem', background: 'var(--fp-surface)', borderRadius: 'var(--fp-radius-md)', border: '1px solid var(--fp-border)' }}>
                        <p className="text-caption" style={{ marginBottom: '0.375rem' }}>Hours</p>
                        <p className="text-mono-sm" style={{ color: 'var(--fp-amber)', fontWeight: 700 }}>{formatHoursMinutes(totalWeekHours)}</p>
                    </div>
                    <div style={{ padding: '0.75rem', background: 'var(--fp-surface)', borderRadius: 'var(--fp-radius-md)', border: '1px solid var(--fp-border)' }}>
                        <p className="text-caption" style={{ marginBottom: '0.375rem' }}>Miles</p>
                        <p className="text-mono-sm" style={{ color: 'var(--fp-info)', fontWeight: 700 }}>{weeklyMiles.toFixed(0)}</p>
                    </div>
                    <div style={{ padding: '0.75rem', background: 'var(--fp-surface)', borderRadius: 'var(--fp-radius-md)', border: '1px solid var(--fp-border)' }}>
                        <p className="text-caption" style={{ marginBottom: '0.375rem' }}>Shifts</p>
                        <p className="text-mono-sm" style={{ color: 'var(--fp-success)', fontWeight: 700 }}>{weekEntries.length}</p>
                    </div>
                </div>
            </motion.div>

            {/* Earnings Card (if rate set) */}
            {earnings && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="card-amber"
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <DollarSign size={16} style={{ color: 'var(--fp-amber)' }} />
                        <p className="text-heading" style={{ fontSize: '0.9375rem' }}>This Week&apos;s Earnings</p>
                    </div>
                    <p className="text-mono-md" style={{ color: 'var(--fp-amber)' }}>
                        {formatCurrency(earnings.total)}
                    </p>
                    <p className="text-caption" style={{ marginTop: '0.25rem' }}>
                        Regular: {formatCurrency(earnings.regular)}
                        {earnings.overtime > 0 && ` · OT: ${formatCurrency(earnings.overtime)}`}
                    </p>
                </motion.div>
            )}

            {/* Weekly Chart */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="card"
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <TrendingUp size={16} style={{ color: 'var(--fp-amber)' }} />
                        <p className="text-heading" style={{ fontSize: '0.9375rem' }}>This Week</p>
                    </div>
                    <span className="text-mono-sm" style={{ color: 'var(--fp-amber)' }}>
                        {formatHoursMinutes(totalWeekHours)}
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '4px', height: 80, alignItems: 'flex-end' }}>
                    {weeklyHours.map((d, i) => (
                        <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${d.hours ? (d.hours / maxBarHours) * 56 : 2}px` }}
                                transition={{ duration: 0.5, delay: 0.3 + i * 0.05 }}
                                style={{
                                    width: '100%',
                                    minHeight: 2,
                                    borderRadius: 4,
                                    background: d.hours > 0
                                        ? 'linear-gradient(to top, var(--fp-amber-dark), var(--fp-amber-light))'
                                        : 'var(--fp-border)',
                                }}
                            />
                            <span className="text-caption" style={{ fontSize: '0.625rem' }}>{d.day}</span>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <p className="text-heading" style={{ fontSize: '0.9375rem', marginBottom: '0.625rem' }}>Quick Actions</p>
                <div className="quick-actions">
                    <div className="quick-action" onClick={() => router.push('/time')}>
                        <div className="quick-action-icon" style={{ background: 'var(--fp-amber-glow)', color: 'var(--fp-amber)' }}>
                            <Clock size={20} />
                        </div>
                        <span className="quick-action-label">Log Time</span>
                    </div>
                    <div className="quick-action" onClick={() => router.push('/mileage')}>
                        <div className="quick-action-icon" style={{ background: 'var(--fp-info-bg)', color: 'var(--fp-info)' }}>
                            <MapPin size={20} />
                        </div>
                        <span className="quick-action-label">Mileage</span>
                    </div>
                    <div className="quick-action" onClick={() => router.push('/fuel')}>
                        <div className="quick-action-icon" style={{ background: 'var(--fp-success-bg)', color: 'var(--fp-success)' }}>
                            <Fuel size={20} />
                        </div>
                        <span className="quick-action-label">Fuel</span>
                    </div>
                    <div className="quick-action" onClick={() => router.push('/notes')}>
                        <div className="quick-action-icon" style={{ background: 'var(--fp-purple-bg)', color: 'var(--fp-purple)' }}>
                            <FileText size={20} />
                        </div>
                        <span className="quick-action-label">Notes</span>
                    </div>
                </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem' }}>
                    <p className="text-heading" style={{ fontSize: '0.9375rem' }}>Recent Activity</p>
                    <button className="btn btn-ghost" style={{ fontSize: '0.8125rem', padding: '0.25rem 0.5rem' }} onClick={() => router.push('/reports')}>
                        View All <ChevronRight size={14} />
                    </button>
                </div>
                <AnimatePresence>
                    {recentActivity.length === 0 ? (
                        <div className="empty-state" style={{ padding: '2rem' }}>
                            <Calendar className="empty-state-icon" />
                            <p className="text-body">No activity yet today</p>
                            <p className="text-caption">Start a shift or log some data!</p>
                        </div>
                    ) : (
                        recentActivity.map((item, i) => (
                            <motion.div
                                key={`${item.type}-${i}`}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 8 }}
                                transition={{ delay: i * 0.05 }}
                                className="list-item"
                            >
                                <item.icon size={16} style={{ color: 'var(--fp-text-tertiary)', flexShrink: 0 }} />
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: '0.875rem' }}>{item.label}</p>
                                    <p className="text-caption">{item.date}</p>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Floating Action Button */}
            <FloatingActionButton onAction={handleFABAction} />
        </div>
    );
}
