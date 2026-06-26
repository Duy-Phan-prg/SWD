import React from 'react';
import { X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  return (
    <div className="fixed top-6 right-6 z-[120] max-w-sm w-full">
      <div className={`border p-4 text-white rounded ${
        toast.tone === 'sad' 
          ? 'border-red-400/50 bg-red-950' 
          : 'border-green-400/50 bg-green-950'
      }`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className={`text-sm font-bold ${
              toast.tone === 'sad' ? 'text-red-200' : 'text-green-200'
            }`}>
              {toast.tone === 'sad' ? '✗' : '✓'}
            </span>
            <p className="text-sm leading-relaxed">{toast.text}</p>
          </div>
          <button 
            onClick={onClose} 
            className="shrink-0 text-neutral-400 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
