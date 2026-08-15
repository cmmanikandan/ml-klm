import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Phone, MessageSquare, Heart, Share2, ArrowLeft, CheckCircle2, ShieldCheck, Wrench, Layers, Ruler } from 'lucide-react';
import { ProductGallery } from '../components/product/ProductGallery';
import { EnquiryModal } from '../components/product/EnquiryModal';
import { Button } from '../components/common/Button';
import { useLanguage } from '../context/LanguageContext';
import { useWishlist } from '../context/WishlistContext';
import { useRecentlyViewed } from '../context/RecentlyViewedContext';
import { Product } from '../types';
import { INITIAL_PRODUCTS, DEFAULT_SHOP_INFO } from '../lib/supabase';

import { useAuth } from '../context/AuthContext';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { trackProductView } = useRecentlyViewed();
  const { user } = useAuth();

  const isTamil = language === 'ta';

  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const product: Product | undefined = INITIAL_PRODUCTS.find((p) => p.id === id) || INITIAL_PRODUCTS[0];

  useEffect(() => {
    if (product?.id) {
      trackProductView(product.id);
    }
  }, [product?.id]);

  if (!product) {
    return (
      <div className="min-h-screen bg-warm-bg flex items-center justify-center p-4 text-center">
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Product not found</h2>
          <Button onClick={() => navigate('/products')}>Back to Products</Button>
        </div>
      </div>
    );
  }

  const isWishlisted = isInWishlist(product.id);
  const title = isTamil ? product.name_ta || product.name_en : product.name_en;
  const description = isTamil ? product.description_ta || product.description_en : product.description_en;
  const categoryName = isTamil ? product.category_name || 'பொதுவானது' : product.category_name || 'General';

  const handleWishlistToggle = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    toggleWishlist(product.id);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Manikandan Lathe - ${title}`,
          text: description,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleWhatsAppEnquiry = () => {
    const text = encodeURIComponent(
      `Hi Manikandan Lathe, I am interested in: *${title}*\nCategory: ${categoryName}\nPlease provide price and options.`
    );
    window.open(`https://wa.me/${DEFAULT_SHOP_INFO.whatsapp}?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-warm-bg pb-28 md:pb-14 pt-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Back Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-charcoal-700 hover:text-brand-600 bg-white px-3 py-1.5 rounded-full border border-warm-border shadow-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('back')}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleWishlistToggle}
              className={`p-2 rounded-full border transition-all shadow-sm ${
                isWishlisted
                  ? 'bg-rose-500 text-white border-rose-500'
                  : 'bg-white text-charcoal-700 border-warm-border hover:text-rose-500'
              }`}
              aria-label="Wishlist"
            >
              <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={handleShare}
              className="p-2 bg-white text-charcoal-700 hover:text-brand-600 rounded-full border border-warm-border transition-colors shadow-sm relative"
              aria-label="Share"
            >
              <Share2 className="w-5 h-5" />
              {copied && (
                <span className="absolute -bottom-8 right-0 bg-charcoal-900 text-white text-[10px] px-2 py-0.5 rounded shadow">
                  Copied Link!
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Product Details Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Left Column: Multi-Image Gallery */}
          <div>
            <ProductGallery
              images={product.images || (product.primary_image ? [product.primary_image] : [])}
              productTitle={title}
            />
          </div>

          {/* Right Column: Information & Actions */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-warm-border/80 shadow-card space-y-6">
            
            {/* Category Tag & Title */}
            <div>
              <span className="text-xs font-extrabold text-brand-600 uppercase tracking-wider block mb-1">
                {categoryName}
              </span>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-charcoal-900 leading-tight">
                {title}
              </h1>
            </div>

            {/* Price Hidden Notice Banner */}
            <div className="p-3.5 rounded-2xl bg-warm-bg border border-brand-200 flex items-center gap-3 text-xs text-charcoal-700 font-bold">
              <ShieldCheck className="w-5 h-5 text-brand-600 shrink-0" />
              <span>{t('price_hidden_notice')}</span>
            </div>

            {/* Product Description */}
            <div className="space-y-2">
              <h3 className="text-xs font-extrabold uppercase text-charcoal-500 tracking-wider">
                {t('description')}
              </h3>
              <p className="text-sm text-charcoal-700 leading-relaxed font-medium">
                {description}
              </p>
            </div>

            {/* Materials Used */}
            {product.materials && (
              <div className="p-4 rounded-2xl bg-warm-bg border border-warm-border space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-extrabold text-brand-600 uppercase">
                  <Layers className="w-4 h-4" />
                  <span>{t('materials')}</span>
                </div>
                <p className="text-xs font-bold text-charcoal-800">{product.materials}</p>
              </div>
            )}

            {/* Available Sizes */}
            {product.available_sizes && (
              <div className="p-4 rounded-2xl bg-warm-bg border border-warm-border space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-extrabold text-brand-600 uppercase">
                  <Ruler className="w-4 h-4" />
                  <span>{t('available_sizes')}</span>
                </div>
                <p className="text-xs font-bold text-charcoal-800">{product.available_sizes}</p>
              </div>
            )}

            {/* Product Specifications Table */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="space-y-2 pt-2 border-t border-warm-muted">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase text-charcoal-500 tracking-wider mb-2">
                  <Wrench className="w-4 h-4 text-brand-600" />
                  <span>{t('specifications')}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries(product.specifications).map(([key, val]) => (
                    <div key={key} className="bg-warm-bg p-2.5 rounded-xl border border-warm-border">
                      <span className="text-[11px] font-extrabold text-charcoal-500 block">{key}</span>
                      <span className="text-xs font-bold text-charcoal-900">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Primary Product Actions */}
            <div className="space-y-3 pt-4 border-t border-warm-muted">
              {/* Place Enquiry / Order Trigger */}
              <Button
                onClick={() => setIsEnquiryOpen(true)}
                variant="primary"
                size="lg"
                fullWidth
                className="py-4 text-base"
              >
                {t('place_enquiry')}
              </Button>

              {/* Call & WhatsApp Quick Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <a
                  href={`tel:${DEFAULT_SHOP_INFO.phone}`}
                  className="flex items-center justify-center gap-2 bg-white hover:bg-warm-hover text-charcoal-800 font-extrabold py-3.5 px-4 rounded-xl border-2 border-brand-200 shadow-sm transition-all text-xs"
                >
                  <Phone className="w-4 h-4 text-brand-600" />
                  <span>{t('call_shop')}</span>
                </a>

                <button
                  type="button"
                  onClick={handleWhatsAppEnquiry}
                  className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 px-4 rounded-xl shadow-md transition-all text-xs"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{t('whatsapp_enquiry')}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Enquiry Modal */}
      <EnquiryModal
        isOpen={isEnquiryOpen}
        onClose={() => setIsEnquiryOpen(false)}
        product={product}
      />
    </div>
  );
};
