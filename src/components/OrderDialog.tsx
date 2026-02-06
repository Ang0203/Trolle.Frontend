import { Board } from "@/lib/api";
import { Dialog } from "./ui/dialog";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";
import { Input } from "./ui/input";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface OrderDialogProps {
    board: Board;
    isOpen: boolean;
    onClose: () => void;
    onSave: (orders: Record<string, number>, target: "Column" | "Card") => Promise<void>;
}

export function OrderDialog({ board, isOpen, onClose, onSave }: OrderDialogProps) {
    const { t } = useLanguage();
    const [target, setTarget] = useState<"Column" | "Card">("Column");
    const [localOrders, setLocalOrders] = useState<Record<string, number>>({});
    const [isSaving, setIsSaving] = useState(false);

    // Effect to initialize localOrders when the dialog opens or board changes
    useEffect(() => {
        if (isOpen && board) {
            const initial: Record<string, number> = {};

            // Columns 1..N
            board.columns.slice().sort((a, b) => a.order - b.order).forEach((col, idx) => {
                initial[col.id] = idx + 1;

                // Cards 1..N within column
                const activeCards = col.cards.filter(c => !c.isArchived).sort((a, b) => a.order - b.order);
                activeCards.forEach((card, cIdx) => {
                    initial[card.id] = cIdx + 1;
                });
            });
            setLocalOrders(initial);
        }
    }, [isOpen, board]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(localOrders, target);
            onClose();
        } finally {
            setIsSaving(false);
        }
    };

    const updateOrder = (id: string, val: string, max: number) => {
        let num = parseInt(val);
        if (isNaN(num)) num = 1;
        if (num < 1) num = 1;
        if (num > max) num = max;
        setLocalOrders(prev => ({ ...prev, [id]: num }));
    };

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title={t('reorder.reorder_board_elements')} maxWidth="sm">
            <div className="space-y-5 max-h-[85vh] flex flex-col">
                <div
                    tabIndex={0}
                    role="button"
                    aria-label={`Switch to ${target === "Column" ? "Card" : "Column"} ordering`}
                    onClick={() => setTarget(prev => prev === "Column" ? "Card" : "Column")}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setTarget(prev => prev === "Column" ? "Card" : "Column");
                        }
                    }}
                    className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 w-fit shrink-0 cursor-pointer select-none group focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 outline-none ml-1"
                >
                    <div
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${target === "Column" ? "bg-white text-blue-600 shadow-sm" : "text-slate-950 hover:text-black"}`}
                    >
                        {t('reorder.columns')}
                    </div>
                    <div
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${target === "Card" ? "bg-white text-blue-600 shadow-sm" : "text-slate-950 hover:text-black"}`}
                    >
                        {t('reorder.cards')}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 space-y-4 min-h-0 custom-scrollbar">
                    {target === "Column" ? (
                        <div className="space-y-2">
                            {board.columns.map(col => (
                                <div key={col.id} className="flex items-center gap-3 p-2 bg-white border border-slate-200 rounded-2xl shadow-sm">
                                    <div
                                        className="w-8 h-8 rounded-lg shrink-0 border border-black/5"
                                        style={{ backgroundColor: col.headerColor || "#cbd5e1" }}
                                    />
                                    <span className="flex-1 font-bold text-xs text-slate-800 truncate">{col.title}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">{t('reorder.order')} (1-{board.columns.length})</span>
                                        <Input
                                            type="number"
                                            min={1}
                                            max={board.columns.length}
                                            value={localOrders[col.id] ?? 1}
                                            onChange={(e) => updateOrder(col.id, e.target.value, board.columns.length)}
                                            className="w-12 h-8 text-center text-xs font-bold bg-slate-50 border-slate-200 text-slate-900"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {board.columns.map(col => {
                                const activeCards = col.cards.filter(c => !c.isArchived);
                                return (
                                    <div key={col.id} className="space-y-2">
                                        <div className="flex items-center gap-2 px-1">
                                            <div
                                                className="w-2.5 h-2.5 rounded-[2px] shrink-0 shadow-sm border border-black/5"
                                                style={{ backgroundColor: col.headerColor || "#cbd5e1" }}
                                            />
                                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{col.title}</h4>
                                        </div>
                                        <div className="space-y-2 pl-2 border-l-2 border-slate-100">
                                            {activeCards.length === 0 ? (
                                                <p className="text-[10px] text-slate-400 italic px-2">{t('reorder.no_cards')}</p>
                                            ) : (
                                                activeCards.map(card => (
                                                    <div key={card.id} className="flex items-center gap-2 p-2 bg-slate-50/50 border border-slate-200 rounded-xl">
                                                        <span className="flex-1 font-bold text-[11px] text-slate-700 truncate">{card.title}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase">{t('reorder.order')} (1-{activeCards.length})</span>
                                                            <Input
                                                                type="number"
                                                                min={1}
                                                                max={activeCards.length}
                                                                value={localOrders[card.id] ?? 1}
                                                                onChange={(e) => updateOrder(card.id, e.target.value, activeCards.length)}
                                                                className="w-12 h-8 text-center text-[10px] font-bold border-slate-200 bg-white text-slate-900"
                                                            />
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 shrink-0">
                    <Button variant="secondary" className="h-8 text-xs font-bold text-slate-600" onClick={onClose} disabled={isSaving}>{t('common.cancel')}</Button>
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        className="font-bold h-8 text-xs px-4 rounded-lg shadow-md"
                        disabled={isSaving}
                    >
                        {isSaving ? t('reorder.saving') : t('reorder.apply_order')}
                    </Button>
                </div>
            </div>
        </Dialog>
    );
}
