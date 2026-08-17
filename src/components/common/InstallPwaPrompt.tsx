import React, { useState, useEffect } from 'react';
import { Download, Share2, PlusSquare, X, Smartphone, Check } from 'lucide-react';
import { useNetworkStatus } from '../../context/NetworkStatusContext';
import { useLanguage } from '../../context/LanguageContext';

export const InstallPwaPrompt: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, promptInstall } = useNetworkStatus();
  const { language } = useLanguage();
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  useEffect(() => {
    // Check if dismissed previously within 7 days
    const dismissedUntil = localStorage.getItem('ml_pwa_prompt_dismissed');
    if (dismissedUntil && Date.now() < Number(dismissedUntil)) {
      return;
    }

    // Delay prompt appearance by 3 seconds for smooth page intro
    const timer = setTimeout(() => {
      if (!isInstalled && (isInstallable || isIOS)) {
        setShowPrompt(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [isInstallable, isInstalled, isIOS]);

  const handleDismiss = () => {
    setShowPrompt(false);
    // Dismiss for 7 days
    localStorage.setItem('ml_pwa_prompt_dismissed', String(Date.now() + 7 * 24 * 60 * 60 * 1000));
  };

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIosGuide(true);
      return;
    }

    if (isInstallable) {
      const installed = await promptInstall();
      if (installed) {
        setInstallSuccess(true);
        setTimeout(() => setShowPrompt(false), 2000);
      }
    }
  };

  if (!showPrompt || isInstalled) {
    return null;
  }

  return (
    <>
      {/* Floating Bottom Action Banner */}
      <div
        className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-40 bg-slate-900/95 text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl border border-brand-500/30 backdrop-blur-md transition-all duration-300 animate-slide-up"
        role="region"
        aria-label="Install Manikandan Lathe App"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-amber-600 flex items-center justify-center text-white shrink-0 shadow-md">
            <Smartphone className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-white tracking-wide">
                {language === 'ta' ? 'செயலியை நிறுவுக' : 'Install Lathe App'}
              </h4>
              <button
                onClick={handleDismiss}
                className="text-slate-400 hover:text-white p-1 rounded-full transition-colors -mr-1"
                aria-label="Close install prompt"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">
              {language === 'ta'
                ? 'விரைவான அணுகல் மற்றும் ஆஃப்லைன் பயன்பாட்டிற்கு முகப்புத் திரையில் சேர்க்கவும்.'
                : 'Add to your Home Screen for faster access, offline browsing & instant order tracking.'}
            </p>

            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={handleInstallClick}
                className="flex-1 bg-brand-500 hover:bg-brand-600 active:scale-98 text-white text-xs font-semibold py-2 px-3 rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5"
              >
                {installSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{language === 'ta' ? 'நிறுவப்பட்டது!' : 'Installed!'}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>{language === 'ta' ? 'முகப்புத் திரையில் சேர்' : 'Add to Home Screen'}</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDismiss}
                className="px-2.5 py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                {language === 'ta' ? 'பிறகு' : 'Later'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* iOS Safari Step-by-Step Instructions Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-slate-900 text-white rounded-t-3xl sm:rounded-2xl max-w-md w-full p-6 border border-slate-700 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-base font-bold">
                  {language === 'ta' ? 'ஐபோனில் நிறுவும் முறை' : 'Install on iPhone / iPad'}
                </h3>
              </div>
              <button
                onClick={() => setShowIosGuide(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs sm:text-sm text-slate-300">
              <div className="flex items-start gap-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700/50">
                <div className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-400 font-bold flex items-center justify-center shrink-0">
                  1
                </div>
                <div>
                  <p className="font-medium text-white">
                    {language === 'ta' ? 'பகிர் (Share) ஐகானை அழுத்தவும்' : 'Tap the Share Button'}
                  </p>
                  <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-1">
                    {language === 'ta'
                      ? 'சஃபாரி உலாவியின் கீழ்ப் பகுதியில் உள்ள'
                      : 'At the bottom of Safari screen'}{' '}
                    <Share2 className="w-3.5 h-3.5 text-blue-400 inline" />
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700/50">
                <div className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-400 font-bold flex items-center justify-center shrink-0">
                  2
                </div>
                <div>
                  <p className="font-medium text-white">
                    {language === 'ta'
                      ? '"முகப்புத் திரையில் சேர்" என்பதைத் தேர்ந்தெடுக்கவும்'
                      : 'Select "Add to Home Screen"'}
                  </p>
                  <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-1">
                    {language === 'ta' ? 'மெனுவை கீழே உருட்டி' : 'Scroll down the menu to find'}{' '}
                    <PlusSquare className="w-3.5 h-3.5 text-amber-400 inline" />
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700/50">
                <div className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-400 font-bold flex items-center justify-center shrink-0">
                  3
                </div>
                <div>
                  <p className="font-medium text-white">
                    {language === 'ta' ? '"சேர்" (Add) என்பதை அழுத்தவும்' : 'Tap "Add" in Top Right'}
                  </p>
                  <p className="text-slate-400 text-xs mt-0.5">
                    {language === 'ta'
                      ? 'செயலி உங்கள் முகப்புத் திரையில் நிறுவப்படும்'
                      : 'The Manikandan Lathe App icon will appear on your phone screen'}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIosGuide(false)}
              className="mt-5 w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors"
            >
              {language === 'ta' ? 'புரிந்தது' : 'Got it!'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
