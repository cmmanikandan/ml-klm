import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, MessageSquare, MapPin, Clock, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { DEFAULT_SHOP_INFO } from '../lib/supabase';

export const HelpPage: React.FC = () => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const isTamil = language === 'ta';

  return (
    <div className="min-h-screen bg-warm-bg pb-24 md:pb-12 pt-4">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-charcoal-700 bg-white rounded-full border border-warm-border shadow-sm"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-2xl font-black text-charcoal-900">{t('help_contact')}</h1>
        </div>

        {/* Shop Info Card */}
        <div className="bg-white rounded-3xl p-6 border border-warm-border shadow-card space-y-5">
          <div className="flex items-center gap-2 text-brand-600 font-extrabold text-xs uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>MANIKANDAN LATHE – WELDING WORKS</span>
          </div>

          <div className="space-y-4 text-sm text-charcoal-800 font-medium">
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-warm-bg border border-warm-border">
              <MapPin className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-charcoal-500 block">Shop Address</span>
                <span>{DEFAULT_SHOP_INFO.address}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-warm-bg border border-warm-border">
              <Clock className="w-5 h-5 text-brand-600 shrink-0" />
              <div>
                <span className="text-xs font-bold text-charcoal-500 block">Working Hours</span>
                <span>{isTamil ? DEFAULT_SHOP_INFO.working_hours_ta : DEFAULT_SHOP_INFO.working_hours_en}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <a
              href={`tel:${DEFAULT_SHOP_INFO.phone}`}
              className="flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-extrabold py-4 px-4 rounded-2xl shadow-md transition-all text-sm"
            >
              <Phone className="w-5 h-5" />
              <span>{t('call_shop')}</span>
            </a>

            <a
              href={`https://wa.me/${DEFAULT_SHOP_INFO.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-4 px-4 rounded-2xl shadow-md transition-all text-sm"
            >
              <MessageSquare className="w-5 h-5" />
              <span>WhatsApp Chat</span>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};
