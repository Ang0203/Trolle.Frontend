import React from 'react';
import { Label } from '@/lib/api';
import { Tag, Plus } from 'lucide-react';
import { LabelBadge } from '../ui/LabelBadge';
import { LabelsPanel } from '../LabelsPanel';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface CardLabelsProps {
    boardId: string;
    allLabels: Label[];
    selectedLabelIds: string[];
    onToggleLabel: (labelId: string) => void;
    showLabelsPanel: boolean;
    setShowLabelsPanel: (show: boolean) => void;
    onRefresh: () => void;
}

export function CardLabels({
    boardId,
    allLabels,
    selectedLabelIds,
    onToggleLabel,
    showLabelsPanel,
    setShowLabelsPanel,
    onRefresh
}: CardLabelsProps) {
    const { t } = useLanguage();
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-800">
                <Tag size={16} className="text-indigo-600" />
                <label className="text-xs font-bold uppercase tracking-widest">{t('board.labels')}</label>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
                {selectedLabelIds.map(id => {
                    const label = allLabels.find(l => l.id === id);
                    if (!label) return null;
                    return (
                        <LabelBadge
                            key={id}
                            label={label}
                            onClick={() => onToggleLabel(id)}
                        />
                    );
                })}
                <div className="relative">
                    <button
                        onClick={() => setShowLabelsPanel(!showLabelsPanel)}
                        className="flex items-center justify-center w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-md text-slate-600 transition-all active:scale-95 shadow-sm"
                        title={t('board.labels')}
                    >
                        <Plus size={18} />
                    </button>
                    {showLabelsPanel && (
                        <div className="absolute top-10 left-0 z-[110]">
                            <LabelsPanel
                                boardId={boardId}
                                allLabels={allLabels}
                                selectedLabels={selectedLabelIds}
                                onToggleLabel={onToggleLabel}
                                onClose={() => setShowLabelsPanel(false)}
                                onRefresh={onRefresh}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
