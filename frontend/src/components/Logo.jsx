import React from 'react';
import { Wind } from 'lucide-react';

const Logo = () => {
    return (
        <div className="flex items-center gap-2">
            <span className="font-bold text-xl tracking-tight text-slate-900">Aerolytics</span>
            <div className="relative w-8 h-8 flex items-center justify-center">
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-wind"
                >
                    <defs>
                        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#34d399" /> {/* Emerald-400 */}
                            <stop offset="100%" stopColor="#10b981" /> {/* Emerald-500 */}
                        </linearGradient>
                        <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#22d3ee" /> {/* Cyan-400 */}
                            <stop offset="100%" stopColor="#0ea5e9" /> {/* Sky-500 */}
                        </linearGradient>
                        <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#60a5fa" /> {/* Blue-400 */}
                            <stop offset="100%" stopColor="#3b82f6" /> {/* Blue-500 */}
                        </linearGradient>
                    </defs>

                    {/* Top Path */}
                    <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" style={{ stroke: "url(#grad1)" }} />

                    {/* Middle Path */}
                    <path d="M9.6 4.6A2 2 0 1 1 11 8H2" style={{ stroke: "url(#grad2)" }} />

                    {/* Bottom Path */}
                    <path d="M12.6 19.4A2 2 0 1 0 14 16H2" style={{ stroke: "url(#grad3)" }} />
                </svg>
            </div>
        </div>
    );
};

export default Logo;
