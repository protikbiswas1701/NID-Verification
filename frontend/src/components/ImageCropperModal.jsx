import React, { useRef, useState, useEffect } from 'react';
import { Check, X, RotateCw, ZoomIn, ZoomOut, Crop as CropIcon } from 'lucide-react';
import Button from './Button';

/**
 * Interactive canvas-based card cropper modal for NID photos
 * Aspect ratio locked to ID-1 card format (1.586 : 1)
 */
export default function ImageCropperModal({ imageFile, onCropComplete, onClose }) {
  const canvasRef = useRef(null);
  const [imgObj, setImgObj] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [cropBox, setCropBox] = useState({ x: 0.1, y: 0.15, w: 0.8, h: 0.8 / 1.586 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!imageFile) return;
    const url = URL.createObjectURL(imageFile);
    const img = new Image();
    img.onload = () => {
      setImgObj(img);
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  useEffect(() => {
    if (!imgObj || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Draw background grid
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);

    // Draw Image centered
    const imgAspect = imgObj.width / imgObj.height;
    let drawW, drawH;
    if (imgAspect > width / height) {
      drawW = width * 0.9;
      drawH = drawW / imgAspect;
    } else {
      drawH = height * 0.9;
      drawW = drawH * imgAspect;
    }
    ctx.drawImage(imgObj, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    // Draw Semi-transparent Overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(0, 0, width, height);

    // Clear Crop Window (ID card 1.586:1 aspect ratio)
    const boxX = cropBox.x * width;
    const boxY = cropBox.y * height;
    const boxW = cropBox.w * width;
    const boxH = boxW / 1.586;

    ctx.clearRect(boxX, boxY, boxW, boxH);

    // Re-draw original image slice inside crop window without dimming
    ctx.save();
    ctx.beginPath();
    ctx.rect(boxX, boxY, boxW, boxH);
    ctx.clip();

    ctx.translate(width / 2, height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);
    ctx.drawImage(imgObj, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    // Draw Crop Window Border & Grid
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // Corner guides
    const cornerSize = 18;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    // Top-Left
    ctx.beginPath();
    ctx.moveTo(boxX, boxY + cornerSize);
    ctx.lineTo(boxX, boxY);
    ctx.lineTo(boxX + cornerSize, boxY);
    ctx.stroke();
    // Top-Right
    ctx.beginPath();
    ctx.moveTo(boxX + boxW - cornerSize, boxY);
    ctx.lineTo(boxX + boxW, boxY);
    ctx.lineTo(boxX + boxW, boxY + cornerSize);
    ctx.stroke();
    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(boxX, boxY + boxH - cornerSize);
    ctx.lineTo(boxX, boxY + boxH);
    ctx.lineTo(boxX + cornerSize, boxY + boxH);
    ctx.stroke();
    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(boxX + boxW - cornerSize, boxY + boxH);
    ctx.lineTo(boxX + boxW, boxY + boxH);
    ctx.lineTo(boxX + boxW, boxY + boxH - cornerSize);
    ctx.stroke();
  }, [imgObj, zoom, rotation, cropBox]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const deltaX = (e.clientX - dragStart.x) / rect.width;
    const deltaY = (e.clientY - dragStart.y) / rect.height;

    setCropBox((prev) => {
      const boxH = prev.w / 1.586;
      return {
        ...prev,
        x: Math.max(0, Math.min(1 - prev.w, prev.x + deltaX)),
        y: Math.max(0, Math.min(1 - boxH, prev.y + deltaY)),
      };
    });
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const performCrop = () => {
    if (!imgObj || !canvasRef.current) return;
    const sourceCanvas = canvasRef.current;
    const boxX = cropBox.x * sourceCanvas.width;
    const boxY = cropBox.y * sourceCanvas.height;
    const boxW = cropBox.w * sourceCanvas.width;
    const boxH = boxW / 1.586;

    const outCanvas = document.createElement('canvas');
    outCanvas.width = 800;
    outCanvas.height = Math.round(800 / 1.586);
    const outCtx = outCanvas.getContext('2d');

    // Extract pixels from the source canvas
    outCtx.drawImage(sourceCanvas, boxX, boxY, boxW, boxH, 0, 0, outCanvas.width, outCanvas.height);

    outCanvas.toBlob(
      (blob) => {
        if (!blob) return;
        const croppedFile = new File([blob], imageFile.name || 'card_cropped.jpg', { type: 'image/jpeg' });
        onCropComplete(croppedFile);
      },
      'image/jpeg',
      0.95
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
      <div className="flex max-h-[95vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-slate-900 text-white shadow-2xl ring-1 ring-white/10">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-2">
            <CropIcon size={18} className="text-sky-400" />
            <h3 className="font-bold">Align & Crop Card Bounds</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative flex flex-1 items-center justify-center bg-slate-950 p-4">
          <canvas
            ref={canvasRef}
            width={640}
            height={440}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="max-h-[55vh] w-full cursor-move rounded-xl object-contain shadow-inner"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 bg-slate-900/90 px-5 py-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Zoom:</span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))}
              className="rounded p-1.5 hover:bg-slate-800 hover:text-white"
              title="Zoom out"
            >
              <ZoomOut size={16} />
            </button>
            <span className="w-8 text-center font-mono">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2.5, z + 0.1))}
              className="rounded p-1.5 hover:bg-slate-800 hover:text-white"
              title="Zoom in"
            >
              <ZoomIn size={16} />
            </button>
            <button
              type="button"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="ml-2 flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-slate-300 hover:bg-slate-700 hover:text-white"
              title="Rotate 90°"
            >
              <RotateCw size={14} />
              <span>Rotate</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" icon={Check} onClick={performCrop}>
              Apply Card Crop
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
