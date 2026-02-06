import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import FocusTrap from 'focus-trap-react';

interface DialogProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
}

export const Dialog: React.FC<DialogProps> = ({ isOpen, onClose, title, children, maxWidth = 'lg' }) => {
    const maxWidthClass = {
        'xs': 'max-w-xs',
        'sm': 'max-w-sm',
        'md': 'max-w-md',
        'lg': 'max-w-lg',
        'xl': 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl',
    }[maxWidth];
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            const handleEsc = (e: KeyboardEvent) => {
                if (e.key === 'Escape') onClose();
            };
            window.addEventListener('keydown', handleEsc);
            return () => {
                document.body.style.overflow = 'unset';
                window.removeEventListener('keydown', handleEsc);
            };
        }
    }, [isOpen, onClose]);

    const [mouseDownTarget, setMouseDownTarget] = useState<EventTarget | null>(null);

    const handleMouseDown = (e: React.MouseEvent) => {
        setMouseDownTarget(e.target);
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        if (mouseDownTarget === e.currentTarget && e.target === e.currentTarget) {
            onClose();
        }
        setMouseDownTarget(null);
    };

    // ... existing useEffect ...

    if (!isOpen || !mounted) return null;

    return createPortal(
        <FocusTrap active={isOpen} focusTrapOptions={{ allowOutsideClick: true }}>
            <div
                className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300"
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
            >
                <div className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidthClass} border border-white/20 overflow-hidden animate-in fade-in zoom-in duration-300 ring-1 ring-black/10`}>
                    <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h3>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-all active:scale-90 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                            aria-label="Close dialog"
                        >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>
                    <div className="p-6">
                        {children}
                    </div>
                </div>
            </div>
        </FocusTrap>,
        document.body
    );
};
