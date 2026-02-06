import { useSortable } from "@dnd-kit/sortable";
import { Column, Card, Label, api } from "@/lib/api";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { TaskCard } from "./TaskCard";
import { useMemo, useState, useRef } from "react";
import { Button } from "./ui/button";
import { Plus, X } from "lucide-react";
import { Input } from "./ui/input";
import { cn, getLighterColor } from "@/lib/utils";
import { ColumnHeader } from "./column/ColumnHeader";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface ColumnListProps {
    boardId: string;
    column: Column;
    cards: Card[];
    onAddCard: (columnId: string) => void;
    onUpdateColumn: (columnId: string, title: string, titleColor: string, headerColor: string) => void;
    onDeleteColumn: (columnId: string) => void;
    allLabels: Label[];
    onRefresh: () => void;
    isOver?: boolean;
}

export function ColumnList({
    boardId,
    column,
    cards,
    onUpdateColumn,
    onDeleteColumn,
    allLabels,
    onRefresh,
    isOver,
}: ColumnListProps) {
    const { t } = useLanguage();
    const [isAddingCard, setIsAddingCard] = useState(false);
    const [newCardTitle, setNewCardTitle] = useState("");
    const isProcessingAdd = useRef(false);

    const cardIds = useMemo(() => cards.map((c) => c.id), [cards]);

    const backgroundStyle = useMemo(() => {
        const hasHeaderColor = column.headerColor && column.headerColor !== "transparent";
        const baseStyle: React.CSSProperties = {
            borderColor: hasHeaderColor ? column.headerColor : "rgba(0,0,0,0.05)",
        };

        if (!hasHeaderColor) {
            return { ...baseStyle, backgroundColor: "rgba(255, 255, 255, 0.4)" };
        }

        const baseColor = getLighterColor(column.headerColor!, 0.85);
        const lightColor = getLighterColor(column.headerColor!, 0.95);
        return {
            ...baseStyle,
            backgroundImage: `linear-gradient(to bottom, ${baseColor}, ${lightColor})`
        };
    }, [column.headerColor]);

    const {
        setNodeRef,
        attributes,
        listeners,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: column.id,
        data: {
            type: "Column",
            column,
        },
    });

    const style = {
        transition,
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    };

    const handleAddCard = async (forceDefault = false) => {
        if (isProcessingAdd.current) return;

        let title = newCardTitle.trim();
        if (!title) {
            if (forceDefault) {
                title = t('board.new_card_title');
            } else {
                setIsAddingCard(false);
                return;
            }
        }

        isProcessingAdd.current = true;
        try {
            await api.createCard(boardId, column.id, title);
            setNewCardTitle("");
            setIsAddingCard(false);
            onRefresh();
        } catch (error) {
            console.error("Failed to add card", error);
        } finally {
            isProcessingAdd.current = false;
        }
    };

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="w-[300px] min-w-[300px] h-[500px] max-h-[calc(100vh-120px)] rounded-xl bg-slate-200/50 border-2 border-dashed border-slate-400 opacity-50 shrink-0"
            />
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={{ ...backgroundStyle, ...style }}
            {...attributes}
            {...listeners}
            className={cn(
                "w-[300px] min-w-[300px] rounded-xl flex flex-col h-fit max-h-full relative overflow-visible shadow-xl border transition-all touch-none cursor-grab active:cursor-grabbing",
                isOver ? "ring-4 ring-blue-500 border-blue-500 scale-[1.02] shadow-blue-500/20" : "ring-1 ring-black/5"
            )}
        >
            {/* Overlay to soften the gradient for the content area */}
            <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px] rounded-xl pointer-events-none"></div>

            <ColumnHeader
                column={column}
                onUpdateColumn={onUpdateColumn}
                onDeleteColumn={onDeleteColumn}
            />

            <div className="flex-1 overflow-y-auto min-h-[50px] px-4 pb-4 relative z-10">
                <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
                    {cards.map((card) => (
                        <TaskCard
                            key={card.id}
                            card={card}
                            boardId={boardId}
                            allLabels={allLabels}
                            onRefresh={onRefresh}
                        />
                    ))}
                </SortableContext>

                {isAddingCard && (
                    <div className="mt-3 bg-white/60 backdrop-blur-md p-3 space-y-3 rounded-xl border border-black/10 shadow-md animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="flex gap-2">
                            <Input
                                autoFocus
                                placeholder={t('card.enter_card_title')}
                                value={newCardTitle}
                                onChange={(e) => setNewCardTitle(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleAddCard(true);
                                    if (e.key === "Escape") {
                                        isProcessingAdd.current = true;
                                        setNewCardTitle("");
                                        setIsAddingCard(false);
                                        setTimeout(() => { isProcessingAdd.current = false; }, 100);
                                    }
                                }}
                                onBlur={() => {
                                    if (!isProcessingAdd.current) {
                                        handleAddCard(false);
                                    }
                                }}
                                className="bg-white border-slate-200 text-slate-800 placeholder:text-slate-500 focus-visible:ring-1 focus-visible:ring-slate-400 rounded-lg h-10 text-sm shadow-inner"
                            />
                            <Button
                                size="sm"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => handleAddCard(true)}
                                className="bg-slate-800 text-white hover:bg-slate-900 font-bold px-4 rounded-xl shadow-md transition-transform active:scale-95 h-10"
                            >
                                {t('common.add')}
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setNewCardTitle("");
                                    setIsAddingCard(false);
                                }}
                                className="p-2 h-10 w-10 text-slate-500 hover:text-slate-700 hover:bg-black/5 rounded-xl shrink-0"
                                title={t('common.cancel')}
                            >
                                <X size={20} />
                            </Button>
                        </div>
                    </div>
                )}

                {!isAddingCard && (
                    <Button
                        variant="ghost"
                        className="mt-2 w-full justify-center text-slate-600 hover:text-slate-900 hover:bg-black/5 text-sm h-10 gap-2 font-semibold"
                        onClick={() => setIsAddingCard(true)}
                    >
                        <Plus className="h-4 w-4" />
                        <span className="relative -left-1">{t('card.add_card')}</span>
                    </Button>
                )}
            </div>
        </div>
    );
}
