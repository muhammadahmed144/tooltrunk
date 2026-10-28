'use client';

export default function LoadingScreen({ message = 'Loading ToolTrunk...' }) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100">
      <div className="relative flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        <span className="absolute text-2xl">🧰</span>
      </div>
      <p className="mt-4 text-slate-400 font-medium animate-pulse">{message}</p>
    </div>
  );
}
