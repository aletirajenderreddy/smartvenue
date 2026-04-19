import { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(null);

let counter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++counter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ push, dismiss }}>
      {children}
      <div
        className='fixed bottom-24 left-1/2 z-[9999] flex -translate-x-1/2 flex-col gap-2 md:bottom-5 md:left-auto md:right-5 md:translate-x-0'
        role='region'
        aria-label='Notifications'
      >
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function Toast({ toast, onDismiss }) {
  const styles = {
    info: 'bg-[#1a2236] border-primary/40 text-white',
    success: 'bg-emerald-950 border-emerald-500/40 text-emerald-100',
    error: 'bg-red-950 border-red-500/40 text-red-100',
    warning: 'bg-amber-950 border-amber-500/40 text-amber-100'
  };

  const icons = {
    info: '💬',
    success: '✅',
    error: '❌',
    warning: '⚠️'
  };

  return (
    <div
      className={`flex min-w-[260px] max-w-xs items-start gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-xl transition-all ${styles[toast.type] || styles.info}`}
      role='alert'
    >
      <span className='mt-px text-base leading-none'>{icons[toast.type] || icons.info}</span>
      <p className='flex-1 text-sm leading-5'>{toast.message}</p>
      <button
        type='button'
        className='mt-0.5 text-xs opacity-60 hover:opacity-100'
        onClick={() => onDismiss(toast.id)}
        aria-label='Dismiss'
      >
        ✕
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx;
}
