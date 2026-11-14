import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, title, onClose, children, footer }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-navy-950/50" onClick={onClose} />
      <div className="panel relative max-h-[90vh] w-full max-w-lg overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-bold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <div className="px-5 py-4 text-sm text-slate-600">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3.5">{footer}</div>}
      </div>
    </div>
  );
}
