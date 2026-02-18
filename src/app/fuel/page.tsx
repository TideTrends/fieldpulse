'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Fuel, Trash2, Calendar, Plus, Info,
    History, Droplets, Gauge, Clock
} from 'lucide-react';
import {
    useStore,
    getTodayFuel,
    type FuelLog,
} from '@/lib/store';

export default function FuelPage() {
    const {
        fuelLogs, addFuelLog, deleteFuelLog,
        showToast,
    } = useStore();

    const [mounted, setMounted] = useState(false);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    const [gallons, setGallons] = useState('');
    const [mileage, setMileage] = useState('');
    const [notes, setNotes] = useState('');
    const [fuelType, setFuelType] = useState('Gasoline');

    useEffect(() => { setMounted(true); }, []);

    const sortedLogs = useMemo(() => {
        return [...fuelLogs].sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
            const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
            return dateB.getTime() - dateA.getTime();
        });
    }, [fuelLogs]);

    const stats = useMemo(() => {
        const todayNum = getTodayFuel(fuelLogs);
        const totalGal = fuelLogs.reduce((sum, l) => sum + l.gallons, 0);
        return { todayNum, totalGal };
    }, [fuelLogs]);

    const handleSubmit = () => {
        const g = parseFloat(gallons);
        const m = parseFloat(mileage);

        if (isNaN(g) || isNaN(m)) {
            showToast('Fill in all required fields', 'error');
            return;
        }

        addFuelLog({
            date,
            time,
            mileage: m,
            gallons: g,
            costPerGallon: 0,
            totalCost: 0,
            station: 'Company Provided',
            notes,
            receiptPhoto: null,
            fuelType,
        });

        setGallons('');
        setMileage('');
        setNotes('');
        showToast('Fuel log saved!');
    };

    if (!mounted) return null;

    return (
        <div className="page-container section-gap" style={{ paddingTop: '1rem' }}>
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="icon-box-emerald">
                        <Fuel size={20} />
                    </div>
                    <h1 className="text-title">Fuel Tracking</h1>
                </div>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="card-glass" style={{ textAlign: 'center' }}>
                    <p className="text-caption" style={{ marginBottom: '0.25rem' }}>Today</p>
                    <p className="text-mono-md" style={{ color: 'var(--fp-emerald)' }}>
                        {stats.todayNum.toFixed(1)} <span style={{ fontSize: '0.625rem', opacity: 0.6 }}>GAL</span>
                    </p>
                </div>
                <div className="card-glass" style={{ textAlign: 'center' }}>
                    <p className="text-caption" style={{ marginBottom: '0.25rem' }}>Total Life</p>
                    <p className="text-mono-md" style={{ color: 'var(--fp-emerald)' }}>
                        {stats.totalGal.toFixed(0)} <span style={{ fontSize: '0.625rem', opacity: 0.6 }}>GAL</span>
                    </p>
                </div>
            </div>

            {/* Quick Log Form */}
            <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    <Plus size={16} style={{ color: 'var(--fp-emerald)' }} />
                    <h2 className="text-body" style={{ fontWeight: 600 }}>Log Fuel Up</h2>
                </div>

                <div className="section-gap" style={{ gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div className="input-group">
                            <label className="input-label"><Calendar size={12} /> Date</label>
                            <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
                        </div>
                        <div className="input-group">
                            <label className="input-label"><Clock size={12} /> Time</label>
                            <input className="input" type="time" value={time} onChange={e => setTime(e.target.value)} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div className="input-group">
                            <label className="input-label"><Droplets size={12} /> Gallons</label>
                            <input
                                className="input"
                                type="number"
                                inputMode="decimal"
                                placeholder="0.00"
                                value={gallons}
                                onChange={e => setGallons(e.target.value)}
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label"><Gauge size={12} /> Odometer</label>
                            <input
                                className="input"
                                type="number"
                                inputMode="numeric"
                                placeholder="Current miles"
                                value={mileage}
                                onChange={e => setMileage(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Fuel Type</label>
                        <select className="input" value={fuelType} onChange={e => setFuelType(e.target.value)}>
                            <option>Gasoline</option>
                            <option>Diesel</option>
                            <option>Premium</option>
                        </select>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Notes (optional)</label>
                        <input className="input" placeholder="Any comments..." value={notes} onChange={e => setNotes(e.target.value)} />
                    </div>

                    <button className="btn btn-primary" onClick={handleSubmit}>
                        Log Entry
                    </button>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.75rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: 'var(--fp-radius-md)', marginTop: '0.25rem' }}>
                        <Info size={14} style={{ color: 'var(--fp-emerald)', flexShrink: 0, marginTop: '2px' }} />
                        <p className="text-caption" style={{ color: 'var(--fp-emerald)', opacity: 0.8, lineHeight: 1.4 }}>
                            Station and cost tracking are disabled as fuel is company provided.
                        </p>
                    </div>
                </div>
            </div>

            {/* History */}
            <div className="section-gap" style={{ gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.5rem 0' }}>
                    <History size={14} style={{ color: 'var(--fp-text-muted)' }} />
                    <h2 className="text-caption" style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>History</h2>
                </div>

                <AnimatePresence mode="popLayout">
                    {sortedLogs.length === 0 ? (
                        <div className="empty-state">
                            <Fuel className="empty-state-icon" style={{ opacity: 0.1 }} />
                            <p className="text-body">No fuel logs yet</p>
                        </div>
                    ) : (
                        sortedLogs.map((log, i) => (
                            <motion.div
                                key={log.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -30 }}
                                transition={{ delay: i * 0.03 }}
                                className="card"
                                style={{ padding: '1rem' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
                                            <p className="text-mono-sm" style={{ color: 'var(--fp-emerald)', fontSize: '0.9375rem', fontWeight: 600 }}>
                                                {log.gallons.toFixed(2)} gal
                                            </p>
                                            <span className="tag-outline" style={{ fontSize: '0.625rem' }}>{log.fuelType}</span>
                                        </div>
                                        <div style={{ display: 'flex', color: 'var(--fp-text-muted)', gap: '0.5rem', alignItems: 'center' }}>
                                            <Calendar size={12} />
                                            <span className="text-caption" style={{ fontWeight: 500 }}>{log.date}</span>
                                            <span className="text-caption" style={{ opacity: 0.5 }}>•</span>
                                            <span className="text-caption">{log.time}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.375rem', color: 'var(--fp-text-primary)' }}>
                                            <Gauge size={12} style={{ opacity: 0.5 }} />
                                            <p className="text-caption" style={{ fontWeight: 600 }}>{log.mileage.toLocaleString()} miles</p>
                                        </div>
                                    </div>
                                    <button
                                        className="btn btn-ghost btn-icon"
                                        onClick={() => { deleteFuelLog(log.id); showToast('Log deleted'); }}
                                        style={{ height: 32, width: 32 }}
                                    >
                                        <Trash2 size={14} style={{ color: 'var(--fp-error)' }} />
                                    </button>
                                </div>
                                {log.notes && (
                                    <div style={{ marginTop: '0.75rem', padding: '0.625rem', background: 'var(--fp-surface)', borderRadius: 'var(--fp-radius-sm)', borderLeft: '2px solid var(--fp-emerald)' }}>
                                        <p className="text-body" style={{ fontSize: '0.75rem', color: 'var(--fp-text-secondary)', fontStyle: 'italic' }}>
                                            "{log.notes}"
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
