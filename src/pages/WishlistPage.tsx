import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ArrowLeft } from 'lucide-react';
import { ProductCard } from '../components/product/ProductCard';
import { Button } from '../components/common/Button';
import { useWishlist } from '../context/WishlistContext';
import { useLanguage } from '../context/LanguageContext';
import { INITIAL_PRODUCTS } from '../lib/supabase';

export const WishlistPage: React.FC = () => {
  const { wishlistProductIds } = useWishlist();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const wishlistedProducts = INITIAL_PRODUCTS.filter((p) => wishlistProductIds.includes(p.id));

  return (
    <div className="min-h-screen bg-warm-bg pb-24 md:pb-12 pt-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-charcoal-700 bg-white rounded-full border border-warm-border shadow-sm"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-2xl font-black text-charcoal-900">{t('my_wishlist')}</h1>
          </div>

          <span className="text-xs font-extrabold text-brand-600 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
            {wishlistedProducts.length} Items
          </span>
        </div>

        {wishlistedProducts.length === 0 ? (
          <div className="bg-white p-8 text-center rounded-3xl border border-warm-border space-y-3 max-w-md mx-auto">
            <Heart className="w-12 h-12 text-rose-400 mx-auto" />
            <h3 className="text-lg font-bold">Your wishlist is empty</h3>
            <p className="text-xs text-charcoal-500">Tap the heart icon on any product to save it here!</p>
            <Button onClick={() => navigate('/products')} variant="primary">
              {t('nav_products')}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {wishlistedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
