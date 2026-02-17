'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Brain, TrendingUp, AlertTriangle, Flame, Lightbulb, Zap } from 'lucide-react';
import { useStore } from '@/lib/store';
import { generateInsights, type Insight } from '@/lib/insights';
import { transcribe, isSpeechAvailable, parseVoiceCommand, type VoiceCommand } from '@/lib/voice';

export function InsightsCard() {
    const { timeEntries, mileageEntries, fuelLogs, profile } = useStore();
    const [expanded, setExpanded] = useState(false);

    const insights = useMemo(
        () => generateInsights(timeEntries, mileageEntries, fuelLogs, profile.weeklyGoal.hoursTarget),
        [timeEntries, mileageEntries, fuelLogs, profile.weeklyGoal.hoursTarget]
    );

    if (insights.length === 0) return null;

    const iconMap: Record<string, React.ReactNode> = {
        pattern: <Brain size={14} />,
        anomaly: <AlertTriangle size={14} />,
        prediction: <TrendingUp size={14} />,
        streak: <Flame size={14} />,
        tip: <Lightbulb size={14} />,
    };

    const colorMap: Record<string, string> = {
        info: 'var(--fp-info)',
        warn: 'var(--fp-amber)',
        success: 'var(--fp-success)',
    };

    const displayed = expanded ? insights : insights.slice(0, 3);

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Zap size={16} style={{ color: 'var(--fp-amber)' }} />
                <p className="text-heading" style={{ fontSize: '0.9375rem' }}>Smart Insights</p>
                <span
                    className="tag"
                    style={{
                        marginLeft: 'auto',
                        fontSize: '0.625rem',
                        background: 'var(--fp-amber-glow)',
                        color: 'var(--fp-amber)',
                    }}
                >
                    {insights.length}
                </span>
            </div>

            <div className="section-gap" style={{ gap: '0.5rem' }}>
                {displayed.map((insight, i) => (
                    <motion.div
                        key={insight.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        style={{
                            display: 'flex',
                            gap: '0.5rem',
                            padding: '0.5rem',
                            borderRadius: 'var(--fp-radius-md)',
                            background: 'var(--fp-surface)',
                        }}
                    >
                        <div style={{ color: colorMap[insight.severity], marginTop: '2px', flexShrink: 0 }}>
                            {iconMap[insight.type]}
                        </div>
                        <div>
                            <p className="text-body" style={{ fontWeight: 600, fontSize: '0.75rem' }}>
                                {insight.icon} {insight.title}
                            </p>
                            <p className="text-caption" style={{ fontSize: '0.6875rem', marginTop: '0.125rem' }}>
                                {insight.body}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {insights.length > 3 && (
                <button
                    className="btn btn-ghost"
                    style={{ width: '100%', marginTop: '0.5rem', fontSize: '0.75rem' }}
                    onClick={() => setExpanded(!expanded)}
                >
                    {expanded ? 'Show less' : `Show ${insights.length - 3} more`}
                </button>
            )}
        </motion.div>
    );
}

// ─── Voice Logger ───
interface VoiceLoggerProps {
    onTranscript: (text: string) => void;
    onCommand?: (cmd: VoiceCommand) => void;
}

export function VoiceLogger({ onTranscript, onCommand }: VoiceLoggerProps) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [available, setAvailable] = useState(false);
    const stopRef = useRef<{ stop: () => void } | null>(null);

    useEffect(() => {
        setAvailable(isSpeechAvailable());
    }, []);

    const startListening = () => {
        setIsListening(true);
        setTranscript('');

        stopRef.current = transcribe(
            (result) => {
                setTranscript(result.transcript);
                if (result.isFinal) {
                    onTranscript(result.transcript);

                    if (onCommand) {
                        const cmd = parseVoiceCommand(result.transcript);
                        if (cmd.action !== 'unknown') {
                            onCommand(cmd);
                        }
                    }

                    setIsListening(false);
                }
            },
            () => setIsListening(false),
            () => setIsListening(false)
        );
    };

    const stopListening = () => {
        stopRef.current?.stop();
        setIsListening(false);
    };

    if (!available) return null;

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
                className={`btn ${isListening ? 'btn-primary' : 'btn-secondary'} btn-icon`}
                style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    position: 'relative',
                }}
                onClick={isListening ? stopListening : startListening}
                title={isListening ? 'Stop recording' : 'Start voice input'}
            >
                {isListening ? (
                    <>
                        <MicOff size={16} />
                        <span
                            style={{
                                position: 'absolute',
                                inset: -4,
                                borderRadius: '50%',
                                border: '2px solid var(--fp-amber)',
                                animation: 'pulse-ring 1.5s ease-out infinite',
                            }}
                        />
                    </>
                ) : (
                    <Mic size={16} />
                )}
            </button>

            {isListening && transcript && (
                <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-caption"
                    style={{ fontSize: '0.75rem', fontStyle: 'italic', flex: 1 }}
                >
                    "{transcript}"
                </motion.span>
            )}
        </div>
    );
}




// ─── Weather Badge ───
interface WeatherBadgeProps {
    weather: {
        temperature: number;
        icon: string;
        description: string;
        feelsLike: number;
        humidity: number;
        windSpeed: number;
    } | null;
    compact?: boolean;
}

export function WeatherBadge({ weather, compact = false }: WeatherBadgeProps) {
    if (!weather) return null;

    if (compact) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ fontSize: '1rem' }}>{weather.icon}</span>
                <span className="text-mono-sm">{weather.temperature}°F</span>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
            style={{ textAlign: 'center' }}
        >
            <span style={{ fontSize: '2rem' }}>{weather.icon}</span>
            <p className="text-mono-md" style={{ marginTop: '0.25rem' }}>{weather.temperature}°F</p>
            <p className="text-caption">{weather.description}</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.375rem' }}>
                <span className="text-caption" style={{ fontSize: '0.625rem' }}>
                    Feels {weather.feelsLike}°F
                </span>
                <span className="text-caption" style={{ fontSize: '0.625rem' }}>
                    💧 {weather.humidity}%
                </span>
                <span className="text-caption" style={{ fontSize: '0.625rem' }}>
                    💨 {weather.windSpeed} mph
                </span>
            </div>
        </motion.div>
    );
}

// ─── Floating Action Button ───
interface FABProps {
    onAction: (action: string) => void;
}

export function FloatingActionButton({ onAction }: FABProps) {
    const [isOpen, setIsOpen] = useState(false);

    const actions = [
        { id: 'time', label: 'Clock In', icon: '⏱️', color: 'var(--fp-amber)' },
        { id: 'mileage', label: 'Log Trip', icon: '🚗', color: 'var(--fp-info)' },
        { id: 'fuel', label: 'Log Fuel', icon: '⛽', color: 'var(--fp-success)' },
        { id: 'note', label: 'Add Note', icon: '📝', color: 'var(--fp-purple)' },
    ];

    return (
        <div style={{ position: 'fixed', bottom: 80, right: 16, zIndex: 100 }}>
            {/* Action buttons */}
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ display: 'flex', flexDirection: 'column-reverse', gap: '0.5rem', marginBottom: '0.5rem' }}
                >
                    {actions.map((action, i) => (
                        <motion.button
                            key={action.id}
                            initial={{ opacity: 0, scale: 0.5, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            onClick={() => { onAction(action.id); setIsOpen(false); }}
                            style={{
                                width: 44,
                                height: 44,
                                borderRadius: '50%',
                                background: 'var(--fp-surface)',
                                border: `2px solid ${action.color}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.125rem',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                            }}
                            title={action.label}
                        >
                            {action.icon}
                        </motion.button>
                    ))}
                </motion.div>
            )}

            {/* Main FAB */}
            <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--fp-amber-dark), var(--fp-amber-light))',
                    border: 'none',
                    color: 'white',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 20px rgba(245, 158, 11, 0.3)',
                    transform: isOpen ? 'rotate(45deg)' : 'none',
                    transition: 'transform 0.2s ease',
                }}
            >
                +
            </motion.button>
        </div>
    );
}
