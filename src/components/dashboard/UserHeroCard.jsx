'use client';

import Image from 'next/image';
import { Sparkles, MapPin, Star, Award, Handshake, Sliders } from 'lucide-react';

export default function UserHeroCard({ user, stats, tierInfo }) {
  if (!user) return null;

  const isRemoteAvatar = user.avatarUrl && (user.avatarUrl.startsWith('http://') || user.avatarUrl.startsWith('https://'));

  return (
    <div className="bg-linear-to-br from-slate-900 via-slate-900 to-indigo-950/30 border border-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden mb-8">
      <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none">
        <Sparkles className="w-64 h-64 text-indigo-400" />
      </div>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
        <div className="flex items-center gap-5">
          {user.avatarUrl ? (
            isRemoteAvatar ? (
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-indigo-500/30 shadow-inner shrink-0">
                <Image
                  src={user.avatarUrl}
                  alt={user.fullName || 'User'}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt={user.fullName || 'User'}
                className="w-16 h-16 rounded-2xl object-cover border border-indigo-500/30 shadow-inner shrink-0"
              />
            )
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-linear-to-tr from-indigo-500/20 to-violet-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-2xl font-black shadow-inner shrink-0">
              {user.fullName ? user.fullName.split(' ').map((n) => n[0]).join('').toUpperCase() : 'U'}
            </div>
          )}
          <div className="space-y-1.5">
            <h1 className="text-3xl font-extrabold text-white tracking-tight leading-tight">{user.fullName}</h1>
            <div className="flex flex-wrap items-center gap-3.5">
              <span className="text-slate-400 text-sm font-semibold flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-indigo-400" /> {user.postalCode}
              </span>
              <span className="text-slate-800">•</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${tierInfo.color} flex items-center gap-1`}>
                <Star className="w-3.5 h-3.5 fill-current" />
                {tierInfo.tier}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 sm:gap-6">
          <div className="bg-slate-950/60 border border-slate-900 px-6 py-4 rounded-2xl flex items-center gap-4 min-w-[155px] shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Trust Rating</span>
              <span className="text-xl font-black text-white">{user.reputation} pts</span>
            </div>
          </div>
          <div className="bg-slate-950/60 border border-slate-900 px-6 py-4 rounded-2xl flex items-center gap-4 min-w-[155px] shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Handshake className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Sharing Shelf</span>
              <span className="text-xl font-black text-white">{stats.totalTools} Tools</span>
            </div>
          </div>
          <div className="bg-slate-950/60 border border-slate-900 px-6 py-4 rounded-2xl flex items-center gap-4 min-w-[155px] shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Active Lends</span>
              <span className="text-xl font-black text-white">{stats.activeLends} Lent</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
