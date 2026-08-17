import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Mic, 
  Wrench, 
  Receipt, 
  Smartphone, 
  X, 
  ArrowRight, 
  CheckCircle2, 
  Flame,
  ShieldCheck
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface FeatureSpotlightModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  autoCheckFirstTime?: boolean;
}

export const FeatureSpotlightModal: React.FC<FeatureSpotlightModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
  autoCheckFirstTime = false,
}) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isTamil = language === 'ta';

  const [internalOpen, setInternalOpen] = useState(false);

  useEffect(() => {
    if (autoCheckFirstTime) {
      const hasSeen = localStorage.getItem('ml_feature_spotlight_shown_v1');
      if (!hasSeen) {
        // Show after a brief delay so page loads smoothly
        const timer = setTimeout(() => {
          setInternalOpen(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [autoCheckFirstTime]);

  const isOpen = propIsOpen !== undefined ? propIsOpen : internalOpen;

  const handleClose = () => {
    localStorage.setItem('ml_feature_spotlight_shown_v1', 'true');
    if (propOnClose) {
      propOnClose();
    } else {
      setInternalOpen(false);
    }
  };

  const handleNavigateFeature = (path: string) => {
    handleClose();
    navigate(path);
  };

  if (!isOpen) return null;

  const features = [
    {
      id: 'voice_search',
      icon: Mic,
      color: 'bg-rose-50 text-rose-600 border-rose-200',
      badge_en: 'New Feature',
      badge_ta: 'புதிய வசதி',
      title_en: 'Tamil & English Voice Search',
      title_ta: 'தமிழ் மற்றும் ஆங்கில குரல் தேடல்',
      desc_en: 'Speak naturally to search for gates, safety grills, 7-kallapai, roofing sheets, or custom welding.',
      desc_ta: 'மைக்கை அழுத்தி தமிழில் பேசி கேட், கிரில், ஏர் கலப்பை போன்ற பொருட்களை எளிதாகக் கண்டறியலாம்.',
      action_en: 'Try Voice Search',
      action_ta: 'குரல் தேடலை சோதிக்க',
      onClick: () => handleNavigateFeature('/search'),
    },
    {
      id: 'repair_service',
      icon: Wrench,
      color: 'bg-amber-50 text-amber-600 border-amber-200',
      badge_en: 'Workshop Service',
      badge_ta: 'பட்டறை சேவை',
      title_en: 'Machining & Heavy ARC Repair Requests',
      title_ta: 'லேத் & ARC வெல்டிங் பழுது பார்க்கும் சேவை',
      desc_en: 'Submit broken tractor implements, bent axles, gates, grills, and motor shafts for quick estimates.',
      desc_ta: 'உடைந்த டிராக்டர் பாகங்கள், கலப்பை, கேட் கிரில் மற்றும் மோட்டார் பாகங்களை பதிவு செய்து உடனடி மதிப்பீடு பெறலாம்.',
      action_en: 'Request Repair',
      action_ta: 'பழுது கோரிக்கை விடுக்க',
      onClick: () => handleNavigateFeature('/repair'),
    },
    {
      id: 'invoices_tracking',
      icon: Receipt,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      badge_en: 'Live Orders',
      badge_ta: 'நேரலை ஆர்டர்கள்',
      title_en: 'Digital Invoices & Live Stage Tracking',
      title_ta: 'டிஜிட்டல் இன்வாய்ஸ் & நேரலை நிலை அறிதல்',
      desc_en: 'Track your steel fabrication stage-by-stage and download official GST print invoices online.',
      desc_ta: 'தயாரிப்பின் வெல்டிங் மற்றும் பெயிண்டிங் நிலைகளை நேரலையில் அறிந்து ஜிஎஸ்டி ரசீதுகளை பதிவிறக்கலாம்.',
      action_en: 'View Orders',
      action_ta: 'ஆர்டர்களைப் பார்',
      onClick: () => handleNavigateFeature('/orders'),
    },
    {
      id: 'pwa_offline',
      icon: Smartphone,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
      badge_en: 'Mobile App',
      badge_ta: 'மொபைல் ஆப்',
      title_en: 'Add to Home Screen (Offline PWA)',
      title_ta: 'முகப்புத் திரையில் செயலி சேர்க்க',
      desc_en: 'Install directly on Android or iPhone home screen for ultra-fast browsing and offline price catalog.',
      desc_ta: 'உங்கள் மொபைல் போனில் எளிதாக நிறுவி இண்டர்நெட் இல்லாத நேரத்திலும் விலைப் பட்டியலைக் காணலாம்.',
      action_en: 'Learn How',
      action_ta: 'விபரம் அறிக',
      onClick: () => handleNavigateFeature('/profile'),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in overflow-y-auto select-none">
      <div className="bg-slate-900 text-white rounded-3xl max-w-xl w-full p-5 sm:p-7 border border-slate-700 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto space-y-5 animate-slide-up">
        
        {/* Close Icon */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2 pt-2">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-brand-500/20 text-brand-400 text-xs font-black uppercase tracking-wider border border-brand-500/30">
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-400" />
            <span>{isTamil ? 'புதிய வசதிகள் & வழிகாட்டி' : 'Explore Smart New Features'}</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white">
            {isTamil ? 'மணிகண்டன் லேத் செயலியில் புதிதாக என்ன?' : "What's New in MANIKANDAN LATHE"}
          </h2>

          <p className="text-xs text-slate-300 font-medium max-w-md mx-auto leading-relaxed">
            {isTamil
              ? 'உங்கள் பயன்பாட்டை எளிதாக்க புதிய குரல் தேடல், பழுது பார்க்கும் கோரிக்கைகள் மற்றும் டிஜிட்டல் இன்வாய்ஸ் வசதிகள் இணைக்கப்பட்டுள்ளன.'
              : 'Discover powerful new features engineered for quick product lookup, lathe repair estimates, and live order tracking.'}
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="space-y-3 pt-1">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.id}
                className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700 hover:border-brand-500/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="flex items-start gap-3.5">
                  <div className={`p-2.5 rounded-xl border shrink-0 ${feat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-black text-white group-hover:text-amber-300 transition-colors">
                        {isTamil ? feat.title_ta : feat.title_en}
                      </h4>
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-slate-700 text-slate-300">
                        {isTamil ? feat.badge_ta : feat.badge_en}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                      {isTamil ? feat.desc_ta : feat.desc_en}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={feat.onClick}
                  className="inline-flex items-center justify-center gap-1.5 bg-slate-700 hover:bg-brand-600 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl transition-colors shrink-0 self-end sm:self-center shadow-xs"
                >
                  <span>{isTamil ? feat.action_ta : feat.action_en}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Bottom Dismiss Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 hover:to-amber-600 text-white font-black text-xs sm:text-sm shadow-xl transition-all active:scale-98 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isTamil ? 'புரிந்தது! உலாவத் தொடங்குக' : 'Got it! Start Exploring'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default FeatureSpotlightModal;
