import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  ShieldCheck, 
  Wrench, 
  CreditCard, 
  Truck, 
  Clock, 
  Phone, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { DEFAULT_SHOP_INFO } from '../lib/supabase';

export const TermsPage: React.FC = () => {
  const { language } = useLanguage();
  const isTamil = language === 'ta';

  return (
    <div className="min-h-screen bg-warm-bg pb-24 md:pb-16 pt-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Back Button */}
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-black text-charcoal-700 bg-white px-4 py-2 rounded-full border border-warm-border shadow-sm hover:bg-warm-hover transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-brand-600" />
            <span>{isTamil ? 'முகப்புக்குத் திரும்புக' : 'Back to Home'}</span>
          </Link>
        </div>

        {/* Header Hero */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-2.5 text-brand-400 text-xs font-black uppercase tracking-widest">
            <FileText className="w-4 h-4" />
            <span>{isTamil ? 'விதிமுறைகள் & நிபந்தனைகள்' : 'Terms & Conditions • Workshop Policy'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {isTamil ? 'மணிகண்டன் லேத் பட்டறை சேவை விதிமுறைகள்' : 'Manikandan Lathe Works — Terms of Service'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl leading-relaxed">
            {isTamil
              ? 'எங்கள் பட்டறையில் ஆர்டர் செய்யப்படும் விவசாய கருவிகள், எஃகு கேட், கிரில்கள் மற்றும் பழுதுபார்ப்பு வேலைகளுக்கான அதிகாரப்பூர்வ விதிமுறைகள்.'
              : 'Official terms and operating policies governing custom agricultural fabrication, steel gates, grills, and lathe machining services.'}
          </p>
          <div className="pt-2 flex items-center gap-4 text-[11px] text-slate-400 font-mono">
            <span>Last Updated: {new Date().getFullYear()}</span>
            <span>•</span>
            <span>Kallimandhayam, Tamil Nadu</span>
          </div>
        </div>

        {/* Policy Sections */}
        <div className="space-y-6">

          {/* 1. Custom Fabrication & Specifications */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-warm-border shadow-card space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-100 text-brand-600 flex items-center justify-center font-bold">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-charcoal-900">
                  {isTamil ? '1. தனிப்பயன் உற்பத்தி & அளவுகள்' : '1. Custom Fabrication & Specifications'}
                </h2>
                <span className="text-[11px] text-charcoal-500 font-medium">
                  {isTamil ? 'அளவீடுகள் மற்றும் மூலப்பொருள் விவரங்கள்' : 'Dimensions, Material Quality & Customer Specifications'}
                </span>
              </div>
            </div>
            <div className="text-xs sm:text-sm text-charcoal-700 leading-relaxed space-y-2 pt-2 border-t border-warm-muted">
              <p>
                {isTamil
                  ? 'விவசாய ஏர் கலப்பைகள் (5, 7, 9, 11 கொத்து), கேட், கிரில்கள் மற்றும் லேத் பாகங்கள் வாடிக்கையாளர் வழங்கும் அளவீடுகள் மற்றும் தேவைகளுக்கு ஏற்ப உருவாக்கப்படுகின்றன.'
                  : 'All agricultural implements (Kallapai, cultivators), steel entrance gates, safety grills, and machine components are custom fabricated based on customer requirements and verified workshop dimensions.'}
              </p>
              <p>
                {isTamil
                  ? 'உற்பத்தி தொடங்கிய பின் வாடிக்கையாளர் அளவுகளில் பெரிய மாற்றம் செய்ய விரும்பினால், மூலப்பொருள் மற்றும் கூலி செலவு கூடுதல் தொகையாக சேர்க்கப்படும்.'
                  : 'Any major dimensional or structural changes requested after metal cutting/welding has commenced may incur additional material and labor charges.'}
              </p>
            </div>
          </div>

          {/* 2. Pricing, Estimates & Invoices */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-warm-border shadow-card space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-charcoal-900">
                  {isTamil ? '2. கட்டணம், முன்பணம் & பில்கள்' : '2. Pricing, Advance Payments & Invoices'}
                </h2>
                <span className="text-[11px] text-charcoal-500 font-medium">
                  {isTamil ? 'பட்டறை விலை நிர்ணயம் மற்றும் ரசீது கொள்கை' : 'Workshop Rate Card, Advance Policy & Work Order Bills'}
                </span>
              </div>
            </div>
            <div className="text-xs sm:text-sm text-charcoal-700 leading-relaxed space-y-2 pt-2 border-t border-warm-muted">
              <p>
                {isTamil
                  ? 'எடை அடிப்படையிலான பொருட்கள் (கேட், கிரில் போன்றவை) இறுதி தயாரிப்பின் துல்லியமான எடையின் (kg) அடிப்படையில் கணக்கிடப்படும்.'
                  : 'Weight-based fabrication orders (heavy gates, safety grills, frames) are priced based on the final scale weight (kg) upon completion.'}
              </p>
              <p>
                {isTamil
                  ? 'ஆர்டர்கள் உறுதிசெய்யப்படும்போது மூலப்பொருட்களுக்கான முன்பணம் (Advance) பெறப்படும். மீதித் தொகை பொருள் ஒப்படைக்கப்படும்போது செலுத்தப்பட வேண்டும்.'
                  : 'Advance payment is required upon order confirmation to procure virgin steel materials. The remaining balance is payable upon final workshop inspection/pickup.'}
              </p>
              <p>
                {isTamil
                  ? 'எங்கள் அனைத்து ஆர்டர்களுக்கும் முறையான பட்டறை வேலை ரசீது (Official Invoice Bill & Work Order) வழங்கப்படும்.'
                  : 'Every counter sale and workshop job order is issued an official Manikandan Lathe Works Invoice Bill & Work Order.'}
              </p>
            </div>
          </div>

          {/* 3. Shop Pickup & Delivery Logistics */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-warm-border shadow-card space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-charcoal-900">
                  {isTamil ? '3. நேரடி பட்டறை பெறுதல் & டெலிவரி' : '3. Counter Pickup & Delivery Logistics'}
                </h2>
                <span className="text-[11px] text-charcoal-500 font-medium">
                  {isTamil ? 'கள்ளிமந்தையம் பட்டறை கவுண்டர் பெறுதல்' : 'Workshop Counter Collection & Transport Coordination'}
                </span>
              </div>
            </div>
            <div className="text-xs sm:text-sm text-charcoal-700 leading-relaxed space-y-2 pt-2 border-t border-warm-muted">
              <p>
                {isTamil
                  ? 'தயாரிக்கப்பட்ட ஏர் கலப்பைகள் மற்றும் கனரக பொருட்கள் கள்ளிமந்தையம் பட்டறையில் நேரடியாக பரிசோதித்து பெறலாம்.'
                  : 'Finished agricultural implements and heavy machinery can be inspected and picked up directly at our Kallimandhayam workshop.'}
              </p>
              <p>
                {isTamil
                  ? 'வெளி ஊர் வாடிக்கையாளர்களுக்கு (ஒட்டன்சத்திரம், தாராபுரம், பழனி, திண்டுக்கல்) வாடகை வாகனம் ஏற்பாடு செய்து அனுப்பப்படும்.'
                  : 'Local vehicle transport assistance can be coordinated for customers in nearby towns (Oddanchatram, Dharapuram, Palani, Dindigul, Tiruppur).'}
              </p>
            </div>
          </div>

          {/* 4. Quality Guarantee & Repair Works */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-warm-border shadow-card space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-charcoal-900">
                  {isTamil ? '4. தர உத்தரவாதம் & பழுதுபார்ப்பு' : '4. Quality Guarantee & Repair Service'}
                </h2>
                <span className="text-[11px] text-charcoal-500 font-medium">
                  {isTamil ? 'வெல்டிங் மற்றும் லேத் வேலைப்பாட்டின் உறுதி' : 'Weld Integrity, Structural Strength & Support'}
                </span>
              </div>
            </div>
            <div className="text-xs sm:text-sm text-charcoal-700 leading-relaxed space-y-2 pt-2 border-t border-warm-muted">
              <p>
                {isTamil
                  ? 'அனைத்து வெல்டிங் மற்றும் லேத் டர்னிங் வேலைகளும் 100% திடமான மூலப்பொருட்களைக் கொண்டு அனுபவமிக்க கைவினைஞர்களால் செய்யப்படுகிறது.'
                  : 'All ARC welding and precision lathe machining are executed using high-grade structural steel by experienced craftsmen with 25+ years of trade heritage.'}
              </p>
              <p>
                {isTamil
                  ? 'உற்பத்தி குறைபாடுகள் ஏதேனும் கண்டறியப்பட்டால், உடனடியாக பட்டறையில் சரிசெய்து தரப்படும்.'
                  : 'In the rare event of a workmanship discrepancy, our workshop will inspect and rectify the issue promptly.'}
              </p>
            </div>
          </div>

        </div>

        {/* Contact Assistance Card */}
        <div className="bg-gradient-to-r from-amber-500 via-brand-600 to-orange-600 text-white rounded-3xl p-6 sm:p-7 border-2 border-amber-300 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-base font-black text-white">
              {isTamil ? 'விதிமுறைகள் குறித்து ஏதேனும் கேள்விகள் உள்ளதா?' : 'Have Questions About Our Workshop Policies?'}
            </h3>
            <p className="text-xs text-amber-100 font-medium">
              {isTamil ? 'எங்கள் பட்டறையை நேரடியாக தொடர்பு கொள்ளவும்:' : 'Contact workshop directly:'} {DEFAULT_SHOP_INFO.phone}
            </p>
          </div>

          <a
            href={`tel:${DEFAULT_SHOP_INFO.phone}`}
            className="bg-white hover:bg-amber-100 text-charcoal-900 font-black px-5 py-2.5 rounded-2xl text-xs shadow-lg transition-all inline-flex items-center gap-2 shrink-0"
          >
            <Phone className="w-4 h-4 text-brand-600" />
            <span>{isTamil ? 'அழைக்கவும்' : 'Call Workshop'}</span>
          </a>
        </div>

      </div>
    </div>
  );
};
