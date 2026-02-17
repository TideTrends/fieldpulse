'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Play, Square, Clock, Trash2, Edit3, Tag, Filter,
    ChevronDown, Zap, DollarSign,
} from 'lucide-react';
import {
    useStore,
    getHoursFromEntry,
    formatDuration,
    formatHoursMinutes,
    formatCurrency,
    getTodayEntries,
    getWeekEntries,
    type TimeEntry,
} from '@/lib/store';

export default function TimePage() {
    const {
        profile, isTimerRunning, activeTimerStart,
        startTimer, stopTimer,
        timeEntries, updateTimeEntry, deleteTimeEntry,
        showToast,
    } = useStore();

    const [elapsed, setElapsed] = useState(0);
    const [mounted, setMounted] = useState(false);
    const [filter, setFilter] = useState<'today' | 'week' | 'all'>('today');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editNotes, setEditNotes] = useState('');
    const [editBreak, setEditBreak] = useState('');
    const [editTags, setEditTags] = useState<string[]>([]);

    useEffect(() => { setMounted(true); }, []);

    // Live timer
    useEffect(() => {
        if (!isTimerRunning || !activeTimerStart) return;
        const tick = () =>
            setElapsed(Math.floor((Date.now() - new Date(activeTimerStart).getTime()) / 1000));
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [isTimerRunning, activeTimerStart]);

    const filteredEntries = useMemo(() => {
        if (filter === 'today') return getTodayEntries(timeEntries);
        if (filter === 'week') return getWeekEntries(timeEntries);
        return timeEntries;
    }, [timeEntries, filter]);

    const totalHours = useMemo(
        () => filteredEntries.reduce((sum, e) => sum + getHoursFromEntry(e), 0),
        [filteredEntries]
    );

    const overtimeEntries = filteredEntries.filter(e => e.isOvertime);

    const handleTimerToggle = () => {
        if (isTimerRunning) {
            stopTimer();
            showToast('Shift ended! Entry saved.');
        } else {
            startTimer();
            showToast('Shift started!', 'info');
        }
    };

    const startEdit = (entry: TimeEntry) => {
        setEditingId(entry.id);
        setEditNotes(entry.notes);
        setEditBreak(entry.breakMinutes.toString());
        setEditTags(entry.tags);
    };

    const saveEdit = (id: string) => {
        updateTimeEntry(id, {
            notes: editNotes,
            breakMinutes: parseInt(editBreak) || 0,
            tags: editTags,
        });
        setEditingId(null);
        showToast('Entry updated');
    };

    if (!mounted) return null;

    return (
        <div className="page-container section-gap" style={{ paddingTop: '1rem' }}>
            <div className="page-header">
                <h1 className="text-title">Time</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {overtimeEntries.length > 0 && (
                        <div className="overtime-badge">
                            <Zap size={10} /> {overtimeEntries.length} OT
                        </div>
                    )}
                </div>
            </div>

            {/* Timer */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '1.5rem 0' }}
            >
                <p className="text-caption" style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.6875rem' }}>
                    {isTimerRunning ? 'Tracking Active' : 'Not Tracking'}
                </p>
                <motion.p
                    className="text-mono-lg"
                    style={{ color: isTimerRunning ? 'var(--fp-amber)' : 'var(--fp-text-primary)' }}
                >
                    {isTimerRunning ? formatDuration(elapsed) : '00:00:00'}
                </motion.p>
                <motion.button
                    className={`timer-btn ${isTimerRunning ? 'timer-btn-stop' : 'timer-btn-start'}`}
                    onClick={handleTimerToggle}
                    whileTap={{ scale: 0.93 }}
                >
                    {isTimerRunning ? <Square size={40} fill="white" /> : <Play size={40} fill="#0a0a0b" />}
                </motion.button>
            </motion.div>

            {/* Filter */}
            <div style={{ display: 'flex', gap: '0.375rem' }}>
                {(['today', 'week', 'all'] as const).map(f => (
                    <button
                        key={f}
                        className={`tag ${filter === f ? 'tag-active' : ''}`}
                        onClick={() => setFilter(f)}
                    >
                        {f === 'today' ? 'Today' : f === 'week' ? 'This Week' : 'All'}
                    </button>
                ))}
                <div style={{ flex: 1 }} />
                <span className="text-mono-sm" style={{ color: 'var(--fp-amber)', alignSelf: 'center' }}>
                    {formatHoursMinutes(totalHours)}
                </span>
            </div>

            {/* Entries List */}
            <AnimatePresence mode="popLayout">
                {filteredEntries.length === 0 ? (
                    <div className="empty-state">
                        <Clock className="empty-state-icon" />
                        <p className="text-body">No time entries yet</p>
                        <p className="text-caption">Start a shift to begin tracking</p>
                    </div>
                ) : (
                    filteredEntries.map((entry, i) => {
                        const hours = getHoursFromEntry(entry);
                        const isEditing = editingId === entry.id;
                        return (
                            <motion.div
                                key={entry.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -30 }}
                                transition={{ delay: i * 0.03 }}
                                className="card"
                                style={{ marginBottom: '0.5rem' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <p className="text-mono-sm" style={{ color: 'var(--fp-amber)' }}>
                                                {formatHoursMinutes(hours)}
                                            </p>
                                            {entry.isOvertime && (
                                                <span className="overtime-badge"><Zap size={8} /> OT</span>
                                            )}
                                        </div>
                                        <p className="text-caption" style={{ marginTop: '0.125rem' }}>
                                            {new Date(entry.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            {' → '}
                                            {entry.endTime
                                                ? new Date(entry.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                : 'Running'}
                                        </p>
                                        <p className="text-caption">{entry.date}</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                                        <button className="btn btn-ghost btn-icon" style={{ width: 32, height: 32 }} onClick={() => isEditing ? saveEdit(entry.id) : startEdit(entry)}>
                                            <Edit3 size={14} />
                                        </button>
                                        <button className="btn btn-ghost btn-icon" style={{ width: 32, height: 32 }} onClick={() => { deleteTimeEntry(entry.id); showToast('Entry deleted'); }}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                {/* Tags */}
                                {entry.tags.length > 0 && !isEditing && (
                                    <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                        {entry.tags.map(tag => (
                                            <span key={tag} className="tag" style={{ fontSize: '0.6875rem' }}>{tag}</span>
                                        ))}
                                    </div>
                                )}
                                {entry.notes && !isEditing && (
                                    <p className="text-body" style={{ marginTop: '0.375rem', fontSize: '0.8125rem' }}>{entry.notes}</p>
                                )}

                                {/* Earnings */}
                                {entry.hourlyRate && entry.hourlyRate > 0 && (
                                    <p className="text-caption" style={{ marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <DollarSign size={10} />
                                        {formatCurrency(hours * entry.hourlyRate * (entry.isOvertime ? profile.overtimeMultiplier : 1))}
                                    </p>
                                )}

                                {/* Edit Form */}
                                <AnimatePresence>
                                    {isEditing && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            style={{ marginTop: '0.75rem', overflow: 'hidden' }}
                                        >
                                            <div className="section-gap" style={{ gap: '0.5rem' }}>
                                                <div className="input-group">
                                                    <label className="input-label">Break (min)</label>
                                                    <input className="input" type="number" value={editBreak} onChange={e => setEditBreak(e.target.value)} />
                                                </div>
                                                <div className="input-group">
                                                    <label className="input-label">Notes</label>
                                                    <input className="input" value={editNotes} onChange={e => setEditNotes(e.target.value)} />
                                                </div>
                                                <div>
                                                    <label className="input-label" style={{ marginBottom: '0.25rem' }}>Tags</label>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                                        {useStore.getState().customTags.map(tag => (
                                                            <span
                                                                key={tag}
                                                                className={`tag ${editTags.includes(tag) ? 'tag-active' : ''}`}
                                                                onClick={() => setEditTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                                                            >
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <button className="btn btn-primary" onClick={() => saveEdit(entry.id)}>
                                                    Save Changes
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })
                )}
            </AnimatePresence>
        </div>
    );
}
