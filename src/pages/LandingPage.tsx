import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Phone, ArrowRight, Sparkles, Flame, PackageX, Wrench } from 'lucide-react';
import { Logo } from '../components/common/Logo';
import { ProductCard } from '../components/product/ProductCard';
import { useLanguage } from '../context/LanguageContext';
import { DEFAULT_SHOP_INFO, supabase, INITIAL_CATEGORIES } from '../lib/supabase';
import { Product, Category } from '../types';
import { fetchActiveProducts } from '../lib/productsStore';
import { fetchActiveCategories } from '../lib/categoriesStore';

export const LandingPage: React.FC = () => {
  const { language, t } = useLanguage();
  const isTamil = language === 'ta';

  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLiveData();
  }, []);

  const fetchLiveData = async () => {
    setLoading(true);
    try {
      const activeCats = await fetchActiveCategories();
      setCategories(activeCats);

      const activeProds = await fetchActiveProducts();
      setProducts(activeProds);
    } catch (e) {
      console.warn('Error fetching live landing page data');
    } finally {
      setLoading(false);
    }
  };

  const featuredProducts = products.filter((p) => p.is_best_selling || p.is_new).slice(0, 4);
  const displayProducts = featuredProducts.length > 0 ? featuredProducts : products.slice(0, 4);

  return (
    <div className="min-h-screen bg-warm-bg">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-warm-bg to-warm-bg border-b border-warm-border pt-8 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Content */}
            <div className="space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-100 border border-brand-300 text-brand-700 text-xs font-extrabold shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isTamil ? '25+ வருட சிறந்த லேத் வெல்டிங் பாரம்பரியம்' : '25+ Years of Industrial Fabrication Excellence'}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-charcoal-900 leading-tight tracking-tight">
                {isTamil ? (
                  <>
                    கேட்டுகள், கிரில்கள், <span className="text-brand-600">ஏர் கலப்பை, கூரை ஸ்ட்ரக்சர்</span> & ARC வெல்டிங் வேலைகள்
                  </>
                ) : (
                  <>
                    Gates, Grills, <span className="text-brand-600">Kallapai, Roofing</span> & ARC Welding Fabrication
                  </>
                )}
              </h1>

              <p className="text-sm sm:text-base text-charcoal-600 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                {isTamil
                  ? 'உங்கள் வீடு, விவசாய நிலம் மற்றும் கட்டிடங்களுக்கான கேட், கிரில், ஏர் கலப்பை, கூரை ஸ்ட்ரக்சர் மற்றும் ARC வெல்டிங் லேத் வேலைகள் துல்லியமாகவும் உறுதியாகவும் செய்து தரப்படும்.'
                  : 'Engineered for extreme durability. Browse our catalogue of main entrance gates, safety grills, roofing structures, Kallapai, and precision ARC welding fabrication.'}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <Link
                  to="/products"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-brand-600 hover:bg-brand-700 text-white font-extrabold px-7 py-4 rounded-2xl shadow-lg shadow-brand-600/25 transition-all active:scale-95 text-base"
                >
                  <span>{isTamil ? 'பொருட்களைப் பார்' : 'Explore Products'}</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>

                <a
                  href={`tel:${DEFAULT_SHOP_INFO.phone}`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-white hover:bg-warm-hover text-charcoal-800 font-extrabold px-6 py-4 rounded-2xl border-2 border-brand-200 shadow-sm transition-all active:scale-95 text-base"
                >
                  <Phone className="w-5 h-5 text-brand-600" />
                  <span>Call Shop ({DEFAULT_SHOP_INFO.phone})</span>
                </a>
              </div>
            </div>

            {/* Right Workshop Brand Image */}
            <div className="relative flex justify-center">
              <div className="relative w-full max-w-md bg-white rounded-3xl p-6 border-2 border-brand-200 shadow-2xl space-y-4">
                <Logo size="lg" className="justify-center" />
                <div className="aspect-video bg-warm-bg rounded-2xl overflow-hidden border border-warm-border">
                  <img
                    src="/workshop_hero.png"
                    alt="Manikandan Lathe Workshop"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex items-center justify-between text-xs font-extrabold text-charcoal-700 bg-brand-50 p-3 rounded-xl border border-brand-200">
                  <span>📍 Kallimandhayam, Dindigul</span>
                  <span className="text-brand-600">Direct Workshop</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black text-charcoal-900">{t('categories_title')}</h2>
              <p className="text-xs text-charcoal-500 font-semibold mt-0.5">
                {isTamil ? 'எங்கள் பிரதான தயாரிப்பு பிரிவுகள்' : 'Explore by product category'}
              </p>
            </div>
            <Link to="/products" className="text-xs font-extrabold text-brand-600 hover:text-brand-700 flex items-center gap-1">
              <span>{t('view_all')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/products?category=${cat.slug}`}
                className="group bg-white p-4 rounded-2xl border border-warm-border/80 shadow-card hover:shadow-warm transition-all text-center flex flex-col items-center justify-center"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Flame className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-charcoal-900 group-hover:text-brand-600 transition-colors line-clamp-1">
                  {isTamil ? cat.name_ta || cat.name_en : cat.name_en}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products Section */}
      <section className="py-10 bg-white border-y border-warm-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black text-charcoal-900">{t('best_selling')}</h2>
              <p className="text-xs text-charcoal-500 font-semibold mt-0.5">
                {isTamil ? 'வாடிக்கையாளர்களால் பெரிதும் விரும்பப்படும் தயாரிப்புகள்' : 'Popular fabricated products'}
              </p>
            </div>
            <Link to="/products" className="text-xs font-extrabold text-brand-600 hover:text-brand-700 flex items-center gap-1">
              <span>{t('view_all')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="bg-warm-bg rounded-2xl h-60 border border-warm-border animate-pulse p-4" />
              ))}
            </div>
          ) : displayProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
              {displayProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="bg-warm-bg rounded-3xl p-8 text-center border border-warm-border max-w-md mx-auto my-4 space-y-2">
              <PackageX className="w-8 h-8 text-brand-600 mx-auto" />
              <h3 className="text-sm font-black text-charcoal-900">
                {isTamil ? 'தயாரிப்புகள் ஏதும் இல்லை' : 'No Products Currently Listed'}
              </h3>
              <p className="text-xs text-charcoal-500 font-medium">
                {isTamil ? 'புதிய தயாரிப்புகள் பட்டியலில் சேர்க்கப்பட்டவுடன் இங்கு தோன்றும்' : 'Products added by admin will appear here live'}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
