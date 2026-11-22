import SecureImage from './SecureImage';
import { formatBytes } from '../utils/format';
import { User, CreditCard } from 'lucide-react';

export default function DocumentCard({ title, file, loader }) {
  const isSelfie = title?.toLowerCase().includes('selfie');
  const aspectClass = isSelfie ? 'aspect-[4/5]' : 'aspect-[1.586]';
  const Icon = isSelfie ? User : CreditCard;

  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
        <Icon size={14} className={isSelfie ? 'text-indigo-600' : 'text-slate-500'} />
        {title}
      </p>
      {file ? (
        <>
          <SecureImage loader={loader} alt={title} className={`${aspectClass} w-full`} />
          <p className="mt-2 truncate text-xs text-slate-500">
            {file.originalName} · {(file.mimeType || '').replace('image/', '').toUpperCase()} · {formatBytes(file.size || 0)}
          </p>
        </>
      ) : (
        <div className={`grid ${aspectClass} place-items-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-400`}>
          <div className="flex flex-col items-center gap-1.5">
            <Icon size={24} className="text-slate-300" />
            <span>Not provided</span>
          </div>
        </div>
      )}
    </div>
  );
}
