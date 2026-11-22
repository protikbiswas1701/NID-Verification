import { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';
import { Spinner } from './Spinner';

// Private images need the auth header, so they are fetched with axios and shown via a blob URL.
// `loader` is e.g. () => verificationApi.file(id, 'front').
export default function SecureImage({ loader, alt, className = '' }) {
  const [src, setSrc] = useState(null);
  const [state, setState] = useState('loading');

  const fetchImage = () => {
    let active = true;
    setState('loading');
    loader()
      .then(({ data }) => {
        if (!active) return;
        if (!data || data.size === 0) {
          setState('error');
          return;
        }
        const objectUrl = URL.createObjectURL(data);
        setSrc(objectUrl);
        setState('ready');
      })
      .catch(() => {
        if (active) setState('error');
      });
  };

  useEffect(() => {
    fetchImage();
    return () => {
      if (src) URL.revokeObjectURL(src);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`grid place-items-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100 ${className}`}>
      {state === 'loading' && <Spinner className="text-navy-500" />}
      {state === 'error' && (
        <div className="flex flex-col items-center gap-1.5 p-6 text-xs text-slate-500">
          <ImageOff size={22} className="text-slate-400" />
          <span>Image unavailable</span>
          <button
            type="button"
            onClick={fetchImage}
            className="mt-1 text-[11px] font-semibold text-navy-600 hover:underline"
          >
            Retry
          </button>
        </div>
      )}
      {state === 'ready' && src && <img src={src} alt={alt} className="h-full w-full object-contain" />}
    </div>
  );
}
