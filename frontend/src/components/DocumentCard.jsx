import SecureImage from './SecureImage';
import { formatBytes } from '../utils/format';

export default function DocumentCard({ title, file, loader }) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-slate-800">{title}</p>
      {file ? (
        <>
          <SecureImage loader={loader} alt={title} className="aspect-[1.586] w-full" />
          <p className="mt-2 truncate text-xs text-slate-500">{file.originalName} · {file.mimeType.replace('image/', '').toUpperCase()} · {formatBytes(file.size)}</p>
        </>
      ) : (
        <div className="grid aspect-[1.586] place-items-center rounded-lg border border-dashed border-slate-300 text-xs text-slate-400">Not provided</div>
      )}
    </div>
  );
}
