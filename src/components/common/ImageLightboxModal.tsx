import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, Maximize2 } from 'lucide-react';

interface ImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  initialIndex?: number;
  productTitle?: string;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  isOpen,
  onClose,
  images,
  initialIndex = 0,
  productTitle = 'Product Image',
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setZoomLevel(1);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images.length]);

  if (!isOpen || images.length === 0) return null;

  const handleNext = () => {
    setZoomLevel(1);
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setZoomLevel(1);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel((prev) => Math.max(prev - 0.5, 1));
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentImg = images[currentIndex];
    if (currentImg) {
      window.open(currentImg, '_blank');
    }
  };

  const currentImage = images[currentIndex] || images[0];

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 select-none animate-fade-in"
      onClick={onClose}
    >
      {/* Top Controls Bar */}
      <div 
        className="flex items-center justify-between z-10 max-w-5xl w-full mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-white/80 bg-white/10 px-3 py-1.5 rounded-full border border-white/15">
            {currentIndex + 1} / {images.length}
          </span>
          <span className="text-xs font-bold text-white/90 truncate max-w-[200px] sm:max-w-md hidden sm:inline">
            {productTitle}
          </span>
        </div>

        {/* Zoom & Download Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoomLevel >= 3}
            className="p-2 text-white/90 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors disabled:opacity-30"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoomLevel <= 1}
            className="p-2 text-white/90 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors disabled:opacity-30"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="p-2 text-white/90 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            title="Open Full Image"
            aria-label="Open Full Image"
          >
            <Download className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white bg-rose-600/80 hover:bg-rose-600 rounded-full transition-colors ml-2 shadow-lg"
            title="Close (ESC)"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Display Area */}
      <div 
        className="flex-1 flex items-center justify-center relative overflow-hidden py-4 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Previous Button */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-2 sm:left-4 z-20 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 shadow-2xl transition-all transform active:scale-95"
            aria-label="Previous Image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Scalable Image */}
        <div 
          className="relative max-w-full max-h-full flex items-center justify-center transition-transform duration-200 cursor-zoom-in"
          style={{ transform: `scale(${zoomLevel})` }}
          onClick={() => setZoomLevel((prev) => (prev > 1 ? 1 : 2))}
        >
          <img
            src={currentImage}
            alt={productTitle}
            className="max-h-[72vh] max-w-[92vw] object-contain rounded-2xl shadow-2xl transition-all"
          />
        </div>

        {/* Next Button */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-2 sm:right-4 z-20 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 shadow-2xl transition-all transform active:scale-95"
            aria-label="Next Image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Bottom Thumbnail Strip */}
      {images.length > 1 && (
        <div 
          className="z-10 flex items-center justify-center gap-2 overflow-x-auto py-2 max-w-md mx-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => {
                setZoomLevel(1);
                setCurrentIndex(idx);
              }}
              className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                currentIndex === idx
                  ? 'border-brand-500 ring-2 ring-brand-400 scale-105 opacity-100'
                  : 'border-white/20 opacity-50 hover:opacity-100'
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
