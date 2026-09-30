'use client';

import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { History, Star } from 'lucide-react';

export default function LedgerTab({ user }) {
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerFilter, setLedgerFilter] = useState('all');

  const filteredLedger = useMemo(() => {
    return (user.reputationHistory || []).filter((item) => {
      const matchesSearch = item.description.toLowerCase().includes(ledgerSearch.toLowerCase());
      if (ledgerFilter === 'positive') return matchesSearch && item.points >= 0;
      if (ledgerFilter === 'negative') return matchesSearch && item.points < 0;
      return matchesSearch;
    });
  }, [user.reputationHistory, ledgerSearch, ledgerFilter]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="bg-slate-900/30 border border-slate-900 rounded-2xl p-6 sm:p-8 flex flex-col"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
            <History className="w-5 h-5 text-indigo-400" /> Reputation Ledger & Audits
          </h2>
          <p className="text-xs text-slate-400">
            Complete immutable record of neighbor interactions and feedback comments.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search ledger logs..."
            value={ledgerSearch}
            onChange={(e) => setLedgerSearch(e.target.value)}
            className="w-48 pl-3 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl focus:border-indigo-500 text-slate-200 outline-none transition-all text-xs"
          />
          <div className="flex border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
            {['all', 'positive', 'negative'].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setLedgerFilter(f)}
                className={`px-3 py-2 text-[10px] font-bold cursor-pointer transition-colors ${
                  ledgerFilter === f ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3.5 max-h-[450px] overflow-y-auto pr-1">
        {filteredLedger.length === 0 ? (
          <div className="text-center text-slate-500 py-12 text-sm">No ledger matches found.</div>
        ) : (
          filteredLedger.map((item) => {
            const isPositive = item.points >= 0;
            return (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-950/40 rounded-xl border border-slate-900/60 hover:border-slate-800 transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                        isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                      }`}
                    >
                      {isPositive ? '✓' : '✗'}
                    </div>
                    <p className="text-sm font-semibold text-slate-200">{item.description}</p>
                  </div>
                  <span className="text-[10px] text-slate-500 block pl-7 font-mono">
                    Timestamp: {new Date(item.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-4 pl-7 sm:pl-0">
                  {isPositive && item.points >= 15 && (
                    <div className="flex gap-0.5 text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                  )}
                  <span
                    className={`px-2.5 py-1 text-xs font-black rounded-md ${
                      isPositive
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'
                        : 'bg-red-500/10 text-red-400 border border-red-500/10'
                    }`}
                  >
                    {isPositive ? '+' : ''}
                    {item.points} Points
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
