import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Sparkles } from 'lucide-react';
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
  const isWishlisted = isInWishlist(product.id);

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

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Require Login for Wishlist Action
    if (!user) {
      navigate('/login');
      return;
    }
    
    toggleWishlist(product.id);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group bg-white rounded-2xl border border-warm-border/80 shadow-card hover:shadow-warm-lg transition-all duration-300 overflow-hidden flex flex-col relative h-full cursor-pointer"
    >
      {/* Wishlist Button */}
      <button
        type="button"
        onClick={handleWishlistClick}
        className={`absolute top-2.5 right-2.5 z-10 p-2 rounded-full backdrop-blur-md transition-all shadow-sm ${
          isWishlisted
            ? 'bg-rose-500 text-white shadow-rose-500/30'
            : 'bg-white/80 text-charcoal-600 hover:bg-white hover:text-rose-500'
        }`}
        aria-label="Add to Wishlist"
      >
        <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
      </button>

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

      {/* Product Image Showcase */}
      <div className="block relative aspect-square overflow-hidden bg-warm-bg">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </div>

      {/* Product Details (COMPACT - NO PRICE SHOWN) */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          <span className="text-[11px] font-bold text-brand-600 tracking-wider uppercase block mb-0.5 truncate">
            {category}
          </span>
          <h3 className="text-xs sm:text-sm font-bold text-charcoal-900 group-hover:text-brand-600 transition-colors line-clamp-2 leading-snug">
            {title}
          </h3>
        </div>

        {/* Action Trigger Link */}
        <div className="mt-3 pt-2 border-t border-warm-muted flex items-center justify-between">
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
