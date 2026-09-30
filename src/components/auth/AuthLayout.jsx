'use client';

import Link from 'next/link';
import { Wrench } from 'lucide-react';

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f1f5f9] text-slate-800">
      <div className="w-full max-w-md bg-white border border-slate-200 shadow-xl rounded-3xl overflow-hidden relative flex flex-col justify-between">
        <div className="p-8 pb-4">
          {/* Logo and Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <Link href="/" className="flex items-center gap-2 mb-4 group">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-700/20 group-hover:bg-emerald-500 transition-colors">
                <Wrench className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-lg text-slate-900 tracking-tight">
                ToolTrunk
              </span>
            </Link>

            {title && (
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-xs text-slate-500 mt-1">
                {subtitle}
              </p>
            )}
          </div>

          {children}
        </div>

        {/* Mountain / Evergreen Forest Silhouette Illustration at bottom matching mockup */}
        <div className="relative w-full h-14 overflow-hidden mt-4 opacity-70 pointer-events-none">
          <svg
            viewBox="0 0 500 80"
            preserveAspectRatio="none"
            className="w-full h-full text-emerald-900/15 fill-current"
          >
            <path d="M0,80 L0,50 L40,30 L80,55 L120,25 L160,50 L200,35 L240,60 L280,20 L320,50 L360,30 L400,60 L440,35 L480,55 L500,45 L500,80 Z" />
            <path
              d="M0,80 L0,60 L30,45 L60,65 L100,40 L140,65 L180,48 L220,70 L260,38 L300,62 L340,44 L380,68 L420,48 L460,65 L500,55 L500,80 Z"
              className="text-emerald-800/20 fill-current"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
