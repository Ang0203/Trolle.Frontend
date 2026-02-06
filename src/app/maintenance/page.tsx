"use client"

import { Construction, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function MaintenancePage() {
    const router = useRouter();

    return (
        <main className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]"></div>
                <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]"></div>
            </div>

            <div className="max-w-md w-full z-10">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 text-center shadow-2xl">
                    <div className="flex justify-center mb-8">
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                            <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 p-5 rounded-2xl shadow-lg border border-white/20">
                                <Construction className="text-white h-10 w-10" />
                            </div>
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold text-white mb-4 tracking-tight">
                        We&apos;re under maintenance
                    </h1>

                    <p className="text-slate-400 text-lg leading-relaxed mb-10">
                        Please try again later. We&apos;re currently updating our systems to provide you with the best experience.
                    </p>

                    <Button
                        onClick={() => router.push('/')}
                        className="w-full h-12 bg-white text-slate-900 hover:bg-slate-200 font-bold text-lg rounded-xl transition-all flex items-center justify-center gap-2 group cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 outline-none"
                    >
                        <RefreshCcw className="h-5 w-5 group-hover:rotate-180 transition-transform duration-500" />
                        Try Again
                    </Button>
                </div>

                <div className="mt-8 text-center">
                    <div className="flex items-center justify-center gap-2 text-slate-500 font-mono text-sm tracking-widest opacity-50 uppercase">
                        <div className="h-1 w-1 bg-blue-400 rounded-full"></div>
                        <span>Trolle Systems</span>
                        <div className="h-1 w-1 bg-blue-400 rounded-full"></div>
                    </div>
                </div>
            </div>
        </main>
    );
}
