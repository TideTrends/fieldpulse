'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Play, Square, Clock, Trash2, Edit3, Tag, Filter,
    ChevronDown, Zap, DollarSign, Calendar, Plus, History,
} from 'lucide-react';
import {
    useStore,
    getHoursFromEntry,
    formatDuration,
    formatHoursMinutes,
    formatCurrency,
    getTodayEntries,
    getWeekEntries,
    getHoursForRange,
    type TimeEntry,
} from '@/lib/store';
import TagSelector from '@/components/TagSelector';

export default function TimePage() {
    const {
        profile, isTimerRunning, activeTimerStart,
        startTimer, stopTimer,
        timeEntries, updateTimeEntry, deleteTimeEntry, addTimeEntry,
        showToast,
        customTags, addTag,
    } = useStore();

    const [elapsed, setElapsed] = useState(0);
    const [mounted, setMounted] = useState(false);
    const [filter, setFilter] = useState<'today' | '3days' | 'week' | 'month' | 'all'>('today');
    const [showManual, setShowManual] = useState(false);

    // Manual Form
    const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
    const [manualStart, setManualStart] = useState('08:00');
    const [manualEnd, setManualEnd] = useState('17:00');
    const [manualBreak, setManualBreak] = useState('0');
    const [manualNotes, setManualNotes] = useState('');
    const [manualTags, setManualTags] = useState<string[]>([]);
    const [newTag, setNewTag] = useState('');

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editNotes, setEditNotes] = useState('');
    const [editBreak, setEditBreak] = useState('');
    const [editTags, setEditTags] = useState<string[]>([]);
    const [editDate, setEditDate] = useState('');
    const [editStartTime, setEditStartTime] = useState('');
    const [editEndTime, setEditEndTime] = useState('');

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
        const now = new Date();
        const getStartOfDay = (d: Date) => {
            const res = new Date(d);
            res.setHours(0, 0, 0, 0);
            return res;
        };

        if (filter === 'today') return getTodayEntries(timeEntries);

        let startLimit = new Date();
        if (filter === '3days') startLimit.setDate(now.getDate() - 2);
        else if (filter === 'week') startLimit.setDate(now.getDate() - now.getDay());
        else if (filter === 'month') startLimit.setMonth(now.getMonth(), 1);
        else return timeEntries;

        startLimit = getStartOfDay(startLimit);
        return timeEntries.filter(e => new Date(e.date) >= startLimit);
    }, [timeEntries, filter]);

    const totalHours = useMemo(
        () => filteredEntries.reduce((sum, e) => sum + getHoursFromEntry(e), 0),
        [filteredEntries]
    );

    const handleTimerToggle = () => {
        if (isTimerRunning) {
            stopTimer();
            showToast('Shift ended! Entry saved.');
        } else {
            startTimer();
            showToast('Shift started!', 'info');
        }
    };

    const handleManualSubmit = () => {
        const start = new Date(`${manualDate}T${manualStart}`);
        const end = new Date(`${manualDate}T${manualEnd}`);

        if (end <= start) {
            showToast('End time must be after start time', 'error');
            return;
        }

        const hoursWorked = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

        addTimeEntry({
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            breakMinutes: parseInt(manualBreak) || 0,
            notes: manualNotes,
            tags: manualTags,
            date: manualDate,
            isOvertime: hoursWorked > profile.overtimeThreshold,
            hourlyRate: profile.hourlyRate || null,
        });

        setShowManual(false);
        setManualNotes('');
        setManualTags([]);
        showToast('Manual entry added!');
    };

    const toggleManualTag = (tag: string) => {
        setManualTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    };

    const toggleEditTag = (tag: string) => {
        setEditTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    };

    const startEdit = (entry: TimeEntry) => {
        setEditingId(entry.id);
        setEditNotes(entry.notes);
        setEditBreak(entry.breakMinutes.toString());
        setEditTags(entry.tags);
        setEditDate(entry.date);

        const start = new Date(entry.startTime);
        setEditStartTime(start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));

        if (entry.endTime) {
            const end = new Date(entry.endTime);
            setEditEndTime(end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
        } else {
            setEditEndTime('');
        }
    };

    const saveEdit = (id: string) => {
        const startISO = new Date(`${editDate}T${editStartTime}`).toISOString();
        let endISO = null;
        if (editEndTime) {
            endISO = new Date(`${editDate}T${editEndTime}`).toISOString();
        }

        updateTimeEntry(id, {
            notes: editNotes,
            breakMinutes: parseInt(editBreak) || 0,
            tags: editTags,
            date: editDate,
            startTime: startISO,
            endTime: endISO,
        });
        setEditingId(null);
        showToast('Entry updated');
    };

    if (!mounted) return null;

    return (
        <div className="page-container section-gap" style={{ paddingTop: '1rem' }}>
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="icon-box-amber">
                        <Clock size={20} />
                    </div>
                    <h1 className="text-title">Time Tracking</h1>
                </div>
            </div>

            {/* Timer Section */}
            {!showManual && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '1.25rem',
                        padding: '2rem 0',
                        background: 'var(--fp-surface)',
                        borderRadius: 'var(--fp-radius-lg)',
                        border: '1px solid var(--fp-border)'
                    }}
                >
                    <p className="text-caption-mono" style={{ textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                        {isTimerRunning ? 'Shift in Progress' : 'Ready to Start'}
                    </p>
                    {isTimerRunning && activeTimerStart && (
                        <p className="text-caption" style={{ color: 'var(--fp-text-muted)' }}>
                            Started {new Date(activeTimerStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    )}
                    <motion.p
                        className="text-mono-xl"
                        style={{ color: isTimerRunning ? 'var(--fp-amber)' : 'var(--fp-text-primary)', position: 'relative' }}
                    >
                        {isTimerRunning && (
                            <motion.span
                                style={{
                                    position: 'absolute', left: -20, top: '50%', transform: 'translateY(-50%)',
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
                        {isTimerRunning ? <Square size={32} fill="white" /> : <Play size={32} fill="#0a0a0b" style={{ marginLeft: 4 }} />}
                    </motion.button>
                </motion.div>
            )}

            {/* Manual Toggle */}
            <button
                className={`btn ${showManual ? 'btn-primary' : 'btn-secondary'}`}
                style={{ width: '100%' }}
                onClick={() => setShowManual(!showManual)}
            >
                {showManual ? <Clock size={14} /> : <Plus size={14} />}
                {showManual ? 'Switch to Timer' : 'Add Manual Entry'}
            </button>

            <AnimatePresence>
                {showManual && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="card"
                        style={{ overflow: 'hidden' }}
                    >
                        <div className="section-gap" style={{ gap: '0.75rem' }}>
                            <div className="input-group">
                                <label className="input-label"><Calendar size={12} /> Date</label>
                                <input className="input" type="date" value={manualDate} onChange={e => setManualDate(e.target.value)} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div className="input-group">
                                    <label className="input-label">Start Time</label>
                                    <input className="input" type="time" value={manualStart} onChange={e => setManualStart(e.target.value)} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">End Time</label>
                                    <input className="input" type="time" value={manualEnd} onChange={e => setManualEnd(e.target.value)} />
                                </div>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Break</label>
                                <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.375rem', flexWrap: 'wrap' }}>
                                    {[0, 15, 30, 45, 60].map(m => (
                                        <button
                                            key={m}
                                            type="button"
                                            className={`tag ${manualBreak === String(m) ? 'tag-active' : ''}`}
                                            onClick={() => setManualBreak(String(m))}
                                            style={{ fontSize: '0.6875rem' }}
                                        >
                                            {m === 0 ? 'None' : `${m}m`}
                                        </button>
                                    ))}
                                </div>
                                <input className="input" type="number" placeholder="or enter minutes" value={manualBreak} onChange={e => setManualBreak(e.target.value)} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Notes</label>
                                <textarea
                                    className="input"
                                    style={{ minHeight: '80px', paddingTop: '0.5rem' }}
                                    placeholder="What did you work on?"
                                    value={manualNotes}
                                    onChange={e => setManualNotes(e.target.value)}
                                />
                            </div>

                            <TagSelector
                                selectedTags={manualTags}
                                onTagToggle={toggleManualTag}
                            />

                            <button className="btn btn-primary" style={{ marginTop: '0.5rem' }} onClick={handleManualSubmit}>
                                Save Entry
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Range Filters */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.375rem', overflowX: 'auto', paddingBottom: '2px' }}>
                    {(['today', '3days', 'week', 'month', 'all'] as const).map(f => (
                        <button
                            key={f}
                            className={`tag ${filter === f ? 'tag-active' : ''}`}
                            onClick={() => setFilter(f)}
                            style={{ whiteSpace: 'nowrap' }}
                        >
                            {f === 'today' ? 'Today' : f === '3days' ? '3 Days' : f === 'week' ? 'Week' : f === 'month' ? 'Month' : 'All'}
                        </button>
                    ))}
                </div>

                <div className="card-glass" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <History size={14} style={{ color: 'var(--fp-text-muted)' }} />
                        <span className="text-body" style={{ fontWeight: 500 }}>Total Hours Worked</span>
                    </div>
                    <span className="text-mono-md" style={{ color: 'var(--fp-amber)' }}>
                        {formatHoursMinutes(totalHours)}
                    </span>
                </div>
            </div>

            {/* Entries List */}
            <div className="section-gap" style={{ gap: '0.75rem' }}>
                <AnimatePresence mode="popLayout">
                    {filteredEntries.length === 0 ? (
                        <div className="empty-state">
                            <Clock className="empty-state-icon" />
                            <p className="text-body">No entries for this period</p>
                            <p className="text-caption">Use the timer or manual entry to add time</p>
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
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
                                                <p className="text-mono-sm" style={{ color: 'var(--fp-amber)', fontSize: '1rem', fontWeight: 600 }}>
                                                    {formatHoursMinutes(hours)}
                                                </p>
                                                {entry.isOvertime && (
                                                    <span className="overtime-badge" style={{ padding: '0.125rem 0.375rem' }}>
                                                        <Zap size={10} /> OT
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--fp-text-muted)' }}>
                                                <Calendar size={12} />
                                                <span className="text-caption" style={{ fontWeight: 500 }}>{entry.date}</span>
                                                <span className="text-caption" style={{ opacity: 0.5 }}>•</span>
                                                <span className="text-caption">
                                                    {new Date(entry.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    {' → '}
                                                    {entry.endTime
                                                        ? new Date(entry.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                        : 'Running'}
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                                            <button className="btn btn-ghost btn-icon" onClick={() => isEditing ? saveEdit(entry.id) : startEdit(entry)}>
                                                <Edit3 size={14} />
                                            </button>
                                            <button className="btn btn-ghost btn-icon" onClick={() => { deleteTimeEntry(entry.id); showToast('Entry deleted'); }}>
                                                <Trash2 size={14} style={{ color: 'var(--fp-error)' }} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Tags */}
                                    {(entry.tags.length > 0 || isEditing) && (
                                        <div style={{ marginTop: '0.75rem' }}>
                                            {!isEditing ? (
                                                <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                                                    {entry.tags.map(tag => (
                                                        <span key={tag} className="tag-outline" style={{ fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <TagSelector
                                                    selectedTags={editTags}
                                                    onTagToggle={toggleEditTag}
                                                    label=""
                                                />
                                            )}
                                        </div>
                                    )}

                                    {/* Notes */}
                                    {(entry.notes || isEditing) && (
                                        <div style={{ marginTop: '0.75rem' }}>
                                            {!isEditing ? (
                                                <p className="text-body" style={{ fontSize: '0.8125rem', color: 'var(--fp-text-secondary)', lineHeight: 1.5 }}>
                                                    {entry.notes}
                                                </p>
                                            ) : (
                                                <textarea
                                                    className="input"
                                                    style={{ minHeight: '60px', padding: '0.5rem', fontSize: '0.8125rem' }}
                                                    value={editNotes}
                                                    onChange={e => setEditNotes(e.target.value)}
                                                />
                                            )}
                                        </div>
                                    )}

                                    {isEditing && (
                                        <div className="section-gap" style={{ marginTop: '0.75rem', gap: '0.75rem' }}>
                                            <div className="input-group">
                                                <label className="input-label"><Calendar size={12} /> Date</label>
                                                <input className="input" type="date" value={editDate} onChange={e => setEditDate(e.target.value)} />
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                                <div className="input-group">
                                                    <label className="input-label">Start Time</label>
                                                    <input className="input" type="time" value={editStartTime} onChange={e => setEditStartTime(e.target.value)} />
                                                </div>
                                                <div className="input-group">
                                                    <label className="input-label">End Time</label>
                                                    <input className="input" type="time" value={editEndTime} onChange={e => setEditEndTime(e.target.value)} />
                                                </div>
                                            </div>
                                            <div className="input-group">
                                                <label className="input-label">Break (min)</label>
                                                <input className="input" type="number" value={editBreak} onChange={e => setEditBreak(e.target.value)} />
                                            </div>
                                            <button className="btn btn-primary" style={{ marginTop: '0.25rem' }} onClick={() => saveEdit(entry.id)}>
                                                Save Changes
                                            </button>
                                        </div>
                                    )}

                                    {/* Earnings Hint */}
                                    {entry.hourlyRate && entry.hourlyRate > 0 && !isEditing && (
                                        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--fp-border)', display: 'flex', justifyContent: 'flex-end' }}>
                                            <p className="text-caption" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600, color: 'var(--fp-text-primary)' }}>
                                                <DollarSign size={10} />
                                                {formatCurrency(hours * entry.hourlyRate * (entry.isOvertime ? profile.overtimeMultiplier : 1))}
                                            </p>
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
