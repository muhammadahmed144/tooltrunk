'use client';

import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, ShieldAlert } from 'lucide-react';

export default function Toast({ toast }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className={`fixed top-6 right-6 z-50 p-4 rounded-xl shadow-2xl flex items-center gap-3 border backdrop-blur-md max-w-sm ${
            toast.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-200'
              : 'bg-red-950/80 border-red-500/30 text-red-200'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <span className="text-sm font-semibold">{toast.text}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
