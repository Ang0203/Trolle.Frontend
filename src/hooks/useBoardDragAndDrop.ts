import { useState } from 'react';
import {
    useSensor,
    useSensors,
    PointerSensor,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Board, Card, Column, api } from '@/lib/api';
import confetti from 'canvas-confetti';

interface UseBoardDragAndDropProps {
    board: Board | null;
    setBoard: (board: Board | null) => void;
    boardId: string;
    fetchBoard: () => void;
}

export function useBoardDragAndDrop({ board, setBoard, boardId, fetchBoard }: UseBoardDragAndDropProps) {
    const [activeCard, setActiveCard] = useState<Card | null>(null);
    const [activeColumn, setActiveColumn] = useState<Column | null>(null);
    const [activeOverColumnId, setActiveOverColumnId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    );

    const onDragStart = (event: DragStartEvent) => {
        if (event.active.data.current?.type === "Card") {
            setActiveCard(event.active.data.current.card);
            return;
        }
        if (event.active.data.current?.type === "Column") {
            setActiveColumn(event.active.data.current.column);
            return;
        }
    };

    const onDragOver = (event: DragOverEvent) => {
        const { over } = event;
        if (!over) {
            setActiveOverColumnId(null);
            return;
        }

        const overId = over.id;
        if (!board) return;

        const findColumn = (id: string | number) => {
            return board.columns.find(c => c.id === id) ||
                board.columns.find(c => c.cards.some(card => card.id === id));
        };

        const overColumn = findColumn(overId);
        if (overColumn) {
            setActiveOverColumnId(overColumn.id);
        } else {
            setActiveOverColumnId(null);
        }
    };

    const onDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveOverColumnId(null); // Clear highlight
        setActiveCard(null);
        setActiveColumn(null);

        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (!board) return;

        // Handle Column Reordering
        if (active.data.current?.type === "Column") {
            if (activeId === overId) return;

            const oldIndex = board.columns.findIndex(c => c.id === activeId);
            const newIndex = board.columns.findIndex(c => c.id === overId);

            const newColumns = arrayMove(board.columns, oldIndex, newIndex);
            // Update orders optimistically
            const updatedColumns = newColumns.map((col, idx) => ({ ...col, order: idx }));
            setBoard({ ...board, columns: updatedColumns });

            try {
                await api.moveColumn(boardId, activeId as string, newIndex);
            } catch (err) {
                console.error("Column move failed", err);
                fetchBoard();
            }
            return;
        }

        // Handle Card Movement (Existing logic)
        const findColumn = (id: string | number | null) => {
            if (!id) return null;
            return board.columns.find(c => c.id === id) ||
                board.columns.find(c => c.cards.some(card => card.id === id));
        };

        const activeColumnObj = findColumn(activeId);
        const overColumnObj = findColumn(overId || activeOverColumnId);

        if (!activeColumnObj || !overColumnObj) return;

        const targetColumnId = overColumnObj.id;

        if (activeColumnObj === overColumnObj && activeId === overId) return;

        const activeCardObj = activeColumnObj.cards.find(c => c.id === activeId);
        if (!activeCardObj) return;

        if (overColumnObj.title.toLowerCase().includes("done")) {
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }

        // Optimistic update for cards
        const newColumns = board.columns.map(col => {
            if (col.id === activeColumnObj.id) {
                return { ...col, cards: col.cards.filter(c => c.id !== activeId) };
            }
            return col;
        });

        let newCardIndex = 0;
        const targetCol = newColumns.find(col => col.id === targetColumnId);
        if (targetCol) {
            if (over.data.current?.type === "Card") {
                newCardIndex = targetCol.cards.findIndex(c => c.id === overId);
                if (newCardIndex === -1) newCardIndex = targetCol.cards.length;
            } else {
                newCardIndex = targetCol.cards.length;
            }

            const updatedCards = [...targetCol.cards];
            updatedCards.splice(newCardIndex, 0, { ...activeCardObj, columnId: targetColumnId });

            const finalColumns = newColumns.map(col => {
                if (col.id === targetColumnId) {
                    return { ...col, cards: updatedCards };
                }
                return col;
            });

            setBoard({ ...board, columns: finalColumns });
        }

        try {
            await api.moveCard(boardId, activeId as string, targetColumnId, newCardIndex);
        } catch (err) {
            console.error("Card move failed", err);
            fetchBoard();
        }
    };

    return {
        sensors,
        activeCard,
        setActiveCard,
        activeColumn,
        setActiveColumn,
        activeOverColumnId,
        onDragStart,
        onDragOver,
        onDragEnd
    };
}
