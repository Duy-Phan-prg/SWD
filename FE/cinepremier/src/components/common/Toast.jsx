import React from 'react';
import { AnimatePresence, motion } from 'motion/react';

export default function Toast({ toast, onClose }) {
  const toastDurationMs = Number.isFinite(Number(toast?.durationMs)) && Number(toast?.durationMs) > 0
    ? Number(toast.durationMs)
    : 4500;
  const toastRemainingMs = Number.isFinite(Number(toast?.remainingMs)) && Number(toast?.remainingMs) >= 0
    ? Number(toast.remainingMs)
    : toastDurationMs;

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: -16, scale: 0.98 }}
          animate={toast.tone === 'sad' ? { opacity: 1, y: [0, 2, 0], scale: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.98 }}
          transition={{ duration: 0.28 }}
          className={`fixed right-4 top-5 z-[120] w-[380px] max-w-[calc(100vw-2rem)] overflow-hidden border p-4 text-white backdrop-blur-md sm:right-6 sm:top-6 ${toast.tone === 'sad' ? 'border-rose-300/40 bg-gradient-to-br from-zinc-950/95 via-rose-950/90 to-purple-950/85 shadow-[0_18px_60px_rgba(244,63,94,0.24)]' : 'border-amber-300/40 bg-gradient-to-br from-zinc-900/95 via-neutral-950/95 to-amber-950/90 shadow-[0_18px_50px_rgba(245,158,11,0.22)]'}`}
        >
          <div className={`absolute inset-x-0 top-0 h-1 ${toast.tone === 'sad' ? 'bg-gradient-to-r from-rose-200 via-fuchsia-400 to-indigo-300' : 'bg-gradient-to-r from-amber-200 via-amber-400 to-emerald-300'}`} />
          <div className="flex items-start justify-between gap-3 pt-1">
            <div className="flex min-w-0 items-start gap-3">
              <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border text-sm font-black ${toast.tone === 'sad' ? 'border-rose-300/40 bg-rose-400/15 text-rose-100 shadow-[0_0_18px_rgba(244,63,94,0.22)] animate-pulse' : 'border-emerald-300/40 bg-emerald-400/15 text-emerald-200 shadow-[0_0_18px_rgba(52,211,153,0.22)]'}`}>
                {toast.tone === 'sad' ? '...' : 'OK'}
              </span>
              <p className={`whitespace-pre-line text-sm font-bold leading-relaxed ${toast.tone === 'sad' ? 'text-rose-50' : 'text-amber-50'}`}>{toast.text}</p>
            </div>
            <button type="button" onClick={onClose} className="shrink-0 rounded-sm px-2 py-1 text-base font-bold leading-none text-amber-100/70 transition hover:bg-white/10 hover:text-white">x</button>
          </div>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/15">
            <div className={`toast-progress h-full rounded-full origin-left ${toast.tone === 'sad' ? 'bg-gradient-to-r from-rose-300 via-fuchsia-300 to-indigo-300 shadow-[0_0_16px_rgba(244,63,94,0.6)]' : 'bg-gradient-to-r from-emerald-300 via-amber-300 to-amber-500 shadow-[0_0_16px_rgba(251,191,36,0.65)]'}`} style={{ animationDuration: `${toastDurationMs}ms` }} />
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-100/70">Tu tat sau {Math.ceil(toastRemainingMs / 1000)}s</div>
            {toast.action && (
              <button type="button" onClick={() => { toast.action.onClick(); onClose(); }} className="border border-rose-300/50 bg-rose-500/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-rose-50 transition hover:bg-rose-400 hover:text-black">
                {toast.action.label}
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
