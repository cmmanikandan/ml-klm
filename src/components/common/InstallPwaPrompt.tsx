import React, { useState, useEffect } from 'react';
import { Download, Share2, PlusSquare, X, Smartphone, Check, Zap, WifiOff, Bell, Sparkles, ArrowUpRight } from 'lucide-react';
import { useNetworkStatus } from '../../context/NetworkStatusContext';
import { useLanguage } from '../../context/LanguageContext';

export const InstallPwaPrompt: React.FC = () => {
  const { 
    isInstallable, 
    isInstalled, 
    isIOS, 
    isInstallModalOpen, 
    openInstallModal, 
    closeInstallModal, 
    promptInstall,
    deferredPrompt 
  } = useNetworkStatus();
  const { language } = useLanguage();
  const isTamil = language === 'ta';

  const [showBottomBanner, setShowBottomBanner] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [desktopHint, setDesktopHint] = useState(false);

  useEffect(() => {
    if (isInstalled) {
      setShowBottomBanner(false);
      return;
    }

    // Check if dismissed previously within 7 days
    const dismissedUntil = localStorage.getItem('ml_pwa_prompt_dismissed');
    if (dismissedUntil && Date.now() < Number(dismissedUntil)) {
      return;
    }

    // Delay prompt appearance by 3 seconds for smooth page intro
    const timer = setTimeout(() => {
      if (!isInstalled) {
        setShowBottomBanner(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [isInstalled]);

  const handleDismissBanner = () => {
    setShowBottomBanner(false);
    localStorage.setItem('ml_pwa_prompt_dismissed', String(Date.now() + 7 * 24 * 60 * 60 * 1000));
  };

  const handleTriggerInstall = async () => {
    if (isIOS) {
      setShowIosGuide(true);
      return;
    }

    if (deferredPrompt) {
      const installed = await promptInstall();
      if (installed) {
        setInstallSuccess(true);
        setTimeout(() => {
          closeInstallModal();
          setShowBottomBanner(false);
        }, 1500);
      }
    } else {
      // Desktop / Browser manual install hint
      setDesktopHint(true);
    }
  };

  if (isInstalled) {
    return null;
  }

  return (
    <>
      {/* 1. FLOATING BOTTOM ACTION BANNER (Only when not in full modal and not installed) */}
      {showBottomBanner && !isInstallModalOpen && (
        <div
          className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-40 bg-slate-900/95 text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl border border-brand-500/40 backdrop-blur-md transition-all duration-300 animate-slide-up"
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
                  {isTamil ? 'செயலியை நிறுவுக' : 'Install Lathe App'}
                </h4>
                <button
                  onClick={handleDismissBanner}
                  className="text-slate-400 hover:text-white p-1 rounded-full transition-colors -mr-1"
                  aria-label="Close install prompt"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">
                {isTamil
                  ? 'முகப்புத் திரையில் சேர்த்து ஆஃப்லைனிலும் விரைவாக பயன்படுத்தலாம்.'
                  : 'Add to your Home Screen for faster access, offline browsing & order tracking.'}
              </p>

              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={openInstallModal}
                  className="flex-1 bg-brand-500 hover:bg-brand-600 active:scale-98 text-white text-xs font-semibold py-2 px-3 rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isTamil ? 'செயலியை நிறுவுக' : 'Install App'}</span>
                </button>

                <button
                  onClick={handleDismissBanner}
                  className="px-2.5 py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {isTamil ? 'பிறகு' : 'Later'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. RICH DEDICATED INSTALL POPUP MODAL (When clicked from Profile or Banner) */}
      {isInstallModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 text-white rounded-3xl max-w-md w-full p-6 sm:p-7 border border-slate-700 shadow-2xl relative space-y-5 animate-slide-up">
            
            {/* Close Button */}
            <button
              onClick={closeInstallModal}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* App Header Preview */}
            <div className="flex items-center gap-3.5">
              <img
                src="/logo.png"
                alt="Manikandan Lathe"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-brand-500 shadow-lg shrink-0 bg-white p-1"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-lg font-black text-white truncate">
                    MANIKANDAN LATHE
                  </h3>
                  <span className="bg-brand-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-sm uppercase">
                    APP
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium">
                  {isTamil ? 'வெல்டிங் மற்றும் லேத் கஸ்டம் வேலைகள்' : 'Welding & Lathe Custom Works'}
                </p>
                <span className="text-[11px] text-amber-400 font-bold block mt-0.5">
                  ⭐ 4.9 • Free • Progressive Web App
                </span>
              </div>
            </div>

            {/* Feature Highlights Grid */}
            <div className="space-y-2.5 bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/60 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <WifiOff className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white block">
                    {isTamil ? 'ஆஃப்லைன் பயன்பாடு' : 'Offline Access'}
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    {isTamil ? 'இணையம் இல்லாமலும் பொருட்களைப் பார்க்கலாம்' : 'Browse product catalogue & prices without internet'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white block">
                    {isTamil ? '1-நொடி உடனடி முகப்புத் திரை அணுகல்' : '1-Tap Instant Launch'}
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    {isTamil ? 'மொபைல் செயலி போல முழுத் திரையில் இயங்கும்' : 'Opens in full standalone window like a native app'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white block">
                    {isTamil ? 'நேரடி ஆர்டர் அறிவிப்புகள்' : 'Live Order & Invoice Sync'}
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    {isTamil ? 'தயாரிப்பு நிலை மற்றும் ஜிஎஸ்டி ரசீதுகள்' : 'Real-time fabrication tracking & verified tax bills'}
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop / Browser Helper Note if direct prompt is not supported */}
            {desktopHint && (
              <div className="bg-brand-950/80 border border-brand-500/40 p-3 rounded-xl text-xs text-brand-200">
                <p className="font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-brand-400 inline" />
                  {isTamil ? 'உலாவியில் நிறுவ:' : 'To Install in Browser:'}
                </p>
                <p className="text-[11px] text-slate-300 mt-1">
                  {isTamil
                    ? 'முகவரிப் பட்டியில் (Address Bar) உள்ள Install ஐகானை (⊕) அழுத்தவும் அல்லது உலாவியின் மெனுவை (⋮) திறந்து "Install App" என்பதைத் தேர்ந்தெடுக்கவும்.'
                    : 'Click the Install icon (⊕) in the browser address bar at the top right, or click browser menu (⋮) -> "Install App".'}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleTriggerInstall}
                className="w-full bg-gradient-to-r from-brand-500 to-amber-600 hover:from-brand-600 hover:to-amber-700 active:scale-98 text-white font-extrabold py-3 px-4 rounded-xl text-sm shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {installSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{isTamil ? 'நிறுவப்பட்டது! ✓' : 'App Installed! ✓'}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>{isTamil ? 'இப்போதே நிறுவுக' : 'Install App Now'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={closeInstallModal}
                className="w-full py-2.5 text-xs text-slate-400 hover:text-slate-200 transition-colors font-semibold"
              >
                {isTamil ? 'மூடுக' : 'Cancel'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 3. iOS Safari Step-by-Step Instructions Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 text-white rounded-t-3xl sm:rounded-2xl max-w-md w-full p-6 border border-slate-700 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-base font-bold">
                  {isTamil ? 'ஐபோனில் நிறுவும் முறை' : 'Install on iPhone / iPad'}
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
                    {isTamil ? 'பகிர் (Share) ஐகானை அழுத்தவும்' : 'Tap the Share Button'}
                  </p>
                  <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-1">
                    {isTamil
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
                    {isTamil
                      ? '"முகப்புத் திரையில் சேர்" என்பதைத் தேர்ந்தெடுக்கவும்'
                      : 'Select "Add to Home Screen"'}
                  </p>
                  <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-1">
                    {isTamil ? 'மெனுவை கீழே உருட்டி' : 'Scroll down the menu to find'}{' '}
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
                    {isTamil ? '"சேர்" (Add) என்பதை அழுத்தவும்' : 'Tap "Add" in Top Right'}
                  </p>
                  <p className="text-slate-400 text-xs mt-0.5">
                    {isTamil
                      ? 'செயலி உங்கள் முகப்புத் திரையில் நிறுவப்படும்'
                      : 'The Manikandan Lathe App icon will appear on your phone screen'}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowIosGuide(false);
                closeInstallModal();
              }}
              className="mt-5 w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors"
            >
              {isTamil ? 'புரிந்தது' : 'Got it!'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
