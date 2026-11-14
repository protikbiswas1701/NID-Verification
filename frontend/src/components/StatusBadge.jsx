import { STATUS } from '../utils/constants';

export default function StatusBadge({ status }) {
  const meta = STATUS[status] || { label: status, classes: 'bg-slate-100 text-slate-700 ring-slate-200' };
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${meta.classes}`}>
      {meta.label}
    </span>
  );
}
