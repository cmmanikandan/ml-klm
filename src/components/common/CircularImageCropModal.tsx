import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Check, X, Loader2, Sparkles, Move, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { uploadFileToCloudinary } from '../../lib/cloudinary';

interface CircularImageCropModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onConfirmCrop: (croppedImageUrl: string) => void;
  onSelectNewFile?: (file: File) => void;
}

const CROP_CONTAINER_SIZE = 260; // Circular crop viewport dimension in pixels
const OUTPUT_CANVAS_SIZE = 600;   // High-resolution square output

export const CircularImageCropModal: React.FC<CircularImageCropModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onConfirmCrop,
  onSelectNewFile,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // Touch pinch-to-zoom state
  const [touchPinchStartDist, setTouchPinchStartDist] = useState<number | null>(null);
  const [touchPinchStartZoom, setTouchPinchStartZoom] = useState<number>(1);

  // Image loading lifecycle
  const [loadingStatus, setLoadingStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [naturalDimensions, setNaturalDimensions] = useState<{ width: number; height: number } | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const internalFileInputRef = useRef<HTMLInputElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Compute base scaling so smallest dimension covers CROP_CONTAINER_SIZE
  const baseScale = naturalDimensions
    ? Math.max(
        CROP_CONTAINER_SIZE / naturalDimensions.width,
        CROP_CONTAINER_SIZE / naturalDimensions.height
      )
    : 1;

  // Maximum allowed pan at current zoom level to prevent empty margins
  const getMaxPan = useCallback(
    (currentZoom: number) => {
      if (!naturalDimensions) return { maxX: 0, maxY: 0 };
      const dispWidth = naturalDimensions.width * baseScale * currentZoom;
      const dispHeight = naturalDimensions.height * baseScale * currentZoom;
      return {
        maxX: Math.max(0, (dispWidth - CROP_CONTAINER_SIZE) / 2),
        maxY: Math.max(0, (dispHeight - CROP_CONTAINER_SIZE) / 2),
      };
    },
    [naturalDimensions, baseScale]
  );

  // Clamp pan within permissible bounds
  const clampPan = useCallback(
    (newX: number, newY: number, currentZoom: number) => {
      const { maxX, maxY } = getMaxPan(currentZoom);
      return {
        x: Math.max(-maxX, Math.min(maxX, newX)),
        y: Math.max(-maxY, Math.min(maxY, newY)),
      };
    },
    [getMaxPan]
  );

  // Initialize and load image whenever isOpen or imageSrc changes
  useEffect(() => {
    if (!isOpen || !imageSrc) {
      setLoadingStatus('loading');
      setNaturalDimensions(null);
      return;
    }

    setLoadingStatus('loading');
    setErrorMessage('');
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setIsProcessing(false);
    setUploadProgress(null);
    setNaturalDimensions(null);

    // 5-second safety timeout fallback
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setLoadingStatus((prev) => {
        if (prev === 'loading') {
          setErrorMessage('The selected image could not be loaded. Please choose another image.');
          return 'error';
        }
        return prev;
      });
    }, 5000);

    // Preload image in memory to extract natural dimensions and verify validity
    const testImg = new Image();
    testImg.onload = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (testImg.naturalWidth <= 0 || testImg.naturalHeight <= 0) {
        setLoadingStatus('error');
        setErrorMessage('Invalid image dimensions. Please choose another image.');
        return;
      }
      setNaturalDimensions({
        width: testImg.naturalWidth,
        height: testImg.naturalHeight,
      });
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setLoadingStatus('loaded');
    };

    testImg.onerror = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setLoadingStatus('error');
      setErrorMessage('The selected image could not be loaded.');
    };

    testImg.src = imageSrc;

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isOpen, imageSrc]);

  // Lock body scroll while modal is open
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

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (loadingStatus !== 'loaded' || isProcessing) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || loadingStatus !== 'loaded') return;
      const rawX = e.clientX - dragStart.x;
      const rawY = e.clientY - dragStart.y;
      setPan(clampPan(rawX, rawY, zoom));
    },
    [isDragging, dragStart, clampPan, zoom, loadingStatus]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

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

  // Touch drag & Pinch-to-zoom handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (loadingStatus !== 'loaded' || isProcessing) return;
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
      setTouchPinchStartDist(null);
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      setTouchPinchStartDist(dist);
      setTouchPinchStartZoom(zoom);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (loadingStatus !== 'loaded' || isProcessing) return;
    if (e.touches.length === 1 && isDragging) {
      const touch = e.touches[0];
      const rawX = touch.clientX - dragStart.x;
      const rawY = touch.clientY - dragStart.y;
      setPan(clampPan(rawX, rawY, zoom));
    } else if (e.touches.length === 2 && touchPinchStartDist !== null) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const factor = dist / touchPinchStartDist;
      const newZoom = Math.min(Math.max(1, +(touchPinchStartZoom * factor).toFixed(2)), 3);
      setZoom(newZoom);
      setPan((prev) => clampPan(prev.x, prev.y, newZoom));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setTouchPinchStartDist(null);
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (loadingStatus !== 'loaded' || isProcessing) return;
    e.preventDefault();
    const delta = e.deltaY * -0.0015;
    const newZoom = Math.min(Math.max(1, +(zoom + delta).toFixed(2)), 3);
    setZoom(newZoom);
    setPan((prev) => clampPan(prev.x, prev.y, newZoom));
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleZoomChange = (newZoom: number) => {
    const clamped = Math.min(Math.max(1, newZoom), 3);
    const rounded = +clamped.toFixed(2);
    setZoom(rounded);
    setPan((prev) => clampPan(prev.x, prev.y, rounded));
  };

  // Internal file selection for "Choose Another Image"
  const handleInternalFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image format
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const validMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const fileName = file.name.toLowerCase();
    const isExtensionValid = validExtensions.some((ext) => fileName.endsWith(ext));
    const isMimeValid = validMimes.includes(file.type);

    if (!isExtensionValid && !isMimeValid) {
      alert('Unable to load image.\nPlease select a valid JPG, PNG, or WEBP image.');
      e.target.value = '';
      return;
    }

    if (onSelectNewFile) {
      onSelectNewFile(file);
    }
    e.target.value = '';
  };

  // Generate high-resolution 1:1 cropped square image and upload/save
  const handleConfirmCrop = async () => {
    if (!naturalDimensions || loadingStatus !== 'loaded' || isProcessing || !imageSrc) return;
    setIsProcessing(true);

    try {
      const { width: naturalWidth, height: naturalHeight } = naturalDimensions;

      // Displayed dimensions in preview container
      const dispWidth = naturalWidth * baseScale * zoom;
      const dispHeight = naturalHeight * baseScale * zoom;

      // Position of top-left corner of displayed image relative to crop container top-left
      const imgTopLeftX = (CROP_CONTAINER_SIZE - dispWidth) / 2 + pan.x;
      const imgTopLeftY = (CROP_CONTAINER_SIZE - dispHeight) / 2 + pan.y;

      // Ratio from container coordinates to natural source image pixels
      const scaleToNatural = naturalWidth / dispWidth;

      // Exact source bounding box corresponding to [0, 0, CROP_CONTAINER_SIZE, CROP_CONTAINER_SIZE]
      const sx = (0 - imgTopLeftX) * scaleToNatural;
      const sy = (0 - imgTopLeftY) * scaleToNatural;
      const sWidth = CROP_CONTAINER_SIZE * scaleToNatural;
      const sHeight = CROP_CONTAINER_SIZE * scaleToNatural;

      // Create output canvas
      const canvas = document.createElement('canvas');
      canvas.width = OUTPUT_CANVAS_SIZE;
      canvas.height = OUTPUT_CANVAS_SIZE;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Canvas 2D context unavailable');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Load native image element for drawing
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image for canvas export'));
        img.src = imageSrc;
      });

      // Draw exact sub-rectangle onto 1:1 square canvas
      ctx.drawImage(
        img,
        Math.max(0, sx),
        Math.max(0, sy),
        Math.min(naturalWidth - sx, sWidth),
        Math.min(naturalHeight - sy, sHeight),
        0,
        0,
        OUTPUT_CANVAS_SIZE,
        OUTPUT_CANVAS_SIZE
      );

      // Convert canvas to Blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92);
      });

      if (!blob) {
        const fallbackDataUrl = canvas.toDataURL('image/jpeg', 0.92);
        onConfirmCrop(fallbackDataUrl);
        onClose();
        return;
      }

      // Try uploading to Cloudinary
      const file = new File([blob], `cat_crop_${Date.now()}.jpg`, { type: 'image/jpeg' });
      try {
        setUploadProgress(15);
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

      // Fallback: High quality data URL
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      onConfirmCrop(dataUrl);
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

  // Display dimensions for preview image element
  const dispWidth = naturalDimensions ? naturalDimensions.width * baseScale * zoom : CROP_CONTAINER_SIZE;
  const dispHeight = naturalDimensions ? naturalDimensions.height * baseScale * zoom : CROP_CONTAINER_SIZE;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md transition-all animate-fade-in">
      {/* Hidden file input for "Choose Another Image" */}
      <input
        ref={internalFileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        onChange={handleInternalFileSelect}
        className="hidden"
      />

      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-[440px] sm:max-w-[480px] max-h-[calc(100dvh-24px)] sm:max-h-[calc(100vh-32px)] overflow-y-auto border border-brand-100 transform transition-all flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-warm-border flex items-center justify-between bg-gradient-to-r from-white via-warm-bg to-brand-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-charcoal-900 leading-tight">
                Crop Category Image
              </h3>
              <p className="text-[10px] sm:text-[11px] text-charcoal-500 font-semibold">
                Position & zoom to fit circular display
              </p>
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

        {/* Crop Area Body */}
        <div className="p-4 sm:p-5 space-y-3 bg-slate-900 select-none flex flex-col items-center justify-center shrink-0">
          
          {/* Circular Crop Mask Viewport */}
          <div
            style={{ width: CROP_CONTAINER_SIZE, height: CROP_CONTAINER_SIZE }}
            className="relative overflow-hidden rounded-full cursor-grab active:cursor-grabbing border-2 border-dashed border-white/80 shadow-2xl bg-black flex items-center justify-center touch-none select-none group"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
          >
            {/* The Source Image */}
            {loadingStatus === 'loaded' && naturalDimensions && (
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Crop target"
                style={{
                  width: `${dispWidth}px`,
                  height: `${dispHeight}px`,
                  transform: `translate(${pan.x}px, ${pan.y}px)`,
                  maxWidth: 'none',
                  maxHeight: 'none',
                }}
                className="pointer-events-none select-none transition-transform duration-75"
                draggable={false}
              />
            )}

            {/* Subtle Crosshair Guide Overlay */}
            {loadingStatus === 'loaded' && (
              <div className="absolute inset-0 pointer-events-none border border-white/20 rounded-full flex items-center justify-center">
                <div className="w-full h-[1px] bg-white/20" />
                <div className="h-full w-[1px] bg-white/20 absolute" />
              </div>
            )}

            {/* Drag Hint Badge */}
            {loadingStatus === 'loaded' && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 pointer-events-none bg-black/70 backdrop-blur-xs text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-white/10 opacity-75 group-hover:opacity-100 transition-opacity">
                <Move className="w-3 h-3 text-brand-400" />
                <span>Drag to Move</span>
              </div>
            )}

            {/* Loading Spinner */}
            {loadingStatus === 'loading' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 text-brand-400 p-4 text-center space-y-2">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-xs font-bold text-slate-200">Loading image…</span>
              </div>
            )}

            {/* Inline Error State */}
            {loadingStatus === 'error' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 text-white p-4 text-center space-y-2.5">
                <AlertCircle className="w-8 h-8 text-red-400" />
                <div>
                  <h4 className="text-xs font-black text-red-300">Unable to load image</h4>
                  <p className="text-[10px] text-slate-300 font-medium mt-0.5 leading-snug">
                    {errorMessage || 'The selected image could not be loaded.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => internalFileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-[11px] font-black inline-flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Choose Another Image</span>
                </button>
              </div>
            )}
          </div>

          {/* Helper Instruction Text */}
          <p className="text-[11px] text-slate-300 font-medium text-center">
            Drag to move • Pinch or use slider to zoom
          </p>
        </div>

        {/* Zoom & Adjustment Controls */}
        <div className="p-4 bg-white border-t border-warm-border space-y-3 shrink-0">
          
          {/* Zoom Header & Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-black text-charcoal-800">
              <span className="flex items-center gap-1">
                <span>Zoom Level</span>
                <span className="text-brand-600 font-mono text-[11px]">
                  ({Math.round(zoom * 100)}%)
                </span>
              </span>

              <button
                type="button"
                onClick={handleReset}
                disabled={isProcessing || loadingStatus !== 'loaded' || (zoom === 1 && pan.x === 0 && pan.y === 0)}
                className="inline-flex items-center gap-1 text-[11px] font-extrabold text-charcoal-500 hover:text-brand-600 disabled:opacity-40 transition-colors"
                title="Reset zoom and position"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleZoomChange(zoom - 0.1)}
                disabled={isProcessing || loadingStatus !== 'loaded' || zoom <= 1}
                className="p-2 text-charcoal-700 bg-warm-bg hover:bg-brand-100 rounded-xl border border-warm-border transition-colors disabled:opacity-40"
                title="Zoom Out"
                aria-label="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                disabled={isProcessing || loadingStatus !== 'loaded'}
                onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600 disabled:opacity-40"
              />

              <button
                type="button"
                onClick={() => handleZoomChange(zoom + 0.1)}
                disabled={isProcessing || loadingStatus !== 'loaded' || zoom >= 3}
                className="p-2 text-charcoal-700 bg-warm-bg hover:bg-brand-100 rounded-xl border border-warm-border transition-colors disabled:opacity-40"
                title="Zoom In"
                aria-label="Zoom In"
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
              disabled={isProcessing || loadingStatus !== 'loaded'}
              className="flex-1 py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-black text-xs shadow-md shadow-brand-600/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{uploadProgress ? `Uploading ${uploadProgress}%` : 'Processing…'}</span>
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
