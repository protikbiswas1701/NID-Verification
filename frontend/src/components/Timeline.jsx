import StatusBadge from './StatusBadge';
import { formatDate } from '../utils/format';

// history: [{ status, note, at, by? }] (oldest first). Shown newest first.
export default function Timeline({ history = [] }) {
  const items = [...history].reverse();
  if (!items.length) return <p className="text-sm text-slate-500">No activity recorded yet.</p>;
  return (
    <ol className="relative space-y-5 border-l border-slate-200 pl-6">
      {items.map((h, i) => (
        <li key={`${h.at}-${i}`} className="relative">
          <span className="absolute -left-[30px] top-1 h-3 w-3 rounded-full border-2 border-white bg-navy-500 ring-1 ring-navy-200" />
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={h.status} />
            <span className="text-xs text-slate-500">{formatDate(h.at)}</span>
            {h.by?.name && <span className="text-xs text-slate-500">by {h.by.name}</span>}
          </div>
          {h.note && <p className="mt-1.5 text-sm text-slate-600">{h.note}</p>}
        </li>
      ))}
    </ol>
  );
}
