'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin, Navigation, ArrowRight, Plus, Trash2, Square,
    Car, Briefcase, Home, Coffee,
} from 'lucide-react';
import {
    useStore,
    getTotalMilesToday,
    getWeeklyMiles,
    getMileageReimbursement,
    formatCurrency,
} from '@/lib/store';

export default function MileagePage() {
    const {
        mileageEntries, addMileageEntry, deleteMileageEntry, updateMileageEntry,
        isTripRunning, activeTripStart, startTrip, endTrip,
        showToast, profile,
    } = useStore();

    const [mounted, setMounted] = useState(false);
    const [startMileage, setStartMileage] = useState('');
    const [endMileage, setEndMileage] = useState('');
    const [showManual, setShowManual] = useState(false);
    const [manualStart, setManualStart] = useState('');
    const [manualEnd, setManualEnd] = useState('');
    const [manualPurpose, setManualPurpose] = useState<'work' | 'personal' | 'commute'>('work');

    useEffect(() => { setMounted(true); }, []);

    const todayMiles = useMemo(() => getTotalMilesToday(mileageEntries), [mileageEntries]);
    const weeklyMiles = useMemo(() => getWeeklyMiles(mileageEntries), [mileageEntries]);
    const reimbursement = useMemo(() => getMileageReimbursement(mileageEntries), [mileageEntries]);
    const totalMiles = useMemo(() => mileageEntries.reduce((s, e) => s + e.tripMiles, 0), [mileageEntries]);

    const handleStartTrip = () => {
        const val = parseFloat(startMileage);
        if (isNaN(val) || val <= 0) {
            showToast('Enter a valid start mileage', 'error');
            return;
        }
        startTrip(val);
        showToast('Trip started!', 'info');
        setStartMileage('');
    };

    const handleEndTrip = () => {
        const val = parseFloat(endMileage);
        if (isNaN(val) || val <= 0) {
            showToast('Enter a valid end mileage', 'error');
            return;
        }
        if (activeTripStart !== null && val <= activeTripStart) {
            showToast('End must be greater than start', 'error');
            return;
        }
        endTrip(val);
        showToast('Trip logged!');
        setEndMileage('');
    };

    const handleManualAdd = () => {
        const s = parseFloat(manualStart);
        const e = parseFloat(manualEnd);
        if (isNaN(s) || isNaN(e) || e <= s) {
            showToast('Enter valid start/end values', 'error');
            return;
        }
        addMileageEntry({
            date: new Date().toISOString().split('T')[0],
            startMileage: s,
            endMileage: e,
            tripMiles: e - s,
            startLocation: '',
            endLocation: '',
            notes: '',
            linkedTimeEntryId: null,
            purpose: manualPurpose,
        });
        setManualStart('');
        setManualEnd('');
        setShowManual(false);
        showToast('Trip added!');
    };

    const purposeIcons = { work: Briefcase, personal: Home, commute: Coffee };
    const purposeColors = { work: 'var(--fp-amber)', personal: 'var(--fp-info)', commute: 'var(--fp-success)' };

    if (!mounted) return null;

    return (
        <div className="page-container section-gap" style={{ paddingTop: '1rem' }}>
            <div className="page-header">
                <h1 className="text-title">Mileage</h1>
            </div>

            {/* Stats */}
            <div className="stat-grid">
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ textAlign: 'center' }}>
                    <p className="text-caption">Today</p>
                    <p className="text-mono-md" style={{ color: 'var(--fp-amber)' }}>{todayMiles.toFixed(1)} mi</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card" style={{ textAlign: 'center' }}>
                    <p className="text-caption">This Week</p>
                    <p className="text-mono-md" style={{ color: 'var(--fp-info)' }}>{weeklyMiles.toFixed(1)} mi</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card" style={{ textAlign: 'center' }}>
                    <p className="text-caption">Total</p>
                    <p className="text-mono-md">{totalMiles.toFixed(0)} mi</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card" style={{ textAlign: 'center' }}>
                    <p className="text-caption">Reimbursement</p>
                    <p className="text-mono-md" style={{ color: 'var(--fp-success)' }}>{formatCurrency(reimbursement)}</p>
                    <p className="text-caption" style={{ fontSize: '0.625rem' }}>@$0.67/mi (IRS)</p>
                </motion.div>
            </div>

            {/* Active Trip or Start Trip */}
            {isTripRunning ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="card-amber"
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <Navigation size={16} style={{ color: 'var(--fp-amber)' }} className="animate-pulse-dot" />
                        <p className="text-heading" style={{ fontSize: '0.9375rem' }}>Trip in Progress</p>
                    </div>
                    <p className="text-body" style={{ marginBottom: '0.75rem' }}>
                        Started at <span className="text-mono-sm">{activeTripStart?.toLocaleString()}</span> {profile.mileageUnit}
                    </p>
                    <div className="input-group">
                        <label className="input-label">End Odometer</label>
                        <input
                            className="input input-lg"
                            type="number"
                            placeholder="0"
                            value={endMileage}
                            onChange={e => setEndMileage(e.target.value)}
                        />
                    </div>
                    {endMileage && activeTripStart && parseFloat(endMileage) > activeTripStart && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-mono-md"
                            style={{ color: 'var(--fp-amber)', textAlign: 'center', margin: '0.5rem 0' }}
                        >
                            {(parseFloat(endMileage) - activeTripStart).toFixed(1)} {profile.mileageUnit}
                        </motion.p>
                    )}
                    <button className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={handleEndTrip}>
                        <Square size={14} /> End Trip
                    </button>
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card"
                >
                    <p className="text-heading" style={{ fontSize: '0.9375rem', marginBottom: '0.75rem' }}>Start a Trip</p>
                    <div className="input-group">
                        <label className="input-label">Start Odometer</label>
                        <input
                            className="input input-lg"
                            type="number"
                            placeholder="0"
                            value={startMileage}
                            onChange={e => setStartMileage(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-primary" style={{ width: '100%', marginTop: '0.75rem' }} onClick={handleStartTrip}>
                        <Navigation size={14} /> Start Trip
                    </button>
                </motion.div>
            )}

            {/* Manual Entry Toggle */}
            {!isTripRunning && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => setShowManual(!showManual)}>
                        <Plus size={14} /> Manual Entry
                    </button>
                    <AnimatePresence>
                        {showManual && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="card"
                                style={{ marginTop: '0.5rem', overflow: 'hidden' }}
                            >
                                <div className="section-gap" style={{ gap: '0.5rem' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.5rem', alignItems: 'end' }}>
                                        <div className="input-group">
                                            <label className="input-label">Start</label>
                                            <input className="input" type="number" value={manualStart} onChange={e => setManualStart(e.target.value)} />
                                        </div>
                                        <ArrowRight size={16} style={{ color: 'var(--fp-text-muted)', marginBottom: '0.75rem' }} />
                                        <div className="input-group">
                                            <label className="input-label">End</label>
                                            <input className="input" type="number" value={manualEnd} onChange={e => setManualEnd(e.target.value)} />
                                        </div>
                                    </div>
                                    {/* Purpose selector */}
                                    <div>
                                        <label className="input-label" style={{ marginBottom: '0.375rem' }}>Purpose</label>
                                        <div style={{ display: 'flex', gap: '0.375rem' }}>
                                            {(['work', 'personal', 'commute'] as const).map(p => (
                                                <button
                                                    key={p}
                                                    className={`tag ${manualPurpose === p ? 'tag-active' : ''}`}
                                                    onClick={() => setManualPurpose(p)}
                                                    style={{ flex: 1, justifyContent: 'center' }}
                                                >
                                                    {p.charAt(0).toUpperCase() + p.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    {manualStart && manualEnd && parseFloat(manualEnd) > parseFloat(manualStart) && (
                                        <p className="text-mono-sm" style={{ color: 'var(--fp-amber)', textAlign: 'center' }}>
                                            {(parseFloat(manualEnd) - parseFloat(manualStart)).toFixed(1)} {profile.mileageUnit}
                                        </p>
                                    )}
                                    <button className="btn btn-primary" onClick={handleManualAdd}>
                                        <Plus size={14} /> Add Entry
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* Trip History */}
            <div>
                <p className="text-heading" style={{ fontSize: '0.9375rem', marginBottom: '0.625rem' }}>Trip History</p>
                <AnimatePresence>
                    {mileageEntries.length === 0 ? (
                        <div className="empty-state">
                            <Car className="empty-state-icon" />
                            <p className="text-body">No trips logged yet</p>
                            <p className="text-caption">Start a trip to begin tracking mileage</p>
                        </div>
                    ) : (
                        mileageEntries.map((entry, i) => {
                            const PurpIcon = purposeIcons[entry.purpose] || Car;
                            return (
                                <motion.div
                                    key={entry.id}
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
                                        background: entry.purpose === 'work' ? 'var(--fp-amber-glow)' : entry.purpose === 'personal' ? 'var(--fp-info-bg)' : 'var(--fp-success-bg)',
                                        flexShrink: 0,
                                    }}>
                                        <PurpIcon size={16} style={{ color: purposeColors[entry.purpose] }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span className="text-mono-sm" style={{ fontWeight: 600 }}>{entry.tripMiles.toFixed(1)} mi</span>
                                            <span className="tag" style={{ fontSize: '0.625rem', padding: '0.125rem 0.375rem' }}>
                                                {entry.purpose}
                                            </span>
                                        </div>
                                        <p className="text-caption">
                                            {entry.startMileage.toLocaleString()} → {entry.endMileage?.toLocaleString()} · {entry.date}
                                        </p>
                                    </div>
                                    <button
                                        className="btn btn-ghost btn-icon"
                                        style={{ width: 32, height: 32 }}
                                        onClick={() => { deleteMileageEntry(entry.id); showToast('Trip deleted'); }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </motion.div>
                            );
                        })
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
