import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Wrench, 
  ArrowLeft, 
  Phone, 
  ShieldCheck, 
  Sparkles, 
  Zap, 
  CheckCircle2, 
  Clock,
  Settings,
  MessageSquare
} from 'lucide-react';
import { RepairServiceModal } from '../components/repair/RepairServiceModal';
import { useLanguage } from '../context/LanguageContext';
import { DEFAULT_SHOP_INFO } from '../lib/supabase';

export const RepairServicePage: React.FC = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isTamil = language === 'ta';

  const [isModalOpen, setIsModalOpen] = useState(false);

  const servicesList = [
    {
      title_en: 'Tractor 7-Kallapai & Agri Implements',
      title_ta: 'டிராக்டர் 7-கலப்பை & விவசாயக் கருவிகள்',
      desc_en: 'Heavy duty shank replacement, plough hook welding, disc bearing turning',
      desc_ta: 'கலப்பை கம்பி பொருத்துதல், ஹூக் வெல்டிங், பேரிங் புஷ் அமைத்தல்',
      icon: '🚜'
    },
    {
      title_en: 'Precision Shaft Turning & Bushing',
      title_ta: 'துல்லியமான ஷாப்ட் டர்னிங் & புஷ் வேலை',
      desc_en: 'High accuracy lathe machining, keyway slot cutting, thread restoring',
      desc_ta: 'துல்லியமான லேத் டர்னிங், கீவே ஸ்லாட் வெட்டுதல், திரெட் சரிசெய்தல்',
      icon: '⚙️'
    },
    {
      title_en: 'Heavy ARC & Cast Iron Welding',
      title_ta: 'ஹெவி ARC & காஸ்ட் அயர்ன் வெல்டிங்',
      desc_en: 'Cast iron crack patching, high-strength industrial welding & fabrication',
      desc_ta: 'காஸ்ட் அயர்ன் விரிசல் பழுது, வலிமையான தொழிற்துறை வெல்டிங் வேலை',
      icon: '🔥'
    },
    {
      title_en: 'Axle Straightening & Facing',
      title_ta: 'ஆக்சில் வளைவு நீக்குதல் & பேஸிங்',
      desc_en: 'Hydraulic press alignment for bent shafts, trailer axles & rotors',
      desc_ta: 'ஹைட்ராலிக் பிரஸ் மூலம் வளைந்த ஷாப்ட் மற்றும் ஆக்சில்களை நேராக்குதல்',
      icon: '📏'
    },
    {
      title_en: 'Borewell Pump & Motor Machining',
      title_ta: 'போர்வெல் பம்ப் & மோட்டார் லேத் வேலை',
      desc_en: 'Submersible motor shaft repair, impeller replacement & balancing',
      desc_ta: 'சப்மெர்சிபிள் மோட்டார் ஷாப்ட் பழுது, இம்பெல்லர் பொருத்துதல்',
      icon: '⚡'
    },
    {
      title_en: 'Emergency Breakdown Lathe Service',
      title_ta: 'அவசர லேத் & வெல்டிங் பழுது வேலை',
      desc_en: 'Same-day turnaround for agricultural & industrial machinery breakdown',
      desc_ta: 'விவசாய மற்றும் இயந்திர பழுதுகளுக்கு ஒரே நாளில் உடனடி பழுது நீக்கம்',
      icon: '🚨'
    }
  ];

  return (
    <div className="min-h-screen bg-warm-bg pb-24 md:pb-12 pt-4">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Top Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-charcoal-700 bg-white rounded-full border border-warm-border shadow-sm hover:bg-warm-bg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <span className="text-xs font-black text-brand-600 bg-brand-50 px-3.5 py-1 rounded-full border border-brand-200 uppercase tracking-wider">
            MANIKANDAN LATHE WORKS
          </span>
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-charcoal-900 via-charcoal-800 to-slate-900 text-white rounded-3xl p-6 sm:p-10 border border-slate-700 shadow-2xl relative overflow-hidden space-y-4">
          <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 text-brand-400 text-xs font-black uppercase tracking-wider border border-brand-500/30">
            <Wrench className="w-3.5 h-3.5" />
            <span>{isTamil ? 'உடனடி பழுது பார்க்கும் சேவை' : 'Machining & Lathe Repair'}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">
            {isTamil 
              ? 'டிராக்டர் பாகங்கள் & உடைந்த இயந்திரங்களுக்கான லேத் பழுது வேலை' 
              : 'Precision Lathe Turning & Machinery Repair Service'}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-xl leading-relaxed">
            {isTamil
              ? 'உடைந்த டிராக்டர் 7-கலப்பை, வளைந்த ஷாப்ட், கியர் பழுது, அல்லது மோட்டார் பாகங்களை எங்கள் அனுபவமிக்க லேத் பட்டறையில் கொண்டு வந்து உடனடியாக சரிசெய்து கொள்ளுங்கள்.'
              : 'Bring broken agricultural implements, bent shafts, or damaged industrial parts to our Kallimandhayam workshop for same-day precision turning and heavy ARC welding.'}
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 hover:to-amber-600 text-white font-extrabold py-3.5 px-6 rounded-2xl text-xs sm:text-sm shadow-xl transition-all active:scale-95"
            >
              <Wrench className="w-4 h-4" />
              <span>{isTamil ? 'பழுது வேலைக்கு விண்ணப்பிக்கவும்' : 'Request Machining / Repair Quote'}</span>
            </button>

            <a
              href={`tel:${DEFAULT_SHOP_INFO.phone}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold py-3.5 px-5 rounded-2xl text-xs border border-white/20 transition-all"
            >
              <Phone className="w-4 h-4 text-brand-400" />
              <span>Call Workshop: {DEFAULT_SHOP_INFO.phone}</span>
            </a>
          </div>
        </div>

        {/* Services Showcase Cards */}
        <div className="space-y-4">
          <h2 className="text-lg font-black text-charcoal-900">
            {isTamil ? 'எங்கள் பிரத்யேக லேத் & வெல்டிங் சேவைகள்' : 'Our Specialized Machining & Repair Capabilities'}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {servicesList.map((srv, idx) => (
              <div 
                key={idx}
                className="bg-white rounded-3xl p-5 border border-warm-border shadow-card hover:shadow-warm-lg transition-all flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200 text-2xl flex items-center justify-center shrink-0 shadow-xs">
                  {srv.icon}
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-charcoal-900">
                    {isTamil ? srv.title_ta : srv.title_en}
                  </h3>
                  <p className="text-xs text-charcoal-500 font-medium leading-relaxed">
                    {isTamil ? srv.desc_ta : srv.desc_en}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quality Badges */}
        <div className="bg-white rounded-3xl p-6 border border-warm-border shadow-card grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="space-y-1 p-2">
            <ShieldCheck className="w-7 h-7 text-brand-600 mx-auto" />
            <h4 className="text-xs font-black text-charcoal-900">25+ Years Experience</h4>
            <p className="text-[11px] text-charcoal-500 font-medium">Expert lathe master craftsmen</p>
          </div>

          <div className="space-y-1 p-2">
            <Zap className="w-7 h-7 text-amber-600 mx-auto" />
            <h4 className="text-xs font-black text-charcoal-900">Fast Turnaround</h4>
            <p className="text-[11px] text-charcoal-500 font-medium">Same-day emergency repairs</p>
          </div>

          <div className="space-y-1 p-2">
            <Sparkles className="w-7 h-7 text-emerald-600 mx-auto" />
            <h4 className="text-xs font-black text-charcoal-900">Heavy ARC Welding</h4>
            <p className="text-[11px] text-charcoal-500 font-medium">Extreme durability finish</p>
          </div>
        </div>

      </div>

      {/* Repair Modal */}
      <RepairServiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
