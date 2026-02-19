'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Play, Square, Clock, MapPin, Fuel, FileText,
    TrendingUp, Flame, ChevronRight, DollarSign,
    Zap, Calendar, Sun, Moon, BarChart2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/components/ThemeProvider';
import { FloatingActionButton } from '@/components/SmartWidgets';
import { ReactiveBackground } from '@/components/ReactiveBackground';
import {
    useStore,
    getTotalHoursToday,
    getTotalMilesToday,
    getHoursFromEntry,
    getWeeklyHours,
    getWeekEntries,
    getWeeklyMiles,
    getOvertimeHours,
    calculateEarnings,
    formatDuration,
    formatHoursMinutes,
    formatCurrency,
} from '@/lib/store';
import { getCurrentPosition } from '@/lib/geolocation';
import { getWeatherCached, type WeatherData } from '@/lib/weather';

const ShiftMap = dynamic(() => import('@/components/ShiftMap'), { ssr: false });

export default function DashboardPage() {
    const router = useRouter();
    const { resolvedTheme, toggleTheme } = useTheme();
    const {
        profile, isTimerRunning, activeTimerStart,
        startTimer, stopTimer, showToast,
        timeEntries, mileageEntries, fuelLogs, dailyNotes,
        streakCount, locationLogs, addTimeEntry,
    } = useStore();

    const [elapsed, setElapsed] = useState(0);
    const [mounted, setMounted] = useState(false);
    const [weather, setWeather] = useState<WeatherData | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Fetch weather on mount
    useEffect(() => {
        if (!mounted) return;
        getCurrentPosition()
            .then(pos => getWeatherCached(pos.lat, pos.lng))
            .then(setWeather)
            .catch(() => { /* no location / denied */ });
    }, [mounted]);

    // Live timer
    useEffect(() => {
        if (!isTimerRunning || !activeTimerStart) return;
        const tick = () => {
            setElapsed(Math.floor((Date.now() - new Date(activeTimerStart).getTime()) / 1000));
        };
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [isTimerRunning, activeTimerStart]);

    // Stats
    const todayHours = useMemo(() => getTotalHoursToday(timeEntries), [timeEntries]);
    const todayMiles = useMemo(() => getTotalMilesToday(mileageEntries), [mileageEntries]);
    const weekEntries = useMemo(() => getWeekEntries(timeEntries), [timeEntries]);
    const weeklyHours = useMemo(() => getWeeklyHours(timeEntries), [timeEntries]);
    const totalWeekHours = useMemo(() => weekEntries.reduce((s, e) => s + getHoursFromEntry(e), 0), [weekEntries]);
    const weeklyMiles = useMemo(() => getWeeklyMiles(mileageEntries), [mileageEntries]);

    const overtimeToday = useMemo(() => getOvertimeHours(timeEntries, profile.overtimeThreshold), [timeEntries, profile.overtimeThreshold]);
    const maxBarHours = useMemo(() => Math.max(...weeklyHours.map(d => d.hours), 1), [weeklyHours]);

    // Weekly earnings
    const earnings = useMemo(() => {
        if (!profile.hourlyRate) return null;
        return calculateEarnings(weekEntries, profile.hourlyRate, profile.overtimeMultiplier, profile.overtimeThreshold);
    }, [weekEntries, profile.hourlyRate, profile.overtimeMultiplier, profile.overtimeThreshold]);

    // Recent activity
    const recentActivity = useMemo(() => {
        const all = [
            ...timeEntries.slice(0, 3).map(e => ({
                type: 'time' as const,
                date: e.date,
                label: `Worked ${formatHoursMinutes(getHoursFromEntry(e))}`,
                icon: Clock,
            })),
            ...mileageEntries.slice(0, 3).map(e => ({
                type: 'mileage' as const,
                date: e.date,
                label: `Drove ${e.tripMiles.toFixed(1)} mi`,
                icon: MapPin,
            })),
            ...fuelLogs.slice(0, 3).map(l => ({
                type: 'fuel' as const,
                date: l.date,
                label: `${l.gallons.toFixed(1)} gal at ${l.station || 'Unknown'}`,
                icon: Fuel,
            })),
        ];
        return all.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
    }, [timeEntries, mileageEntries, fuelLogs]);

    const handleTimerToggle = () => {
        if (isTimerRunning) {
            stopTimer();
            showToast('Shift ended!');
        } else {
            startTimer();
            showToast('Shift started!', 'info');
        }
    };

    const handleFABAction = (action: string) => {
        switch (action) {
            case 'time': router.push('/time'); break;
            case 'mileage': router.push('/mileage'); break;
            case 'fuel': router.push('/fuel'); break;
            case 'note': router.push('/notes'); break;
        }
    };

    if (!mounted) return null;

    return (
        <div className="relative min-h-screen bg-[#050505] text-white" style={{ fontFamily: 'var(--font-manrope, sans-serif)' }}>
            <ReactiveBackground />

            <div className="page-container relative z-10 pt-6 pb-32">
                {/* Header Section */}
                <header className="flex items-center justify-between mb-10">
                    <div>
                        <motion.p className="text-[#888] text-xs font-bold uppercase tracking-widest mb-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </motion.p>
                        <motion.h1
                            className="text-4xl font-bold tracking-tight"
                            style={{ fontFamily: 'var(--font-syne, sans-serif)' }}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 }}
                        >
                            {profile.name ? `Hey, ${profile.name}` : 'Overview'}
                        </motion.h1>
                    </div>
                    <div className="flex items-center gap-3">
                        {streakCount > 0 && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-br from-[#ff6b00]/20 to-[#cc5500]/20 border border-[#ff6b00]/30 text-[#ff6b00] text-sm font-semibold shadow-[0_0_15px_rgba(255,107,0,0.15)]"
                            >
                                <Flame size={14} /> {streakCount}
                            </motion.div>
                        )}
                        {/* {weather && <div className="text-[#888] text-sm font-medium">{weather.temp}°</div>} */}
                    </div>
                </header>

                {/* Central Timer Array */}
                <motion.section
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col items-center justify-center py-10 mb-12 relative"
                >
                    {/* The sleek timer button */}
                    <div className="relative group cursor-pointer" onClick={handleTimerToggle}>
                        {/* Outer Glow */}
                        <div className={`absolute -inset-4 rounded-full blur-2xl transition-all duration-1000 ${isTimerRunning ? 'bg-[#ff6b00]/30 animate-pulse' : 'bg-white/5 opacity-50 group-hover:opacity-100'}`} />

                        {/* Status Ring */}
                        <div className="absolute inset-[-4px] rounded-full overflow-hidden">
                            <svg className="w-full h-full rotate-[-90deg]">
                                <circle cx="50%" cy="50%" r="48%" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
                                {isTimerRunning && (
                                    <circle cx="50%" cy="50%" r="48%" fill="none" stroke="#ff6b00" strokeWidth="2" strokeDasharray="300" strokeDashoffset={300 - (300 * (elapsed % 60) / 60)} className="transition-all duration-1000 ease-linear" />
                                )}
                            </svg>
                        </div>

                        {/* Button Surface */}
                        <div className={`w-40 h-40 rounded-full flex flex-col items-center justify-center backdrop-blur-xl border border-white/10 shadow-2xl transition-all duration-500 scale-100 active:scale-95 ${isTimerRunning ? 'bg-[#ff6b00]/10 border-[#ff6b00]/50' : 'bg-[#111] hover:bg-[#1a1a1a]'}`}>
                            {isTimerRunning ? (
                                <Square size={32} className="text-[#ff6b00] mb-2 drop-shadow-[0_0_10px_rgba(255,107,0,0.5)] fill-transparent" strokeWidth={1.5} />
                            ) : (
                                <Play size={36} className="text-white mb-2 ml-1" strokeWidth={1} />
                            )}
                            <div className="text-[#666] text-xs font-bold uppercase tracking-widest mt-2">{isTimerRunning ? 'Working' : 'Start'}</div>
                        </div>
                    </div>

                    {/* Clock Readout */}
                    <div className="mt-8 flex flex-col items-center">
                        <motion.div
                            className="text-5xl md:text-6xl font-medium tracking-tight"
                            style={{ fontFamily: 'var(--font-syne, sans-serif)', color: isTimerRunning ? '#fff' : '#666', textShadow: isTimerRunning ? '0 0 40px rgba(255,255,255,0.2)' : 'none' }}
                            key={isTimerRunning ? 'running' : 'idle'}
                        >
                            {isTimerRunning ? formatDuration(elapsed) : '00:00:00'}
                        </motion.div>
                        {isTimerRunning && activeTimerStart && (
                            <p className="text-[#888] text-sm mt-3 font-medium">
                                Shift started at {new Date(activeTimerStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        )}
                        {!isTimerRunning && (
                            <p className="text-[#555] text-sm mt-3 font-medium">Ready for deployment</p>
                        )}
                    </div>
                </motion.section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                    {/* Insights Hub */}
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        {/* <IntuitiveInsightCard /> - Wait, we removed this in favor of a sleek redesign, or we can use it if it looks good, but I'll write a custom one  */}
                        <div className="bg-[#111]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-6 h-full transition-all hover:bg-[#151515] hover:border-white/10">
                            <div className="flex items-center gap-2 mb-6">
                                <BarChart2 size={16} className="text-[#ff6b00]" />
                                <h2 className="text-sm font-bold uppercase tracking-widest text-[#888]">Data Telemetry</h2>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <div className="text-xs text-[#666] uppercase tracking-wider mb-1">Hours</div>
                                    <div className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-syne, sans-serif)' }}>{formatHoursMinutes(totalWeekHours)}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-[#666] uppercase tracking-wider mb-1">Miles</div>
                                    <div className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-syne, sans-serif)' }}>{weeklyMiles.toFixed(0)}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-[#666] uppercase tracking-wider mb-1">Shifts</div>
                                    <div className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-syne, sans-serif)' }}>{weekEntries.length}</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Earnings Module */}
                    {earnings && (
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                            <div className="relative overflow-hidden bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0b] backdrop-blur-xl border border-white/10 rounded-2xl p-6 h-full group">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#ff6b00]/5 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
                                <div className="flex items-center gap-2 mb-2 relative z-10">
                                    <DollarSign size={16} className="text-[#ff6b00]" />
                                    <h2 className="text-sm font-bold uppercase tracking-widest text-[#888]">Gross Earnings</h2>
                                </div>
                                <div className="text-4xl font-bold text-white mb-2 relative z-10" style={{ fontFamily: 'var(--font-syne, sans-serif)' }}>
                                    {formatCurrency(earnings.total)}
                                </div>
                                <div className="text-xs text-[#666] font-medium tracking-wide relative z-10 flex gap-3">
                                    <span>REG: {formatCurrency(earnings.regular)}</span>
                                    {earnings.overtime > 0 && <span className="text-[#ff6b00]">OT: {formatCurrency(earnings.overtime)}</span>}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Activity Log */}
                <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-10">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-[#888]">Activity Log</h2>
                        <button onClick={() => router.push('/reports')} className="text-xs font-semibold text-[#ff6b00] hover:text-[#fff] transition-colors flex items-center gap-1 uppercase tracking-wider">
                            View Log <ChevronRight size={12} strokeWidth={3} />
                        </button>
                    </div>

                    <div className="space-y-3">
                        <AnimatePresence>
                            {recentActivity.length === 0 ? (
                                <div className="bg-[#111]/50 border border-white/5 rounded-2xl p-10 flex flex-col items-center justify-center text-center">
                                    <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center mb-4">
                                        <Clock size={20} className="text-[#666]" />
                                    </div>
                                    <p className="text-[#888] font-medium">Awaiting telemetry data.</p>
                                </div>
                            ) : (
                                recentActivity.map((item, i) => (
                                    <motion.div
                                        key={`${item.type}-${i}`}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="group bg-[#0a0a0b] hover:bg-[#111] border border-white/5 hover:border-white/10 rounded-xl p-4 flex items-center gap-4 transition-all cursor-pointer"
                                    >
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center border border-white/5 ${item.type === 'time' ? 'bg-white/5 text-white' :
                                            item.type === 'mileage' ? 'bg-[#ff6b00]/10 text-[#ff6b00]' :
                                                'bg-blue-500/10 text-blue-500' // fuel
                                            }`}>
                                            <item.icon size={18} strokeWidth={2} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-white group-hover:text-[#ff6b00] transition-colors">{item.label}</p>
                                            <p className="text-xs text-[#666] font-medium">{item.date}</p>
                                        </div>
                                        <ChevronRight size={16} className="text-[#333] group-hover:text-[#fff] transition-colors" />
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                </motion.section>

            </div>

            <FloatingActionButton onAction={handleFABAction} />
        </div>
    );
}
