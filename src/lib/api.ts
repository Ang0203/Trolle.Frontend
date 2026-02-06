import { toast } from "sonner";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2207/api';

const handleRes = async (res: Response) => {
    if (res.status === 429) {
        toast.error("Too many requests. Please slow down!", {
            description: "The server is currently rate limiting your actions.",
            duration: 4000
        });
        throw new Error('Rate limited');
    }
    if (!res.ok) {
        const error = await res.text().catch(() => 'Unknown error');
        // Only redirect to maintenance for 503 Service Unavailable
        // This indicates the server is truly down or in maintenance mode
        if (typeof window !== 'undefined' && res.status === 503) {
            window.location.href = '/maintenance';
        }
        throw new Error(error || res.statusText);
    }
    return res;
};

const safeFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    try {
        const response = await fetch(input, init);
        return await handleRes(response);
    } catch (error: unknown) {
        // Only log the error, don't redirect to maintenance
        // Let the calling code handle the error appropriately
        const err = error as Error;
        if (err.message !== 'Rate limited') {
            console.error("API request failed:", err);
        }
        throw error;
    }
};

export interface Label {
    id: string;
    name: string;
    color: string;
    textColor: string;
    boardId: string;
}

export interface Board {
    id: string;
    title: string;
    backgroundImage?: string;
    titleColor?: string;
    backgroundColor?: string;
    isFavorite: boolean;
    columns: Column[];
    labels: Label[];
    createdAt: string;
}

export interface Column {
    id: string;
    title: string;
    titleColor?: string;
    headerColor?: string;
    order: number;
    cards: Card[];
}

export interface Card {
    id: string;
    title: string;
    description: string;
    order: number;
    columnId: string;
    isArchived: boolean;
    labels: Label[];
}

export const api = {
    getBoards: async (): Promise<Board[]> => {
        const res = await safeFetch(`${API_URL}/board`);
        return res.json();
    },

    getBoard: async (id: string): Promise<Board> => {
        const res = await safeFetch(`${API_URL}/board/${id}`);
        return res.json();
    },

    createBoard: async (title: string, backgroundImage?: string): Promise<{ id: string }> => {
        const res = await safeFetch(`${API_URL}/board`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, backgroundImage }),
        });
        return res.json();
    },

    toggleFavorite: async (boardId: string): Promise<void> => {
        await safeFetch(`${API_URL}/board/${boardId}/favorite`, {
            method: 'POST',
        });
    },

    updateTitle: async (boardId: string, title: string): Promise<void> => {
        await safeFetch(`${API_URL}/board/${boardId}/title`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title }),
        });
    },

    updateBoardTitleColor: async (boardId: string, color: string): Promise<void> => {
        await safeFetch(`${API_URL}/board/${boardId}/color`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ color }),
        });
    },

    updateBoardBackgroundColor: async (boardId: string, color: string): Promise<void> => {
        await safeFetch(`${API_URL}/board/${boardId}/background-color`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ color }),
        });
    },

    deleteBoard: async (id: string): Promise<void> => {
        await safeFetch(`${API_URL}/board/${id}`, {
            method: 'DELETE',
        });
    },

    createColumn: async (boardId: string, title: string, headerColor?: string) => {
        await safeFetch(`${API_URL}/board/${boardId}/columns`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ Title: title, HeaderColor: headerColor }),
        });
    },

    updateColumn: async (boardId: string, columnId: string, title: string, titleColor: string, headerColor: string) => {
        await safeFetch(`${API_URL}/column/${columnId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ boardId, title, titleColor, headerColor }),
        });
    },

    createCard: async (boardId: string, columnId: string, title: string, description: string = '', labelIds: string[] = []) => {
        await safeFetch(`${API_URL}/card`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ boardId, columnId, title, description, labelIds }),
        });
    },

    updateCard: async (boardId: string, cardId: string, title: string, description: string = '', labelIds: string[] = []) => {
        await safeFetch(`${API_URL}/card/${cardId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ boardId, title, description, labelIds }),
        });
    },

    deleteCard: async (boardId: string, cardId: string) => {
        await safeFetch(`${API_URL}/card/${cardId}?boardId=${boardId}`, {
            method: 'DELETE',
        });
    },

    archiveCard: async (boardId: string, cardId: string) => {
        await safeFetch(`${API_URL}/card/${cardId}/archive?boardId=${boardId}`, {
            method: 'POST',
        });
    },

    unarchiveCard: async (boardId: string, cardId: string) => {
        await safeFetch(`${API_URL}/card/${cardId}/unarchive?boardId=${boardId}`, {
            method: 'POST',
        });
    },

    moveCard: async (boardId: string, cardId: string, targetColumnId: string, newOrder: number) => {
        await safeFetch(`${API_URL}/card/move`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ boardId, cardId, targetColumnId, newOrder }),
        });
    },

    moveColumn: async (boardId: string, columnId: string, newOrder: number) => {
        await safeFetch(`${API_URL}/column/move`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ boardId, columnId, newOrder }),
        });
    },

    bulkMoveColumns: async (boardId: string, columnOrders: Record<string, number>) => {
        await safeFetch(`${API_URL}/column/bulk-move`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ boardId, columnOrders }),
        });
    },

    bulkMoveCards: async (boardId: string, cardOrders: Record<string, number>) => {
        await safeFetch(`${API_URL}/card/bulk-move`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ boardId, cardOrders }),
        });
    },

    deleteColumn: async (boardId: string, columnId: string) => {
        await safeFetch(`${API_URL}/column/${columnId}?boardId=${boardId}`, {
            method: 'DELETE',
        });
    },

    createLabel: async (boardId: string, name: string, color: string, textColor: string) => {
        const res = await safeFetch(`${API_URL}/label`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ boardId, name, color, textColor }),
        });
        return res.json();
    },

    updateLabel: async (boardId: string, labelId: string, name: string, color: string, textColor: string) => {
        await safeFetch(`${API_URL}/label/${labelId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ boardId, name, color, textColor }),
        });
    },

    deleteLabel: async (boardId: string, labelId: string) => {
        await safeFetch(`${API_URL}/label/${labelId}?boardId=${boardId}`, {
            method: 'DELETE',
        });
    }
};
