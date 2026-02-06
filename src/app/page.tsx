"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, Board, API_URL } from "@/lib/api";
import { getBoardGradient, getRandomModernGradient, signalRLogger, cn } from "@/lib/utils";
import Link from "next/link";
import { Star, Plus, Trash2, LogOut, ArrowUpAZ, ArrowDownAZ } from "lucide-react";
import { HubConnectionBuilder } from "@microsoft/signalr";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function Home() {
  const { t } = useLanguage();
  const [boards, setBoards] = useState<Board[]>([]);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const router = useRouter();

  const loadBoards = async () => {
    try {
      const data = await api.getBoards();
      setBoards(data);
    } catch (e: unknown) {
      console.error("Load boards failed", e);
      // Don't redirect to maintenance, just show empty state
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadBoards();

    // SignalR Connection
    const signalRUrl = API_URL.replace("/api", "/hubs/board");
    const connection = new HubConnectionBuilder()
      .withUrl(signalRUrl)
      .configureLogging(signalRLogger)
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000]) // Custom retry delays to prevent rate limiting
      .build();

    let isMounted = true;

    connection.start()
      .then(() => {
        if (isMounted) {
          console.log("Connected to SignalR Dashboard");
          connection.invoke("JoinDashboard")
            .catch(err => {
              if (isMounted) {
                console.error("Failed to join dashboard:", err);
              }
            });
        }
      })
      .catch(err => {
        // Ignore "The connection was stopped during negotiation" error
        if (isMounted && !err.message?.includes("stopped during negotiation")) {
          console.error("SignalR Dashboard start error:", err);
          // Check if it's a rate limit error
          if (err.message?.includes("429") || err.message?.includes("Too Many Requests")) {
            toast.error("Too many connections. Please wait a moment.", {
              description: "SignalR is being rate-limited. The page will work without real-time updates.",
              duration: 5000
            });
          }
        }
      });

    connection.onclose((error) => {
      if (isMounted && error) {
        console.error("SignalR Dashboard connection closed due to error:", error);
        // Don't redirect to maintenance, just log the error
      }
    });

    connection.on("DashboardUpdated", () => {
      if (isMounted) loadBoards().catch((err) => {

        console.error("Failed to reload boards:", err);
      });
    });

    return () => {
      isMounted = false;
      if (connection.state !== "Disconnected") {
        connection.stop();
      }
    };
  }, []);

  // Clear selection when exiting delete mode
  useEffect(() => {
    if (!isDeleteMode) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedIds(new Set());
    }
  }, [isDeleteMode]);

  const handleCreate = async () => {
    try {
      // User prefers easy-on-the-eyes modern gradients
      const bg = getRandomModernGradient();
      const { id } = await api.createBoard(t('hub.new_board_title'), bg);
      router.push(`/b/${id}`);
    } catch (e) {
      console.error("Create board failed", e);
    }
  };

  const toggleFavorite = async (e: React.MouseEvent, board: Board) => {
    e.preventDefault();
    e.stopPropagation();

    // Optimistic update BEFORE api call
    const previousBoards = [...boards];

    // Toggle favorite logic
    const isFavoriting = !board.isFavorite;
    const updatedBoards = boards.map(b => b.id === board.id ? { ...b, isFavorite: isFavoriting } : b);

    if (isFavoriting) {
      confetti({
        particleCount: 15,
        spread: 30,
        origin: {
          x: e.clientX / window.innerWidth,
          y: e.clientY / window.innerHeight
        },
        colors: ['#fbbf24', '#f59e0b'],
        shapes: ['star'],
        gravity: 1.5,
        scalar: 0.6,
        ticks: 60,
        startVelocity: 18
      });
    }

    // Sort implementation: Favorites first, then CreatedAt/Title
    // Since we don't have createdAt in the simple sort here easily without date parsing, let's just stick favorites to top.
    // For now we preserve original order but bump favorites.

    // Better: split into favorites and non-favorites and concat
    const favorites = updatedBoards.filter(b => b.isFavorite);
    const nonFavorites = updatedBoards.filter(b => !b.isFavorite);

    // Preserving relative order within groups if possible, or just concat
    setBoards([...favorites, ...nonFavorites]);

    try {
      await api.toggleFavorite(board.id);
    } catch (err) {
      console.error(err);
      // Revert on failure
      setBoards(previousBoards);
    }
  };

  const toggleSelection = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;

    // Optimistic UI update
    const idsToDelete = Array.from(selectedIds);
    setBoards(boards.filter(b => !selectedIds.has(b.id)));
    setSelectedIds(new Set());

    try {
      // Parallel deletion
      await Promise.all(idsToDelete.map(id => api.deleteBoard(id)));
    } catch (err) {
      console.error("Delete failed", err);
      loadBoards(); // Revert/Refresh on error
    }
  };

  const startEditing = (e: React.MouseEvent, board: Board) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingId(board.id);
    setEditingTitle(board.title);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const titleToSave = !editingTitle || !editingTitle.trim() ? t('hub.new_board_title') : editingTitle.trim();

    // Optimistic update
    setBoards(boards.map(b => b.id === editingId ? { ...b, title: titleToSave } : b));
    const id = editingId;
    setEditingId(null);

    try {
      await api.updateTitle(id, titleToSave);
      // loadBoards() is not strictly needed for the title if we updated optimistically, 
      // but we NEED it for re-sorting.
      loadBoards();
    } catch (err) {
      console.error("Update title failed", err);
      loadBoards();
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingTitle("");
  };

  const confirmSingleDelete = async () => {
    if (!deleteId) return;
    const id = deleteId;
    setDeleteId(null);

    // Optimistic
    setBoards(boards.filter(b => b.id !== id));

    try {
      await api.deleteBoard(id);
    } catch (err) {
      console.error("Delete failed", err);
      loadBoards();
    }
  };

  // Sort: Favorites first, then by date (not implemented in sort here, but assuming API does it or we do it)
  // The API Service apparently does manual sort.


  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8 relative">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="mx-auto max-w-7xl relative z-10">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between gap-3 text-slate-700">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/favicon.svg" alt="Trolle Icon" className="h-8 w-8" />
            <h1 className="text-xl font-bold text-slate-700">Trolle</h1>
          </div>
          <LanguageSwitcher
            buttonClassName="p-2 rounded-full hover:bg-slate-200 text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 border border-slate-300 shadow-sm"
          />
        </div>

        {/* Section Title & Delete Mode Controls */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-slate-600 font-semibold uppercase tracking-wide text-sm">
            {t('hub.your_workspaces')}
          </h2>

          <div className="flex items-center gap-4">
            {isDeleteMode && selectedIds.size > 0 && (
              <button
                onClick={handleBatchDelete}
                className="flex items-center gap-2 px-4 py-1.5 rounded-md font-bold transition-all shadow-md text-sm bg-red-600 hover:bg-red-700 text-white animate-in fade-in slide-in-from-right-2"
              >
                <Trash2 size={16} />
                <span>{t('hub.confirm_delete')} ({selectedIds.size})</span>
              </button>
            )}
            <button
              onClick={() => setIsDeleteMode(!isDeleteMode)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-bold transition-all shadow-sm text-sm ${isDeleteMode
                ? "bg-slate-500 hover:bg-slate-600 text-white"
                : "bg-red-500 hover:bg-red-600 text-white"
                }`}
            >
              {isDeleteMode ? (
                <>
                  <LogOut size={16} />
                  <span>{t('hub.exit_delete_mode')}</span>
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  <span>{t('hub.enter_delete_mode')}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sort Controls */}
        <div className="mb-6 flex items-center gap-3">
          <div className="h-[1px] flex-1 bg-slate-200"></div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{t('hub.sort_by_name')}:</span>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full shadow-sm hover:shadow-md hover:border-blue-400 transition-all text-xs font-bold text-slate-600"
            >
              {sortOrder === "asc" ? (
                <>
                  <ArrowUpAZ size={14} className="text-blue-500" />
                  <span>A-Z</span>
                </>
              ) : (
                <>
                  <ArrowDownAZ size={14} className="text-indigo-500" />
                  <span>Z-A</span>
                </>
              )}
            </button>
          </div>
          <div className="h-[1px] flex-1 bg-slate-200"></div>
        </div>

        {/* Grid: lg->6, md->4, sm->2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">

          {/* Create New Board Button */}
          <button
            onClick={handleCreate}
            className="group relative h-32 cursor-pointer rounded-md border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all flex flex-col items-center justify-center gap-1 w-full"
            aria-label={t('hub.create_new_board')}
          >
            <Plus className="text-slate-400 group-hover:text-slate-600 transition-colors" size={24} />
            <span className="text-slate-600 text-sm font-semibold">{t('hub.create_new_board')}</span>
          </button>

          {/* Board Cards */}
          {[...boards]
            .sort((a, b) => {
              // Favorites first
              if (a.isFavorite && !b.isFavorite) return -1;
              if (!a.isFavorite && b.isFavorite) return 1;

              // Then by name
              const comp = a.title.localeCompare(b.title);
              return sortOrder === "asc" ? comp : -comp;
            })
            .map((board) => {
              const bgStyle = board.backgroundImage?.startsWith("http")
                ? { backgroundImage: `url(${board.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                : {};

              const gradientClass = !board.backgroundImage?.startsWith("http")
                ? (board.backgroundImage || getBoardGradient(board.id))
                : "";

              return (
                <div
                  key={board.id}
                  className="relative group h-32 rounded-md shadow-md transition-all overflow-hidden"
                >
                  {/* The Background Navigation Link or Background for Delete Mode */}
                  {!isDeleteMode ? (
                    <Link
                      href={`/b/${board.id}`}
                      className={`absolute inset-0 z-0 ${gradientClass} hover:brightness-95 transition-all`}
                      style={bgStyle}
                    >
                      <div className="absolute inset-0 bg-black/10 transition-colors" />
                    </Link>
                  ) : (
                    <div
                      className={`absolute inset-0 z-0 ${gradientClass} cursor-pointer`}
                      style={bgStyle}
                      onClick={(e) => toggleSelection(e, board.id)}
                    >
                      <div className="absolute inset-0 bg-black/10 transition-colors" />
                      {/* Selection Overlay */}
                      <div className={`absolute inset-0 z-20 flex items-center justify-center transition-all ${selectedIds.has(board.id) ? 'bg-red-600/60 opacity-100' : 'bg-red-500/0 hover:bg-red-500/40 opacity-0 hover:opacity-100'}`}>
                        <div className={`bg-white p-2 rounded-full shadow-lg transform transition-transform ${selectedIds.has(board.id) ? 'scale-110' : 'scale-90 group-hover:scale-100'}`}>
                          <Trash2 className="text-black" size={24} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Board Title Layer - Always visible but non-interactive in delete mode */}
                  <div className={`absolute inset-0 z-10 p-3 flex flex-col justify-start pointer-events-none`}>
                    <div className="flex justify-between items-start w-full">
                      <div className="flex-1 mr-2">
                        {editingId === board.id && !isDeleteMode ? (
                          <input
                            autoFocus
                            className="w-full bg-white/30 backdrop-blur-md border border-white/40 text-white font-bold text-lg leading-tight rounded px-1 outline-none focus:ring-2 focus:ring-white/60 pointer-events-auto"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onBlur={saveEdit}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEdit();
                              if (e.key === "Escape") cancelEdit();
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <h2
                            className={cn(
                              "text-white font-bold text-lg leading-tight truncate drop-shadow-md",
                              !isDeleteMode && "cursor-text hover:underline pointer-events-auto"
                            )}
                            style={{ color: board.titleColor || "#1e293b" }}
                            onClick={(e) => {
                              if (!isDeleteMode) {
                                e.stopPropagation();
                                startEditing(e, board);
                              }
                            }}
                          >
                            {board.title}
                          </h2>
                        )}
                      </div>

                      <div className={`flex gap-1 ${isDeleteMode ? 'pointer-events-none' : 'pointer-events-auto'}`}>
                        {/* Star button - favorited ones always visible, non-favorited hidden in delete mode */}
                        <button
                          className={`p-1 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${isDeleteMode
                            ? (board.isFavorite ? 'opacity-100 text-yellow-400 cursor-default' : 'opacity-0 pointer-events-none')
                            : (board.isFavorite ? 'opacity-100 text-yellow-400' : 'opacity-0 group-hover:opacity-100 text-white/50 hover:text-yellow-400')
                            }`}
                          onClick={(e) => {
                            if (!isDeleteMode) {
                              toggleFavorite(e, board);
                            }
                          }}
                          disabled={isDeleteMode}
                          aria-label={board.isFavorite ? "Unstar board" : "Star board"}
                        >
                          <Star size={16} fill={board.isFavorite ? "currentColor" : "none"} className={board.isFavorite ? "" : "hover:fill-current"} />
                        </button>

                        {/* Individual delete button - invisible in delete mode but still takes up space */}
                        <button
                          className={`p-1 rounded text-white/50 hover:text-red-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 ${isDeleteMode ? 'invisible' : 'opacity-0 group-hover:opacity-100'}`}
                          onClick={(e) => {
                            if (!isDeleteMode) {
                              e.preventDefault();
                              e.stopPropagation();
                              setDeleteId(board.id);
                            }
                          }}
                          disabled={isDeleteMode}
                          title="Delete board"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      <Dialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title={t('hub.delete_board_title')}
      >
        <div className="space-y-4">
          <p className="text-slate-600">
            {t('hub.delete_board_confirm')}
          </p>
          <div className="flex justify-end gap-3">
            <Button
              onClick={() => setDeleteId(null)}
              className="bg-slate-500 hover:bg-slate-600 text-white font-bold"
            >
              {t('common.cancel')}
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={confirmSingleDelete}
            >
              {t('hub.delete_board_title')}
            </Button>
          </div>
        </div>
      </Dialog>
    </main>
  );
}
