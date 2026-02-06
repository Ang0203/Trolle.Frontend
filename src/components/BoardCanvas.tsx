"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
    DndContext,
    DragOverlay,
    pointerWithin
} from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { createPortal } from "react-dom";
import { Board, api, API_URL } from "@/lib/api";
import { getRandomDarkColor, signalRLogger } from "@/lib/utils";
import { ColumnList } from "./ColumnList";
import { TaskCard } from "./TaskCard";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog } from "./ui/dialog";
import { HubConnectionBuilder } from "@microsoft/signalr";
import confetti from "canvas-confetti";
import { Star, Plus, Check, Tag, ArrowDownUp, Filter, Type, X } from "lucide-react";
import { LabelsPanel } from "./LabelsPanel";
import { OrderDialog } from "./OrderDialog";
import { FilterDialog, BoardFilter } from "./FilterDialog";
import { ArchivedCardsDialog } from "./ArchivedCardsDialog";
import { toast } from "sonner";
import { useBoardDragAndDrop } from "@/hooks/useBoardDragAndDrop";
import { Archive as ArchiveIcon } from "lucide-react"; // Renamed to avoid conflict if any, though explicit import is safer
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

interface BoardCanvasProps {
    boardId: string;
}

export function BoardCanvas({ boardId }: BoardCanvasProps) {
    const { t } = useLanguage();
    const router = useRouter();
    const [board, setBoard] = useState<Board | null>(null);
    const [newColTitle, setNewColTitle] = useState("");
    const [mounted, setMounted] = useState(false);
    const titleColorInputRef = useRef<HTMLInputElement>(null);
    const isCancelingRef = useRef(false);

    // Card Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [activeColumnId, setActiveColumnId] = useState<string | null>(null);
    const [cardTitle, setCardTitle] = useState("");
    const [cardDesc, setCardDesc] = useState("");
    const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
    const [showBoardLabels, setShowBoardLabels] = useState(false);
    const [pendingTitleColor, setPendingTitleColor] = useState<string | null>(null);

    // Ordering Mode State
    const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);

    // Filtering Mode State
    const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
    const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
    const [filter, setFilter] = useState<BoardFilter>({
        title: "",
        description: "",
        labelIds: []
    });

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    // Fetch Board
    const fetchBoard = useCallback(async () => {
        try {
            const data = await api.getBoard(boardId);
            // Sort columns and cards
            data.columns.sort((a, b) => a.order - b.order);
            data.columns.forEach(c => c.cards.sort((a, b) => a.order - b.order));
            setBoard(data);
        } catch (e) {
            console.error("Failed to fetch board:", e);
        }
    }, [boardId]);

    const {
        sensors,
        activeCard,
        activeColumn,
        activeOverColumnId,
        onDragStart,
        onDragOver,
        onDragEnd
    } = useBoardDragAndDrop({ board, setBoard, boardId, fetchBoard });

    useEffect(() => {
        if (!boardId) return;

        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchBoard();

        // SignalR
        const signalRUrl = API_URL.replace("/api", "/hubs/board");

        const connection = new HubConnectionBuilder()
            .withUrl(signalRUrl)
            .configureLogging(signalRLogger)
            .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
            .build();

        let isMounted = true;

        const startConnection = async () => {
            try {
                await connection.start();
                if (isMounted) {
                    console.log("Connected to SignalR");
                    await connection.invoke("JoinBoard", boardId);
                }
            } catch (err) {
                const error = err as Error;
                if (isMounted && !error.message?.includes("stopped during negotiation")) {
                    console.error("SignalR start error:", error);
                    if (error.message?.includes("429") || error.message?.includes("Too Many Requests")) {
                        toast.error("Too many connections. Please wait a moment.", {
                            description: "SignalR is being rate-limited. Real-time updates are temporarily disabled.",
                            duration: 5000
                        });
                    }
                }
            }
        };

        connection.onclose((error) => {
            if (isMounted && error) {
                console.error("SignalR connection closed due to error:", error);
            }
        });

        startConnection();

        connection.on("BoardUpdated", () => {
            if (isMounted) fetchBoard().catch((err) => {
                console.error("Failed to reload board:", err);
            });
        });

        return () => {
            isMounted = false;
            if (connection.state !== "Disconnected") {
                connection.stop().catch(() => { /* Ignore stop errors */ });
            }
        };
    }, [boardId, fetchBoard]);

    // Update document title when board title changes
    useEffect(() => {
        if (board?.title) {
            document.title = `Trolle - ${board.title}`;
        }
    }, [board?.title]);

    const handleCreateColumn = async () => {
        const titleToUse = !newColTitle || !newColTitle.trim() ? t('board.new_column_title') : newColTitle.trim();
        const randomHeaderColor = getRandomDarkColor();

        setNewColTitle("");

        try {
            await api.createColumn(boardId, titleToUse, randomHeaderColor);
            fetchBoard();
        } catch (err) {
            console.error("Failed to create column:", err);
            setNewColTitle(" ");
        }
    };

    const openAddCardDialog = (columnId: string) => {
        setActiveColumnId(columnId);
        setCardTitle("");
        setCardDesc("");
        setSelectedLabelIds([]);
        setIsDialogOpen(true);
    };

    const handleSaveCard = async () => {
        if (!activeColumnId) return;

        let title = cardTitle.trim();
        if (!title) {
            title = t('board.new_card_title');
        }

        await api.createCard(boardId, activeColumnId, title, cardDesc, selectedLabelIds);

        setIsDialogOpen(false);
        fetchBoard();
    };

    const handleToggleFavorite = async (e: React.MouseEvent) => {
        if (!board) return;
        const newFavoriteStatus = !board.isFavorite;

        if (newFavoriteStatus) {
            confetti({
                particleCount: 20,
                spread: 35,
                origin: {
                    x: e.clientX / window.innerWidth,
                    y: e.clientY / window.innerHeight
                },
                colors: ['#fbbf24', '#f59e0b', '#fcd34d'],
                shapes: ['star'],
                gravity: 1.5,
                scalar: 0.6,
                ticks: 60,
                startVelocity: 20
            });
        }

        setBoard({ ...board, isFavorite: newFavoriteStatus });
        await api.toggleFavorite(board.id);
    };

    const handleUpdateTitleColor = async (color: string) => {
        if (!board) return;
        setBoard({ ...board, titleColor: color });
        await api.updateBoardTitleColor(board.id, color);
    };

    const handleUpdateColumn = async (columnId: string, title: string, titleColor: string, headerColor: string) => {
        if (!board) return;
        await api.updateColumn(board.id, columnId, title, titleColor, headerColor);
    };

    const handleDeleteColumn = async (columnId: string) => {
        if (!board) return;
        await api.deleteColumn(board.id, columnId);
    };

    const handleUpdateTitle = async (newTitle: string) => {
        if (!board) return;
        const titleToSave = !newTitle || !newTitle.trim() ? t('hub.new_board_title') : newTitle.trim();
        try {
            await api.updateTitle(board.id, titleToSave);
            document.title = `Trolle - ${titleToSave}`;
            if (titleToSave !== newTitle) {
                setBoard({ ...board, title: titleToSave });
            }
        } catch (e) {
            console.error(e);
            fetchBoard();
        }
    };

    const handleSaveOrders = async (orders: Record<string, number>, target: "Column" | "Card") => {
        try {
            if (target === "Column") {
                await api.bulkMoveColumns(boardId, orders);
            } else {
                await api.bulkMoveCards(boardId, orders);
            }
            fetchBoard();
        } catch (e) {
            console.error(e);
        }
    };

    const filteredBoard = useMemo(() => {
        if (!board) return null;

        return {
            ...board,
            columns: board.columns.map(col => ({
                ...col,
                cards: col.cards.filter(card => {
                    if (card.isArchived) return false;

                    const titleMatch = !filter.title || card.title.toLowerCase().includes(filter.title.toLowerCase());
                    const descMatch = !filter.description || card.description.toLowerCase().includes(filter.description.toLowerCase());
                    const labelsMatch = filter.labelIds.length === 0 || filter.labelIds.some(id => card.labels.some(l => l.id === id));

                    return titleMatch && descMatch && labelsMatch;
                })
            }))
        };
    }, [board, filter]);

    const activeFilterCount = useMemo(() => {
        let count = filter.labelIds.length;
        if (filter.title.trim()) count += 1;
        if (filter.description.trim()) count += 1;
        return count;
    }, [filter]);


    const isImageUrl = board?.backgroundImage?.startsWith("http");

    const bgStyle = useMemo(() => {
        if (isImageUrl && board) {
            return { backgroundImage: `url(${board.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' };
        }
        return { backgroundColor: board?.backgroundColor || "#1e293b" };
    }, [isImageUrl, board]);

    const gradientClass = !isImageUrl ? (board?.backgroundImage || "") : "";

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={pointerWithin}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
        >
            <div
                className={`flex h-[100dvh] w-full flex-col overflow-auto relative ${gradientClass}`}
                style={bgStyle}
            >
                <div className={`absolute inset-0 pointer-events-none ${isImageUrl ? 'bg-black/20' : 'bg-[radial-gradient(circle_at_50%_0%,rgba(0,0,0,0.05),transparent),radial-gradient(circle_at_0%_100%,rgba(0,0,0,0.02),transparent)]'}`}></div>

                {/* Header */}
                <div className="flex items-center px-4 h-14 bg-slate-800 z-20 shrink-0 text-white relative shadow-lg">
                    <div
                        className="flex items-center gap-2 cursor-pointer group"
                        onClick={() => router.push('/')}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/favicon.svg" alt="Trolle Icon" className="h-7 w-7" />
                        <h1 className="text-2xl font-bold font-mono tracking-tighter opacity-90 group-hover:opacity-100 text-white">
                            Trolle
                        </h1>
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white/10 h-8 px-3 flex gap-1 font-bold bg-white/5 ml-4"
                        onClick={() => router.push('/')}
                    >
                        <span className="hidden sm:inline text-white">{t('hub.workspaces')}</span>
                    </Button>
                    <div className="ml-auto">
                        <LanguageSwitcher
                            buttonClassName="text-white hover:bg-white/10 h-8 w-8 flex items-center justify-center rounded-md bg-white/5 transition-all"
                        />
                    </div>
                </div>

                {/* Sub Header (Board Info) */}
                <div className="flex items-center gap-4 px-4 h-auto min-h-[56px] shrink-0 text-slate-800 flex-wrap py-2 z-10 bg-white/10 backdrop-blur-sm border-b border-black/5 shadow-sm">
                    <Input
                        value={board?.title || ""}
                        onChange={(e) => board && setBoard({ ...board, title: e.target.value })}
                        onBlur={(e) => handleUpdateTitle(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.currentTarget.blur();
                            }
                            if (e.key === "Escape") {
                                fetchBoard();
                                e.currentTarget.blur();
                            }
                        }}
                        style={{ color: pendingTitleColor || board?.titleColor || "#1e293b" }}
                        className="text-xl font-bold bg-black/5 border-black/10 hover:bg-black/10 focus:bg-white/40 min-w-[300px] w-[300px] h-11 px-3 rounded-xl transition-all shadow-inner placeholder:text-slate-500"
                    />

                    {/* Advanced Title Color Picker */}
                    <div className="flex items-center gap-1">
                        <div
                            onClick={() => titleColorInputRef.current?.click()}
                            className="flex gap-2 items-center bg-black/5 backdrop-blur-md p-2 rounded-xl border border-black/10 shadow-sm hover:bg-black/10 transition-colors cursor-pointer"
                        >
                            <Type size={16} className="text-slate-700" />
                            <input
                                ref={titleColorInputRef}
                                type="color"
                                value={pendingTitleColor || board?.titleColor || "#1e293b"}
                                onChange={(e) => setPendingTitleColor(e.target.value)}
                                className="w-8 h-6 bg-transparent cursor-pointer rounded border-none appearance-none"
                                title="Choose title color"
                            />
                        </div>
                        {pendingTitleColor && pendingTitleColor !== board?.titleColor && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                    handleUpdateTitleColor(pendingTitleColor);
                                    setPendingTitleColor(null);
                                }}
                                className="bg-green-500 hover:bg-green-600 text-white p-1 h-8 w-8 rounded-full shadow-lg shrink-0 animate-in zoom-in"
                                title="Confirm color change"
                            >
                                <Check size={16} />
                            </Button>
                        )}
                    </div>

                    <button
                        onClick={handleToggleFavorite}
                        className={`p-2 rounded-xl transition-all border shadow-sm backdrop-blur-md bg-black/5 hover:bg-black/10 active:scale-95 cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-black/40 ${board?.isFavorite ? 'text-yellow-400 border-yellow-400/30' : 'text-slate-700 border-black/10'}`}
                        title={board?.isFavorite ? "Unfavorite board" : "Favorite board"}
                    >
                        <Star className={`h-5 w-5 ${board?.isFavorite ? 'fill-current' : ''}`} />
                    </button>

                    <div className="h-6 w-[1px] bg-black/10 mx-1"></div>

                    {/* Board Labels Management */}
                    <div className="relative">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-700 hover:bg-black/10 h-10 px-3 flex gap-2 font-bold bg-black/5 backdrop-blur-md rounded-xl border border-black/10 shadow-sm transition-all active:scale-95 focus-visible:ring-black/40"
                            onClick={() => setShowBoardLabels(true)}
                        >
                            <Tag size={16} />
                            <span className="hidden sm:inline">{t('board.labels')}</span>
                        </Button>
                        <Dialog
                            isOpen={showBoardLabels}
                            onClose={() => setShowBoardLabels(false)}
                            title={t('labels.board_labels')}
                            maxWidth="xs"
                        >
                            <LabelsPanel
                                boardId={boardId}
                                allLabels={board?.labels || []}
                                selectedLabels={[]}
                                onToggleLabel={() => { }}
                                onClose={() => setShowBoardLabels(false)}
                                onRefresh={fetchBoard}
                                isDialogMode={true}
                            />
                        </Dialog>
                    </div>

                    <div className="h-6 w-[1px] bg-black/10 mx-1"></div>

                    {/* Ordering/Sorting Mode Toggles */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`h-10 px-3 flex gap-2 font-bold backdrop-blur-md rounded-xl border transition-all active:scale-95 focus-visible:ring-black/40 ${activeFilterCount > 0 ? 'bg-blue-500/10 border-blue-500/30 text-blue-700 hover:bg-blue-500/20' : 'text-slate-700 bg-black/5 hover:bg-black/10 border-black/10 shadow-sm'}`}
                            onClick={() => setIsFilterDialogOpen(true)}
                        >
                            <Filter size={16} />
                            <span>{t('board.filters')}</span>
                            {activeFilterCount > 0 && (
                                <span className="flex items-center justify-center bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1 min-w-[20px]">
                                    +{activeFilterCount}
                                </span>
                            )}
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-700 bg-black/5 hover:bg-black/10 h-10 px-3 flex gap-2 font-bold backdrop-blur-md rounded-xl border border-black/10 shadow-sm transition-all active:scale-95 focus-visible:ring-black/40"
                            onClick={() => setIsArchiveDialogOpen(true)}
                        >
                            <ArchiveIcon size={16} />
                            <span>{t('board.archived')}</span>
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-700 bg-black/5 hover:bg-black/10 h-10 px-3 flex gap-2 font-bold backdrop-blur-md rounded-xl border border-black/10 shadow-sm transition-all active:scale-95 focus-visible:ring-black/40"
                            onClick={() => setIsOrderDialogOpen(true)}
                        >
                            <ArrowDownUp size={16} />
                            <span>{t('board.reorder')}</span>
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-x-auto overflow-y-hidden px-4 pt-6 pb-4 min-h-[500px]">
                    <div className="flex gap-4 h-full items-start">
                        <SortableContext items={filteredBoard?.columns.map(c => c.id) || []} strategy={horizontalListSortingStrategy}>
                            {filteredBoard?.columns.map(col => (
                                <ColumnList
                                    key={col.id}
                                    boardId={boardId}
                                    column={col}
                                    cards={col.cards}
                                    allLabels={board?.labels || []}
                                    onAddCard={openAddCardDialog}
                                    onUpdateColumn={handleUpdateColumn}
                                    onDeleteColumn={handleDeleteColumn}
                                    onRefresh={fetchBoard}
                                    isOver={activeOverColumnId === col.id && activeCard !== null}
                                />
                            ))}
                        </SortableContext>

                        {/* New Column Box */}
                        <div className="min-w-[300px] w-[300px] bg-white/40 backdrop-blur-xl border border-black/5 rounded-xl p-4 transition-all hover:bg-white/50 shadow-xl shrink-0 h-fit">
                            {newColTitle !== "" ? (
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <Input
                                            autoFocus
                                            placeholder={t('board.enter_column_title')}
                                            value={newColTitle === " " ? "" : newColTitle}
                                            onChange={e => setNewColTitle(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === "Enter") {
                                                    handleCreateColumn();
                                                }
                                                if (e.key === "Escape") {
                                                    isCancelingRef.current = true;
                                                    setNewColTitle("");
                                                }
                                            }}
                                            onBlur={() => {
                                                if (isCancelingRef.current) {
                                                    isCancelingRef.current = false;
                                                    return;
                                                }

                                                if (!newColTitle || !newColTitle.trim()) {
                                                    setNewColTitle("");
                                                } else {
                                                    handleCreateColumn();
                                                }
                                            }}
                                            className="bg-white/50 border-black/10 text-slate-900 placeholder:text-slate-500 focus-visible:ring-black/20 rounded-xl h-10"
                                        />
                                        <Button
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={handleCreateColumn}
                                            className="bg-slate-800 text-white hover:bg-slate-900 font-bold px-4 rounded-xl shadow-lg shrink-0 transition-transform active:scale-95"
                                        >
                                            {t('common.add')}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => setNewColTitle("")}
                                            className="p-2 h-10 w-10 text-slate-500 hover:text-slate-700 hover:bg-black/5 rounded-xl shrink-0"
                                            title="Cancel"
                                        >
                                            <X size={20} />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    onClick={() => {
                                        isCancelingRef.current = false;
                                        setNewColTitle(" ");
                                    }}
                                    className="flex items-center gap-3 cursor-pointer text-slate-800 hover:text-black group py-1"
                                >
                                    <div className="bg-black/10 rounded-lg p-1 group-hover:bg-black/20 transition-colors">
                                        <Plus className="h-5 w-5" />
                                    </div>
                                    <span className="font-semibold tracking-tight">{t('board.add_list')}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {mounted && createPortal(
                    <DragOverlay>
                        {activeCard && (
                            <TaskCard
                                card={activeCard}
                                boardId={boardId}
                                allLabels={board?.labels || []}
                                onRefresh={fetchBoard}
                            />
                        )}
                        {activeColumn && (
                            <ColumnList
                                boardId={boardId}
                                column={activeColumn}
                                cards={activeColumn.cards}
                                allLabels={board?.labels || []}
                                onAddCard={() => { }}
                                onUpdateColumn={() => { }}
                                onDeleteColumn={() => { }}
                                onRefresh={() => { }}
                            />
                        )}
                    </DragOverlay>,
                    document.body
                )}

                {/* Card Dialog */}
                <Dialog
                    isOpen={isDialogOpen}
                    onClose={() => setIsDialogOpen(false)}
                    title={t('board.add_card')}
                >
                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="text-sm font-medium text-slate-700">Title</label>
                            <Input
                                value={cardTitle}
                                onChange={e => setCardTitle(e.target.value)}
                                placeholder="Enter a title for this card..."
                                autoFocus
                                onKeyDown={e => {
                                    if (e.key === "Enter") handleSaveCard();
                                    if (e.key === "Escape") setIsDialogOpen(false);
                                }}
                                className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700">{t('common.description')}</label>
                            <textarea
                                className="w-full min-h-[80px] rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 ring-offset-background placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                                value={cardDesc}
                                onChange={e => setCardDesc(e.target.value)}
                                placeholder={t('card.add_description')}
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('board.labels')}</label>
                            <div className="flex flex-wrap gap-2 items-center">
                                {selectedLabelIds.map(id => {
                                    const label = board?.labels.find(l => l.id === id);
                                    if (!label) return null;
                                    return (
                                        <div
                                            key={id}
                                            className="px-2 py-1 rounded text-[10px] font-bold shadow-sm"
                                            style={{ backgroundColor: label.color, color: label.textColor }}
                                        >
                                            {label.name}
                                        </div>
                                    );
                                })}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowBoardLabels(!showBoardLabels)}
                                        className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-md text-slate-600 transition-all active:scale-95"
                                    >
                                        <Plus size={16} />
                                    </button>
                                    {showBoardLabels && (
                                        <div className="absolute top-10 left-0 z-[110]">
                                            <LabelsPanel
                                                boardId={boardId}
                                                allLabels={board?.labels || []}
                                                selectedLabels={selectedLabelIds}
                                                onToggleLabel={(id) => {
                                                    setSelectedLabelIds(prev =>
                                                        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
                                                    );
                                                }}
                                                onClose={() => setShowBoardLabels(false)}
                                                onRefresh={fetchBoard}
                                                isDialogMode={true}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-2">
                            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>{t('common.cancel')}</Button>
                            <Button variant="primary" onClick={handleSaveCard}>{t('card.add_card')}</Button>
                        </div>
                    </div>
                </Dialog>

                {board && (
                    <OrderDialog
                        board={board}
                        isOpen={isOrderDialogOpen}
                        onClose={() => setIsOrderDialogOpen(false)}
                        onSave={handleSaveOrders}
                    />
                )}

                {board && (
                    <FilterDialog
                        board={board}
                        initialFilter={filter}
                        isOpen={isFilterDialogOpen}
                        onClose={() => setIsFilterDialogOpen(false)}
                        onSave={(newFilter) => setFilter(newFilter)}
                    />
                )}

                {board && (
                    <ArchivedCardsDialog
                        board={board}
                        isOpen={isArchiveDialogOpen}
                        onClose={() => setIsArchiveDialogOpen(false)}
                        onRefresh={fetchBoard}
                    />
                )}
            </div>
        </DndContext >
    );
}
