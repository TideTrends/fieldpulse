'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart3, Clock, MapPin, Fuel, Calendar,
    Download, FileText, TrendingUp, DollarSign,
    ChevronLeft, ChevronRight,
} from 'lucide-react';
import {
    useStore,
    getHoursFromEntry,
    formatHoursMinutes,
    formatCurrency,
    calculateEarnings,
    getMileageReimbursement,
} from '@/lib/store';

export default function ReportsPage() {
    const {
        timeEntries, mileageEntries, fuelLogs, dailyNotes, profile,
    } = useStore();

    const [mounted, setMounted] = useState(false);
    const [period, setPeriod] = useState<'week' | 'month' | 'all'>('week');
    const [weekOffset, setWeekOffset] = useState(0);

    useEffect(() => { setMounted(true); }, []);

    // Date range
    const dateRange = useMemo(() => {
        const now = new Date();
        const start = new Date(now);
        const end = new Date(now);

        if (period === 'week') {
            start.setDate(now.getDate() - now.getDay() - weekOffset * 7);
            end.setDate(start.getDate() + 6);
        } else if (period === 'month') {
            start.setDate(1);
            end.setMonth(end.getMonth() + 1, 0);
        } else {
            start.setFullYear(2020);
        }
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        return { start, end };
    }, [period, weekOffset]);

    const filteredTime = useMemo(
        () => timeEntries.filter(e => {
            const d = new Date(e.date);
            return d >= dateRange.start && d <= dateRange.end;
        }),
        [timeEntries, dateRange]
    );
    const filteredMileage = useMemo(
        () => mileageEntries.filter(e => {
            const d = new Date(e.date);
            return d >= dateRange.start && d <= dateRange.end;
        }),
        [mileageEntries, dateRange]
    );
    const filteredFuel = useMemo(
        () => fuelLogs.filter(l => {
            const d = new Date(l.date);
            return d >= dateRange.start && d <= dateRange.end;
        }),
        [fuelLogs, dateRange]
    );

    const totalHours = useMemo(
        () => filteredTime.reduce((s, e) => s + getHoursFromEntry(e), 0),
        [filteredTime]
    );
    const totalMiles = useMemo(
        () => filteredMileage.reduce((s, e) => s + e.tripMiles, 0),
        [filteredMileage]
    );
    const totalFuelCost = useMemo(
        () => filteredFuel.reduce((s, l) => s + l.totalCost, 0),
        [filteredFuel]
    );
    const totalGallons = useMemo(
        () => filteredFuel.reduce((s, l) => s + l.gallons, 0),
        [filteredFuel]
    );

    const earnings = useMemo(
        () => profile.hourlyRate
            ? calculateEarnings(filteredTime, profile.hourlyRate, profile.overtimeMultiplier, profile.overtimeThreshold)
            : null,
        [filteredTime, profile.hourlyRate, profile.overtimeMultiplier, profile.overtimeThreshold]
    );

    const reimbursement = useMemo(
        () => getMileageReimbursement(filteredMileage),
        [filteredMileage]
    );

    // Daily breakdown for chart
    const dailyBreakdown = useMemo(() => {
        const days: { date: string; hours: number; miles: number }[] = [];
        const d = new Date(dateRange.start);
        while (d <= dateRange.end) {
            const dateStr = d.toISOString().split('T')[0];
            const dayHours = filteredTime
                .filter(e => e.date === dateStr)
                .reduce((s, e) => s + getHoursFromEntry(e), 0);
            const dayMiles = filteredMileage
                .filter(e => e.date === dateStr)
                .reduce((s, e) => s + e.tripMiles, 0);
            if (dayHours > 0 || dayMiles > 0) {
                days.push({ date: dateStr, hours: dayHours, miles: dayMiles });
            }
            d.setDate(d.getDate() + 1);
        }
        return days;
    }, [filteredTime, filteredMileage, dateRange]);

    const maxHours = useMemo(() => Math.max(...dailyBreakdown.map(d => d.hours), 1), [dailyBreakdown]);

    const workMiles = filteredMileage.filter(e => e.purpose === 'work').reduce((s, e) => s + e.tripMiles, 0);
    const personalMiles = filteredMileage.filter(e => e.purpose === 'personal').reduce((s, e) => s + e.tripMiles, 0);
    const commuteMiles = filteredMileage.filter(e => e.purpose === 'commute').reduce((s, e) => s + e.tripMiles, 0);

    const overtimeEntries = filteredTime.filter(e => e.isOvertime);

    if (!mounted) return null;

    const formatDateRange = () => {
        const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
        if (period === 'week') {
            return `${dateRange.start.toLocaleDateString('en-US', opts)} – ${dateRange.end.toLocaleDateString('en-US', opts)}`;
        }
        if (period === 'month') {
            return dateRange.start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        }
        return 'All Time';
    };

    return (
        <div className="page-container section-gap" style={{ paddingTop: '1rem' }}>
            <div className="page-header">
                <h1 className="text-title">Reports</h1>
            </div>

            {/* Period Filter */}
            <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                {(['week', 'month', 'all'] as const).map(p => (
                    <button
                        key={p}
                        className={`tag ${period === p ? 'tag-active' : ''}`}
                        onClick={() => { setPeriod(p); setWeekOffset(0); }}
                    >
                        {p === 'week' ? 'Week' : p === 'month' ? 'Month' : 'All'}
                    </button>
                ))}
            </div>

            {/* Period Navigation */}
            {period === 'week' && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <button className="btn btn-ghost btn-icon" style={{ width: 32, height: 32 }} onClick={() => setWeekOffset(o => o + 1)}>
                        <ChevronLeft size={16} />
                    </button>
                    <span className="text-body" style={{ fontSize: '0.875rem', fontWeight: 500 }}>{formatDateRange()}</span>
                    <button
                        className="btn btn-ghost btn-icon"
                        style={{ width: 32, height: 32, opacity: weekOffset === 0 ? 0.3 : 1 }}
                        onClick={() => weekOffset > 0 && setWeekOffset(o => o - 1)}
                        disabled={weekOffset === 0}
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}

            {/* Summary Stats */}
            <div className="stat-grid">
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ textAlign: 'center' }}>
                    <Clock size={16} style={{ color: 'var(--fp-amber)', margin: '0 auto 0.25rem' }} />
                    <p className="text-mono-md" style={{ color: 'var(--fp-amber)' }}>{formatHoursMinutes(totalHours)}</p>
                    <p className="text-caption">Hours</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card" style={{ textAlign: 'center' }}>
                    <MapPin size={16} style={{ color: 'var(--fp-info)', margin: '0 auto 0.25rem' }} />
                    <p className="text-mono-md" style={{ color: 'var(--fp-info)' }}>{totalMiles.toFixed(0)}</p>
                    <p className="text-caption">Miles</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card" style={{ textAlign: 'center' }}>
                    <Fuel size={16} style={{ color: 'var(--fp-success)', margin: '0 auto 0.25rem' }} />
                    <p className="text-mono-md" style={{ color: 'var(--fp-success)' }}>{totalGallons.toFixed(1)}</p>
                    <p className="text-caption">Gallons</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card" style={{ textAlign: 'center' }}>
                    <FileText size={16} style={{ color: 'var(--fp-purple)', margin: '0 auto 0.25rem' }} />
                    <p className="text-mono-md">{filteredTime.length}</p>
                    <p className="text-caption">Entries</p>
                </motion.div>
            </div>

            {/* Earnings */}
            {earnings && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card-amber">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <DollarSign size={16} style={{ color: 'var(--fp-amber)' }} />
                        <p className="text-heading" style={{ fontSize: '0.9375rem' }}>Earnings</p>
                    </div>
                    <div className="stat-grid" style={{ gap: '0.75rem' }}>
                        <div style={{ textAlign: 'center' }}>
                            <p className="text-mono-md" style={{ color: 'var(--fp-amber)' }}>{formatCurrency(earnings.total)}</p>
                            <p className="text-caption">Total</p>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <p className="text-mono-sm">{formatCurrency(earnings.regular)}</p>
                            <p className="text-caption">Regular</p>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <p className="text-mono-sm" style={{ color: earnings.overtime > 0 ? 'var(--fp-amber)' : 'inherit' }}>{formatCurrency(earnings.overtime)}</p>
                            <p className="text-caption">Overtime</p>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <p className="text-mono-sm" style={{ color: 'var(--fp-success)' }}>{formatCurrency(reimbursement)}</p>
                            <p className="text-caption">Mileage $</p>
                        </div>
                    </div>
                    {totalFuelCost > 0 && (
                        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--fp-border)', display: 'flex', justifyContent: 'space-between' }}>
                            <span className="text-caption">Fuel Costs</span>
                            <span className="text-mono-sm" style={{ color: 'var(--fp-error)' }}>-{formatCurrency(totalFuelCost)}</span>
                        </div>
                    )}
                    <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span className="text-caption" style={{ fontWeight: 600 }}>Net Income</span>
                        <span className="text-mono-sm" style={{ fontWeight: 600, color: 'var(--fp-success)' }}>
                            {formatCurrency(earnings.total + reimbursement - totalFuelCost)}
                        </span>
                    </div>
                </motion.div>
            )}

            {/* Hours Chart */}
            {dailyBreakdown.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <BarChart3 size={16} style={{ color: 'var(--fp-amber)' }} />
                        <p className="text-heading" style={{ fontSize: '0.9375rem' }}>Daily Hours</p>
                    </div>
                    <div style={{ display: 'flex', gap: '3px', height: 80, alignItems: 'flex-end' }}>
                        {dailyBreakdown.map((d, i) => (
                            <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${(d.hours / maxHours) * 56}px` }}
                                    transition={{ duration: 0.4, delay: i * 0.04 }}
                                    style={{
                                        width: '100%', minHeight: 2, borderRadius: 3,
                                        background: 'linear-gradient(to top, var(--fp-amber-dark), var(--fp-amber-light))',
                                    }}
                                />
                                <span className="text-caption" style={{ fontSize: '0.5625rem' }}>
                                    {new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
                                </span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Mileage Breakdown by Purpose */}
            {totalMiles > 0 && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <MapPin size={16} style={{ color: 'var(--fp-info)' }} />
                        <p className="text-heading" style={{ fontSize: '0.9375rem' }}>Mileage by Purpose</p>
                    </div>
                    <div className="section-gap" style={{ gap: '0.5rem' }}>
                        {[
                            { label: 'Work', value: workMiles, color: 'var(--fp-amber)' },
                            { label: 'Personal', value: personalMiles, color: 'var(--fp-info)' },
                            { label: 'Commute', value: commuteMiles, color: 'var(--fp-success)' },
                        ].map(item => (
                            <div key={item.label}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                    <span className="text-caption">{item.label}</span>
                                    <span className="text-mono-sm">{item.value.toFixed(0)} mi</span>
                                </div>
                                <div className="progress-bar">
                                    <motion.div
                                        className="progress-fill"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${totalMiles > 0 ? (item.value / totalMiles) * 100 : 0}%` }}
                                        transition={{ duration: 0.6 }}
                                        style={{ background: item.color }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Overtime Summary */}
            {overtimeEntries.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card">
                    <p className="text-heading" style={{ fontSize: '0.9375rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <TrendingUp size={16} style={{ color: 'var(--fp-amber)' }} /> Overtime
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                            <p className="text-mono-md">{overtimeEntries.length}</p>
                            <p className="text-caption">OT Entries</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p className="text-mono-md" style={{ color: 'var(--fp-amber)' }}>
                                {formatHoursMinutes(overtimeEntries.reduce((s, e) => s + getHoursFromEntry(e), 0))}
                            </p>
                            <p className="text-caption">OT Hours</p>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
