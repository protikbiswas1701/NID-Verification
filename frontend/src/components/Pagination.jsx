import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button';

export default function Pagination({ pagination, onPage }) {
  if (!pagination || pagination.pages <= 1) return null;
  const { page, pages, total } = pagination;
  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
      <p className="text-xs text-slate-500">Page {page} of {pages} · {total} results</p>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" icon={ChevronLeft} disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</Button>
        <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next <ChevronRight size={16} /></Button>
      </div>
    </div>
  );
}
