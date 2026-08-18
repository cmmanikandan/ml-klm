import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Flame, ThumbsUp, Clock, PackageX, CreditCard } from 'lucide-react';
import { SearchCard } from '../components/common/SearchCard';
import { ProductCard } from '../components/product/ProductCard';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useRecentlyViewed } from '../context/RecentlyViewedContext';
import { Category, Product, Order } from '../types';
import { supabase } from '../lib/supabase';
import { fetchActiveProducts, getCachedProducts } from '../lib/productsStore';
import { fetchActiveCategories, getCachedCategories } from '../lib/categoriesStore';

export const HomePage: React.FC = () => {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const { recentlyViewedIds } = useRecentlyViewed();
  const navigate = useNavigate();

  const isTamil = language === 'ta';

  // Instant offline/cached initial states - Zero delay and Zero layout shift on first frame
  const [categories, setCategories] = useState<Category[]>(() => getCachedCategories());
  const [products, setProducts] = useState<Product[]>(() => getCachedProducts());
  const [pendingPaymentOrders, setPendingPaymentOrders] = useState<Order[]>(() => {
    try {
      const cached = localStorage.getItem('ml_cached_pending_orders');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(() => getCachedProducts().length === 0);

  useEffect(() => {
    fetchLiveHomeData();
  }, [user?.id, user?.phone]);

  const fetchLiveHomeData = async () => {
    try {
      // 1. Fetch Categories (with automatic offline cache sync)
      const liveCats = await fetchActiveCategories();
      if (liveCats && liveCats.length > 0) {
        setCategories(liveCats);
      }

      // 2. Fetch Active Products (with automatic offline cache sync)
      const activeProds = await fetchActiveProducts();
      if (activeProds && activeProds.length > 0) {
        setProducts(activeProds);
      }

      // 3. Fetch Live Orders strictly for this authenticated customer
      if (!user?.id) {
        setPendingPaymentOrders([]);
        localStorage.removeItem('ml_cached_pending_orders');
        setLoading(false);
        return;
      }

      const { data: dbOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const customerOrders = dbOrders || [];

      // Filter orders where admin requested payment or balance is pending
      const pending = customerOrders.filter((o: any) => {
        const isPaid = o.payment_status === 'paid';
        if (isPaid) return false;

        const totalAmt = Number(o.total_amount || 0);
        const reqAmt = Number(o.payment_request_amount || 0);
        const advAmt = Number(o.advance_amount || 0);
        const remAmt = Number(o.remaining_amount || 0);
        const isReqFlag = o.is_payment_requested === true;
        const isPartial = o.payment_status === 'partially_paid';

        return isReqFlag || reqAmt > 0 || advAmt > 0 || remAmt > 0 || totalAmt > 0 || isPartial;
      });

      setPendingPaymentOrders(pending);
      try {
        localStorage.setItem('ml_cached_pending_orders', JSON.stringify(pending));
      } catch (e) {}
    } catch (e) {
      console.warn('Error fetching home page live data', e);
    } finally {
      setLoading(false);
    }
  };

  // Time-based Greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return isTamil ? 'காலை வணக்கம்' : 'Good Morning';
    if (hour < 17) return isTamil ? 'மதிய வணக்கம்' : 'Good Afternoon';
    return isTamil ? 'மாலை வணக்கம்' : 'Good Evening';
  };

  const featuredProducts = products.filter((p) => p.is_best_selling || p.is_new).slice(0, 4);
  const displayProducts = featuredProducts.length > 0 ? featuredProducts : products.slice(0, 4);
  const recentlyViewedProducts = products.filter((p) => recentlyViewedIds.includes(p.id));

  return (
    <div className="min-h-screen bg-warm-bg pb-24 md:pb-12 pt-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Top User Greeting & Workshop Brand Hero Card */}
        <div className="relative overflow-hidden bg-slate-900 text-white rounded-3xl p-6 sm:p-7 border border-slate-800 shadow-2xl space-y-4">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-black text-amber-300 bg-amber-500/20 px-3.5 py-1 rounded-full border border-amber-500/40 uppercase tracking-widest shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>{getGreeting()} 👋</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-sm">
                {user?.full_name ? user.full_name : (isTamil ? 'வணக்கம், வாடிக்கையாளரே' : 'Welcome to Workshop')}
              </h1>

              <p className="text-xs text-slate-300 font-medium max-w-lg leading-relaxed">
                {isTamil 
                  ? 'மணிகண்டன் லேத் — ஸ்டீல் கேட், கிரில்ஸ், கலப்பை, ரூஃபிங் மற்றும் லேத் வேலைகள்'
                  : 'MANIKANDAN LATHE — Custom Steel Gates, Grills, Kallapai, Roofing & Precision Lathe Works'}
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <Link
                to="/products"
                className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-black px-5 py-3 rounded-2xl shadow-lg shadow-brand-600/40 transition-all inline-flex items-center gap-2 border border-brand-400/30"
              >
                <span>{isTamil ? 'பொருட்களைப் பார்' : 'Explore Catalogue'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* PENDING PAYMENT ACTION NOTIFICATION CARDS */}
        {pendingPaymentOrders.map((ord) => {
          const reqAmt = ord.payment_request_amount || ord.advance_amount || ord.remaining_amount || ord.total_amount || 0;
          return (
            <div
              key={ord.id}
              onClick={() => navigate(`/orders/${ord.id}`)}
              className="cursor-pointer group relative overflow-hidden bg-gradient-to-r from-amber-500 via-brand-600 to-orange-600 text-white rounded-3xl p-5 sm:p-6 border-2 border-amber-300 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 animate-bounce-subtle"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-300 text-charcoal-950 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shadow-sm">
                      <CreditCard className="w-3.5 h-3.5 text-charcoal-900" />
                      <span>{isTamil ? 'கட்டண அறிவிப்பு' : 'PAYMENT ACTION REQUIRED'}</span>
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-100 bg-black/20 px-2.5 py-0.5 rounded-full border border-white/20">
                      #{ord.order_number || ord.id}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-white group-hover:text-amber-200 transition-colors">
                    {ord.productName || (ord as any).product_name || (isTamil ? 'உற்பத்திப் பொருள்' : 'Custom Lathe Fabrication Product')}
                  </h3>

                  <p className="text-xs text-amber-100 font-medium leading-relaxed">
                    {isTamil 
                      ? 'நிர்வாகி முன்பணம்/கட்டணத் தொகையை நிர்ணயித்துள்ளார். ஆன்லைனில் பாதுகாப்பாக செலுத்த இங்கு கிளிக் செய்யவும்.' 
                      : 'Workshop admin requested payment for this order. Tap card to pay now via Razorpay.'}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/20 shrink-0">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] font-extrabold text-amber-200 uppercase tracking-wider block">PAYABLE DUE</span>
                    <span className="text-2xl font-black text-white font-mono drop-shadow-sm">
                      ₹{reqAmt.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="bg-white text-brand-700 group-hover:bg-amber-300 group-hover:text-charcoal-950 font-black px-4 py-2.5 rounded-2xl text-xs shadow-lg transition-all flex items-center gap-1.5">
                    <span>{isTamil ? 'செலுத்துக' : 'Pay Now'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Search Bar Card Component */}
        <SearchCard />

        {/* Popular Categories Horizontal Scrolling Section */}
        {categories.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-charcoal-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-600" />
                <span>{isTamil ? 'பிரபலமான பிரிவுகள்' : 'Popular Categories'}</span>
              </h2>
              <Link to="/products" className="text-xs font-extrabold text-brand-600 hover:text-brand-700">
                {isTamil ? 'அனைத்தும் →' : 'View All →'}
              </Link>
            </div>

            {/* Left to Right Horizontal Scrolling Circular Category Carousel */}
            <div className="flex items-start gap-3.5 sm:gap-5 overflow-x-auto pb-3 pt-1 scrollbar-none no-scrollbar snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/products?category=${cat.slug}`}
                  className="snap-start shrink-0 flex flex-col items-center text-center group cursor-pointer w-20 sm:w-24 focus:outline-none"
                >
                  {/* Perfect Circular Image Container */}
                  <div className="w-18 h-18 sm:w-22 sm:h-22 aspect-square rounded-full overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-300 relative flex items-center justify-center bg-brand-50">
                    {cat.image_url ? (
                      <img
                        src={cat.image_url}
                        alt={cat.name_en}
                        className="w-full h-full rounded-full object-cover group-hover:scale-108 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-brand-50 flex items-center justify-center text-brand-600">
                        <Flame className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  {/* Category Name Below Circle */}
                  <span className="mt-2 text-[11px] sm:text-xs font-black text-charcoal-900 group-hover:text-brand-600 transition-colors text-center line-clamp-2 leading-tight max-w-[80px] sm:max-w-[96px]">
                    {isTamil ? (cat.name_ta || cat.name_en) : cat.name_en}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Featured Products Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-charcoal-900 flex items-center gap-2">
              <ThumbsUp className="w-4 h-4 text-brand-600" />
              <span>{t('recommended')}</span>
            </h2>
            <Link to="/products" className="text-xs font-extrabold text-brand-600 hover:text-brand-700">
              {isTamil ? 'அனைத்தும்' : 'View All →'}
            </Link>
          </div>

          {loading && displayProducts.length === 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {[1, 2].map((n) => (
                <div key={n} className="bg-white rounded-3xl h-64 border border-warm-border animate-pulse p-4 flex flex-col justify-between">
                  <div className="w-full h-36 bg-warm-bg rounded-2xl" />
                  <div className="space-y-2 pt-2">
                    <div className="w-3/4 h-4 bg-warm-bg rounded-lg" />
                    <div className="w-1/2 h-3 bg-warm-bg rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {displayProducts.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 text-center border border-warm-border max-w-md mx-auto my-2 space-y-2">
              <PackageX className="w-8 h-8 text-brand-600 mx-auto" />
              <h3 className="text-sm font-black text-charcoal-900">
                {isTamil ? 'தயாரிப்புகள் ஏதும் இல்லை' : 'No Products Currently Listed'}
              </h3>
            </div>
          )}
        </div>

        {/* Recently Viewed Products */}
        {recentlyViewedProducts.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-warm-muted">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-charcoal-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-600" />
                <span>{t('recently_viewed')}</span>
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {recentlyViewedProducts.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
