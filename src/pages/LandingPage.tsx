import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Phone, ArrowRight, Sparkles, Flame, PackageX, Wrench, ShieldCheck, MapPin, Clock, MessageSquare, Navigation, CheckCircle2 } from 'lucide-react';
import { Logo } from '../components/common/Logo';
import { ProductCard } from '../components/product/ProductCard';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_SHOP_INFO, supabase, INITIAL_CATEGORIES } from '../lib/supabase';
import { Product, Category } from '../types';
import { fetchActiveProducts, getCachedProducts } from '../lib/productsStore';
import { fetchActiveCategories, getCachedCategories } from '../lib/categoriesStore';

export const LandingPage: React.FC = () => {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const isTamil = language === 'ta';

  const [categories, setCategories] = useState<Category[]>(() => getCachedCategories());
  const [products, setProducts] = useState<Product[]>(() => getCachedProducts());
  const [loading, setLoading] = useState(() => getCachedProducts().length === 0);

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

      {/* Categories Section - Left-to-Right Horizontal Scrolling Carousel */}
      {categories.length > 0 && (
        <section className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-charcoal-900">{t('categories_title')}</h2>
              <p className="text-xs text-charcoal-500 font-semibold mt-0.5">
                {isTamil ? 'எங்கள் பிரதான தயாரிப்பு பிரிவுகள்' : 'Explore by product category'}
              </p>
            </div>
            <Link to="/products" className="text-xs font-extrabold text-brand-600 hover:text-brand-700 flex items-center gap-1">
              <span>{t('view_all')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Left to Right Horizontal Scrolling Circular Category Carousel */}
          <div className="flex items-start gap-4 sm:gap-6 overflow-x-auto pb-3 pt-1 scrollbar-none no-scrollbar snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/products?category=${cat.slug}`}
                className="snap-start shrink-0 flex flex-col items-center text-center group cursor-pointer w-22 sm:w-28 focus:outline-none"
              >
                {/* Perfect Circular Image Container */}
                <div className="w-20 h-20 sm:w-26 sm:h-26 aspect-square rounded-full overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-300 relative flex items-center justify-center bg-brand-50">
                  {cat.image_url ? (
                    <img
                      src={cat.image_url}
                      alt={cat.name_en}
                      className="w-full h-full rounded-full object-cover group-hover:scale-108 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-brand-50 flex items-center justify-center text-brand-600">
                      <Flame className="w-8 h-8" />
                    </div>
                  )}
                </div>

                {/* Category Name Below Circle */}
                <span className="mt-2 text-xs sm:text-sm font-black text-charcoal-900 group-hover:text-brand-600 transition-colors text-center line-clamp-2 leading-tight max-w-[88px] sm:max-w-[110px]">
                  {isTamil ? (cat.name_ta || cat.name_en) : cat.name_en}
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

      {/* EMERGENCY LATHE REPAIR & MACHINING SERVICE BANNER */}
      <section className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-900 via-charcoal-900 to-slate-950 text-white rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl relative overflow-hidden space-y-6">
          <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-black uppercase tracking-wider">
                <Wrench className="w-3.5 h-3.5 text-amber-400" />
                <span>{isTamil ? 'பழுதுபார்ப்பு & லேத் டர்னிங் சேவை' : 'LATHE MACHINING & BREAKDOWN REPAIR'}</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {isTamil
                  ? 'டிராக்டர் பாகங்கள், ஷாஃப்ட் & விவசாய கருவிகள் பழுதா? உடனடியாக சரிசெய்கிறோம்!'
                  : 'Broken Tractor Shaft, Machine Parts, or Cultivators? Fast Precision Repairs.'}
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                {isTamil
                  ? 'கள்ளிமந்தையம் பட்டறைக்கு உடைந்த பாகங்களைக் கொண்டு வரவும். எங்களின் அனுபவமிக்க லேத் கைவினைஞர்கள் துல்லியமாக லேத் டர்னிங் & வெல்டிங் செய்து தருவார்கள்.'
                  : 'Submit a photo of the damaged machine part online or bring it directly to our Kallimandhayam workshop. Fast turnaround with extreme tolerance precision.'}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-amber-300 font-bold pt-1">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{isTamil ? 'அவசர பழுதுபார்ப்பு (Same-Day / 24h)' : 'Emergency Same-Day Service'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{isTamil ? '100% உறுதியான வெல்டிங்' : 'High-Strength ARC Welding'}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
              <Link
                to={user ? "/repair" : "/login?redirect=/repair"}
                onClick={() => {
                  if (!user) {
                    try {
                      sessionStorage.setItem('ml_auth_redirect', '/repair');
                    } catch (e) {}
                  }
                }}
                className="inline-flex items-center justify-center gap-2.5 bg-brand-600 hover:bg-brand-700 text-white font-black px-6 py-4 rounded-2xl shadow-xl shadow-brand-600/40 transition-all text-sm active:scale-95 border border-brand-400/40"
              >
                <Wrench className="w-4 h-4" />
                <span>{isTamil ? 'பழுது விபரம் பதிவு செய்க' : 'Book Repair Service'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <a
                href={`tel:${DEFAULT_SHOP_INFO.phone}`}
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-extrabold px-5 py-3.5 rounded-2xl border border-white/20 transition-all text-xs"
              >
                <Phone className="w-4 h-4 text-brand-400" />
                <span>Call Workshop ({DEFAULT_SHOP_INFO.phone})</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* GET IN TOUCH & WORKSHOP LOCATION SECTION - Mobile Optimized */}
      <section className="py-8 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-5 sm:p-8 border border-warm-border shadow-card space-y-6">
          
          {/* Section Header */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="bg-brand-100 text-brand-700 text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full border border-brand-200">
              📍 {isTamil ? 'நேரடி பட்டறை & தொடர்பு' : 'DIRECT WORKSHOP & LOCATION'}
            </span>
            <span className="text-[11px] font-bold text-charcoal-500">
              {isTamil ? 'திண்டுக்கல் மாவட்டம்' : 'Dindigul District'}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            
            {/* Left Main Details */}
            <div className="lg:col-span-7 space-y-4 text-left">
              <h3 className="text-xl sm:text-2xl font-black text-charcoal-900 leading-tight">
                {isTamil
                  ? 'கள்ளிமந்தையம் பட்டறைக்கு நேரில் வருகை தாருங்கள்'
                  : 'Visit Our Workshop in Kallimandhayam or Connect Directly'}
              </h3>
              
              <p className="text-xs sm:text-sm text-charcoal-600 font-medium leading-relaxed">
                {isTamil
                  ? 'நேரடி தயாரிப்பு பார்வைக்கு விவசாய ஏர் கலப்பைகள் மற்றும் கேட் மாதிரிகள் வைக்கப்பட்டுள்ளன. புதிய ஆர்டர்கள் மற்றும் தனிப்பயன் அளவுகளுக்கு எங்களை தொடர்பு கொள்ளவும்.'
                  : 'Ready stock of heavy duty Kallapai cultivators, entrance gates, and safety grills available for inspection at our workshop counter.'}
              </p>

              {/* Address & Hours Info Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <a
                  href={DEFAULT_SHOP_INFO.google_maps_url}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-warm-bg hover:bg-brand-50/60 p-3.5 rounded-2xl border border-warm-border transition-colors flex items-start gap-3 group"
                >
                  <div className="w-8 h-8 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-black text-charcoal-400 uppercase tracking-wider block">
                      {isTamil ? 'பட்டறை முகவரி' : 'WORKSHOP ADDRESS'}
                    </span>
                    <span className="text-xs font-bold text-charcoal-900 leading-snug block mt-0.5">
                      {DEFAULT_SHOP_INFO.address}
                    </span>
                  </div>
                </a>

                <div className="bg-warm-bg p-3.5 rounded-2xl border border-warm-border flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-charcoal-400 uppercase tracking-wider block">
                      {isTamil ? 'வேலை நேரம்' : 'WORKING HOURS'}
                    </span>
                    <span className="text-xs font-bold text-charcoal-900 leading-snug block mt-0.5">
                      {isTamil ? DEFAULT_SHOP_INFO.working_hours_ta : DEFAULT_SHOP_INFO.working_hours_en}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mobile-First 3 Quick Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                <a
                  href={`tel:${DEFAULT_SHOP_INFO.phone}`}
                  className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-black py-3.5 px-4 rounded-2xl shadow-md text-xs sm:text-sm transition-all active:scale-95"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call: {DEFAULT_SHOP_INFO.phone}</span>
                </a>

                <a
                  href={`https://wa.me/${DEFAULT_SHOP_INFO.whatsapp}?text=${encodeURIComponent('வணக்கம் மணிகண்டன் லேத் பட்டறை, எனக்கு லேத் / கலப்பை பற்றிய விபரம் தேவை.')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 px-4 rounded-2xl shadow-md text-xs sm:text-sm transition-all active:scale-95"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>WhatsApp Chat</span>
                </a>

                <a
                  href={DEFAULT_SHOP_INFO.google_maps_url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-black py-3.5 px-4 rounded-2xl shadow-md text-xs sm:text-sm transition-all active:scale-95"
                >
                  <Navigation className="w-4 h-4 text-brand-400" />
                  <span>Google Maps</span>
                </a>
              </div>
            </div>

            {/* Right Badge / Trust Card */}
            <div className="lg:col-span-5 bg-gradient-to-b from-warm-bg to-brand-50/50 rounded-3xl p-5 sm:p-6 border border-warm-border text-center space-y-3.5 flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-md">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-black text-charcoal-900">
                  {isTamil ? '25+ வருட பாரம்பரியம் மிக்க உள்ளூர் பட்டறை' : '25+ Years of Precision Engineering'}
                </h4>
                <p className="text-xs text-charcoal-500 font-medium max-w-xs mx-auto leading-relaxed">
                  {isTamil
                    ? 'திண்டுக்கல், திருப்பூர் மற்றும் ஈரோடு மாவட்ட விவசாயிகளுக்கு நம்பகமான சேவை.'
                    : 'Serving thousands of farmers and contractors across Dindigul, Tiruppur & Erode districts with precision tolerances.'}
                </p>
              </div>
              <div className="pt-1">
                <Link
                  to="/terms"
                  className="inline-flex items-center gap-1 text-xs font-black text-brand-600 hover:text-brand-700 bg-white px-4 py-2 rounded-xl border border-warm-border shadow-xs hover:shadow-sm transition-all"
                >
                  <span>{isTamil ? 'சேவை விதிமுறைகள் & கொள்கைகள் →' : 'Workshop Terms & Policies →'}</span>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};
