import React from 'react';
import { Label } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface LabelBadgeProps {
    label: Label;
    className?: string;
    onClick?: () => void;
    title?: string;
    showCheck?: boolean; // For selection state visualization if needed later
}

export function LabelBadge({ label, className, onClick, title, showCheck }: LabelBadgeProps) {
    return (
        <div
            className={cn(
                "px-3 py-1.5 rounded-md text-[11px] font-bold shadow-sm transition-transform hover:scale-105 cursor-pointer flex items-center gap-1",
                className
            )}
            style={{ backgroundColor: label.color, color: label.textColor }}
            onClick={onClick}
            title={title}
        >
            {label.name}
            {showCheck && <Check size={12} />}
        </div>
    );
}
