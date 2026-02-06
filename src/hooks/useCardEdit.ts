import { useState, useEffect } from 'react';
import { Card, api } from '@/lib/api';

interface UseCardEditProps {
    card: Card;
    boardId: string;
    isOpen: boolean;
    onClose: () => void;
    onRefresh: () => void;
}

export function useCardEdit({ card, boardId, isOpen, onClose, onRefresh }: UseCardEditProps) {
    const [title, setTitle] = useState(card.title);
    const [description, setDescription] = useState(card.description);
    const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>(card.labels.map(l => l.id));
    const [isDeleting, setIsDeleting] = useState(false);
    const [showLabelsPanel, setShowLabelsPanel] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setTitle(card.title);
            setDescription(card.description);
            setSelectedLabelIds(card.labels.map(l => l.id));
            setIsDeleting(false);
            setShowLabelsPanel(false); // Close labels panel when dialog opens
        } else {
            // Close labels panel when dialog closes to prevent flash
            setShowLabelsPanel(false);
        }
    }, [card, isOpen]);

    const handleSave = async () => {
        try {
            await api.updateCard(boardId, card.id, title, description, selectedLabelIds);
            onRefresh();
            onClose();
        } catch (error) {
            console.error('Failed to update card', error);
        }
    };

    const handleArchive = async () => {
        try {
            await api.archiveCard(boardId, card.id);
            onRefresh();
            onClose();
        } catch (error) {
            console.error('Failed to archive card', error);
        }
    };

    const handleToggleLabel = (labelId: string) => {
        setSelectedLabelIds(prev =>
            prev.includes(labelId)
                ? prev.filter(id => id !== labelId)
                : [...prev, labelId]
        );
    };

    return {
        title,
        setTitle,
        description,
        setDescription,
        selectedLabelIds,
        isDeleting,
        setIsDeleting,
        showLabelsPanel,
        setShowLabelsPanel,
        handleSave,
        handleArchive,
        handleToggleLabel,
    };
}
