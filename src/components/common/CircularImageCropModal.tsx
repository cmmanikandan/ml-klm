import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Check, X, Loader2, Sparkles, Move } from 'lucide-react';
import { uploadFileToCloudinary } from '../../lib/cloudinary';

interface CircularImageCropModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onConfirmCrop: (croppedImageUrl: string) => void;
}

const CROP_CONTAINER_SIZE = 280; // Size of the circular crop viewport in pixels
const OUTPUT_CANVAS_SIZE = 600;   // High-resolution square output

export const CircularImageCropModal: React.FC<CircularImageCropModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onConfirmCrop,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Reset state whenever a new image is loaded or modal opens
  useEffect(() => {
    if (isOpen && imageSrc) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setImageLoaded(false);
      setIsProcessing(false);
      setUploadProgress(null);
    }
  }, [isOpen, imageSrc]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle Drag / Pan (Mouse)
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle Drag / Pan (Touch)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPan({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.0015;
    setZoom((prev) => Math.min(Math.max(1, +(prev + delta).toFixed(2)), 3));
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleZoomChange = (newZoom: number) => {
    const clamped = Math.min(Math.max(1, newZoom), 3);
    setZoom(+clamped.toFixed(2));
  };

  // Generate cropped image and upload to Cloudinary
  const handleConfirmCrop = async () => {
    if (!imgRef.current || isProcessing) return;
    setIsProcessing(true);

    try {
      const img = imgRef.current;
      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;

      if (!naturalWidth || !naturalHeight) {
        throw new Error('Image dimensions unavailable');
      }

      // Base scaling to fit smallest dimension to CROP_CONTAINER_SIZE
      const baseScale = Math.max(
        CROP_CONTAINER_SIZE / naturalWidth,
        CROP_CONTAINER_SIZE / naturalHeight
      );

      const dispWidth = naturalWidth * baseScale * zoom;
      const dispHeight = naturalHeight * baseScale * zoom;

      const topLeftX = CROP_CONTAINER_SIZE / 2 - dispWidth / 2 + pan.x;
      const topLeftY = CROP_CONTAINER_SIZE / 2 - dispHeight / 2 + pan.y;

      const canvas = document.createElement('canvas');
      canvas.width = OUTPUT_CANVAS_SIZE;
      canvas.height = OUTPUT_CANVAS_SIZE;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Canvas 2D context unavailable');

      // Enable smooth image rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Scale factor from preview container to output canvas
      const ratio = OUTPUT_CANVAS_SIZE / CROP_CONTAINER_SIZE;

      ctx.drawImage(
        img,
        topLeftX * ratio,
        topLeftY * ratio,
        dispWidth * ratio,
        dispHeight * ratio
      );

      // Convert canvas to Blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92);
      });

      if (!blob) {
        // Fallback to data URL if toBlob fails
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        onConfirmCrop(dataUrl);
        onClose();
        return;
      }

      // Create a File from Blob and attempt Cloudinary upload
      const file = new File([blob], `cat_crop_${Date.now()}.jpg`, { type: 'image/jpeg' });

      try {
        setUploadProgress(10);
        const result = await uploadFileToCloudinary(file, (percent) => {
          setUploadProgress(percent);
        });
        if (result?.url) {
          onConfirmCrop(result.url);
          onClose();
          return;
        }
      } catch (uploadErr) {
        console.warn('Cloudinary upload warning, falling back to cropped data URL:', uploadErr);
      }

      // Fallback if Cloudinary is not configured or offline: Data URL
      const fallbackDataUrl = canvas.toDataURL('image/jpeg', 0.92);
      onConfirmCrop(fallbackDataUrl);
      onClose();
    } catch (err) {
      console.error('Error during image crop:', err);
      alert('Could not crop image. Please try another image.');
    } finally {
      setIsProcessing(false);
      setUploadProgress(null);
    }
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md transition-all animate-fade-in">
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-brand-200 transform transition-all flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-warm-border flex items-center justify-between bg-gradient-to-r from-white via-warm-bg to-brand-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-charcoal-900 leading-tight">Crop Category Image</h3>
              <p className="text-[11px] text-charcoal-500 font-semibold">Position & zoom to fit circular display</p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 text-charcoal-400 hover:text-charcoal-800 rounded-full hover:bg-warm-hover transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Cropper Canvas Viewport */}
        <div className="p-5 space-y-4 bg-slate-900 select-none flex flex-col items-center">
          
          {/* Circular Crop Mask Viewport */}
          <div
            ref={containerRef}
            style={{ width: CROP_CONTAINER_SIZE, height: CROP_CONTAINER_SIZE }}
            className="relative overflow-hidden rounded-full cursor-grab active:cursor-grabbing border-2 border-dashed border-white/80 shadow-2xl bg-black flex items-center justify-center touch-none select-none group"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
          >
            {/* The Source Image */}
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop target"
              crossOrigin="anonymous"
              onLoad={() => setImageLoaded(true)}
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
                maxWidth: 'none',
                maxHeight: 'none',
              }}
              className={`w-full h-full object-cover transition-transform duration-75 pointer-events-none select-none ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              draggable={false}
            />

            {/* Subtle Crosshair Guide Overlay inside Circle */}
            <div className="absolute inset-0 pointer-events-none border border-white/20 rounded-full flex items-center justify-center">
              <div className="w-full h-[1px] bg-white/20" />
              <div className="h-full w-[1px] bg-white/20 absolute" />
            </div>

            {/* Interactive Drag Hint Badge */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 pointer-events-none bg-black/60 backdrop-blur-xs text-white/90 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-white/10 opacity-75 group-hover:opacity-100 transition-opacity">
              <Move className="w-3 h-3 text-brand-400" />
              <span>Drag to Pan</span>
            </div>

            {/* Loading Indicator while Image Decodes */}
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 text-brand-400">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-400 font-medium text-center">
            The image inside the circular area shows the exact final website appearance.
          </p>
        </div>

        {/* Zoom & Adjustment Controls */}
        <div className="p-4 bg-white border-t border-warm-border space-y-3.5">
          {/* Zoom Slider with - and + */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-black text-charcoal-800">
              <span className="flex items-center gap-1">
                <span>Zoom Level</span>
                <span className="text-brand-600 font-mono text-[11px]">({Math.round(zoom * 100)}%)</span>
              </span>

              <button
                type="button"
                onClick={handleReset}
                disabled={isProcessing || (zoom === 1 && pan.x === 0 && pan.y === 0)}
                className="inline-flex items-center gap-1 text-[11px] font-extrabold text-charcoal-500 hover:text-brand-600 disabled:opacity-40 transition-colors"
                title="Reset zoom and position"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleZoomChange(zoom - 0.15)}
                disabled={isProcessing || zoom <= 1}
                className="p-2 text-charcoal-700 bg-warm-bg hover:bg-brand-100 rounded-xl border border-warm-border transition-colors disabled:opacity-40"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                disabled={isProcessing}
                onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
              />

              <button
                type="button"
                onClick={() => handleZoomChange(zoom + 0.15)}
                disabled={isProcessing || zoom >= 3}
                className="p-2 text-charcoal-700 bg-warm-bg hover:bg-brand-100 rounded-xl border border-warm-border transition-colors disabled:opacity-40"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 py-2.5 px-4 rounded-xl border border-warm-border text-charcoal-700 font-extrabold text-xs hover:bg-warm-bg transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>

            <button
              type="button"
              onClick={handleConfirmCrop}
              disabled={isProcessing || !imageLoaded}
              className="flex-1 py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-black text-xs shadow-md shadow-brand-600/30 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{uploadProgress ? `Uploading ${uploadProgress}%` : 'Processing...'}</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Confirm Crop</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
