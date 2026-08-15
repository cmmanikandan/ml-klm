import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Wrench, Award, CheckCircle2, ArrowRight, Clock, Users, Building } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { DEFAULT_SHOP_INFO } from '../lib/supabase';

export const AboutPage: React.FC = () => {
  const { language } = useLanguage();
  const isTamil = language === 'ta';

  return (
    <div className="min-h-screen bg-warm-bg pb-16">
      
      {/* Header Banner */}
      <section className="bg-gradient-to-b from-white via-warm-bg to-warm-bg py-12 border-b border-warm-border text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <span className="text-xs font-extrabold text-brand-600 uppercase tracking-widest block">
            {isTamil ? 'எங்களைப் பற்றி' : 'ABOUT MANIKANDAN LATHE'}
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-charcoal-900 tracking-tight">
            {isTamil ? (
              <>40+ வருடங்கள் பாரம்பரிய <span className="text-brand-600">லேத் & வெல்டிங்</span> தயாரிப்புகள்</>
            ) : (
              <>40+ Years of Precision <span className="text-brand-600">Lathe Turning & Metal Fabrication</span></>
            )}
          </h1>
          <p className="text-sm sm:text-base text-charcoal-600 max-w-2xl mx-auto font-medium leading-relaxed">
            {isTamil
              ? 'கள்ளிமந்தையம், திண்டுக்கல் மாவட்டத்தில் உள்ள எங்கள் பட்டறையில் உயர்தர ஸ்டெயின்லெஸ் ஸ்டீல் நாற்காலிகள், மெயின் கேட்டுகள், பால்கனி கிரில்கள் மற்றும் தொழில்துறை லேத் வேலைகள் துல்லியமாக செய்யப்பட்டு வழங்கப்படுகின்றன.'
              : 'Located in Kallimandhayam, Dindigul District, Tamil Nadu, Manikandan Lathe – Welding Works specializes in heavy grade 304 stainless steel chairs, architectural entrance gates, safety grills, and custom industrial lathe fabrication.'}
          </p>
        </div>
      </section>

      {/* Stats Counter */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-warm-border text-center shadow-card space-y-1">
            <span className="text-3xl font-black text-brand-600">40+</span>
            <span className="text-xs font-bold text-charcoal-700 block">Years Experience</span>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-warm-border text-center shadow-card space-y-1">
            <span className="text-3xl font-black text-brand-600">5,000+</span>
            <span className="text-xs font-bold text-charcoal-700 block">Projects Completed</span>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-warm-border text-center shadow-card space-y-1">
            <span className="text-3xl font-black text-brand-600">100%</span>
            <span className="text-xs font-bold text-charcoal-700 block">Grade 304 SS Steel</span>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-warm-border text-center shadow-card space-y-1">
            <span className="text-3xl font-black text-brand-600">1,200+</span>
            <span className="text-xs font-bold text-charcoal-700 block">Satisfied Customers</span>
          </div>
        </div>
      </section>

      {/* Core Quality Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-charcoal-900">
            {isTamil ? 'எங்கள் தயாரிப்பு சிறப்பம்சங்கள்' : 'Our Quality Standards'}
          </h2>
          <p className="text-xs text-charcoal-500 font-semibold mt-1">
            {isTamil ? 'உயர்தர மூலப்பொருட்கள் மற்றும் துல்லியமான தயாரிப்பு' : 'Engineered for extreme durability and aesthetic appeal'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-warm-border shadow-card space-y-3">
            <div className="w-12 h-12 bg-brand-100 text-brand-600 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-charcoal-900">
              {isTamil ? 'துருப்பிடிக்காத 304 ஸ்டீல்' : 'Grade 304 Stainless Steel'}
            </h3>
            <p className="text-xs text-charcoal-600 leading-relaxed font-medium">
              {isTamil
                ? 'நாங்கள் பயன்படுத்தும் அனைத்து ஸ்டெயின்லெஸ் ஸ்டீல்களும் 304 கிரேடு கொண்டவை. மழை மற்றும் வெயிலிலும் துருப்பிடிக்காது.'
                : 'All stainless steel chairs and structures are fabricated using certified 304 grade SS, providing lifelong corrosion resistance.'}
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-warm-border shadow-card space-y-3">
            <div className="w-12 h-12 bg-brand-100 text-brand-600 rounded-2xl flex items-center justify-center">
              <Wrench className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-charcoal-900">
              {isTamil ? 'துல்லியமான லேத் டர்னிங்' : 'Precision Lathe Turning'}
            </h3>
            <p className="text-xs text-charcoal-600 leading-relaxed font-medium">
              {isTamil
                ? 'ஹெவி டர்னிங் மெஷின்கள் மூலம் துல்லியமான அளவுகளில் த்ரெட்டிங் மற்றும் ஷாஃப்ட் வெல்டிங் வேலைகள் மேற்கொள்ளப்படுகின்றன.'
                : 'Equipped with heavy industrial lathe machinery for precise metal threading, shaft turning, and heavy arc welding.'}
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-warm-border shadow-card space-y-3">
            <div className="w-12 h-12 bg-brand-100 text-brand-600 rounded-2xl flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-charcoal-900">
              {isTamil ? 'நேரடி பட்டறை தயாரிப்பு' : 'Direct Workshop Crafting'}
            </h3>
            <p className="text-xs text-charcoal-600 leading-relaxed font-medium">
              {isTamil
                ? 'இடைத்தரகர்கள் இன்றி பட்டறையில் நேரடியாக வடிவமைக்கப்படுவதால் நியாயமான கட்டணம் மற்றும் தரமான தயாரிப்பு உறுதியளிக்கப்படுகிறது.'
                : 'Direct workshop fabrication without middleman commissions, ensuring transparent custom quote pricing.'}
            </p>
          </div>
        </div>

        {/* CTA to Products */}
        <div className="text-center pt-6">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-extrabold px-8 py-4 rounded-2xl shadow-lg shadow-brand-600/25 transition-all text-base"
          >
            <span>{isTamil ? 'எங்கள் தயாரிப்புகளைப் பார்க்க' : 'Explore Product Catalogue'}</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

    </div>
  );
};
