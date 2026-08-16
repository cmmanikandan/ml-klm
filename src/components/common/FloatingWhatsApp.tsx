import React from 'react';
import { MessageSquare } from 'lucide-react';
import { DEFAULT_SHOP_INFO } from '../../lib/supabase';
import { useLanguage } from '../../context/LanguageContext';

export const FloatingWhatsApp: React.FC = () => {
  const { language } = useLanguage();
  const isTamil = language === 'ta';

  const handleOpenWhatsApp = () => {
    const text = encodeURIComponent(
      isTamil
        ? 'வணக்கம் மணிகண்டன் லேத், நான் உங்கள் தயாரிப்புகளைப் பற்றி விசாரிக்க விரும்புகிறேன்.'
        : 'Hi Manikandan Lathe, I would like to enquire about your welding & lathe fabrication services.'
    );
    window.open(`https://wa.me/${DEFAULT_SHOP_INFO.whatsapp}?text=${text}`, '_blank');
  };

  return (
    <button
      onClick={handleOpenWhatsApp}
      className="fixed bottom-6 right-4 z-50 sm:bottom-6 sm:right-6 bg-emerald-600 hover:bg-emerald-700 text-white p-3 sm:px-4 sm:py-3 rounded-full shadow-2xl shadow-emerald-600/50 flex items-center gap-2 transition-all hover:scale-110 active:scale-95 border-2 border-white ring-2 ring-emerald-400/30"
      aria-label="Contact WhatsApp"
    >
      <MessageSquare className="w-6 h-6 fill-current shrink-0" />
      <span className="hidden sm:inline-block text-xs font-black tracking-wide">
        {isTamil ? 'வாட்ஸ்அப் சாட்' : 'WhatsApp Us'}
      </span>
    </button>
  );
};
