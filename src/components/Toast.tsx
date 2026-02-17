'use client';

import { useStore } from '@/lib/store';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export default function Toast() {
    const toast = useStore((s) => s.toast);
    const clearToast = useStore((s) => s.clearToast);

    const icons = {
        success: <CheckCircle size={18} style={{ color: 'var(--fp-success)' }} />,
        error: <AlertCircle size={18} style={{ color: 'var(--fp-error)' }} />,
        info: <Info size={18} style={{ color: 'var(--fp-info)' }} />,
    };

    return (
        <AnimatePresence>
            {toast && (
                <motion.div
                    className="toast"
                    initial={{ opacity: 0, y: -20, x: '-50%' }}
                    animate={{ opacity: 1, y: 0, x: '-50%' }}
                    exit={{ opacity: 0, y: -20, x: '-50%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                >
                    {icons[toast.type]}
                    <span>{toast.message}</span>
                    <button
                        onClick={clearToast}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--fp-text-muted)',
                            padding: '2px',
                        }}
                    >
                        <X size={14} />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
