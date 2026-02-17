'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Fuel, Plus, Trash2, TrendingDown, DollarSign,
    Droplets, Gauge, Calendar, Star, MapPin,
} from 'lucide-react';
import {
    useStore,
    formatCurrency,
    getWeeklyFuelCost,
} from '@/lib/store';
import LocationSearch from '@/components/LocationSearch';

export default function FuelPage() {
    const {
        fuelLogs, addFuelLog, deleteFuelLog,
        recentStations, addRecentStation,
        showToast, profile,
    } = useStore();

    const [mounted, setMounted] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    const [mileage, setMileage] = useState('');
    const [gallons, setGallons] = useState('');
    const [costPerGallon, setCostPerGallon] = useState('');
    const [station, setStation] = useState('');
    const [notes, setNotes] = useState('');
    const [fuelType, setFuelType] = useState<'regular' | 'mid' | 'premium' | 'diesel'>('regular');

    useEffect(() => { setMounted(true); }, []);

    const totalCostCalc = useMemo(() => {
        const g = parseFloat(gallons) || 0;
        const c = parseFloat(costPerGallon) || 0;
        return g * c;
    }, [gallons, costPerGallon]);

    const totalGallons = useMemo(() => fuelLogs.reduce((s, l) => s + l.gallons, 0), [fuelLogs]);
    const totalCost = useMemo(() => fuelLogs.reduce((s, l) => s + l.totalCost, 0), [fuelLogs]);
    const weeklyFuelCost = useMemo(() => getWeeklyFuelCost(fuelLogs), [fuelLogs]);
    const avgMPG = useMemo(() => {
        if (fuelLogs.length < 2) return 0;
        const sorted = [...fuelLogs].sort((a, b) => a.mileage - b.mileage);
        const totalMiles = sorted[sorted.length - 1].mileage - sorted[0].mileage;
        const totalGal = fuelLogs.reduce((s, l) => s + l.gallons, 0);
        return totalGal > 0 ? totalMiles / totalGal : 0;
    }, [fuelLogs]);

    const handleSubmit = () => {
        const g = parseFloat(gallons);
        const c = parseFloat(costPerGallon);
        const m = parseFloat(mileage);
        if (isNaN(g) || isNaN(c) || isNaN(m)) {
            showToast('Fill in all required fields', 'error');
            return;
        }
        addFuelLog({
            date,
            time,
            mileage: m,
            gallons: g,
            costPerGallon: c,
            totalCost: g * c,
            station,
            notes,
            receiptPhoto: null,
            fuelType,
        });
        if (station.trim()) addRecentStation(station.trim());
        setMileage('');
        setGallons('');
        setCostPerGallon('');
        setStation('');
        setNotes('');
        setShowForm(false);
        showToast('Fuel log added!');
    };

    const handleLocationSelect = (result: { lat: number; lng: number; name: string; address: string }) => {
        setStation(result.name);
    };

    if (!mounted) return null;

    return (
        <div className="page-container section-gap" style={{ paddingTop: '1rem' }}>
            <div className="page-header">
                <h1 className="text-title">Fuel</h1>
            </div>

            {/* Stats */}
            <div className="stat-grid">
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ textAlign: 'center' }}>
                    <p className="text-caption">Total {profile.fuelUnit}</p>
                    <p className="text-mono-md" style={{ color: 'var(--fp-amber)' }}>{totalGallons.toFixed(1)}</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card" style={{ textAlign: 'center' }}>
                    <p className="text-caption">Total Cost</p>
                    <p className="text-mono-md" style={{ color: 'var(--fp-error)' }}>{formatCurrency(totalCost)}</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card" style={{ textAlign: 'center' }}>
                    <p className="text-caption">Avg MPG</p>
                    <p className="text-mono-md" style={{ color: 'var(--fp-success)' }}>{avgMPG > 0 ? avgMPG.toFixed(1) : '—'}</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card" style={{ textAlign: 'center' }}>
                    <p className="text-caption">This Week</p>
                    <p className="text-mono-md">{formatCurrency(weeklyFuelCost)}</p>
                </motion.div>
            </div>

            {/* Budget Alert */}
            {profile.weeklyGoal.fuelBudget > 0 && weeklyFuelCost > profile.weeklyGoal.fuelBudget * 0.8 && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--fp-radius-md)',
                        background: weeklyFuelCost > profile.weeklyGoal.fuelBudget ? 'var(--fp-error-bg)' : 'var(--fp-amber-glow)',
                        border: `1px solid ${weeklyFuelCost > profile.weeklyGoal.fuelBudget ? 'rgba(239,68,68,0.2)' : 'var(--fp-border-active)'}`,
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                    }}
                >
                    <TrendingDown size={14} style={{ color: weeklyFuelCost > profile.weeklyGoal.fuelBudget ? 'var(--fp-error)' : 'var(--fp-amber)' }} />
                    <span className="text-body" style={{ fontSize: '0.8125rem', color: 'var(--fp-text-primary)' }}>
                        {weeklyFuelCost > profile.weeklyGoal.fuelBudget
                            ? `Over budget by ${formatCurrency(weeklyFuelCost - profile.weeklyGoal.fuelBudget)}`
                            : `${Math.round((weeklyFuelCost / profile.weeklyGoal.fuelBudget) * 100)}% of fuel budget used`}
                    </span>
                </motion.div>
            )}

            {/* Add Form */}
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setShowForm(!showForm)}>
                <Plus size={14} /> Log Fuel Stop
            </button>

            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="card"
                        style={{ overflow: 'hidden' }}
                    >
                        <div className="section-gap" style={{ gap: '0.625rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                <div className="input-group">
                                    <label className="input-label">Date</label>
                                    <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Time</label>
                                    <input className="input" type="time" value={time} onChange={e => setTime(e.target.value)} />
                                </div>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Odometer</label>
                                <input className="input" type="number" placeholder="Current mileage" value={mileage} onChange={e => setMileage(e.target.value)} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                <div className="input-group">
                                    <label className="input-label">{profile.fuelUnit}</label>
                                    <input className="input" type="number" step="0.01" placeholder="0.00" value={gallons} onChange={e => setGallons(e.target.value)} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">$/gal</label>
                                    <input className="input" type="number" step="0.01" placeholder="0.00" value={costPerGallon} onChange={e => setCostPerGallon(e.target.value)} />
                                </div>
                            </div>
                            {totalCostCalc > 0 && (
                                <div style={{ textAlign: 'center', padding: '0.5rem', background: 'var(--fp-amber-glow)', borderRadius: 'var(--fp-radius-md)' }}>
                                    <p className="text-caption">Total</p>
                                    <p className="text-mono-md" style={{ color: 'var(--fp-amber)' }}>{formatCurrency(totalCostCalc)}</p>
                                </div>
                            )}
                            {/* Fuel Type */}
                            <div>
                                <label className="input-label" style={{ marginBottom: '0.375rem' }}>Fuel Type</label>
                                <div style={{ display: 'flex', gap: '0.375rem' }}>
                                    {(['regular', 'mid', 'premium', 'diesel'] as const).map(ft => (
                                        <button
                                            key={ft}
                                            className={`tag ${fuelType === ft ? 'tag-active' : ''}`}
                                            onClick={() => setFuelType(ft)}
                                            style={{ flex: 1, justifyContent: 'center', fontSize: '0.6875rem' }}
                                        >
                                            {ft.charAt(0).toUpperCase() + ft.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Location Search for Station */}
                            <div className="input-group">
                                <label className="input-label">
                                    <MapPin size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
                                    Find Station
                                </label>
                                <LocationSearch
                                    onSelect={handleLocationSelect}
                                    placeholder="Search for gas station..."
                                    showCurrentLocation={true}
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Station Name</label>
                                <input className="input" placeholder="Gas station name" value={station} onChange={e => setStation(e.target.value)} />
                            </div>
                            {/* Recent Stations */}
                            {recentStations.length > 0 && !station && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                    {recentStations.map(s => (
                                        <button key={s} className="tag" onClick={() => setStation(s)}>
                                            <Star size={8} /> {s}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <div className="input-group">
                                <label className="input-label">Notes</label>
                                <input className="input" placeholder="Optional" value={notes} onChange={e => setNotes(e.target.value)} />
                            </div>
                            <button className="btn btn-primary" onClick={handleSubmit}>
                                <Plus size={14} /> Save Fuel Log
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Fuel History */}
            <div>
                <p className="text-heading" style={{ fontSize: '0.9375rem', marginBottom: '0.625rem' }}>Fuel History</p>
                <AnimatePresence>
                    {fuelLogs.length === 0 ? (
                        <div className="empty-state">
                            <Fuel className="empty-state-icon" />
                            <p className="text-body">No fuel logs yet</p>
                            <p className="text-caption">Log your first fuel stop above</p>
                        </div>
                    ) : (
                        fuelLogs.map((log, i) => (
                            <motion.div
                                key={log.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -30 }}
                                transition={{ delay: i * 0.03 }}
                                className="list-item"
                                style={{ marginBottom: '0.5rem' }}
                            >
                                <div style={{
                                    width: 36, height: 36, borderRadius: 'var(--fp-radius-md)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: 'var(--fp-success-bg)', flexShrink: 0,
                                }}>
                                    <Fuel size={16} style={{ color: 'var(--fp-success)' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>
                                            {log.gallons.toFixed(2)} gal · {formatCurrency(log.totalCost)}
                                        </span>
                                    </div>
                                    <p className="text-caption">
                                        {log.station || 'Unknown'} · {log.fuelType || 'regular'} · {log.date}
                                    </p>
                                    <p className="text-caption">{log.mileage.toLocaleString()} mi</p>
                                </div>
                                <button
                                    className="btn btn-ghost btn-icon"
                                    style={{ width: 32, height: 32 }}
                                    onClick={() => { deleteFuelLog(log.id); showToast('Log deleted'); }}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
