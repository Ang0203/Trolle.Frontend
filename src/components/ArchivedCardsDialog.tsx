"use client"

import React, { useMemo, useEffect, useState } from 'react';
import { Board, Card, api } from '@/lib/api';
import { X, Archive, RotateCcw, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface ArchivedCardsDialogProps {
    board: Board;
    isOpen: boolean;
    onClose: () => void;
    onRefresh: () => void;
}

export function ArchivedCardsDialog({
    board,
    isOpen,
    onClose,
    onRefresh
}: ArchivedCardsDialogProps) {
    const { t } = useLanguage();
    const [searchTerm, setSearchTerm] = useState("");
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

    const archivedCards = useMemo(() => {
        const carts: Card[] = [];
        board.columns.forEach(col => {
            col.cards.forEach(card => {
                if (card.isArchived) {
                    carts.push(card);
                }
            });
        });

        if (!searchTerm) return carts;

        return carts.filter(c =>
            c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [board, searchTerm]);

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

    const handleUnarchive = async (cardId: string) => {
        try {
            await api.unarchiveCard(board.id, cardId);
            onRefresh();
        } catch (e) {
            console.error("Failed to unarchive card", e);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
        >
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-[400px] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <Archive size={18} className="text-slate-900" />
                        <h3 className="text-md font-bold text-slate-900 tracking-tight">{t('archived.archived_cards')}</h3>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-full transition-colors cursor-pointer">
                        <X size={18} className="text-slate-400" />
                    </button>
                </div>

                <div className="p-5 space-y-4 flex-1 overflow-hidden flex flex-col">
                    <div className="relative">
                        <Input
                            placeholder={t('archived.search_by_title')}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-9 h-10 bg-slate-100/50 border-slate-200 rounded-xl focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all text-xs font-medium text-slate-900 placeholder:text-slate-500"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    </div>

                    <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-2">
                        {archivedCards.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-2">
                                <Archive size={40} strokeWidth={1} />
                                <p className="font-medium text-xs">{searchTerm ? t('archived.no_results') : t('archived.no_archived_cards')}</p>
                            </div>
                        ) : (
                            archivedCards.map(card => (
                                <div key={card.id} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between group hover:bg-white hover:shadow-sm transition-all">
                                    <div className="space-y-0.5 overflow-hidden flex-1">
                                        <h4 className="font-bold text-[13px] text-slate-800 truncate" title={card.title}>{card.title}</h4>
                                        <p className="text-[10px] text-slate-500 truncate" title={card.description || ""}>{card.description || t('archived.no_description')}</p>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {card.labels.map(label => (
                                                <div
                                                    key={label.id}
                                                    className="w-6 h-1 rounded-full shrink-0"
                                                    style={{ backgroundColor: label.color }}
                                                    title={label.name}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleUnarchive(card.id)}
                                        className="h-8 text-[10px] text-blue-600 hover:bg-blue-50 bg-white shadow-sm border border-blue-100 rounded-lg flex gap-1.5 font-bold px-2 ml-3 shrink-0"
                                    >
                                        <RotateCcw size={12} />
                                        <span>{t('archived.restore')}</span>
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-end items-center">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        className="px-6 h-8 text-xs font-bold rounded-lg cursor-pointer"
                    >
                        {t('common.close')}
                    </Button>
                </div>
            </div>
        </div>
    );
}
