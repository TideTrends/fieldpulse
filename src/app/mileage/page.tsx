'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin, Navigation, ArrowRight, Plus, Trash2, Square,
    Car, Briefcase, Home, Coffee, History, Info, TrendingUp,
    Calendar, Gauge, Map, Edit3, X, Check
} from 'lucide-react';
import {
    useStore,
    getMilesForRange,
} from '@/lib/store';

type MileageTab = 'work' | 'personal' | 'all';

export default function MileagePage() {
    const {
        mileageEntries, addMileageEntry, updateMileageEntry, deleteMileageEntry,
        isTripRunning, activeTripStart, startTrip, endTrip,
        showToast, profile,
    } = useStore();

    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<MileageTab>('work');
    const [startMileage, setStartMileage] = useState('');
    const [endMileage, setEndMileage] = useState('');
    const [showManual, setShowManual] = useState(false);
    const [manualStart, setManualStart] = useState('');
    const [manualEnd, setManualEnd] = useState('');
    const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
    const [manualPurpose, setManualPurpose] = useState<'work' | 'personal' | 'commute'>('work');

    // Edit State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editDate, setEditDate] = useState('');
    const [editStart, setEditStart] = useState('');
    const [editEnd, setEditEnd] = useState('');
    const [editPurpose, setEditPurpose] = useState<'work' | 'personal' | 'commute'>('work');
    const [editNotes, setEditNotes] = useState('');

    useEffect(() => { setMounted(true); }, []);

    const filteredEntries = useMemo(() => {
        if (activeTab === 'all') return [...mileageEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return mileageEntries
            .filter(e => e.purpose === activeTab)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [mileageEntries, activeTab]);

    const stats = useMemo(() => {
        const entries = activeTab === 'all' ? mileageEntries : mileageEntries.filter(e => e.purpose === activeTab);
        const todayStr = new Date().toISOString().split('T')[0];

        const today = entries.filter(e => e.date === todayStr).reduce((s, e) => s + e.tripMiles, 0);
        const week = getMilesForRange(mileageEntries, 7, activeTab === 'all' ? undefined : activeTab as 'work' | 'personal');
        const month = getMilesForRange(mileageEntries, 30, activeTab === 'all' ? undefined : activeTab as 'work' | 'personal');
        const total = entries.reduce((s, e) => s + e.tripMiles, 0);

        return { today, week, month, total };
    }, [mileageEntries, activeTab]);

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
            date: manualDate,
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

    const startEdit = (entry: any) => {
        setEditingId(entry.id);
        setEditDate(entry.date);
        setEditStart(entry.startMileage.toString());
        setEditEnd(entry.endMileage?.toString() || '');
        setEditPurpose(entry.purpose);
        setEditNotes(entry.notes || '');
    };

    const saveEdit = (id: string) => {
        const s = parseFloat(editStart);
        const e = parseFloat(editEnd);
        if (isNaN(s) || isNaN(e) || e <= s) {
            showToast('Enter valid start/end values', 'error');
            return;
        }
        updateMileageEntry(id, {
            date: editDate,
            startMileage: s,
            endMileage: e,
            tripMiles: e - s,
            purpose: editPurpose,
            notes: editNotes,
        });
        setEditingId(null);
        showToast('Trip updated');
    };

    const purposeIcons = { work: Briefcase, personal: Home, commute: Coffee };
    const purposeColors = { work: 'var(--fp-amber)', personal: 'var(--fp-info)', commute: 'var(--fp-success)' };

    if (!mounted) return null;

    const tabs: { id: MileageTab; label: string; icon: any }[] = [
        { id: 'work', label: 'Work', icon: Briefcase },
        { id: 'personal', label: 'Personal', icon: Home },
        { id: 'all', label: 'All Trips', icon: Map },
    ];

    return (
        <div className="page-container section-gap" style={{ paddingTop: '1rem' }}>
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="icon-box-blue">
                        <Car size={20} />
                    </div>
                    <h1 className="text-title">Mileage</h1>
                </div>
            </div>

            {/* Premium Tab Switcher */}
            <div className="tab-container" style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.375rem', borderRadius: 'var(--fp-radius-lg)', marginBottom: '1rem' }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                            padding: '0.625rem', borderRadius: 'var(--fp-radius-md)', border: 'none',
                            background: activeTab === tab.id ? 'var(--fp-blue)' : 'transparent',
                            color: activeTab === tab.id ? 'white' : 'var(--fp-text-secondary)',
                            fontSize: '0.8125rem', fontWeight: 600, transition: 'all 0.2s',
                            cursor: 'pointer'
                        }}
                    >
                        <tab.icon size={14} />
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Stats Grid */}
            <div className="stat-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                <div className="card-glass" style={{ textAlign: 'center' }}>
                    <p className="text-caption">Today</p>
                    <p className="text-mono-md" style={{ color: 'var(--fp-blue)' }}>{stats.today.toFixed(1)} <span style={{ fontSize: '0.625rem' }}>MI</span></p>
                </div>
                <div className="card-glass" style={{ textAlign: 'center' }}>
                    <p className="text-caption">This Week</p>
                    <p className="text-mono-md" style={{ color: 'var(--fp-blue)' }}>{stats.week.toFixed(1)} <span style={{ fontSize: '0.625rem' }}>MI</span></p>
                </div>
                <div className="card-glass" style={{ textAlign: 'center' }}>
                    <p className="text-caption">Lifetime</p>
                    <p className="text-mono-md">{stats.total.toFixed(0)} <span style={{ fontSize: '0.625rem' }}>MI</span></p>
                </div>
            </div>

            {/* Active Trip Section */}
            {isTripRunning ? (
                <div className="card-glass" style={{ background: 'var(--fp-blue-glow)', borderColor: 'var(--fp-blue)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
                        <div className="animate-pulse-dot" style={{ backgroundColor: 'var(--fp-blue)' }} />
                        <h2 className="text-body" style={{ fontWeight: 600 }}>Active Trip</h2>
                    </div>
                    <div className="section-gap" style={{ gap: '0.75rem' }}>
                        <div className="input-group">
                            <label className="input-label">End Odometer Reading</label>
                            <input
                                className="input input-lg"
                                type="number"
                                placeholder="Enter current mileage"
                                value={endMileage}
                                onChange={e => setEndMileage(e.target.value)}
                            />
                        </div>
                        {endMileage && activeTripStart && parseFloat(endMileage) > activeTripStart && (
                            <div style={{ textAlign: 'center', padding: '0.5rem' }}>
                                <p className="text-caption">Current Distance</p>
                                <p className="text-mono-lg" style={{ color: 'var(--fp-blue)' }}>
                                    {(parseFloat(endMileage) - activeTripStart).toFixed(1)} mi
                                </p>
                            </div>
                        )}
                        <button className="btn btn-primary" onClick={handleEndTrip}>
                            End & Save Trip
                        </button>
                    </div>
                </div>
            ) : (
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                        <Navigation size={16} style={{ color: 'var(--fp-blue)' }} />
                        <h2 className="text-body" style={{ fontWeight: 600 }}>Start New Trip</h2>
                    </div>
                    <div className="section-gap" style={{ gap: '0.75rem' }}>
                        <div className="input-group">
                            <label className="input-label">Start Odometer Reading</label>
                            <input
                                className="input input-lg"
                                type="number"
                                placeholder="Enter current mileage"
                                value={startMileage}
                                onChange={e => setStartMileage(e.target.value)}
                            />
                        </div>
                        <button className="btn btn-primary" onClick={handleStartTrip}>
                            Start Tracking
                        </button>
                    </div>
                </div>
            )}

            {/* Manual Entry Toggle */}
            {!isTripRunning && (
                <div>
                    <button className="btn btn-ghost" style={{ width: '100%', border: '1px dashed var(--fp-border)' }} onClick={() => setShowManual(!showManual)}>
                        {showManual ? 'Cancel' : <><Plus size={14} /> Add Manual Entry</>}
                    </button>

                    <AnimatePresence>
                        {showManual && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                style={{ overflow: 'hidden' }}
                            >
                                <div className="card" style={{ marginTop: '0.75rem' }}>
                                    <div className="section-gap" style={{ gap: '1rem' }}>
                                        <div className="input-group">
                                            <label className="input-label"><Calendar size={12} /> Date</label>
                                            <input className="input" type="date" value={manualDate} onChange={e => setManualDate(e.target.value)} />
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.75rem', alignItems: 'center' }}>
                                            <div className="input-group">
                                                <label className="input-label">Start</label>
                                                <input className="input" type="number" value={manualStart} onChange={e => setManualStart(e.target.value)} />
                                            </div>
                                            <ArrowRight size={14} style={{ color: 'var(--fp-text-muted)', marginTop: '1rem' }} />
                                            <div className="input-group">
                                                <label className="input-label">End</label>
                                                <input className="input" type="number" value={manualEnd} onChange={e => setManualEnd(e.target.value)} />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="input-label" style={{ marginBottom: '0.5rem' }}>Trip Purpose</label>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                {(['work', 'personal', 'commute'] as const).map(p => (
                                                    <button
                                                        key={p}
                                                        className={`tag ${manualPurpose === p ? 'tag-active' : ''}`}
                                                        onClick={() => setManualPurpose(p)}
                                                        style={{ flex: 1, justifyContent: 'center', padding: '0.5rem' }}
                                                    >
                                                        {p === 'work' && <Briefcase size={12} />}
                                                        {p === 'personal' && <Home size={12} />}
                                                        {p === 'commute' && <Coffee size={12} />}
                                                        {p.charAt(0).toUpperCase() + p.slice(1)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <button className="btn btn-primary" onClick={handleManualAdd}>
                                            Save Entry
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* History Section */}
            <div className="section-gap" style={{ gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.5rem 0' }}>
                    <History size={14} style={{ color: 'var(--fp-text-muted)' }} />
                    <h2 className="text-caption" style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>Trip History</h2>
                </div>

                <AnimatePresence mode="popLayout">
                    {filteredEntries.length === 0 ? (
                        <div className="empty-state">
                            <Car className="empty-state-icon" style={{ opacity: 0.1 }} />
                            <p className="text-body">No {activeTab !== 'all' ? activeTab : ''} trips found</p>
                        </div>
                    ) : (
                        filteredEntries.map((entry, i) => {
                            const isWork = entry.purpose === 'work';
                            const isCommute = entry.purpose === 'commute';
                            return (
                                <motion.div
                                    key={entry.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -30 }}
                                    transition={{ delay: i * 0.03 }}
                                    className="card"
                                    style={{ padding: '0.875rem 1rem' }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            <div style={{
                                                width: 40, height: 40, borderRadius: 'var(--fp-radius-md)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                background: isWork ? 'var(--fp-amber-glow)' : isCommute ? 'var(--fp-success-bg)' : 'var(--fp-info-bg)'
                                            }}>
                                                {isWork ? <Briefcase size={18} style={{ color: 'var(--fp-amber)' }} /> :
                                                    isCommute ? <Coffee size={18} style={{ color: 'var(--fp-success)' }} /> :
                                                        <Home size={18} style={{ color: 'var(--fp-info)' }} />}
                                            </div>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                                    <p className="text-mono-sm" style={{ fontWeight: 700, fontSize: '1rem' }}>{entry.tripMiles.toFixed(1)} <span style={{ fontSize: '0.75rem' }}>mi</span></p>
                                                    <span className={`tag ${isWork ? 'tag-warning' : isCommute ? 'tag-success' : 'tag-info'}`} style={{ fontSize: '0.625rem', padding: '2px 6px' }}>
                                                        {entry.purpose}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--fp-text-muted)' }}>
                                                    <Calendar size={12} />
                                                    <span className="text-caption">{entry.date}</span>
                                                    <span style={{ opacity: 0.3 }}>•</span>
                                                    <Gauge size={12} />
                                                    <span className="text-caption">{entry.startMileage.toLocaleString()} → {entry.endMileage?.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                                            <button
                                                className="btn btn-ghost btn-icon"
                                                onClick={() => editingId === entry.id ? setEditingId(null) : startEdit(entry)}
                                                style={{ height: 32, width: 32 }}
                                            >
                                                {editingId === entry.id ? <X size={14} /> : <Edit3 size={14} />}
                                            </button>
                                            <button
                                                className="btn btn-ghost btn-icon"
                                                onClick={() => { deleteMileageEntry(entry.id); showToast('Trip deleted'); }}
                                                style={{ height: 32, width: 32 }}
                                            >
                                                <Trash2 size={14} style={{ color: 'var(--fp-error)' }} />
                                            </button>
                                        </div>
                                    </div>

                                    {editingId === entry.id && (
                                        <div className="section-gap" style={{ marginTop: '1rem', gap: '0.75rem', padding: '1rem', background: 'var(--fp-surface)', borderRadius: 'var(--fp-radius-md)', border: '1px solid var(--fp-border)' }}>
                                            <div className="input-group">
                                                <label className="input-label"><Calendar size={12} /> Date</label>
                                                <input className="input" type="date" value={editDate} onChange={e => setEditDate(e.target.value)} />
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.75rem', alignItems: 'center' }}>
                                                <div className="input-group">
                                                    <label className="input-label">Start</label>
                                                    <input className="input" type="number" value={editStart} onChange={e => setEditStart(e.target.value)} />
                                                </div>
                                                <ArrowRight size={14} style={{ color: 'var(--fp-text-muted)', marginTop: '1rem' }} />
                                                <div className="input-group">
                                                    <label className="input-label">End</label>
                                                    <input className="input" type="number" value={editEnd} onChange={e => setEditEnd(e.target.value)} />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="input-label" style={{ marginBottom: '0.5rem' }}>Purpose</label>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    {(['work', 'personal', 'commute'] as const).map(p => (
                                                        <button
                                                            key={p}
                                                            className={`tag ${editPurpose === p ? 'tag-active' : ''}`}
                                                            onClick={() => setEditPurpose(p)}
                                                            style={{ flex: 1, justifyContent: 'center', padding: '0.4rem', fontSize: '0.625rem' }}
                                                        >
                                                            {p.charAt(0).toUpperCase() + p.slice(1)}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <button className="btn btn-primary" onClick={() => saveEdit(entry.id)}>
                                                <Check size={14} /> Save Changes
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
