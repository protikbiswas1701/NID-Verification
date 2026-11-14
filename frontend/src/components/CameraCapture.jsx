import { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, X, User } from 'lucide-react';
import Button from './Button';
import { Spinner } from './Spinner';

// Full-screen camera. Supports mode="card" (ID-1 ratio guide) or mode="selfie" (face oval guide).
export default function CameraCapture({ label, mode = 'card', onCapture, onClose }) {
  const isSelfie = mode === 'selfie' || label?.toLowerCase().includes('selfie');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [facing, setFacing] = useState(isSelfie ? 'user' : 'environment');
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      setReady(false);
      setError('');
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('This browser cannot open the camera, or the page is not served over HTTPS. Use "Upload from device" instead.');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setReady(true);
      } catch (err) {
        if (err.name === 'NotAllowedError') setError('Camera permission was denied. Allow camera access in your browser settings and try again.');
        else if (err.name === 'NotFoundError') setError('No camera was found on this device.');
        else setError('The camera could not be started. Close other apps that use it and try again.');
      }
    };

    start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [facing]);

  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => blob && onCapture(new File([blob], `${isSelfie ? 'selfie' : 'nid'}-${Date.now()}.jpg`, { type: 'image/jpeg' })),
      'image/jpeg',
      0.92
    );
  };

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-navy-950" role="dialog" aria-modal="true" aria-label={`Capture ${label}`}>
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <p className="flex items-center gap-2 text-sm font-semibold">
          {isSelfie && <User size={16} className="text-emerald-400" />}
          Capture {label}
        </p>
        <button onClick={onClose} aria-label="Close camera" className="rounded-full p-2 hover:bg-white/10">
          <X size={22} />
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {error ? (
          <div className="max-w-sm px-6 text-center text-sm text-ice-200">
            <p className="mb-5 leading-relaxed">{error}</p>
            <Button variant="light" onClick={onClose}>Back</Button>
          </div>
        ) : (
          <>
            <video ref={videoRef} playsInline muted className={`h-full w-full object-contain ${isSelfie ? 'scale-x-[-1]' : ''}`} />
            {!ready && <div className="absolute inset-0 grid place-items-center text-white"><Spinner size={32} /></div>}
            {ready && (
              <div className="pointer-events-none absolute inset-0 grid place-items-center p-6">
                {isSelfie ? (
                  /* Portrait / Oval face guide for selfie eKYC */
                  <div className="relative aspect-[3/4] w-64 max-w-[70vw] rounded-[50%] border-3 border-dashed border-emerald-400/80 shadow-[0_0_0_9999px_rgba(10,21,48,.55)]">
                    <div className="absolute inset-x-0 top-1/3 border-t border-dashed border-emerald-400/40" />
                    <div className="absolute inset-y-0 left-1/2 border-l border-dashed border-emerald-400/40" />
                  </div>
                ) : (
                  /* ID-1 card ratio guide (85.6 x 54 mm) */
                  <div className="aspect-[1.586] w-full max-w-md rounded-xl border-2 border-dashed border-white/70 shadow-[0_0_0_9999px_rgba(10,21,48,.45)]" />
                )}
              </div>
            )}
          </>
        )}
      </div>

      {!error && (
        <div className="flex flex-col items-center gap-3 px-4 pb-6 pt-4">
          <p className="text-xs text-ice-200">
            {isSelfie
              ? 'Center your face inside the oval frame. Look directly at the camera with neutral expression.'
              : 'Fit the whole card inside the frame. Avoid glare, reflections, and heavy shadows.'}
          </p>
          <div className="flex items-center gap-6">
            <button
              onClick={() => setFacing((f) => (f === 'environment' ? 'user' : 'environment'))}
              aria-label="Switch camera"
              className="rounded-full p-3 text-white hover:bg-white/10"
              title="Flip camera"
            >
              <RefreshCw size={22} />
            </button>
            <button
              onClick={capture}
              disabled={!ready}
              aria-label="Take photo"
              className="grid h-16 w-16 place-items-center rounded-full bg-white text-navy-900 ring-4 ring-white/30 transition hover:scale-105 disabled:opacity-40"
            >
              <Camera size={26} />
            </button>
            <span className="w-12" />
          </div>
        </div>
      )}
    </div>
  );
}
