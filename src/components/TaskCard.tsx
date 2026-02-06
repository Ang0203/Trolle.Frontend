import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, Label } from "@/lib/api";
import { cn } from "@/lib/utils";
import { LabelBadge } from "./ui/LabelBadge";
import { useState } from "react";
import { CardEditDialog } from "./CardEditDialog";

interface TaskCardProps {
    card: Card;
    boardId: string;
    allLabels: Label[];
    onRefresh: () => void;
}

export function TaskCard({ card, boardId, allLabels, onRefresh }: TaskCardProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: card.id,
        data: {
            type: "Card",
            card,
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition: transition || "transform 200ms cubic-bezier(0.2, 0, 0, 1)",
        zIndex: isDragging ? 50 : undefined,
    };

    const handleCardClick = () => {
        // Stop propagation to prevent drag start if needed, 
        // but dnd-kit usually handles click vs drag.
        setIsDialogOpen(true);
    };

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="opacity-30 h-12 min-h-[48px] w-full items-center flex text-left rounded-lg border-2 border-primary cursor-grab relative"
            />
        );
    }

    return (
        <>
            <div
                ref={setNodeRef}
                style={style}
                {...attributes}
                {...listeners}
                onClick={handleCardClick}
                className={cn(
                    "rounded-lg pt-3 pb-2 px-3 my-2 flex flex-col justify-start text-left cursor-pointer transition-all shadow-sm group",
                    "bg-white text-slate-900 border border-slate-200 hover:border-slate-400 shadow-[0_1px_1px_rgba(0,0,0,0.1)] active:scale-[0.98]"
                )}
            >
                <div className="flex flex-col gap-2 w-full">
                    {card.labels && card.labels.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1">
                            {card.labels.map((label) => (
                                <LabelBadge
                                    key={label.id}
                                    label={label}
                                    className="max-w-[80px] truncate rounded-[4px] py-0.5 text-[9px]"
                                    title={label.name}
                                />
                            ))}
                        </div>
                    )}
                    <div className="flex justify-between items-start w-full">
                        <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-[15px] text-slate-800 tracking-tight group-hover:text-primary transition-colors truncate">{card.title}</h4>
                        </div>
                    </div>
                </div>
            </div>

            <CardEditDialog
                card={card}
                boardId={boardId}
                allLabels={allLabels}
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onRefresh={onRefresh}
            />
        </>
    );
}
