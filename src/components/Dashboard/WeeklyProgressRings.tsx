'use client';

import { motion } from 'framer-motion';

interface WeeklyProgressRingsProps {
    hoursCurrent: number;
    hoursTarget: number;
    milesCurrent: number;
    milesTarget: number;
}

export function WeeklyProgressRings({
    hoursCurrent,
    hoursTarget,
    milesCurrent,
    milesTarget
}: WeeklyProgressRingsProps) {
    const hoursProgress = Math.min(100, (hoursCurrent / hoursTarget) * 100);
    const milesProgress = Math.min(100, (milesCurrent / milesTarget) * 100);

    const radius = 50;
    const circumference = 2 * Math.PI * radius;

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            {/* Hours Ring */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem 1rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'relative', width: 120, height: 120 }}>
                    {/* Background Circle */}
                    <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
                        <circle
                            cx="60"
                            cy="60"
                            r="50"
                            stroke="var(--fp-surface-hover)"
                            strokeWidth="8"
                            fill="transparent"
                        />
                        {/* Progress Circle */}
                        <motion.circle
                            cx="60"
                            cy="60"
                            r="50"
                            stroke="var(--fp-amber)"
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeLinecap="round"
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset: circumference - (hoursProgress / 100) * circumference }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                        />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="text-mono-lg" style={{ color: 'var(--fp-amber)', fontSize: '1.5rem' }}>
                            {Math.round(hoursProgress)}%
                        </span>
                    </div>
                </div>
                <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
                    <p className="text-body" style={{ fontWeight: 600 }}>Weekly Hours</p>
                    <p className="text-caption" style={{ color: 'var(--fp-text-tertiary)' }}>
                        {hoursCurrent.toFixed(1)} / {hoursTarget}h
                    </p>
                </div>
            </div>

            {/* Miles Ring */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem 1rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'relative', width: 120, height: 120 }}>
                    {/* Background Circle */}
                    <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
                        <circle
                            cx="60"
                            cy="60"
                            r="50"
                            stroke="var(--fp-surface-hover)"
                            strokeWidth="8"
                            fill="transparent"
                        />
                        {/* Progress Circle */}
                        <motion.circle
                            cx="60"
                            cy="60"
                            r="50"
                            stroke="var(--fp-info)"
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeLinecap="round"
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset: circumference - (milesProgress / 100) * circumference }}
                            transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                        />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="text-mono-lg" style={{ color: 'var(--fp-info)', fontSize: '1.5rem' }}>
                            {Math.round(milesProgress)}%
                        </span>
                    </div>
                </div>
                <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
                    <p className="text-body" style={{ fontWeight: 600 }}>Weekly Miles</p>
                    <p className="text-caption" style={{ color: 'var(--fp-text-tertiary)' }}>
                        {milesCurrent.toFixed(0)} / {milesTarget}mi
                    </p>
                </div>
            </div>
        </div>
    );
}
