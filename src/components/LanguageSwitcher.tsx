"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Globe } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface LanguageSwitcherProps {
    className?: string;
    buttonClassName?: string;
}

export function LanguageSwitcher({ className, buttonClassName }: LanguageSwitcherProps) {
    const { language, setLanguage } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const toggleOpen = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    const handleLanguageChange = (currentLang: 'en' | 'vi') => {
        setLanguage(currentLang);
        setIsOpen(false);
    }

    return (
        <div className={`relative ${className || ''}`} ref={dropdownRef}>
            <button
                onClick={toggleOpen}
                className={buttonClassName || "p-2 rounded-full hover:bg-slate-200 text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"}
                aria-label="Change Language"
            >
                <Globe size={20} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg py-1 z-50 border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
                    <button
                        onClick={() => handleLanguageChange('vi')}
                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-slate-100 ${language === 'vi' ? 'font-bold text-blue-600' : 'text-slate-700'}`}
                    >
                        Tiếng Việt
                    </button>
                    <button
                        onClick={() => handleLanguageChange('en')}
                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-slate-100 ${language === 'en' ? 'font-bold text-blue-600' : 'text-slate-700'}`}
                    >
                        English
                    </button>
                </div>
            )}
        </div>
    );
}
