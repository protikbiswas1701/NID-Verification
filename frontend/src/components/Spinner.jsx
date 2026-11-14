import { Loader2 } from 'lucide-react';

export function Spinner({ size = 20, className = '' }) {
  return <Loader2 size={size} className={`animate-spin ${className}`} aria-hidden="true" />;
}

export function FullPageSpinner() {
  return (
    <div className="grid min-h-screen place-items-center text-navy-600" role="status" aria-label="Loading">
      <Spinner size={32} />
    </div>
  );
}

export function PanelLoader({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500" role="status">
      <Spinner /> {label}
    </div>
  );
}
