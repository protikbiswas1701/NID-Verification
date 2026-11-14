import { AlertCircle, Info } from 'lucide-react';

const TONES = {
  error: 'border-rose-200 bg-rose-50 text-rose-800',
  info: 'border-navy-200 bg-navy-50 text-navy-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
};

export default function Alert({ tone = 'info', children, className = '' }) {
  const Icon = tone === 'info' ? Info : AlertCircle;
  return (
    <div role={tone === 'error' ? 'alert' : undefined} className={`flex items-start gap-2.5 rounded-lg border p-3.5 text-sm ${TONES[tone]} ${className}`}>
      <Icon size={18} className="mt-0.5 shrink-0" />
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}
