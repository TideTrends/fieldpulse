'use client';

import { useEffect, useState } from 'react';
import { motion, useSpring } from 'framer-motion';

export function ReactiveBackground() {
    const [MousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const springConfig = { damping: 25, stiffness: 120 };
    const springX = useSpring(0, springConfig);
    const springY = useSpring(0, springConfig);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            springX.set(e.clientX);
            springY.set(e.clientY);
            setMousePosition({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [springX, springY]);

    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#050505] transition-colors duration-1000">
            {/* Base Grid Pattern */}
            <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: `
            linear-gradient(to right, #ffffff 1px, transparent 1px),
            linear-gradient(to bottom, #ffffff 1px, transparent 1px)
          `,
                    backgroundSize: '40px 40px'
                }}
            />

            {/* Reactive Glow 1 - follows cursor */}
            <motion.div
                className="absolute w-[800px] h-[800px] rounded-full blur-[150px] mix-blend-screen opacity-20 pointer-events-none"
                style={{
                    background: 'radial-gradient(circle, #ff6b00 0%, transparent 70%)',
                    left: springX,
                    top: springY,
                    translateX: '-50%',
                    translateY: '-50%',
                }}
            />

            {/* Reactive Glow 2 - Static ambient glow */}
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-gradient-to-tl from-[#ff6b00]/10 to-transparent blur-[120px] mix-blend-screen pointer-events-none" />
        </div>
    );
}
