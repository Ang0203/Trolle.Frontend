'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronLeft, Home } from 'lucide-react';

/**
 * Custom 404 Not Found page for Trolle
 * Features a minimalist glassmorphism design with a "Go Back" button logic
 */
export default function NotFound() {
    const router = useRouter();

    const handleBack = () => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
            router.back();
        } else {
            router.push('/');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#F9FAFC] selection:bg-slate-200">
            <div className="relative flex flex-col items-center">
                {/* Main 404 Content */}
                <div className="flex items-center gap-6 mb-12">
                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-4xl font-medium text-slate-900 pr-6 border-r border-slate-300"
                    >
                        404
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-sm text-slate-600 tracking-wide uppercase font-medium"
                    >
                        This page could not be found
                    </motion.p>
                </div>

                {/* Action Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center gap-4"
                >
                    <button
                        onClick={handleBack}
                        className="group flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 text-sm font-semibold shadow-sm hover:shadow-md hover:border-slate-300 transition-all active:scale-95 cursor-pointer"
                    >
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Go Back
                    </button>

                    <Link
                        href="/"
                        className="group flex items-center gap-2 px-5 py-2.5 bg-slate-900 border border-slate-900 rounded-xl text-white text-sm font-semibold shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95"
                    >
                        <Home className="w-4 h-4 opacity-70 group-hover:scale-110 transition-transform" />
                        Home
                    </Link>
                </motion.div>
            </div>

            {/* Decorative Blur Elements */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px]" />
            </div>

            {/* SEO/Accessibility hidden text */}
            <h2 className="sr-only">Error 404 - Page not found</h2>
        </div>
    );
}
