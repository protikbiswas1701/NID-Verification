import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const ToastContext = createContext(null);
const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info };
const TONES = {
  success: 'border-emerald-200 text-emerald-900 [&>svg]:text-emerald-600',
  error: 'border-rose-200 text-rose-900 [&>svg]:text-rose-600',
  info: 'border-navy-200 text-navy-900 [&>svg]:text-navy-600',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);
  const push = useCallback((type, message) => {
    const id = crypto.randomUUID();
    setToasts((list) => [...list, { id, type, message }]);
    setTimeout(() => dismiss(id), 5000);
  }, [dismiss]);

  const value = useMemo(
    () => ({
      success: (m) => push('success', m),
      error: (m) => push('error', m),
      info: (m) => push('info', m),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6" aria-live="polite">
        {toasts.map((t) => {
          const Icon = ICONS[t.type];
          return (
            <div key={t.id} role="status" className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border bg-white p-3.5 text-sm shadow-panel ${TONES[t.type]}`}>
              <Icon size={18} className="mt-0.5 shrink-0" />
              <p className="flex-1 leading-snug">{t.message}</p>
              <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
