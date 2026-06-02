import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

const UIContext = createContext(null);

export function UIProvider({ children }) {
  const [showOTP, setShowOTP] = useState(false);
  const [showWatchlist, setShowWatchlist] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  const showToast = (text, durationMs = 4500, action = null, tone = 'success') => {
    setToast({ id: Date.now(), text, durationMs, remainingMs: durationMs, action, tone });
  };

  useEffect(() => {
    if (!toast) return undefined;
    if (toastTimerRef.current) clearInterval(toastTimerRef.current);

    toastTimerRef.current = setInterval(() => {
      setToast((prev) => {
        if (!prev) return prev;
        const nextRemaining = Math.max(prev.remainingMs - 250, 0);
        if (nextRemaining === 0) {
          clearInterval(toastTimerRef.current);
          toastTimerRef.current = null;
          return null;
        }
        return { ...prev, remainingMs: nextRemaining };
      });
    }, 250);

    return () => {
      if (toastTimerRef.current) {
        clearInterval(toastTimerRef.current);
        toastTimerRef.current = null;
      }
    };
  }, [toast?.id]);

  return (
    <UIContext.Provider value={{ showOTP, setShowOTP, showWatchlist, setShowWatchlist, toast, setToast, showToast }}>
      {children}
    </UIContext.Provider>
  );
}

export const useUI = () => useContext(UIContext);
