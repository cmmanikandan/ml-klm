import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Sparkles, Share2 } from 'lucide-react';
import { Product } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { language } = useLanguage();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { user } = useAuth();
  const navigate = useNavigate();

  const isTamil = language === 'ta';
  const isWishlisted = Boolean(product?.id && isInWishlist(String(product.id)));

  const title = isTamil ? product.name_ta || product.name_en : product.name_en;
  const category = isTamil
    ? product.category_name || 'பொதுவானது'
    : product.category_name || 'General';

  const imageUrl =
    product.primary_image ||
    (product.images && product.images.length > 0
      ? product.images[0]
      : 'https://images.unsplash.com/photo-1580481072645-022f9a6d1270?w=600&auto=format&fit=crop&q=80');

  const handleCardClick = () => {
    navigate(`/products/${product.id}`);
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const prodUrl = `${window.location.origin}/products/${product.id}`;
    const text = `🛠️ *${title}*\nManikandan Lathe – Welding Works (Kallimandhayam)\n\n📍 View Product Details: ${prodUrl}`;

    if (navigator.share) {
      navigator.share({
        title: title,
        text: text,
        url: prodUrl
      }).catch(() => {});
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Require Login for Wishlist Action
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (product?.id) {
      toggleWishlist(String(product.id));
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="group bg-white rounded-2xl border border-warm-border/80 shadow-card hover:shadow-warm-lg transition-all duration-300 overflow-hidden flex flex-col relative h-full cursor-pointer"
    >
      {/* Share & Wishlist Action Buttons */}
      <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleShareClick}
          className="p-1.5 rounded-full bg-white/80 hover:bg-white text-emerald-700 hover:text-emerald-800 backdrop-blur-md shadow-sm transition-all"
          title="Share Product via WhatsApp"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={handleWishlistClick}
          className={`p-1.5 rounded-full backdrop-blur-md transition-all shadow-sm ${
            isWishlisted
              ? 'bg-rose-500 text-white shadow-rose-500/30'
              : 'bg-white/80 text-charcoal-600 hover:bg-white hover:text-rose-500'
          }`}
          aria-label="Add to Wishlist"
        >
          <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Badges */}
      <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1 pointer-events-none">
        {product.is_new && (
          <span className="inline-flex items-center gap-1 bg-brand-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm">
            <Sparkles className="w-2.5 h-2.5" />
            <span>NEW</span>
          </span>
        )}
        {product.is_best_selling && (
          <span className="bg-amber-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm">
            BESTSELLER
          </span>
        )}
      </div>

      {/* Product Image Showcase - Uncropped Full Product View */}
      <div className="block relative aspect-square overflow-hidden bg-white p-2.5 sm:p-3 flex items-center justify-center border-b border-warm-border/50">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-300 select-none"
          loading="lazy"
        />
      </div>

      {/* Product Details & Specifications */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between space-y-2">
        <div>
          <span className="text-[11px] font-bold text-brand-600 tracking-wider uppercase block mb-0.5 truncate">
            {category}
          </span>
          <h3 className="text-xs sm:text-sm font-bold text-charcoal-900 group-hover:text-brand-600 transition-colors line-clamp-2 leading-snug">
            {title}
          </h3>
        </div>

        {/* Action Trigger Link */}
        <div className="pt-2 border-t border-warm-muted flex items-center justify-between">
          <span className="text-[11px] font-bold text-charcoal-500 group-hover:text-brand-600 transition-colors">
            {isTamil ? 'விவரங்களை பார்' : 'View Details'}
          </span>
          <span className="text-xs font-black text-brand-600 group-hover:translate-x-1 transition-transform">
            →
          </span>
        </div>
      </div>
    </div>
  );
};
