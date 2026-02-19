'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginUser } from './actions';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);

        const result = await loginUser(formData);

        if (result.error) {
            setError(result.error);
            setLoading(false);
        } else {
            router.push('/dashboard');
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4" style={{ fontFamily: 'var(--font-manrope, sans-serif)' }}>
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gradient-to-br from-[#ff6b00]/20 to-transparent blur-[120px] mix-blend-screen" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gradient-to-tl from-[#ff6b00]/10 to-transparent blur-[100px] mix-blend-screen" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-md relative z-10"
            >
                <div className="bg-[#0a0a0b]/80 backdrop-blur-xl border border-white/[0.08] p-8 md:p-12 rounded-2xl shadow-2xl relative overflow-hidden">

                    {/* Subtle reflection overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

                    <div className="flex items-center justify-center mb-8">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff6b00] to-[#cc5500] flex items-center justify-center shadow-[0_0_30px_rgba(255,107,0,0.3)] border border-white/20">
                            <Activity className="text-white" size={24} strokeWidth={2.5} />
                        </div>
                    </div>

                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight" style={{ fontFamily: 'var(--font-syne, sans-serif)' }}>FieldPulse</h1>
                        <p className="text-[#888] text-sm font-medium tracking-wide">AUTHENTICATION REQUIRED</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-[#666] uppercase tracking-widest mb-2" htmlFor="email">Identity</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-[#111] border border-white/[0.05] text-white px-4 py-3.5 rounded-xl focus:outline-none focus:border-[#ff6b00]/50 focus:ring-1 focus:ring-[#ff6b00]/50 transition-all placeholder-[#444] font-medium"
                                placeholder="email@example.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[#666] uppercase tracking-widest mb-2" htmlFor="password">Passcode</label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-[#111] border border-white/[0.05] text-white px-4 py-3.5 rounded-xl focus:outline-none focus:border-[#ff6b00]/50 focus:ring-1 focus:ring-[#ff6b00]/50 transition-all placeholder-[#444] font-medium tracking-widest"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        {error && (
                            <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="text-[#ff4444] text-sm text-center py-2 font-medium"
                            >
                                {error}
                            </motion.p>
                        )}

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-white text-black hover:bg-[#ccc] disabled:bg-white/50 disabled:cursor-not-allowed font-bold py-3.5 rounded-xl transition-all duration-300 relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                                <span className="relative inline-flex items-center gap-2">
                                    {loading ? 'AUTHENTICATING...' : 'ACCESS SYSTEM'}
                                </span>
                            </button>
                        </div>

                        <p className="text-[#555] text-xs text-center mt-6">First login registers the master account.</p>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
