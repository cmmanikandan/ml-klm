import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Phone, MessageSquare, ShieldCheck, Wrench, ArrowRight, Sparkles, CheckCircle2, Star, ClipboardCheck, Tag, Truck } from 'lucide-react';
import { Logo } from '../components/common/Logo';
import { ProductCard } from '../components/product/ProductCard';
import { useLanguage } from '../context/LanguageContext';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS, DEFAULT_SHOP_INFO } from '../lib/supabase';

export const LandingPage: React.FC = () => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const isTamil = language === 'ta';

  const featuredProducts = INITIAL_PRODUCTS.slice(0, 4);

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
                <span>{isTamil ? '40+ வருட சிறந்த லேத் வெல்டிங் பாரம்பரியம்' : '40+ Years of Industrial Fabrication Excellence'}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-charcoal-900 leading-tight tracking-tight">
                {isTamil ? (
                  <>
                    உயர்தர <span className="text-brand-600">ஸ்டீல் நாற்காலிகள்</span> & கனரக லேத் வெல்டிங் வேலைகள்
                  </>
                ) : (
                  <>
                    Premium <span className="text-brand-600">Steel Chairs</span>, Gates & Custom Lathe Fabrication
                  </>
                )}
              </h1>

              <p className="text-sm sm:text-base text-charcoal-600 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                {isTamil
                  ? 'உங்கள் வீடு, அலுவலகம் மற்றும் தொழிற்சாலைக்கான அனைத்து வகையான வெல்டிங் வேலைகளும் துல்லியமாகவும் உறுதியாகவும் செய்து தரப்படும்.'
                  : 'Engineered for extreme durability. Browse our premium catalogue of steel chairs, main gates, safety grills, and custom lathe projects.'}
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
                  <span>{isTamil ? 'கடைக்கு அழைக்க' : 'Call Shop Now'}</span>
                </a>

                <a
                  href={`https://wa.me/${DEFAULT_SHOP_INFO.whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-5 py-4 rounded-2xl shadow-md transition-all active:scale-95 text-base"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>WhatsApp</span>
                </a>
              </div>

              {/* Trust Badges */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs font-bold text-charcoal-600">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {isTamil ? 'உயர்தர 304 ஸ்டீல்' : 'Grade 304 Stainless Steel'}
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {isTamil ? 'துல்லியமான லேத் வேலைகள்' : 'Precision Lathe Turning'}
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {isTamil ? 'நேரடி தயாரிப்பாளர்' : 'Direct Manufacturer'}
                </span>
              </div>
            </div>

            {/* Right Hero Image Card */}
            <div className="relative">
              <div className="relative mx-auto max-w-md lg:max-w-none rounded-3xl overflow-hidden border-4 border-white shadow-2xl bg-white">
                <img
                  src="https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1000&auto=format&fit=crop&q=80"
                  alt="Manikandan Lathe Workshop"
                  className="w-full h-[380px] sm:h-[480px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 text-white">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-brand-400">
                    MANIKANDAN LATHE WORKSHOP
                  </span>
                  <h3 className="text-xl font-black mt-1">
                    {isTamil ? 'உறுதியான தயாரிப்பு, தலைமுறை தாங்கும் உழைப்பு' : 'Engineered Strong to Last Generations'}
                  </h3>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Simple 3-Step Order & Enquiry Guide Section */}
      <section className="py-12 bg-white border-b border-warm-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <span className="text-xs font-extrabold text-brand-600 uppercase tracking-widest block">
              {isTamil ? 'எளிய 3 படி ஆர்டர் முறை' : 'HOW IT WORKS'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-charcoal-900">
              {isTamil ? 'விசாரணை முதல் டெலிவரி வரை எளிய வழிமுறை' : 'Simple 3-Step Enquiry to Order Process'}
            </h2>
            <p className="text-xs text-charcoal-500 font-semibold">
              {isTamil ? 'முன்பணம் இன்றி உங்கள் விருப்பமான அளவுகளை பதிவு செய்து விலை அறியலாம்' : 'Submit custom specs without upfront costs. Get exact price quote & timeline.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-warm-bg p-6 rounded-3xl border border-warm-border space-y-3 relative group hover:border-brand-500 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white font-black text-lg flex items-center justify-center shadow-md">
                1
              </div>
              <h3 className="text-lg font-bold text-charcoal-900">
                {isTamil ? '1. இலவச விசாரணை சமர்ப்பிப்பு' : '1. Submit Custom Enquiry'}
              </h3>
              <p className="text-xs text-charcoal-600 leading-relaxed font-medium">
                {isTamil
                  ? 'உங்களுக்கு தேவையான நாற்காலி, கேட் அல்லது கிரில் அளவுகளை முன்பணம் இன்றி பதிவு செய்யுங்கள்.'
                  : 'Select product and specify preferred size, location & custom specs. Zero upfront payment required.'}
              </p>
            </div>

            <div className="bg-warm-bg p-6 rounded-3xl border border-warm-border space-y-3 relative group hover:border-brand-500 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white font-black text-lg flex items-center justify-center shadow-md">
                2
              </div>
              <h3 className="text-lg font-bold text-charcoal-900">
                {isTamil ? '2. கடை நிர்வாகி விலை அறிவிப்பு' : '2. Admin Review & Agreed Quote'}
              </h3>
              <p className="text-xs text-charcoal-600 leading-relaxed font-medium">
                {isTamil
                  ? 'நிர்வாகி உங்கள் தேவைகளை பரிசீலித்து துல்லியமான விலை மற்றும் டெலிவரி தேதியை வழங்குவார்.'
                  : 'Shop admin reviews your request, sets exact price quote and expected delivery completion date.'}
              </p>
            </div>

            <div className="bg-warm-bg p-6 rounded-3xl border border-warm-border space-y-3 relative group hover:border-brand-500 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black text-lg flex items-center justify-center shadow-md">
                3
              </div>
              <h3 className="text-lg font-bold text-charcoal-900">
                {isTamil ? '3. முன்பணம் & தயாரிப்பு தொடக்கம்' : '3. Confirm & Fabrication Starts'}
              </h3>
              <p className="text-xs text-charcoal-600 leading-relaxed font-medium">
                {isTamil
                  ? 'விலையை உறுதி செய்து Razorpay/QR/Cash மூலம் முன்பணம் செலுத்தி தயாரிப்பு நிலையை நேரலையாக அறியலாம்.'
                  : 'Approve quote, pay advance via Razorpay/QR/Cash, and track real-time workshop fabrication timeline.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Categories */}
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

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {INITIAL_CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.slug}`}
              className="group bg-white p-3.5 rounded-2xl border border-warm-border/80 shadow-card hover:shadow-warm transition-all text-center flex flex-col items-center justify-center"
            >
              <div className="w-16 h-16 rounded-full overflow-hidden mb-2.5 border-2 border-brand-100 group-hover:border-brand-500 group-hover:scale-105 transition-all">
                <img src={cat.image_url} alt={cat.name_en} className="w-full h-full object-cover" />
              </div>
              <span className="text-xs font-bold text-charcoal-900 group-hover:text-brand-600 transition-colors line-clamp-1">
                {isTamil ? cat.name_ta : cat.name_en}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products (NO PRICES) */}
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

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {featuredProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section id="about" className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-charcoal-900">
            {isTamil ? 'ஏன் மணிகண்டன் லேத்?' : 'Why Choose Manikandan Lathe?'}
          </h2>
          <p className="text-sm text-charcoal-600 mt-1 font-medium">
            {isTamil ? 'தரமான இரும்பு & ஸ்டீல் வேலைகளுக்கு உங்கள் நம்பிக்கைக்குரிய இடம்' : 'Trusted quality manufacturing and prompt service'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-warm-border shadow-card text-center space-y-3">
            <div className="w-14 h-14 bg-brand-100 text-brand-600 rounded-2xl flex items-center justify-center mx-auto">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-charcoal-900">
              {isTamil ? 'உயர்தர இரும்பு & ஸ்டீல்' : 'Premium Metal Quality'}
            </h3>
            <p className="text-xs text-charcoal-600 leading-relaxed">
              {isTamil ? 'துருப்பிடிக்காத 304 ரக ஸ்டெயின்லெஸ் ஸ்டீல் மற்றும் தடிமனான இரும்பு குழாய்கள் மட்டுமே பயன்படுத்தப்படும்.' : 'We use high grade 304 SS and heavy gauge mild steel for maximum durability.'}
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-warm-border shadow-card text-center space-y-3">
            <div className="w-14 h-14 bg-brand-100 text-brand-600 rounded-2xl flex items-center justify-center mx-auto">
              <Wrench className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-charcoal-900">
              {isTamil ? 'கஸ்டம் வெல்டிங் டிசைன்' : 'Custom Tailored Design'}
            </h3>
            <p className="text-xs text-charcoal-600 leading-relaxed">
              {isTamil ? 'உங்கள் தேவைக்கேற்ப அளவுகள் மற்றும் டிசைன்களில் துல்லியமாக செய்து தரப்படும்.' : 'Customized dimensions, patterns, and lock placements crafted to your specifications.'}
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-warm-border shadow-card text-center space-y-3">
            <div className="w-14 h-14 bg-brand-100 text-brand-600 rounded-2xl flex items-center justify-center mx-auto">
              <Star className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-charcoal-900">
              {isTamil ? 'நேரடி தயாரிப்பு விலை' : 'Direct Manufacturer Value'}
            </h3>
            <p className="text-xs text-charcoal-600 leading-relaxed">
              {isTamil ? 'இடைத்தரகர்கள் இன்றி பட்டறை நேரடி நியாயமான விலை மதிப்பீடு.' : 'Direct workshop value without middlemen markups after review.'}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
