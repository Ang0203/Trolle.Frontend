import React, { useState, useRef, useEffect } from "react";
import { Column } from "@/lib/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Dialog } from "../ui/dialog";
import { MoreHorizontal, Type, Palette, Trash2 } from "lucide-react";

interface ColumnHeaderProps {
    column: Column;
    onUpdateColumn: (columnId: string, title: string, titleColor: string, headerColor: string) => void;
    onDeleteColumn: (columnId: string) => void;
}

export function ColumnHeader({
    column,
    onUpdateColumn,
    onDeleteColumn,
}: ColumnHeaderProps) {
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editedTitle, setEditedTitle] = useState(column.title);
    const [showOptions, setShowOptions] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showTextColorPicker, setShowTextColorPicker] = useState(false);
    const [showBgColorPicker, setShowBgColorPicker] = useState(false);

    const [pendingTitleColor, setPendingTitleColor] = useState(column.titleColor || "#000000");
    const [pendingHeaderColor, setPendingHeaderColor] = useState(column.headerColor || "transparent");

    const menuRef = useRef<HTMLDivElement>(null);

    // Removed unnecessary useEffects that caused lint errors

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowOptions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleTitleSubmit = () => {
        if (editedTitle.trim() && editedTitle !== column.title) {
            onUpdateColumn(column.id, editedTitle, column.titleColor || "#000000", column.headerColor || "transparent");
        }
        setIsEditingTitle(false);
    };

    return (
        <>
            <div
                className="flex items-center justify-between mb-4 group/header pl-4 pr-2 py-2 rounded-t-xl inherit-bg transition-colors relative z-20"
                style={{
                    backgroundColor: column.headerColor || "transparent",
                    margin: "-1px -1px 0 -1px",
                    width: "calc(100% + 2px)",
                }}
            >
                {isEditingTitle ? (
                    <Input
                        autoFocus
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        onBlur={handleTitleSubmit}
                        onKeyDown={(e) => e.key === "Enter" && handleTitleSubmit()}
                        className="h-8 font-bold bg-white/80 text-slate-800 focus-visible:ring-blue-500 w-full mr-2 rounded-lg"
                    />
                ) : (
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <h3
                            onClick={() => setIsEditingTitle(true)}
                            className="font-bold text-lg hover:bg-black/5 rounded cursor-pointer truncate transition-colors px-1"
                            style={{ color: column.titleColor || "#1e293b" }}
                        >
                            {column.title}
                        </h3>
                    </div>
                )}

                <div className="relative" ref={menuRef}>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-slate-900 bg-white/60 hover:bg-white/90 border border-black/20 shadow-md backdrop-blur-md transition-all ring-1 ring-black/5"
                        onClick={() => setShowOptions(!showOptions)}
                    >
                        <MoreHorizontal size={18} strokeWidth={3} />
                    </Button>

                    {showOptions && (
                        <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-2xl border border-black/5 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                            <button
                                onClick={() => {
                                    setShowOptions(false);
                                    setPendingTitleColor(column.titleColor || "#000000"); // Initialize state here
                                    setShowTextColorPicker(true);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                            >
                                <Type size={14} className="text-slate-500" />
                                Change Title Color
                            </button>
                            <button
                                onClick={() => {
                                    setShowOptions(false);
                                    setPendingHeaderColor(column.headerColor || "#ffffff"); // Initialize state here
                                    setShowBgColorPicker(true);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                            >
                                <Palette size={14} className="text-slate-500" />
                                Change Header Background
                            </button>
                            <div className="h-px bg-slate-100 my-1"></div>
                            <button
                                onClick={() => {
                                    setShowOptions(false);
                                    setShowDeleteConfirm(true);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                            >
                                <Trash2 size={14} />
                                Delete Column
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Dialogs */}
            <Dialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                title="Delete Column"
            >
                <div className="space-y-4">
                    <p className="text-slate-600 text-sm">
                        Are you sure you want to delete <span className="font-bold text-slate-900">&quot;{column.title}&quot;</span>?
                        All cards in this column will be permanently removed.
                    </p>
                    <div className="flex justify-end gap-3 mt-6">
                        <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            className="font-bold"
                            onClick={() => {
                                onDeleteColumn(column.id);
                                setShowDeleteConfirm(false);
                            }}
                        >
                            Delete
                        </Button>
                    </div>
                </div>
            </Dialog>

            <Dialog
                isOpen={showTextColorPicker}
                onClose={() => setShowTextColorPicker(false)}
                title="Change Title Color"
            >
                <div className="space-y-4">
                    <div className="flex flex-col gap-4 items-center py-4">
                        <div
                            className="w-full h-12 rounded-xl border border-black/10 flex items-center justify-center font-bold text-lg"
                            style={{ color: pendingTitleColor }}
                        >
                            {column.title}
                        </div>
                        <input
                            type="color"
                            value={pendingTitleColor}
                            onChange={(e) => setPendingTitleColor(e.target.value)}
                            className="w-20 h-20 cursor-pointer rounded-full border-4 border-white shadow-xl"
                        />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <Button variant="secondary" onClick={() => setShowTextColorPicker(false)}>Cancel</Button>
                        <Button
                            variant="primary"
                            className="font-bold"
                            onClick={() => {
                                onUpdateColumn(column.id, column.title, pendingTitleColor, column.headerColor || "transparent");
                                setShowTextColorPicker(false);
                            }}
                        >
                            Save Changes
                        </Button>
                    </div>
                </div>
            </Dialog>

            <Dialog
                isOpen={showBgColorPicker}
                onClose={() => setShowBgColorPicker(false)}
                title="Change Header Color"
            >
                <div className="space-y-4">
                    <div className="flex flex-col gap-4 items-center py-4">
                        <div
                            className="w-full h-12 rounded-t-xl border border-black/10 flex items-center justify-center font-bold"
                            style={{ backgroundColor: pendingHeaderColor, color: column.titleColor || "#000000" }}
                        >
                            Header Preview
                        </div>
                        <input
                            type="color"
                            value={pendingHeaderColor === "transparent" ? "#ffffff" : pendingHeaderColor}
                            onChange={(e) => setPendingHeaderColor(e.target.value)}
                            className="w-20 h-20 cursor-pointer rounded-full border-4 border-white shadow-xl"
                        />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <Button variant="secondary" onClick={() => setShowBgColorPicker(false)}>Cancel</Button>
                        <Button
                            variant="primary"
                            className="font-bold"
                            onClick={() => {
                                onUpdateColumn(column.id, column.title, column.titleColor || "#000000", pendingHeaderColor);
                                setShowBgColorPicker(false);
                            }}
                        >
                            Save Changes
                        </Button>
                    </div>
                </div>
            </Dialog>
        </>
    );
}
