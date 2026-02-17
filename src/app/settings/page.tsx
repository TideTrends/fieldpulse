'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Briefcase, Clock, DollarSign, Target,
    Tag, Download, Trash2, RotateCcw, Plus, X,
    Sun, Moon, Monitor, MapPin, ChevronRight,
    Shield, Database, Zap, Palette, RefreshCw, Cloud,
} from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { useStore, formatCurrency } from '@/lib/store';
import { useSync } from '@/lib/useSync';

export default function SettingsPage() {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const {
        profile, setProfile, setWeeklyGoal,
        customTags, addTag, removeTag,
        savedLocations, removeLocation,
        timeEntries, mileageEntries, fuelLogs, dailyNotes,
        showToast,
    } = useStore();

    const [mounted, setMounted] = useState(false);
    const [newTag, setNewTag] = useState('');
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [activeSection, setActiveSection] = useState<string | null>(null);
    const { status: syncStatus, lastSyncedAt, syncNow, error: syncError } = useSync();

    useEffect(() => { setMounted(true); }, []);
    if (!mounted) return null;

    const handleExportJSON = () => {
        const data = { profile, timeEntries, mileageEntries, fuelLogs, dailyNotes, customTags, savedLocations };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fieldpulse-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Data exported!');
    };

    const handleExportCSV = () => {
        const rows = [
            ['Date', 'Start', 'End', 'Hours', 'Break', 'Tags', 'Notes', 'Overtime'],
            ...timeEntries.map(e => {
                const hours = e.endTime
                    ? ((new Date(e.endTime).getTime() - new Date(e.startTime).getTime()) / 3600000 - e.breakMinutes / 60).toFixed(2)
                    : '0';
                return [e.date, e.startTime, e.endTime || '', hours, e.breakMinutes.toString(), e.tags.join(';'), e.notes, e.isOvertime ? 'Yes' : 'No'];
            }),
        ];
        const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fieldpulse-timesheet-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('CSV exported!');
    };

    const resetData = () => {
        localStorage.removeItem('fieldpulse-storage');
        window.location.reload();
    };

    const totalStats = {
        time: timeEntries.length,
        mileage: mileageEntries.length,
        fuel: fuelLogs.length,
        notes: dailyNotes.length,
        locations: savedLocations.length,
    };

    return (
        <div className="page-container section-gap" style={{ paddingTop: '1rem' }}>
            <div className="page-header">
                <h1 className="text-title">Settings</h1>
            </div>

            {/* Theme Section */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <p className="text-heading" style={{ fontSize: '0.875rem', marginBottom: '0.625rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Palette size={14} /> Appearance
                </p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {[
                        { value: 'dark' as const, icon: Moon, label: 'Dark' },
                        { value: 'light' as const, icon: Sun, label: 'Light' },
                        { value: 'system' as const, icon: Monitor, label: 'System' },
                    ].map(opt => (
                        <button
                            key={opt.value}
                            className={`btn ${theme === opt.value ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ flex: 1, fontSize: '0.8125rem' }}
                            onClick={() => setTheme(opt.value)}
                        >
                            <opt.icon size={14} />
                            {opt.label}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Profile */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
                <p className="text-heading" style={{ fontSize: '0.9375rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <User size={16} /> Profile
                </p>
                <div className="section-gap">
                    <div className="input-group">
                        <label className="input-label">Name</label>
                        <input className="input" value={profile.name} onChange={e => setProfile({ name: e.target.value })} />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Company</label>
                        <input className="input" value={profile.company} onChange={e => setProfile({ company: e.target.value })} placeholder="Optional" />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Role</label>
                        <input className="input" value={profile.role} onChange={e => setProfile({ role: e.target.value })} placeholder="e.g., Field Technician" />
                    </div>
                </div>
            </motion.div>

            {/* Work Preferences */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card">
                <p className="text-heading" style={{ fontSize: '0.9375rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock size={16} /> Work Preferences
                </p>
                <div className="section-gap">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div className="input-group">
                            <label className="input-label">Start Hour</label>
                            <input className="input" type="number" min={0} max={23} value={profile.defaultStartHour} onChange={e => setProfile({ defaultStartHour: parseInt(e.target.value) || 0 })} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">End Hour</label>
                            <input className="input" type="number" min={0} max={23} value={profile.defaultEndHour} onChange={e => setProfile({ defaultEndHour: parseInt(e.target.value) || 0 })} />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div className="input-group">
                            <label className="input-label">Distance</label>
                            <select className="input" value={profile.mileageUnit} onChange={e => setProfile({ mileageUnit: e.target.value as 'miles' | 'km' })}>
                                <option value="miles">Miles</option>
                                <option value="km">Kilometers</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Fuel</label>
                            <select className="input" value={profile.fuelUnit} onChange={e => setProfile({ fuelUnit: e.target.value as 'gallons' | 'liters' })}>
                                <option value="gallons">Gallons</option>
                                <option value="liters">Liters</option>
                            </select>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Pay & Overtime */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card">
                <p className="text-heading" style={{ fontSize: '0.9375rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <DollarSign size={16} /> Pay & Overtime
                </p>
                <div className="section-gap">
                    <div className="input-group">
                        <label className="input-label">Hourly Rate ($)</label>
                        <input className="input" type="number" step="0.5" min={0} value={profile.hourlyRate} onChange={e => setProfile({ hourlyRate: parseFloat(e.target.value) || 0 })} placeholder="0.00" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div className="input-group">
                            <label className="input-label">OT After (hrs/day)</label>
                            <input className="input" type="number" step="0.5" min={1} value={profile.overtimeThreshold} onChange={e => setProfile({ overtimeThreshold: parseFloat(e.target.value) || 8 })} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">OT Multiplier</label>
                            <input className="input" type="number" step="0.25" min={1} value={profile.overtimeMultiplier} onChange={e => setProfile({ overtimeMultiplier: parseFloat(e.target.value) || 1.5 })} />
                        </div>
                    </div>
                    {profile.hourlyRate > 0 && (
                        <p className="text-caption" style={{ marginTop: '0.25rem' }}>
                            Regular: {formatCurrency(profile.hourlyRate)}/hr · OT: {formatCurrency(profile.hourlyRate * profile.overtimeMultiplier)}/hr
                        </p>
                    )}
                </div>
            </motion.div>

            {/* Weekly Goals */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="card">
                <p className="text-heading" style={{ fontSize: '0.9375rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Target size={16} /> Weekly Goals
                </p>
                <div className="section-gap">
                    <div className="input-group">
                        <label className="input-label">Hours Target</label>
                        <input className="input" type="number" min={1} value={profile.weeklyGoal.hoursTarget} onChange={e => setWeeklyGoal({ hoursTarget: parseInt(e.target.value) || 40 })} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div className="input-group">
                            <label className="input-label">Miles Target</label>
                            <input className="input" type="number" min={0} value={profile.weeklyGoal.milesTarget} onChange={e => setWeeklyGoal({ milesTarget: parseInt(e.target.value) || 500 })} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Fuel Budget ($)</label>
                            <input className="input" type="number" min={0} value={profile.weeklyGoal.fuelBudget} onChange={e => setWeeklyGoal({ fuelBudget: parseInt(e.target.value) || 200 })} />
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Tags */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card">
                <p className="text-heading" style={{ fontSize: '0.9375rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Tag size={16} /> Custom Tags
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.75rem' }}>
                    <AnimatePresence>
                        {customTags.map(tag => (
                            <motion.span
                                key={tag}
                                layout
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="tag"
                                onClick={() => {
                                    removeTag(tag);
                                    showToast(`Removed "${tag}"`);
                                }}
                                style={{ cursor: 'pointer' }}
                            >
                                {tag} <X size={10} />
                            </motion.span>
                        ))}
                    </AnimatePresence>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                        className="input"
                        placeholder="New tag..."
                        value={newTag}
                        onChange={e => setNewTag(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && newTag.trim()) {
                                addTag(newTag.trim());
                                setNewTag('');
                                showToast(`Added "${newTag.trim()}"`);
                            }
                        }}
                    />
                    <button
                        className="btn btn-primary btn-icon"
                        onClick={() => {
                            if (newTag.trim()) {
                                addTag(newTag.trim());
                                setNewTag('');
                                showToast(`Added "${newTag.trim()}"`);
                            }
                        }}
                    >
                        <Plus size={18} />
                    </button>
                </div>
            </motion.div>

            {/* Saved Locations */}
            {savedLocations.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="card">
                    <p className="text-heading" style={{ fontSize: '0.9375rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <MapPin size={16} /> Saved Locations
                    </p>
                    {savedLocations.map(loc => (
                        <div key={loc.id} className="list-item" style={{ marginBottom: '0.5rem' }}>
                            <MapPin size={14} style={{ color: 'var(--fp-text-tertiary)' }} />
                            <div style={{ flex: 1 }}>
                                <p style={{ fontSize: '0.875rem' }}>{loc.name}</p>
                                <p className="text-caption">{loc.address}</p>
                            </div>
                            <button className="btn btn-ghost btn-icon" style={{ width: 32, height: 32 }} onClick={() => {
                                removeLocation(loc.id);
                                showToast('Location removed');
                            }}>
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </motion.div>
            )}

            {/* Data Overview */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card">
                <p className="text-heading" style={{ fontSize: '0.9375rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Database size={16} /> Your Data
                </p>
                <div className="stat-grid">
                    <div style={{ textAlign: 'center', padding: '0.5rem' }}>
                        <p className="text-mono-md">{totalStats.time}</p>
                        <p className="text-caption">Time Entries</p>
                    </div>
                    <div style={{ textAlign: 'center', padding: '0.5rem' }}>
                        <p className="text-mono-md">{totalStats.mileage}</p>
                        <p className="text-caption">Trips</p>
                    </div>
                    <div style={{ textAlign: 'center', padding: '0.5rem' }}>
                        <p className="text-mono-md">{totalStats.fuel}</p>
                        <p className="text-caption">Fuel Logs</p>
                    </div>
                    <div style={{ textAlign: 'center', padding: '0.5rem' }}>
                        <p className="text-mono-md">{totalStats.notes}</p>
                        <p className="text-caption">Notes</p>
                    </div>
                </div>
            </motion.div>

            {/* Cloud Sync */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <p className="text-heading" style={{ fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Cloud size={16} /> Cloud Sync
                    </p>
                    <span className={`tag ${syncStatus === 'success' ? 'tag-active' : syncStatus === 'error' ? '' : ''}`}
                        style={{
                            fontSize: '0.625rem',
                            background: syncStatus === 'success' ? 'var(--fp-success-bg)' : syncStatus === 'error' ? 'var(--fp-error-bg)' : 'var(--fp-surface)',
                            color: syncStatus === 'success' ? 'var(--fp-success)' : syncStatus === 'error' ? 'var(--fp-error)' : 'var(--fp-text-muted)',
                        }}>
                        {syncStatus === 'syncing' ? '⟳ Syncing...' : syncStatus === 'success' ? '✓ Synced' : syncStatus === 'error' ? '✗ Error' : '● Idle'}
                    </span>
                </div>
                {lastSyncedAt && (
                    <p className="text-caption" style={{ marginBottom: '0.5rem' }}>
                        Last synced: {new Date(lastSyncedAt).toLocaleString()}
                    </p>
                )}
                {syncError && (
                    <p className="text-caption" style={{ color: 'var(--fp-error)', marginBottom: '0.5rem' }}>
                        {syncError}
                    </p>
                )}
                <button className="btn btn-secondary" style={{ width: '100%' }} onClick={syncNow}
                    disabled={syncStatus === 'syncing'}>
                    <RefreshCw size={14} className={syncStatus === 'syncing' ? 'spin' : ''} /> Sync Now
                </button>
                <p className="text-caption" style={{ marginTop: '0.5rem', textAlign: 'center' }}>
                    Auto-syncs 3 seconds after changes
                </p>
            </motion.div>

            {/* Export */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
                <p className="text-heading" style={{ fontSize: '0.875rem', marginBottom: '0.625rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Download size={14} /> Export
                </p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleExportJSON}>
                        <Download size={14} /> JSON Backup
                    </button>
                    <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleExportCSV}>
                        <Download size={14} /> CSV Timesheet
                    </button>
                </div>
            </motion.div>

            {/* App Info */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card">
                <p className="text-heading" style={{ fontSize: '0.9375rem', marginBottom: '0.5rem' }}>FieldPulse</p>
                <p className="text-caption">v1.2.0 · Work time & mileage tracker</p>
                <p className="text-caption" style={{ marginTop: '0.25rem' }}>Built for field workers · PWA enabled</p>
            </motion.div>

            {/* Danger Zone */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                style={{
                    padding: '1.25rem',
                    borderRadius: 'var(--fp-radius-lg)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    background: 'var(--fp-error-bg)',
                }}
            >
                <p className="text-heading" style={{ fontSize: '0.9375rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Shield size={16} style={{ color: 'var(--fp-error)' }} /> Danger Zone
                </p>

                {!showResetConfirm ? (
                    <button className="btn btn-danger" style={{ width: '100%' }} onClick={() => setShowResetConfirm(true)}>
                        <Trash2 size={14} /> Delete All Data
                    </button>
                ) : (
                    <div className="section-gap" style={{ gap: '0.5rem' }}>
                        <p className="text-body" style={{ fontSize: '0.8125rem', color: 'var(--fp-error)' }}>
                            This will permanently delete ALL your data. This cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowResetConfirm(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-danger" style={{ flex: 1 }} onClick={resetData}>
                                <Trash2 size={14} /> Confirm Delete
                            </button>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
