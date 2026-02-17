'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, Plus, Trash2, Search, Pin, PinOff,
    Tag, X, Smile, Cloud, Sun, CloudRain,
    Frown, Meh, SmilePlus,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { VoiceLogger } from '@/components/SmartWidgets';
import type { VoiceCommand } from '@/lib/voice';

const moodOptions = [
    { value: 'great' as const, label: '🔥 Great', icon: SmilePlus },
    { value: 'good' as const, label: '😊 Good', icon: Smile },
    { value: 'okay' as const, label: '😐 Okay', icon: Meh },
    { value: 'tough' as const, label: '😤 Tough', icon: Frown },
];

export default function NotesPage() {
    const {
        dailyNotes, addDailyNote, updateDailyNote, deleteDailyNote,
        customTags, addTag,
        pinnedNoteIds, togglePinNote,
        showToast,
    } = useStore();

    const [mounted, setMounted] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [whatIDid, setWhatIDid] = useState('');
    const [content, setContent] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [selectedMood, setSelectedMood] = useState<'great' | 'good' | 'okay' | 'tough' | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterTag, setFilterTag] = useState<string | null>(null);
    const [newTag, setNewTag] = useState('');

    useEffect(() => { setMounted(true); }, []);

    const toggleTag = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const handleSubmit = () => {
        if (!whatIDid.trim() && !content.trim()) {
            showToast('Write something first!', 'error');
            return;
        }
        const nowStr = new Date().toISOString();
        addDailyNote({
            date: new Date().toISOString().split('T')[0],
            whatIDid: whatIDid.trim(),
            content: content.trim(),
            tags: selectedTags,
            createdAt: nowStr,
            updatedAt: nowStr,
            mood: selectedMood,
            weather: null,
        });
        setWhatIDid('');
        setContent('');
        setSelectedTags([]);
        setSelectedMood(null);
        setShowForm(false);
        showToast('Note saved!');
    };

    const handleVoiceTranscript = (text: string) => {
        if (showForm) {
            // Append to content if form is open
            setContent(prev => prev ? `${prev}\n${text}` : text);
        } else {
            // Auto-create a quick note
            const nowStr = new Date().toISOString();
            addDailyNote({
                date: new Date().toISOString().split('T')[0],
                whatIDid: text,
                content: '',
                tags: ['🎤 voice'],
                createdAt: nowStr,
                updatedAt: nowStr,
                mood: null,
                weather: null,
            });
            showToast('Voice note saved!');
        }
    };

    const handleVoiceCommand = (cmd: VoiceCommand) => {
        if (cmd.action === 'add-note' && cmd.raw) {
            const nowStr = new Date().toISOString();
            addDailyNote({
                date: new Date().toISOString().split('T')[0],
                whatIDid: cmd.raw,
                content: '',
                tags: ['🎤 voice'],
                createdAt: nowStr,
                updatedAt: nowStr,
                mood: null,
                weather: null,
            });
            showToast('Voice note saved!');
        }
    };

    const filteredNotes = useMemo(() => {
        let notes = [...dailyNotes];
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            notes = notes.filter(n =>
                n.whatIDid.toLowerCase().includes(q) ||
                n.content.toLowerCase().includes(q) ||
                n.tags.some(t => t.toLowerCase().includes(q))
            );
        }
        if (filterTag) {
            notes = notes.filter(n => n.tags.includes(filterTag));
        }
        // Sort pinned first
        return notes.sort((a, b) => {
            const aPinned = pinnedNoteIds.includes(a.id);
            const bPinned = pinnedNoteIds.includes(b.id);
            if (aPinned && !bPinned) return -1;
            if (!aPinned && bPinned) return 1;
            return b.date.localeCompare(a.date);
        });
    }, [dailyNotes, searchQuery, filterTag, pinnedNoteIds]);

    // Group by date
    const groupedNotes = useMemo(() => {
        const groups: Record<string, typeof filteredNotes> = {};
        filteredNotes.forEach(note => {
            if (!groups[note.date]) groups[note.date] = [];
            groups[note.date].push(note);
        });
        return groups;
    }, [filteredNotes]);

    if (!mounted) return null;

    return (
        <div className="page-container section-gap" style={{ paddingTop: '1rem' }}>
            <div className="page-header">
                <h1 className="text-title">Notes</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <VoiceLogger onTranscript={handleVoiceTranscript} onCommand={handleVoiceCommand} />
                    <span className="text-caption">{dailyNotes.length} total</span>
                </div>
            </div>

            {/* Search */}
            <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--fp-text-muted)' }} />
                <input
                    className="input"
                    placeholder="Search notes..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ paddingLeft: '2.25rem' }}
                />
            </div>

            {/* Tag Filter */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                <button className={`tag ${!filterTag ? 'tag-active' : ''}`} onClick={() => setFilterTag(null)}>All</button>
                {customTags.map(tag => (
                    <button
                        key={tag}
                        className={`tag ${filterTag === tag ? 'tag-active' : ''}`}
                        onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                    >
                        {tag}
                    </button>
                ))}
            </div>

            {/* Add Note */}
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setShowForm(!showForm)}>
                <Plus size={14} /> New Note
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
                            {/* Voice input inside form */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', borderRadius: 'var(--fp-radius-md)', background: 'var(--fp-surface)' }}>
                                <VoiceLogger onTranscript={(text) => setContent(prev => prev ? `${prev}\n${text}` : text)} />
                                <span className="text-caption" style={{ fontSize: '0.6875rem' }}>Tap mic to dictate into notes</span>
                            </div>

                            <div className="input-group">
                                <label className="input-label">What I did today</label>
                                <textarea
                                    className="input"
                                    placeholder="Describe your day..."
                                    value={whatIDid}
                                    onChange={e => setWhatIDid(e.target.value)}
                                    style={{ minHeight: '80px' }}
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Additional Notes</label>
                                <textarea
                                    className="input"
                                    placeholder="Extra details, reminders..."
                                    value={content}
                                    onChange={e => setContent(e.target.value)}
                                    style={{ minHeight: '60px' }}
                                />
                            </div>

                            {/* Mood */}
                            <div>
                                <label className="input-label" style={{ marginBottom: '0.375rem' }}>How was today?</label>
                                <div style={{ display: 'flex', gap: '0.375rem' }}>
                                    {moodOptions.map(m => (
                                        <button
                                            key={m.value}
                                            className={`tag ${selectedMood === m.value ? 'tag-active' : ''}`}
                                            onClick={() => setSelectedMood(selectedMood === m.value ? null : m.value)}
                                            style={{ flex: 1, justifyContent: 'center', fontSize: '0.6875rem' }}
                                        >
                                            {m.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Tags */}
                            <div>
                                <label className="input-label" style={{ marginBottom: '0.375rem' }}>Tags</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                    {customTags.map(tag => (
                                        <span
                                            key={tag}
                                            className={`tag ${selectedTags.includes(tag) ? 'tag-active' : ''}`}
                                            onClick={() => toggleTag(tag)}
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                                {/* Inline add tag */}
                                <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.5rem' }}>
                                    <input
                                        className="input"
                                        placeholder="New tag..."
                                        value={newTag}
                                        onChange={e => setNewTag(e.target.value)}
                                        style={{ fontSize: '0.8125rem' }}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' && newTag.trim()) {
                                                addTag(newTag.trim());
                                                setSelectedTags(prev => [...prev, newTag.trim()]);
                                                setNewTag('');
                                            }
                                        }}
                                    />
                                    {newTag.trim() && (
                                        <button className="btn btn-secondary btn-icon" style={{ width: 36, height: 36 }} onClick={() => {
                                            if (newTag.trim()) {
                                                addTag(newTag.trim());
                                                setSelectedTags(prev => [...prev, newTag.trim()]);
                                                setNewTag('');
                                            }
                                        }}>
                                            <Plus size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <button className="btn btn-primary" onClick={handleSubmit}>
                                <Plus size={14} /> Save Note
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Notes List */}
            {Object.entries(groupedNotes).length === 0 ? (
                <div className="empty-state">
                    <FileText className="empty-state-icon" />
                    <p className="text-body">No notes yet</p>
                    <p className="text-caption">Add your first daily note above</p>
                </div>
            ) : (
                Object.entries(groupedNotes).map(([date, notes]) => (
                    <div key={date}>
                        <p className="text-caption" style={{ marginBottom: '0.375rem', fontWeight: 600 }}>
                            {new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </p>
                        {notes.map((note, i) => {
                            const isPinned = pinnedNoteIds.includes(note.id);
                            return (
                                <motion.div
                                    key={note.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -30 }}
                                    transition={{ delay: i * 0.03 }}
                                    className="card"
                                    style={{
                                        marginBottom: '0.5rem',
                                        borderColor: isPinned ? 'var(--fp-amber)' : undefined,
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ flex: 1 }}>
                                            {note.mood && (
                                                <span style={{ fontSize: '0.75rem', marginBottom: '0.25rem', display: 'block' }}>
                                                    {moodOptions.find(m => m.value === note.mood)?.label}
                                                </span>
                                            )}
                                            {note.whatIDid && (
                                                <p style={{ fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.4 }}>{note.whatIDid}</p>
                                            )}
                                            {note.content && (
                                                <p className="text-body" style={{ marginTop: '0.25rem', fontSize: '0.8125rem' }}>{note.content}</p>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.125rem', flexShrink: 0 }}>
                                            <button
                                                className="btn btn-ghost btn-icon"
                                                style={{ width: 28, height: 28 }}
                                                onClick={() => togglePinNote(note.id)}
                                                title={isPinned ? 'Unpin' : 'Pin'}
                                            >
                                                {isPinned ? <PinOff size={12} /> : <Pin size={12} />}
                                            </button>
                                            <button
                                                className="btn btn-ghost btn-icon"
                                                style={{ width: 28, height: 28 }}
                                                onClick={() => { deleteDailyNote(note.id); showToast('Note deleted'); }}
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                    {note.tags.length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.5rem' }}>
                                            {note.tags.map(tag => (
                                                <span key={tag} className="tag" style={{ fontSize: '0.625rem', padding: '0.125rem 0.375rem' }}>{tag}</span>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                ))
            )}
        </div>
    );
}
