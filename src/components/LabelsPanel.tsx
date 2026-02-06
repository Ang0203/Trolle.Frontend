import React, { useState } from 'react';
import { Label, api } from '@/lib/api';
import { X, Search, Pencil, Check, ChevronLeft, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface LabelsPanelProps {
    boardId: string;
    allLabels: Label[];
    selectedLabels: string[];
    onToggleLabel: (labelId: string) => void;
    onClose: () => void;
    onRefresh: () => void;
    isDialogMode?: boolean;
}

type View = 'list' | 'create' | 'edit';

const COLORS = [
    { color: '#bbf7d0', textColor: '#166534', name: 'Green' },
    { color: '#fef08a', textColor: '#854d0e', name: 'Yellow' },
    { color: '#fed7aa', textColor: '#9a3412', name: 'Orange' },
    { color: '#fecaca', textColor: '#991b1b', name: 'Red' },
    { color: '#e9d5ff', textColor: '#6b21a8', name: 'Purple' },
    { color: '#bfdbfe', textColor: '#1e40af', name: 'Blue' },
    { color: '#99f6e4', textColor: '#115e59', name: 'Teal' },
    { color: '#fbcfe8', textColor: '#9d174d', name: 'Pink' },
    { color: '#e2e8f0', textColor: '#1e293b', name: 'Slate' },
    { color: '#000000', textColor: '#ffffff', name: 'Black' },
];

const getContrastTextColor = (hexColor: string) => {
    let hex = hexColor.replace('#', '');
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6 ? '#1e293b' : '#ffffff';
};

export function LabelsPanel({
    boardId,
    allLabels,
    selectedLabels,
    onToggleLabel,
    onClose,
    onRefresh,
    isDialogMode = false,
}: LabelsPanelProps) {
    const { t } = useLanguage();
    const [view, setView] = useState<View>('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [editingLabel, setEditingLabel] = useState<Label | null>(null);

    // Form state for creating/editing
    const [labelName, setLabelName] = useState('');
    const [selectedColor, setSelectedColor] = useState(COLORS[0].color);
    const [selectedTextColor, setSelectedTextColor] = useState(COLORS[0].textColor);

    const filteredLabels = allLabels.filter(l =>
        l.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCreateClick = () => {
        setLabelName('');
        setSelectedColor(COLORS[0].color);
        setSelectedTextColor(COLORS[0].textColor);
        setView('create');
    };

    const handleEditClick = (label: Label) => {
        setEditingLabel(label);
        setLabelName(label.name);
        setSelectedColor(label.color);
        setSelectedTextColor(label.textColor);
        setView('edit');
    };

    const handleColorChange = (color: string) => {
        setSelectedColor(color);
        setSelectedTextColor(getContrastTextColor(color));
    };

    const handleSaveLabel = async () => {
        const finalName = labelName.trim() || t('labels.new_label');
        try {
            if (view === 'create') {
                await api.createLabel(boardId, finalName, selectedColor, selectedTextColor);
            } else if (view === 'edit' && editingLabel) {
                await api.updateLabel(boardId, editingLabel.id, finalName, selectedColor, selectedTextColor);
            }
            onRefresh();
            setView('list');
        } catch (error) {
            console.error('Failed to save label', error);
        }
    };

    const handleDeleteLabel = async () => {
        if (!editingLabel) return;
        if (!window.confirm(t('labels.delete_confirm'))) return;
        try {
            await api.deleteLabel(boardId, editingLabel.id);
            onRefresh();
            setView('list');
        } catch (error) {
            console.error('Failed to delete label', error);
        }
    };

    const handleQuickDelete = async (labelId: string) => {
        if (!window.confirm(t('labels.delete_confirm'))) return;
        try {
            await api.deleteLabel(boardId, labelId);
            onRefresh();
        } catch (error) {
            console.error('Failed to delete label', error);
        }
    };

    const renderContent = () => {
        if (view === 'list') {
            return (
                <div className="w-full text-left">
                    <div className="relative mb-4">
                        <input
                            type="text"
                            placeholder={t('labels.search_labels')}
                            className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                        <Search className="absolute left-2.5 top-2.5 text-slate-400" size={14} />
                    </div>

                    <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('board.labels')}</p>
                        {filteredLabels.length === 0 && (
                            <p className="text-xs text-slate-500 italic py-2">{t('labels.no_labels_found')}</p>
                        )}
                        {filteredLabels.map(label => (
                            <div key={label.id} className="flex items-center gap-2 group">
                                {!isDialogMode && (
                                    <div
                                        className={`flex items-center justify-center w-5 h-5 border rounded-sm cursor-pointer transition-colors ${selectedLabels.includes(label.id) ? 'bg-blue-600 border-blue-600 shadow-sm' : 'border-slate-300 hover:border-slate-400'}`}
                                        onClick={() => onToggleLabel(label.id)}
                                    >
                                        {selectedLabels.includes(label.id) && (
                                            <Check size={12} className="text-white" />
                                        )}
                                    </div>
                                )}
                                <div
                                    className="flex-1 px-3 py-2 rounded-md text-xs font-bold flex items-center gap-2 cursor-pointer transition-all hover:brightness-95 active:scale-[0.98] shadow-sm border border-black/5 overflow-hidden"
                                    style={{ backgroundColor: label.color, color: label.textColor }}
                                    onClick={() => onToggleLabel(label.id)}
                                    title={label.name}
                                >
                                    <div className="w-2 h-2 rounded-full shrink-0 ring-1 ring-black/5 shadow-inner" style={{ backgroundColor: label.textColor }} />
                                    <span className="truncate">{label.name}</span>
                                </div>
                                <div className="flex items-center gap-0.5 shrink-0">
                                    <button
                                        className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all active:scale-95 cursor-pointer"
                                        onClick={() => handleEditClick(label)}
                                        title={t('labels.edit_label_title')}
                                    >
                                        <Pencil size={13} />
                                    </button>
                                    <button
                                        className="p-1 rounded-md hover:bg-red-50 text-red-400 hover:text-red-600 transition-all active:scale-95 cursor-pointer"
                                        onClick={() => handleQuickDelete(label.id)}
                                        title={t('labels.delete_label_title')}
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="primary"
                            className="flex-1 text-xs font-extrabold py-5 h-auto border-none transition-all shadow-md active:scale-[0.98]"
                            onClick={handleCreateClick}
                        >
                            {t('labels.create_new_label')}
                        </Button>
                        {!isDialogMode && (
                            <Button
                                variant="secondary"
                                className="px-6 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border-none h-auto py-5"
                                onClick={onClose}
                            >
                                {t('common.done')}
                            </Button>
                        )}
                    </div>
                </div >
            );
        }

        return (
            <div className="w-full text-left">
                <div className="flex items-center gap-3 mb-4 pb-2 border-b border-slate-100">
                    <button onClick={() => setView('list')} className="text-slate-400 hover:text-slate-600 transition-all active:scale-90 cursor-pointer">
                        <ChevronLeft size={20} />
                    </button>
                    <h3 className="text-sm font-semibold text-slate-700">{view === 'create' ? t('labels.create_label') : t('labels.edit_label')}</h3>
                </div>

                <div className="space-y-4">
                    <div className="p-2 rounded-lg flex items-center justify-center shadow-inner border border-slate-100 transition-colors" style={{ backgroundColor: selectedColor }}>
                        <span className="text-sm font-bold shadow-sm" style={{ color: selectedTextColor }}>
                            {labelName.trim() || t('labels.new_label')}
                        </span>
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">{t('common.title')}</label>
                        <div className="bg-white border border-slate-200 rounded-lg p-1.5 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                            <Input
                                value={labelName}
                                onChange={(e) => setLabelName(e.target.value)}
                                placeholder={t('labels.label_placeholder')}
                                className="bg-transparent border-none text-sm font-semibold text-slate-800 placeholder:text-slate-300 focus-visible:ring-0 h-9"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2 px-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{t('labels.color_picker')}</label>
                            <div className="relative overflow-hidden w-6 h-6 rounded-md shadow-sm border border-slate-200 cursor-pointer hover:scale-110 transition-transform">
                                <input
                                    type="color"
                                    value={selectedColor}
                                    onChange={(e) => handleColorChange(e.target.value)}
                                    className="absolute -inset-2 w-[200%] h-[200%] cursor-pointer"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                            {COLORS.map((color, index) => (
                                <button
                                    key={index}
                                    className={`h-8 rounded-sm transition-all hover:brightness-110 active:scale-90 flex items-center justify-center shadow-sm ${selectedColor === color.color ? 'ring-2 ring-primary ring-offset-2' : 'hover:scale-105'}`}
                                    style={{ backgroundColor: color.color }}
                                    onClick={() => handleColorChange(color.color)}
                                >
                                    {selectedColor === color.color && <Check size={14} style={{ color: color.textColor }} />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-slate-100 gap-2">
                        {view === 'edit' ? (
                            <button
                                className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors px-1 cursor-pointer"
                                onClick={handleDeleteLabel}
                            >
                                {t('labels.delete_label')}
                            </button>
                        ) : <div />}

                        <div className="flex gap-2">
                            <Button
                                variant="secondary"
                                className="text-xs font-bold px-4 py-2 h-9 bg-slate-100 hover:bg-slate-200 text-slate-700 border-none"
                                onClick={() => setView('list')}
                            >
                                {t('common.cancel')}
                            </Button>
                            <Button
                                variant="primary"
                                className="text-xs font-extrabold px-6 py-2 h-9 shadow-md shadow-blue-500/10 border-none transition-all active:scale-[0.98]"
                                onClick={handleSaveLabel}
                            >
                                {view === 'create' ? t('common.create') : t('common.save')}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (isDialogMode) {
        return (
            <div className="pt-2">
                {renderContent()}
            </div>
        );
    }

    return (
        <div className="w-[260px] p-4 bg-white rounded-xl shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200 z-[100]">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-700 mx-auto">{t('board.labels')}</h3>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                    <X size={16} />
                </button>
            </div>
            {renderContent()}
        </div>
    );
}
