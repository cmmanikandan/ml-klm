import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Flame, ThumbsUp, Clock } from 'lucide-react';
import { SearchCard } from '../components/common/SearchCard';
import { ProductCard } from '../components/product/ProductCard';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useRecentlyViewed } from '../context/RecentlyViewedContext';
import { Category, Product } from '../types';
import { supabase, INITIAL_CATEGORIES, INITIAL_PRODUCTS } from '../lib/supabase';

export const HomePage: React.FC = () => {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const { recentlyViewedIds } = useRecentlyViewed();

  const isTamil = language === 'ta';

  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);

  useEffect(() => {
    fetchLiveHomeData();
  }, []);

  const fetchLiveHomeData = async () => {
    try {
      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (catData && catData.length > 0) setCategories(catData);

      const { data: prodData } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true);

      if (prodData && prodData.length > 0) setProducts(prodData);
    } catch (e) {
      console.warn('Using initial fallbacks for home page');
    }
  };

  // Time-based Greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return isTamil ? 'காலை வணக்கம்' : 'Good Morning';
    } else if (hour < 17) {
      return isTamil ? 'மதிய வணக்கம்' : 'Good Afternoon';
    } else {
      return isTamil ? 'மாலை வணக்கம்' : 'Good Evening';
    }
  };

  const customerFirstName = user?.full_name?.split(' ')[0] || (isTamil ? 'அன்பரே' : 'Customer');

  const newProducts = products.filter((p) => p.is_new);
  const bestSelling = products.filter((p) => p.is_best_selling);
  const recommended = products.slice(0, 4);
  const recentlyViewedProducts = products.filter((p) => recentlyViewedIds.includes(p.id));

  return (
    <div className="min-h-screen bg-warm-bg pb-24 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 space-y-6">
        
        {/* Dynamic Welcome Greeting */}
        <div className="bg-gradient-to-r from-brand-600 to-brand-700 rounded-3xl p-6 text-white shadow-warm-lg flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1 relative z-10">
            <span className="text-xs font-extrabold text-brand-200 uppercase tracking-widest block">
              MANIKANDAN LATHE
            </span>
            <h1 className="text-2xl sm:text-3xl font-black">
              {getGreeting()}, {customerFirstName} 👋
            </h1>
            <p className="text-xs text-brand-100 font-medium">
              {isTamil ? 'இன்றைய சிறந்த லேத் & வெல்டிங் தயாரிப்புகளைக் கண்டறியுங்கள்' : 'Explore today\'s precision lathe works & steel fabrication'}
            </p>
          </div>
          <div className="hidden sm:block text-brand-400 opacity-25 -mr-4 -mb-4">
            <Sparkles className="w-32 h-32" />
          </div>
        </div>

        {/* Dedicated Search Card */}
        <SearchCard />

        {/* Dynamic Categories (Circular Cards) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-charcoal-900">{t('categories_title')}</h2>
            <Link to="/products" className="text-xs font-extrabold text-brand-600 hover:text-brand-700 flex items-center gap-1">
              <span>{t('view_all')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/products?category=${cat.slug}`}
                className="group flex flex-col items-center shrink-0 w-20 text-center"
              >
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-brand-200 group-hover:border-brand-600 group-hover:scale-105 transition-all p-0.5 bg-white shadow-sm">
                  <img
                    src={cat.image_url || 'https://images.unsplash.com/photo-1580481072645-022f9a6d1270?w=200&auto=format&fit=crop&q=80'}
                    alt={cat.name_en}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <span className="text-[11px] font-bold text-charcoal-800 group-hover:text-brand-600 transition-colors mt-1.5 line-clamp-1">
                  {isTamil ? cat.name_ta : cat.name_en}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Section 1: New Products (Horizontal Scroll) */}
        {newProducts.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-600" />
                <h2 className="text-lg font-black text-charcoal-900">{t('new_products')}</h2>
              </div>
              <Link to="/products" className="text-xs font-extrabold text-brand-600 hover:text-brand-700">
                {t('view_all')}
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {newProducts.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}

        {/* Section 2: Best Selling */}
        {bestSelling.length > 0 && (
          <div className="space-y-3 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" />
                <h2 className="text-lg font-black text-charcoal-900">{t('best_selling')}</h2>
              </div>
              <Link to="/products" className="text-xs font-extrabold text-brand-600 hover:text-brand-700">
                {t('view_all')}
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {bestSelling.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}

        {/* Section 3: Recommended For You */}
        <div className="space-y-3 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ThumbsUp className="w-4 h-4 text-brand-600" />
              <h2 className="text-lg font-black text-charcoal-900">{t('recommended')}</h2>
            </div>
            <Link to="/products" className="text-xs font-extrabold text-brand-600 hover:text-brand-700">
              {t('view_all')}
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {recommended.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>

        {/* Section 4: Recently Viewed Products */}
        {recentlyViewedProducts.length > 0 && (
          <div className="space-y-3 pt-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-charcoal-500" />
              <h2 className="text-lg font-black text-charcoal-900">{t('recently_viewed')}</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
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
