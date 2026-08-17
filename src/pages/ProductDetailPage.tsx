import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Heart, 
  Share2, 
  Check, 
  ShieldCheck, 
  Phone, 
  Send,
  Building2,
  Sparkles,
  Package,
  Wrench,
  ThumbsUp,
  Maximize2
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { ProductCard } from '../components/product/ProductCard';
import { EnquiryModal } from '../components/product/EnquiryModal';
import { ImageLightboxModal } from '../components/common/ImageLightboxModal';
import { useLanguage } from '../context/LanguageContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { useRecentlyViewed } from '../context/RecentlyViewedContext';
import { DEFAULT_SHOP_INFO } from '../lib/supabase';
import { fetchProductById, fetchActiveProducts } from '../lib/productsStore';
import { Product } from '../types';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { user } = useAuth();
  const { trackProductView } = useRecentlyViewed();

  const isTamil = language === 'ta';

  const [product, setProduct] = useState<Product | null>(null);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (id) {
      fetchDetail(id);
    }
  }, [id]);

  const fetchDetail = async (productId: string) => {
    setLoading(true);
    const prod = await fetchProductById(productId);
    setProduct(prod);

    if (prod) {
      trackProductView(prod.id);

      // Fetch recommended products from same catalogue
      const allActive = await fetchActiveProducts();
      const filtered = allActive
        .filter((p) => p.id !== productId)
        .slice(0, 4);
      setRecommendedProducts(filtered);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-bg flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-brand-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-warm-bg flex items-center justify-center p-4 text-center">
        <div className="bg-white rounded-3xl p-8 border border-warm-border shadow-card max-w-sm w-full space-y-4">
          <Package className="w-12 h-12 text-brand-600 mx-auto" />
          <h2 className="text-lg font-black text-charcoal-900">Product Not Found</h2>
          <p className="text-xs text-charcoal-500 font-medium">This product may have been removed or is unavailable in catalogue.</p>
          <Button onClick={() => navigate('/products')} variant="primary" fullWidth>
            Back to Products Catalogue
          </Button>
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
          title,
          text: description,
          url: window.location.href,
        });
      } catch (err) {
        // Share cancelled
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const fallbackImage = 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80';
  const images = product.images && product.images.length > 0 && product.images[0] 
    ? product.images 
    : [product.primary_image || fallbackImage];

  return (
    <div className="min-h-screen bg-warm-bg pb-36 lg:pb-32 pt-4">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Top Header Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-charcoal-700 bg-white rounded-full border border-warm-border shadow-sm hover:bg-warm-bg transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 text-charcoal-700 bg-white rounded-full border border-warm-border shadow-sm hover:bg-warm-bg transition-colors"
              aria-label="Share"
            >
              {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Share2 className="w-5 h-5" />}
            </button>
            <button
              onClick={handleWishlistToggle}
              className={`p-2 rounded-full border border-warm-border shadow-sm transition-colors ${
                isWishlisted ? 'bg-rose-500 text-white border-rose-500' : 'bg-white text-charcoal-700 hover:text-rose-500'
              }`}
              aria-label="Wishlist"
            >
              <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* Product Image Gallery & Main View */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-warm-border shadow-card space-y-4">
          <div 
            onClick={() => setIsLightboxOpen(true)}
            className="relative aspect-square sm:aspect-video rounded-2xl overflow-hidden bg-warm-bg border border-warm-border cursor-pointer group"
            title="Click to view full image & zoom"
          >
            <img
              src={images[selectedImageIndex] || images[0] || fallbackImage}
              alt={title}
              onError={(e) => {
                (e.target as HTMLImageElement).src = fallbackImage;
              }}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />

            {/* Click to Zoom Badge */}
            <div className="absolute bottom-3 right-3 bg-black/70 hover:bg-black text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-xs shadow-lg transition-all">
              <Maximize2 className="w-3.5 h-3.5 text-brand-400" />
              <span>{isTamil ? 'பெரிதாக்குக' : 'Click to Zoom'}</span>
            </div>
          </div>

          {/* Thumbnail Selector */}
          {images.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedImageIndex(idx);
                  }}
                  className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                    selectedImageIndex === idx ? 'border-brand-600 ring-2 ring-brand-500/30' : 'border-warm-border opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Basic Info Card */}
        <div className="bg-white rounded-3xl p-6 border border-warm-border shadow-card space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-black text-brand-600 uppercase tracking-widest bg-brand-50 px-3.5 py-1 rounded-full border border-brand-200">
              {categoryName}
            </span>

            {product.is_best_selling && (
              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-xs font-extrabold px-3 py-1 rounded-full border border-amber-200">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isTamil ? 'சிறந்த விற்பனை தயாரிப்பு' : 'Best Selling Design'}</span>
              </span>
            )}

            {product.is_new && (
              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs font-extrabold px-3 py-1 rounded-full border border-emerald-200">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isTamil ? 'புதிய தயாரிப்பு' : 'New Design'}</span>
              </span>
            )}

            {product.is_featured && (
              <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-xs font-extrabold px-3 py-1 rounded-full border border-purple-200">
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>{isTamil ? 'சிறப்பு தயாரிப்பு' : 'Featured Product'}</span>
              </span>
            )}

            {product.is_popular && (
              <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs font-extrabold px-3 py-1 rounded-full border border-blue-200">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isTamil ? 'பிரபலமான டிசைன்' : 'Popular Design'}</span>
              </span>
            )}

            {product.is_custom_fabrication && (
              <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-800 text-xs font-extrabold px-3 py-1 rounded-full border border-orange-200">
                <Wrench className="w-3.5 h-3.5" />
                <span>{isTamil ? 'கஸ்டம் அளவு ஏற்றுக்கொள்ளப்படும்' : 'Custom Dimensions Accepted'}</span>
              </span>
            )}

            {product.is_in_stock && (
              <span className="inline-flex items-center gap-1 bg-teal-100 text-teal-800 text-xs font-extrabold px-3 py-1 rounded-full border border-teal-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isTamil ? 'இருப்பில் உள்ளது' : 'In Stock'}</span>
              </span>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-charcoal-900 leading-snug">{title}</h1>
          <p className="text-xs sm:text-sm text-charcoal-600 leading-relaxed font-medium">{description}</p>
        </div>



        {/* Shop Quality Assurances */}
        <div className="bg-white rounded-3xl p-6 border border-warm-border shadow-card grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-brand-100 text-brand-600 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-charcoal-900">Direct Lathe Manufacturer</h4>
              <p className="text-[11px] text-charcoal-500 font-medium">Fabricated in Kallimandhayam workshop with grade steel.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-600 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-charcoal-900">Custom Dimensions Accepted</h4>
              <p className="text-[11px] text-charcoal-500 font-medium">Specify height, width & metal thickness during enquiry.</p>
            </div>
          </div>
        </div>

        {/* Recommended Products Section */}
        {recommendedProducts.length > 0 && (
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-charcoal-900 flex items-center gap-2">
                <ThumbsUp className="w-4 h-4 text-brand-600" />
                <span>{isTamil ? 'பரிந்துரைக்கப்பட்ட தயாரிப்புகள்' : 'Recommended Fabricated Products'}</span>
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {recommendedProducts.map((recProd) => (
                <ProductCard key={recProd.id} product={recProd} />
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Floating Bottom Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-warm-border p-3.5 shadow-2xl">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <a
            href={`tel:${DEFAULT_SHOP_INFO.phone}`}
            className="flex-1 flex items-center justify-center gap-2 bg-warm-bg hover:bg-warm-hover text-charcoal-800 font-extrabold py-3.5 px-4 rounded-2xl border-2 border-warm-border text-xs sm:text-sm transition-all"
          >
            <Phone className="w-4 h-4 text-brand-600" />
            <span>Call Shop</span>
          </a>

          <button
            onClick={() => setIsEnquiryOpen(true)}
            className="flex-[2] flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-extrabold py-3.5 px-4 rounded-2xl text-xs sm:text-sm shadow-lg shadow-brand-600/30 transition-all active:scale-95"
          >
            <Send className="w-4 h-4" />
            <span>{isTamil ? 'இலவசமாக பெற வினவவும்' : 'Submit Free Enquiry / Get Quote'}</span>
          </button>
        </div>
      </div>

      {/* Free Enquiry Submission Modal */}
      {isEnquiryOpen && (
        <EnquiryModal isOpen={isEnquiryOpen} product={product} onClose={() => setIsEnquiryOpen(false)} />
      )}

      {/* Fullscreen High-Res Image Lightbox Modal */}
      <ImageLightboxModal
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        images={images}
        initialIndex={selectedImageIndex}
        productTitle={title}
      />
    </div>
  );
};
