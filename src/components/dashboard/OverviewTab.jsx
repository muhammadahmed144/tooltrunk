'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Star, Sparkles, Send, Map, ChevronRight } from 'lucide-react';

export default function OverviewTab({ user, tierInfo, onAddReputation, updatingReputation }) {
  const [customRepDesc, setCustomRepDesc] = useState('');
  const [customRepPoints, setCustomRepPoints] = useState(15);

  const postalCode = user.postalCode || '';
  const maxDistance = user.locationSettings?.maxDistance || 10;

  const zonePoints = useMemo(() => {
    if (!postalCode || postalCode.length < 1) return [];
    const seed = postalCode.charCodeAt(0) + postalCode.charCodeAt(postalCode.length - 1);
    const count = Math.min(30, Math.max(8, Math.floor(maxDistance * 0.8)));
    return Array.from({ length: count }, (_, i) => {
      const angle = (i * 2 * Math.PI) / count + seed * 0.1;
      const distPercent = 0.2 + (Math.sin(i + seed) + 1) * 0.35;
      const r = maxDistance * distPercent;
      const cx = 150 + Math.cos(angle) * (r * (100 / 50));
      const cy = 150 + Math.sin(angle) * (r * (100 / 50));
      const tools = ['Drill', 'Mower', 'Ladder', 'Tiller', 'Sander', 'Saw'];
      return { x: cx, y: cy, label: `Neighbor's ${tools[(i + seed) % tools.length]}` };
    });
  }, [postalCode, maxDistance]);

  const history = user.reputationHistory || [];
  const pointsGained = history.filter((h) => h.points >= 0).reduce((acc, h) => acc + h.points, 0);
  const pointsLost = history.filter((h) => h.points < 0).reduce((acc, h) => acc + h.points, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="grid grid-cols-1 lg:grid-cols-12 gap-8"
    >
      <div className="lg:col-span-7 flex flex-col gap-6">
        {/* Trust Progress */}
        <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
              <Star className="w-5 h-5 text-indigo-400 fill-indigo-400/20" /> Trust Progress Engine
            </h3>
            <span className="text-xs font-semibold text-indigo-400 font-mono bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/10">
              Tier: {tierInfo.tier}
            </span>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-end text-sm">
              <span className="text-slate-400">Next tier progress</span>
              <span className="text-white font-bold">{Math.round(tierInfo.percent)}%</span>
            </div>
            <div className="w-full h-4 bg-slate-950 border border-slate-800 rounded-full overflow-hidden p-0.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${tierInfo.percent}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-linear-to-r from-indigo-600 via-indigo-500 to-violet-500 rounded-full"
              />
            </div>
            <p className="text-xs text-indigo-400/80 font-medium text-right italic">{tierInfo.text}</p>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-900">
            <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-900/60 text-center">
              <span className="text-2xl block font-extrabold text-indigo-400">{history.length}</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Ledger Entries</span>
            </div>
            <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-900/60 text-center">
              <span className="text-2xl block font-extrabold text-emerald-400">+{pointsGained}</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Points Gained</span>
            </div>
            <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-900/60 text-center">
              <span className="text-2xl block font-extrabold text-red-400">{pointsLost}</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Points Lost</span>
            </div>
          </div>
        </div>

        {/* Trust Score Adjuster */}
        <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-6 sm:p-8">
          <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-indigo-400" /> Trust Score Quick Adjuster
          </h3>
          <p className="text-xs text-slate-400 mb-6">
            Simulate tool borrowing, late returns, or community actions to test automatic tier-up calculations.
          </p>
          <div className="flex flex-wrap gap-2.5 mb-6">
            {[
              { label: '+20: Lent Lawnmower', desc: 'Lent lawnmower to Alex Vance', pts: 20, positive: true },
              { label: '+10: Returned Tool On-Time', desc: 'Returned wheelbarrow on-time to Sarah', pts: 10, positive: true },
              { label: '-25: Late Tool Return', desc: 'Returned hedge trimmer dirty & overdue', pts: -25, positive: false },
              { label: '-10: Booking Cancelled Late', desc: 'Cancelled power drill booking late', pts: -10, positive: false },
            ].map((action) => (
              <button
                key={action.label}
                type="button"
                disabled={updatingReputation}
                onClick={() => onAddReputation(action.desc, action.pts)}
                className={`text-xs px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer font-medium active:scale-95 disabled:opacity-50 ${
                  action.positive
                    ? 'bg-emerald-950/20 border-emerald-900 text-emerald-400 hover:bg-emerald-900/20'
                    : 'bg-red-950/20 border-red-900 text-red-400 hover:bg-red-900/20'
                }`}
              >
                {action.label}
              </button>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Or write custom activity..."
              value={customRepDesc}
              onChange={(e) => setCustomRepDesc(e.target.value)}
              className="grow px-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-100 outline-none transition-all text-xs"
            />
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Pts"
                value={customRepPoints}
                onChange={(e) => setCustomRepPoints(Number(e.target.value))}
                className="w-20 px-3 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-100 text-center outline-none transition-all text-xs"
              />
              <button
                type="button"
                disabled={updatingReputation || !customRepDesc.trim()}
                onClick={() => {
                  onAddReputation(customRepDesc, customRepPoints);
                  setCustomRepDesc('');
                }}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] outline-none transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 text-xs"
              >
                <Send className="w-3.5 h-3.5" /> Log Action
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Radar Map */}
      <div className="lg:col-span-5">
        <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-6 sm:p-8 flex flex-col justify-between h-full">
          <div>
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2.5">
              <Map className="w-5 h-5 text-indigo-400" /> Active Sharing Zone
            </h3>
            <p className="text-xs text-slate-400 mb-6">General neighborhood coverage based on your search radius.</p>
          </div>
          <div className="relative flex items-center justify-center bg-slate-950/80 border border-slate-900 rounded-2xl p-6 h-64 overflow-hidden">
            <svg className="w-full h-full max-w-[240px] max-h-[240px]" viewBox="0 0 300 300">
              <circle cx="150" cy="150" r="140" fill="none" stroke="#312e81" strokeWidth="1" strokeDasharray="4 4" />
              <circle cx="150" cy="150" r="100" fill="none" stroke="#312e81" strokeWidth="1" />
              <circle cx="150" cy="150" r="60" fill="none" stroke="#312e81" strokeWidth="1" strokeDasharray="2 2" />
              <circle
                cx="150"
                cy="150"
                r={Math.min(140, 20 + maxDistance * 2.4)}
                className="fill-indigo-500/5 stroke-indigo-500/20 animate-pulse"
                strokeWidth="1.5"
              />
              <circle cx="150" cy="150" r="6" className="fill-indigo-500 animate-ping" />
              <circle cx="150" cy="150" r="4" className="fill-indigo-400 stroke-slate-950" strokeWidth="1" />
              {zonePoints.map((pt, i) => (
                <circle
                  key={i}
                  cx={pt.x}
                  cy={pt.y}
                  r="3.5"
                  className="fill-emerald-400 stroke-slate-950 cursor-help"
                  strokeWidth="1"
                />
              ))}
            </svg>
            <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center text-[10px] font-semibold text-slate-500">
              <span>Home Center</span>
              <span className="text-indigo-400">{maxDistance} mile radius</span>
            </div>
          </div>
          <div className="mt-6 p-4 bg-slate-950/40 rounded-xl border border-slate-900/60 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Estimated active sharers:</span>
              <span className="font-bold text-white text-sm mt-0.5 block">{zonePoints.length} Neighbors</span>
            </div>
            <Link
              href="/dashboard/profile"
              className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              Adjust Range <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
