'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Clock,
    Route,
    Fuel,
    FileText,
    BarChart3,
    Settings,
} from 'lucide-react';

const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    { href: '/time', icon: Clock, label: 'Time' },
    { href: '/mileage', icon: Route, label: 'Miles' },
    { href: '/fuel', icon: Fuel, label: 'Fuel' },
    { href: '/notes', icon: FileText, label: 'Notes' },
];

export default function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="bottom-nav">
            <div className="bottom-nav-inner">
                {navItems.map(({ href, icon: Icon, label }) => {
                    const isActive = pathname === href || pathname?.startsWith(href + '/');
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
                        >
                            <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
                            <span>{label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
