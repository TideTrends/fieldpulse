'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

type Theme = 'dark' | 'light' | 'system';

interface ThemeContextValue {
    theme: Theme;
    resolvedTheme: 'dark' | 'light';
    setTheme: (t: Theme) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
    theme: 'dark',
    resolvedTheme: 'dark',
    setTheme: () => { },
    toggleTheme: () => { },
});

export function useTheme() {
    return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('dark');
    const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('dark');

    // Resolve system preference
    const resolveTheme = useCallback((t: Theme): 'dark' | 'light' => {
        if (t === 'system') {
            if (typeof window !== 'undefined') {
                return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            }
            return 'dark';
        }
        return t;
    }, []);

    // Apply theme to DOM
    const applyTheme = useCallback((resolved: 'dark' | 'light') => {
        const root = document.documentElement;
        root.setAttribute('data-theme', resolved);
        // Also update <meta name="theme-color">
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) {
            meta.setAttribute('content', resolved === 'dark' ? '#0a0a0b' : '#f5f5f4');
        }
    }, []);

    // Load saved preference
    useEffect(() => {
        const saved = localStorage.getItem('fieldpulse-theme') as Theme | null;
        const t = saved || 'dark';
        setThemeState(t);
        const resolved = resolveTheme(t);
        setResolvedTheme(resolved);
        applyTheme(resolved);
    }, [resolveTheme, applyTheme]);

    // Listen for system changes
    useEffect(() => {
        if (theme !== 'system') return;
        const mql = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = (e: MediaQueryListEvent) => {
            const resolved = e.matches ? 'dark' : 'light';
            setResolvedTheme(resolved);
            applyTheme(resolved);
        };
        mql.addEventListener('change', handler);
        return () => mql.removeEventListener('change', handler);
    }, [theme, applyTheme]);

    const setTheme = useCallback((t: Theme) => {
        setThemeState(t);
        localStorage.setItem('fieldpulse-theme', t);
        const resolved = resolveTheme(t);
        setResolvedTheme(resolved);
        applyTheme(resolved);
    }, [resolveTheme, applyTheme]);

    const toggleTheme = useCallback(() => {
        setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    }, [resolvedTheme, setTheme]);

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}
