import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Flame, ThumbsUp, Clock, PackageX } from 'lucide-react';
import { SearchCard } from '../components/common/SearchCard';
import { ProductCard } from '../components/product/ProductCard';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useRecentlyViewed } from '../context/RecentlyViewedContext';
import { Category, Product } from '../types';
import { supabase, INITIAL_CATEGORIES } from '../lib/supabase';
import { fetchActiveProducts } from '../lib/productsStore';

export const HomePage: React.FC = () => {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const { recentlyViewedIds } = useRecentlyViewed();

  const isTamil = language === 'ta';

  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLiveHomeData();
  }, []);

  const fetchLiveHomeData = async () => {
    setLoading(true);
    try {
      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (catData && catData.length > 0) setCategories(catData);

      const activeProds = await fetchActiveProducts();
      setProducts(activeProds);
    } catch (e) {
      console.warn('Error fetching home page live data');
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
        
        {/* Top User Greeting & Store Subtitle */}
        <div className="flex items-center justify-between bg-white rounded-3xl p-5 sm:p-6 border border-warm-border shadow-card">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {getGreeting()} 👋
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-charcoal-900">
              {user?.full_name ? user.full_name : (isTamil ? 'வணக்கம், வாடிக்கையாளரே' : 'Welcome to Workshop')}
            </h1>
            <p className="text-xs text-charcoal-500 font-semibold">
              {isTamil ? 'மணிகண்டன் லேத் & வெல்டிங் ஒர்க்ஸ், கள்ளிமந்தையம்' : 'MANIKANDAN LATHE – Welding Works, Kallimandhayam'}
            </p>
          </div>
        </div>

        {/* Search Bar Card Component */}
        <SearchCard />

        {/* Categories Section */}
        {categories.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-charcoal-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-600" />
                <span>{t('popular_categories')}</span>
              </h2>
              <Link to="/products" className="text-xs font-extrabold text-brand-600 hover:text-brand-700">
                {isTamil ? 'அனைத்தும்' : 'View All →'}
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/products?category=${cat.slug}`}
                  className="bg-white rounded-2xl p-4 border border-warm-border shadow-card hover:shadow-warm-md hover:border-brand-300 transition-all flex flex-col items-center text-center group"
                >
                  <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Flame className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-extrabold text-charcoal-900 group-hover:text-brand-600 transition-colors line-clamp-1">
                    {isTamil ? cat.name_ta || cat.name_en : cat.name_en}
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
              <span>{t('featured_products')}</span>
            </h2>
            <Link to="/products" className="text-xs font-extrabold text-brand-600 hover:text-brand-700">
              {isTamil ? 'அனைத்தையும் பார் →' : 'See All →'}
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="bg-white rounded-2xl h-60 border border-warm-border animate-pulse p-3" />
              ))}
            </div>
          ) : displayProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {displayProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 text-center border border-warm-border shadow-card">
              <PackageX className="w-8 h-8 text-brand-600 mx-auto mb-2" />
              <h3 className="text-sm font-black text-charcoal-900">
                {isTamil ? 'தயாரிப்புகள் ஏதும் இல்லை' : 'No Products Listed Yet'}
              </h3>
              <p className="text-xs text-charcoal-500 font-medium mt-1">
                {isTamil ? 'புதிய தயாரிப்புகள் விரைவில் சேர்க்கப்படும்' : 'New products will be added soon'}
              </p>
            </div>
          )}
        </div>

        {/* Recently Viewed Section */}
        {recentlyViewedProducts.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-charcoal-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-600" />
                <span>{isTamil ? 'சமீபத்தில் பார்த்தவை' : 'Recently Viewed'}</span>
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {recentlyViewedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
