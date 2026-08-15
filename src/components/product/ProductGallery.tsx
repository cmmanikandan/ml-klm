import React, { useState } from 'react';
import { Maximize2, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductGalleryProps {
  images: string[];
  productTitle: string;
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({ images, productTitle }) => {
  const imageList = images && images.length > 0
    ? images
    : ['https://images.unsplash.com/photo-1580481072645-022f9a6d1270?w=800&auto=format&fit=crop&q=80'];

  const [activeIndex, setActiveIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const activeImage = imageList[activeIndex] || imageList[0];

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? imageList.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev === imageList.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-3">
      {/* Main Image Stage */}
      <div className="relative aspect-[4/3] sm:aspect-square bg-warm-bg rounded-2xl overflow-hidden border border-warm-border shadow-card group">
        <img
          src={activeImage}
          alt={`${productTitle} image ${activeIndex + 1}`}
          className="w-full h-full object-cover transition-all duration-300"
        />

        {/* Fullscreen Button */}
        <button
          onClick={() => setIsFullscreen(true)}
          className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-md transition-all shadow-md"
          aria-label="View Fullscreen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Navigation Arrows for Gallery */}
        {imageList.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-charcoal-800 p-2 rounded-full shadow-md backdrop-blur-sm transition-all"
              aria-label="Previous Image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-charcoal-800 p-2 rounded-full shadow-md backdrop-blur-sm transition-all"
              aria-label="Next Image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails Row */}
      {imageList.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {imageList.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                activeIndex === idx
                  ? 'border-brand-600 ring-2 ring-brand-500/30 scale-105'
                  : 'border-warm-border opacity-70 hover:opacity-100'
              }`}
            >
              <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Modal Viewer */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 text-white bg-white/20 p-3 rounded-full hover:bg-white/40 transition-colors z-10"
            aria-label="Close Fullscreen"
          >
            <X className="w-6 h-6" />
          </button>

          <img
            src={activeImage}
            alt={productTitle}
            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
          />

          {imageList.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/60 px-4 py-2 rounded-full backdrop-blur-md text-white">
              <button onClick={handlePrev} className="hover:text-brand-400">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <span className="text-sm font-bold">
                {activeIndex + 1} / {imageList.length}
              </span>
              <button onClick={handleNext} className="hover:text-brand-400">
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
