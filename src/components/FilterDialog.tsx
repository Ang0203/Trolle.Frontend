"use client"

import React, { useState, useEffect } from 'react';
import { Board } from '@/lib/api';
import { X, Search, Filter, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export interface BoardFilter {
    title: string;
    description: string;
    labelIds: string[];
}

interface FilterDialogProps {
    board: Board;
    initialFilter: BoardFilter;
    isOpen: boolean;
    onClose: () => void;
    onSave: (filter: BoardFilter) => void;
}

export function FilterDialog({
    board,
    initialFilter,
    isOpen,
    onClose,
    onSave
}: FilterDialogProps) {
    const { t } = useLanguage();
    const [filter, setFilter] = useState<BoardFilter>(initialFilter);
    const [mouseDownTarget, setMouseDownTarget] = useState<EventTarget | null>(null);

    useEffect(() => {
        if (isOpen) {
            const handleEsc = (e: KeyboardEvent) => {
                if (e.key === 'Escape') onClose();
            };
            window.addEventListener('keydown', handleEsc);
            return () => window.removeEventListener('keydown', handleEsc);
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleMouseDown = (e: React.MouseEvent) => {
        setMouseDownTarget(e.target);
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        if (mouseDownTarget === e.currentTarget && e.target === e.currentTarget) {
            onClose();
        }
        setMouseDownTarget(null);
    };

    const handleToggleLabel = (id: string) => {
        setFilter(prev => ({
            ...prev,
            labelIds: prev.labelIds.includes(id)
                ? prev.labelIds.filter(x => x !== id)
                : [...prev.labelIds, id]
        }));
    };

    const handleSave = () => {
        onSave(filter);
        onClose();
    };

    const handleClear = () => {
        setFilter({
            title: "",
            description: "",
            labelIds: []
        });
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
        >
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-[340px] overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <Filter size={18} className="text-slate-900" />
                        <h3 className="text-md font-bold text-slate-900 tracking-tight">{t('filter.filter_cards')}</h3>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-full transition-colors cursor-pointer">
                        <X size={18} className="text-slate-400" />
                    </button>
                </div>

                <div className="p-5 space-y-6">
                    {/* Title Search */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">{t('filter.card_title')}</label>
                        <div className="relative">
                            <Input
                                placeholder={t('filter.search_by_title')}
                                value={filter.title}
                                onChange={e => setFilter(prev => ({ ...prev, title: e.target.value }))}
                                className="pl-9 h-10 bg-slate-50 border-slate-200 rounded-xl focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all text-xs font-medium text-slate-900 placeholder:text-slate-400"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        </div>
                    </div>

                    {/* Description Search */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">{t('filter.description_content')}</label>
                        <div className="relative">
                            <Input
                                placeholder={t('filter.search_in_descriptions')}
                                value={filter.description}
                                onChange={e => setFilter(prev => ({ ...prev, description: e.target.value }))}
                                className="pl-9 h-10 bg-slate-50 border-slate-200 rounded-xl focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all text-xs font-medium text-slate-900 placeholder:text-slate-400"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        </div>
                    </div>

                    {/* Labels Filter */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">{t('board.labels')}</label>
                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                            {board.labels.map((label: Board['labels'][number]) => {
                                const isSelected = filter.labelIds.includes(label.id);
                                return (
                                    <div key={label.id} className="flex items-center gap-2 group">
                                        <div
                                            className={`flex items-center justify-center w-5 h-5 border rounded-sm cursor-pointer shrink-0 transition-colors ${isSelected ? 'bg-blue-600 border-blue-600 shadow-sm' : 'border-slate-300 hover:border-slate-400'}`}
                                            onClick={() => handleToggleLabel(label.id)}
                                        >
                                            {isSelected && (
                                                <Check size={12} className="text-white" />
                                            )}
                                        </div>
                                        <div
                                            className="flex-1 px-3 py-1.5 rounded-md text-[11px] font-bold flex items-center gap-2 cursor-pointer transition-all hover:brightness-95 active:scale-[0.98] shadow-sm border border-black/5 overflow-hidden"
                                            style={{ backgroundColor: label.color, color: label.textColor }}
                                            onClick={() => handleToggleLabel(label.id)}
                                            title={label.name}
                                        >
                                            <div className="w-2 h-2 rounded-full shrink-0 ring-1 ring-black/5 shadow-inner" style={{ backgroundColor: label.textColor }} />
                                            <span className="truncate">{label.name}</span>
                                        </div>
                                    </div>
                                );
                            })}
                            {board.labels.length === 0 && (
                                <p className="text-sm text-slate-400 italic px-1">{t('filter.no_labels_defined')}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                    <Button
                        variant="ghost"
                        onClick={handleClear}
                        className="text-[11px] px-2 h-8 font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-200 cursor-pointer"
                    >
                        {t('filter.clear_all')}
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={onClose} className="px-4 h-8 text-[11px] font-bold cursor-pointer text-slate-700">{t('common.cancel')}</Button>
                        <Button
                            variant="primary"
                            onClick={handleSave}
                            className="px-6 h-8 text-[11px] font-bold rounded-lg shadow-md shadow-blue-500/10 ring-1 ring-blue-400/10 cursor-pointer"
                        >
                            {t('common.save')}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
