import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, MapPin, Clock, MessageSquare, ShieldCheck, Navigation } from 'lucide-react';
import { Logo } from '../common/Logo';
import { useLanguage } from '../../context/LanguageContext';
import { DEFAULT_SHOP_INFO, INITIAL_CATEGORIES } from '../../lib/supabase';

export const Footer: React.FC = () => {
  const { language } = useLanguage();
  const isTamil = language === 'ta';

  return (
    <footer className="bg-charcoal-900 text-gray-300 border-t-4 border-brand-600 pt-10 pb-28 md:pb-12 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          
          {/* Brand Info */}
          <div className="space-y-4 sm:col-span-2 md:col-span-1">
            <div className="bg-white/10 p-3 rounded-2xl inline-block backdrop-blur-sm">
              <Logo size="md" variant="dark" />
            </div>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              {isTamil
                ? 'உயர்தர மெயின் கேட்டுகள், பால்கனி கிரில்கள், கூரை ஸ்ட்ரக்சர், ஏர் கலப்பை மற்றும் ARC வெல்டிங் லேத் வேலைகளுக்கு சிறந்த தேர்வு.'
                : 'Premium quality main entrance gates, safety grills, roofing structures, Kallapai, and precision ARC welding fabrication.'}
            </p>
            <div className="flex items-center gap-2 text-brand-400 text-xs font-extrabold">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{isTamil ? '100% நம்பகமான லோக்கல் நிறுவனம்' : '100% Trusted Local Workshop'}</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-black text-sm uppercase tracking-wider mb-3 border-b border-gray-800 pb-2">
              {isTamil ? 'விரைவு இணைப்புகள்' : 'Quick Navigation'}
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link to="/" className="hover:text-brand-400 font-semibold transition-colors">
                  {isTamil ? 'முகப்பு' : 'Home'}
                </Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-brand-400 font-semibold transition-colors">
                  {isTamil ? 'பொருட்கள்' : 'Products'}
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-brand-400 font-semibold transition-colors">
                  {isTamil ? 'எங்களைப் பற்றி' : 'About Us'}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-brand-400 font-semibold transition-colors">
                  {isTamil ? 'தொடர்பு கொள்ள' : 'Contact Us'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Shop Categories */}
          <div>
            <h4 className="text-white font-black text-sm uppercase tracking-wider mb-3 border-b border-gray-800 pb-2">
              {isTamil ? 'தயாரிப்பு பிரிவுகள்' : 'Shop Categories'}
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-gray-400 font-medium">
              {INITIAL_CATEGORIES.map((cat) => (
                <li key={cat.id}>
                  <Link to={`/products?category=${cat.slug}`} className="hover:text-white transition-colors">
                    {isTamil ? cat.name_ta || cat.name_en : cat.name_en}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Map Details */}
          <div id="contact">
            <h4 className="text-white font-black text-sm uppercase tracking-wider mb-3 border-b border-gray-800 pb-2">
              {isTamil ? 'கடை முகவரி & தொடர்பு' : 'Shop Location & Contact'}
            </h4>
            <ul className="space-y-3 text-xs sm:text-sm text-gray-300">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                <span className="leading-snug">{DEFAULT_SHOP_INFO.address}</span>
              </li>

              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-brand-500 shrink-0" />
                <a href={`tel:${DEFAULT_SHOP_INFO.phone}`} className="hover:text-brand-400 font-bold text-white">
                  {DEFAULT_SHOP_INFO.phone}
                </a>
              </li>

              <li className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                <a
                  href={`https://wa.me/${DEFAULT_SHOP_INFO.whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-emerald-400 font-bold text-emerald-400 flex items-center gap-1"
                >
                  <span>WhatsApp Chat</span>
                </a>
              </li>

              <li className="flex items-center gap-2.5 pt-1">
                <a
                  href={DEFAULT_SHOP_INFO.google_maps_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-brand-400 text-xs font-extrabold px-3 py-1.5 rounded-xl border border-gray-700 transition-all"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Google Maps Directions</span>
                </a>
              </li>

              <li className="flex items-center gap-2.5 text-xs text-gray-400 pt-1">
                <Clock className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                <span>{isTamil ? DEFAULT_SHOP_INFO.working_hours_ta : DEFAULT_SHOP_INFO.working_hours_en}</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright & location credit */}
        <div className="border-t border-gray-800 pt-6 text-center text-xs text-gray-400 space-y-1">
          <p className="font-semibold">© {new Date().getFullYear()} MANIKANDAN LATHE – Welding Works. All rights reserved.</p>
          <p className="text-[11px] text-gray-400">Kallimandhayam, Dindigul District, Tamil Nadu - 624616</p>
        </div>
      </div>
    </footer>
  );
};
