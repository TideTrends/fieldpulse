'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store';
import {
    Clock,
    Route,
    Fuel,
    FileText,
    ChevronRight,
    Zap,
    ArrowRight,
    Sparkles,
} from 'lucide-react';

const STEPS = 4;

const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 300 : -300,
        opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({
        x: direction < 0 ? 300 : -300,
        opacity: 0,
    }),
};

export default function OnboardingPage() {
    const router = useRouter();
    const setProfile = useStore((s) => s.setProfile);
    const [step, setStep] = useState(0);
    const [direction, setDirection] = useState(0);
    const [name, setName] = useState('');
    const [company, setCompany] = useState('');
    const [role, setRole] = useState('');

    const next = () => {
        if (step === STEPS - 1) {
            setProfile({
                name: name || 'User',
                company,
                role,
                onboardingComplete: true,
            });
            router.replace('/dashboard');
            return;
        }
        setDirection(1);
        setStep((s) => s + 1);
    };

    const canProceed = step === 0 || step === 2 || step === 3 || name.trim().length > 0;

    return (
        <div className="onboarding-container" style={{ background: 'var(--fp-bg-primary)' }}>
            <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                    key={step}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '1.5rem',
                        width: '100%',
                        maxWidth: 400,
                    }}
                >
                    {step === 0 && (
                        <>
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.1, type: 'spring', damping: 20 }}
                                style={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: 20,
                                    background: 'linear-gradient(135deg, var(--fp-amber), var(--fp-amber-dark))',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 8px 32px rgba(245, 158, 11, 0.3)',
                                    marginBottom: '0.5rem',
                                }}
                            >
                                <Zap size={40} color="#0a0a0b" strokeWidth={2.5} />
                            </motion.div>
                            <h1 className="text-display" style={{ color: 'var(--fp-text-primary)' }}>
                                FieldPulse
                            </h1>
                            <p className="text-body" style={{ maxWidth: 300 }}>
                                Your all-in-one field work tracker. Log hours, track miles, record fuel stops, and keep detailed notes — all in one place.
                            </p>
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(2, 1fr)',
                                    gap: '0.75rem',
                                    width: '100%',
                                    marginTop: '1rem',
                                }}
                            >
                                {[
                                    { icon: Clock, label: 'Time Tracking', desc: 'Start/stop timer' },
                                    { icon: Route, label: 'Mileage', desc: 'Track every trip' },
                                    { icon: Fuel, label: 'Fuel Logging', desc: 'Log fill-ups' },
                                    { icon: FileText, label: 'Daily Notes', desc: 'Tag & organize' },
                                ].map(({ icon: Icon, label, desc }) => (
                                    <div key={label} className="card" style={{ textAlign: 'left' }}>
                                        <Icon size={20} style={{ color: 'var(--fp-amber)', marginBottom: 8 }} />
                                        <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{label}</div>
                                        <div className="text-caption">{desc}</div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {step === 1 && (
                        <>
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.1, type: 'spring' }}
                            >
                                <Sparkles size={48} style={{ color: 'var(--fp-amber)' }} />
                            </motion.div>
                            <h2 className="text-title">Let&apos;s get you set up</h2>
                            <p className="text-body">What should we call you?</p>
                            <div className="input-group" style={{ width: '100%' }}>
                                <label className="input-label">Your Name</label>
                                <input
                                    className="input"
                                    type="text"
                                    placeholder="e.g. Cody"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="input-group" style={{ width: '100%' }}>
                                <label className="input-label">Company (optional)</label>
                                <input
                                    className="input"
                                    type="text"
                                    placeholder="e.g. Acme Corp"
                                    value={company}
                                    onChange={(e) => setCompany(e.target.value)}
                                />
                            </div>
                            <div className="input-group" style={{ width: '100%' }}>
                                <label className="input-label">Your Role (optional)</label>
                                <input
                                    className="input"
                                    type="text"
                                    placeholder="e.g. Field Technician"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                />
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <h2 className="text-title">How it works</h2>
                            <p className="text-body" style={{ maxWidth: 320 }}>
                                FieldPulse is designed to make logging your day effortless. Here&apos;s the quick rundown:
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                                {[
                                    {
                                        num: '1',
                                        title: 'Start your shift',
                                        desc: 'Tap the big button to clock in. It tracks every second.',
                                    },
                                    {
                                        num: '2',
                                        title: 'Log your mileage',
                                        desc: 'Enter your starting odometer. End it when you arrive.',
                                    },
                                    {
                                        num: '3',
                                        title: 'Record fuel stops',
                                        desc: 'Log gallons, cost, and mileage whenever you fill up.',
                                    },
                                    {
                                        num: '4',
                                        title: 'Add daily notes',
                                        desc: 'Tag with state codes, write what you did.',
                                    },
                                ].map(({ num, title, desc }) => (
                                    <div
                                        key={num}
                                        style={{
                                            display: 'flex',
                                            gap: '0.75rem',
                                            alignItems: 'flex-start',
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: 32,
                                                height: 32,
                                                borderRadius: '50%',
                                                background: 'var(--fp-amber-glow)',
                                                border: '1px solid var(--fp-amber-dark)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '0.875rem',
                                                fontWeight: 700,
                                                color: 'var(--fp-amber)',
                                                flexShrink: 0,
                                            }}
                                        >
                                            {num}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{title}</div>
                                            <div className="text-caption">{desc}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {step === 3 && (
                        <>
                            <motion.div
                                initial={{ scale: 0.5, rotate: -10 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: 'spring', damping: 15 }}
                                style={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: '50%',
                                    background: 'var(--fp-success-bg)',
                                    border: '2px solid var(--fp-success)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '0.5rem',
                                }}
                            >
                                <span style={{ fontSize: '2rem' }}>🚀</span>
                            </motion.div>
                            <h2 className="text-title">You&apos;re all set{name ? `, ${name}` : ''}!</h2>
                            <p className="text-body" style={{ maxWidth: 300 }}>
                                Start tracking your first day. Your data stays on this device and syncs automatically when connected.
                            </p>
                            <div className="card-amber" style={{ width: '100%', textAlign: 'left' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <Zap size={16} style={{ color: 'var(--fp-amber)' }} />
                                    <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--fp-amber)' }}>Pro tip</span>
                                </div>
                                <p className="text-caption">
                                    Add FieldPulse to your home screen for the best experience. It works offline too!
                                </p>
                            </div>
                        </>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div style={{ marginTop: '2rem', width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <button
                    className={`btn btn-primary btn-lg ${!canProceed ? 'opacity-50' : ''}`}
                    style={{ width: '100%', opacity: canProceed ? 1 : 0.5 }}
                    onClick={next}
                    disabled={!canProceed}
                >
                    {step === STEPS - 1 ? (
                        <>
                            Get Started <ArrowRight size={18} />
                        </>
                    ) : (
                        <>
                            Continue <ChevronRight size={18} />
                        </>
                    )}
                </button>

                {/* Dots */}
                <div className="onboarding-dots">
                    {Array.from({ length: STEPS }).map((_, i) => (
                        <div
                            key={i}
                            className={`onboarding-dot ${i === step ? 'onboarding-dot-active' : ''}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
