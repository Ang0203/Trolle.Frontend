"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import en from './locales/en.json';
import vi from './locales/vi.json';

type Language = 'en' | 'vi';
type Translations = typeof en;

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Translations> = {
    en,
    vi,
};

export function LanguageProvider({ children }: { children: ReactNode }) {
    // Use lazy initialization to read from localStorage only once on mount
    const [language, setLanguageState] = useState<Language>(() => {
        if (typeof window !== 'undefined') {
            const savedLang = localStorage.getItem('trolle_lang') as Language;
            if (savedLang && (savedLang === 'en' || savedLang === 'vi')) {
                return savedLang;
            }
        }
        return 'vi'; // Default to Vietnamese
    });

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('trolle_lang', lang);
    };

    const t = (path: string): string => {
        const keys = path.split('.');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let current: any = translations[language];

        for (const key of keys) {
            if (current[key] === undefined) {
                console.warn(`Translation key not found: ${path}`);
                return path;
            }
            current = current[key];
        }

        return typeof current === 'string' ? current : path;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
