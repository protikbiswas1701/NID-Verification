import { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, RefreshCw, Trash2, Crop, User } from 'lucide-react';
import Button from './Button';
import CameraCapture from './CameraCapture';
import ImageCropperModal from './ImageCropperModal';
import { ALLOWED_TYPES, MAX_FILE_MB } from '../utils/constants';
import { formatBytes } from '../utils/format';

// Handles image input for card front/back or live selfie with custom camera & cropper guides.
export default function NidImageInput({ label, required = false, file, onChange, disabled = false, error }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [localError, setLocalError] = useState('');

  const isSelfie = label?.toLowerCase().includes('selfie');
  const aspectClass = isSelfie ? 'aspect-[4/5]' : 'aspect-[1.586]';

  useEffect(() => {
    if (!file) { setPreview(null); return undefined; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const accept = (picked) => {
    if (!picked) return;
    if (!ALLOWED_TYPES.includes(picked.type)) return setLocalError('Use a JPG, JPEG, PNG or WEBP image.');
    if (picked.size > MAX_FILE_MB * 1024 * 1024) return setLocalError(`This image is ${formatBytes(picked.size)}. The limit is ${MAX_FILE_MB} MB.`);
    setLocalError('');
    return onChange(picked);
  };

  const remove = () => { setLocalError(''); onChange(null); };
  const shownError = localError || error;

  return (
    <div>
      <p className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-800">
        <span className="flex items-center gap-1.5">
          {isSelfie && <User size={15} className="text-emerald-600" />}
          {label}
        </span>
        {required ? (
          <span className="text-xs font-normal text-rose-600">(required)</span>
        ) : (
          <span className="text-xs font-normal text-slate-400">(optional)</span>
        )}
      </p>

      {preview ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className={`grid ${aspectClass} place-items-center bg-slate-100`}>
            <img src={preview} alt={`${label} preview`} className="h-full w-full object-contain" />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 p-3">
            <p className="min-w-0 truncate text-xs text-slate-500">{file.name} · {formatBytes(file.size)}</p>
            <div className="flex flex-wrap gap-1.5">
              {!isSelfie && (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  icon={Crop}
                  disabled={disabled}
                  onClick={() => setCropperOpen(true)}
                  title="Crop card bounds for optimal OCR"
                >
                  Crop
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                variant="secondary"
                icon={Camera}
                disabled={disabled}
                onClick={() => setCameraOpen(true)}
              >
                Retake
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                icon={RefreshCw}
                disabled={disabled}
                onClick={() => inputRef.current?.click()}
              >
                Replace
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                icon={Trash2}
                disabled={disabled}
                onClick={remove}
                aria-label={`Remove ${label}`}
              >
                Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); if (!disabled) accept(e.dataTransfer.files?.[0]); }}
          className={`flex ${aspectClass} flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed bg-white p-4 text-center ${
            shownError ? 'border-rose-300' : 'border-slate-300'
          }`}
        >
          <div>
            <p className="text-sm font-medium text-slate-700">Add a photo of {label.toLowerCase()}</p>
            <p className="mt-1 text-xs text-slate-500">JPG, PNG or WEBP · up to {MAX_FILE_MB} MB</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              type="button"
              variant="primary"
              icon={Camera}
              disabled={disabled}
              onClick={() => setCameraOpen(true)}
            >
              {isSelfie ? 'Open selfie camera' : 'Use camera'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              icon={ImagePlus}
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
            >
              Upload from device
            </Button>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        className="hidden"
        onChange={(e) => { accept(e.target.files?.[0]); e.target.value = ''; }}
      />
      {shownError && <p className="mt-2 text-xs text-rose-600" role="alert">{shownError}</p>}

      {cameraOpen && (
        <CameraCapture
          label={label.toLowerCase()}
          mode={isSelfie ? 'selfie' : 'card'}
          onClose={() => setCameraOpen(false)}
          onCapture={(captured) => { setCameraOpen(false); accept(captured); }}
        />
      )}

      {cropperOpen && file && !isSelfie && (
        <ImageCropperModal
          imageFile={file}
          onClose={() => setCropperOpen(false)}
          onCropComplete={(cropped) => {
            setCropperOpen(false);
            accept(cropped);
          }}
        />
      )}
    </div>
  );
}
