import React from 'react';
import { Card, Label } from '@/lib/api';
import { Dialog } from './ui/dialog';
import { Button } from './ui/button';
import { Archive } from 'lucide-react';
import { useCardEdit } from '@/hooks/useCardEdit';
import { CardLabels } from './card-edit/CardLabels';
import { CardTitleSection } from './card-edit/CardTitleSection';
import { CardDescription } from './card-edit/CardDescription';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface CardEditDialogProps {
    card: Card;
    boardId: string;
    allLabels: Label[];
    isOpen: boolean;
    onClose: () => void;
    onRefresh: () => void;
}

export function CardEditDialog({ card, boardId, allLabels, isOpen, onClose, onRefresh }: CardEditDialogProps) {
    const { t } = useLanguage();
    const {
        title, setTitle,
        description, setDescription,
        selectedLabelIds,
        isDeleting, setIsDeleting,
        showLabelsPanel, setShowLabelsPanel,
        handleSave,
        handleArchive,
        handleToggleLabel,
    } = useCardEdit({ card, boardId, isOpen, onClose, onRefresh });

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title={t('card.edit_card')}>
            <div className="space-y-8 min-w-[350px] max-h-[85vh] overflow-y-auto px-1 custom-scrollbar">
                <CardLabels
                    boardId={boardId}
                    allLabels={allLabels}
                    selectedLabelIds={selectedLabelIds}
                    onToggleLabel={handleToggleLabel}
                    showLabelsPanel={showLabelsPanel}
                    setShowLabelsPanel={setShowLabelsPanel}
                    onRefresh={onRefresh}
                />

                <CardTitleSection title={title} setTitle={setTitle} />

                <CardDescription description={description} setDescription={setDescription} />

                <div className="flex flex-wrap items-center justify-end pt-8 border-t border-slate-100 mt-6 gap-3">
                    {!isDeleting ? (
                        <button
                            onClick={() => setIsDeleting(true)}
                            className="flex items-center gap-2 text-[11px] font-bold text-red-500 hover:text-red-700 transition-all p-2 hover:bg-red-50 rounded-lg mr-auto active:scale-95"
                        >
                            <Archive size={14} />
                            {t('card.archive_card')}
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-300 bg-amber-50 p-1.5 rounded-xl border border-amber-100 mr-auto">
                            <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider mx-2">{t('card.archive_confirm')}</span>
                            <Button variant="primary" className="h-8 px-4 text-xs font-bold shadow-sm rounded-lg bg-amber-600 hover:bg-amber-700 border-none" onClick={handleArchive}>{t('card.archive_button')}</Button>
                            <Button variant="secondary" className="h-8 px-4 text-xs font-bold rounded-lg" onClick={() => setIsDeleting(false)}>{t('common.cancel')}</Button>
                        </div>
                    )}

                    <Button
                        variant="secondary"
                        onClick={onClose}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 border-none px-6 font-semibold h-10"
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        className="px-8 font-bold shadow-md hover:shadow-lg active:scale-95 transition-all h-10"
                    >
                        {t('card.save_changes')}
                    </Button>
                </div>
            </div>
        </Dialog>
    );
}
