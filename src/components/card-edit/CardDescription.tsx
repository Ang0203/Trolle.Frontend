import React from 'react';
import { AlignLeft } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface CardDescriptionProps {
    description: string;
    setDescription: (desc: string) => void;
}

export function CardDescription({ description, setDescription }: CardDescriptionProps) {
    const { t } = useLanguage();
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-800">
                <AlignLeft size={16} className="text-slate-600" />
                <label className="text-xs font-bold uppercase tracking-widest">{t('common.description')}</label>
            </div>
            <textarea
                className="w-full min-h-[150px] p-4 text-sm border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/20 transition-all bg-slate-50/80 resize-none shadow-inner text-slate-800 placeholder:text-slate-400"
                placeholder={t('card.add_description')}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
            />
        </div>
    );
}
