'use client';

import { useState } from 'react';
import { Tag, Plus, X, Check } from 'lucide-react';
import { useStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';

interface TagSelectorProps {
    selectedTags: string[];
    onTagToggle: (tag: string) => void;
    label?: string;
}

export default function TagSelector({
    selectedTags,
    onTagToggle,
    label = 'Tags',
}: TagSelectorProps) {
    const { customTags, addTag, profile } = useStore();
    const [isAdding, setIsAdding] = useState(false);
    const [newTagInput, setNewTagInput] = useState('');

    // Merge predefined (profile.tags) with custom tags, deduplicated
    const predefinedTags = profile.tags ?? [];
    const allTags = [...new Set([...predefinedTags, ...customTags])];

    const handleAdd = () => {
        const tag = newTagInput.trim().toUpperCase();
        if (tag) {
            addTag(tag);
            onTagToggle(tag);
            setNewTagInput('');
            setIsAdding(false);
        }
    };

    return (
        <div className="section-gap" style={{ gap: '0.625rem' }}>
            {label && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Tag size={12} style={{ color: 'var(--fp-text-muted)' }} />
                    <label className="input-label" style={{ marginBottom: 0 }}>{label}</label>
                </div>
            )}

            {/* Tag Cloud */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                {allTags.map(tag => {
                    const isActive = selectedTags.includes(tag);
                    return (
                        <motion.button
                            key={tag}
                            whileTap={{ scale: 0.95 }}
                            className={`tag ${isActive ? 'tag-active' : ''}`}
                            onClick={() => onTagToggle(tag)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                transition: 'all 0.2s ease',
                                fontSize: '0.6875rem',
                                letterSpacing: '0.04em',
                            }}
                        >
                            {isActive && <Check size={10} />}
                            {tag}
                        </motion.button>
                    );
                })}

                {/* Add custom tag */}
                <AnimatePresence mode="wait">
                    {!isAdding ? (
                        <motion.button
                            key="add-btn"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="btn btn-ghost"
                            style={{
                                padding: '0.25rem 0.5rem',
                                fontSize: '0.6875rem',
                                height: 'auto',
                                borderRadius: 'var(--fp-radius-sm)',
                                border: '1px dashed var(--fp-border)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                            }}
                            onClick={() => setIsAdding(true)}
                        >
                            <Plus size={11} /> Custom
                        </motion.button>
                    ) : (
                        <motion.div
                            key="add-input"
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 'auto', opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}
                        >
                            <input
                                autoFocus
                                className="input"
                                style={{
                                    width: '110px',
                                    height: '28px',
                                    padding: '0 0.5rem',
                                    fontSize: '0.75rem',
                                    borderRadius: 'var(--fp-radius-sm)',
                                    textTransform: 'uppercase',
                                }}
                                value={newTagInput}
                                onChange={e => setNewTagInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                                onBlur={() => !newTagInput && setIsAdding(false)}
                                placeholder="TAG NAME"
                            />
                            <button
                                className="btn btn-primary btn-icon"
                                style={{ width: 28, height: 28 }}
                                onClick={handleAdd}
                            >
                                <Check size={12} />
                            </button>
                            <button
                                className="btn btn-ghost btn-icon"
                                style={{ width: 28, height: 28 }}
                                onClick={() => { setIsAdding(false); setNewTagInput(''); }}
                            >
                                <X size={12} />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
