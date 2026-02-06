import React from 'react';
import { Tag } from 'lucide-react';
import { Input } from '../ui/input';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface CardTitleSectionProps {
    title: string;
    setTitle: (title: string) => void;
}

export function CardTitleSection({ title, setTitle }: CardTitleSectionProps) {
    const { t } = useLanguage();
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-800">
                <Tag size={16} className="text-blue-600" />
                <label className="text-xs font-bold uppercase tracking-widest">{t('common.title')}</label>
            </div>
            <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="font-bold text-lg border-none p-4 focus-visible:ring-2 focus-visible:ring-primary/10 h-auto bg-slate-50/80 rounded-xl shadow-inner text-slate-800 placeholder:text-slate-300 transition-all"
                placeholder={t('card.enter_card_title')}
            />
        </div>
    );
}
