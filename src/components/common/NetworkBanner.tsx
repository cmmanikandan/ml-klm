import React, { useEffect } from 'react';
import { WifiOff, Wifi, CheckCircle2, X } from 'lucide-react';
import { useNetworkStatus } from '../../context/NetworkStatusContext';
import { useLanguage } from '../../context/LanguageContext';

export const NetworkBanner: React.FC = () => {
  const { isOnline, wasOffline, dismissReconnected } = useNetworkStatus();
  const { language } = useLanguage();

  // Auto-dismiss the "back online" green notification after 3.5 seconds
  useEffect(() => {
    if (isOnline && wasOffline) {
      const timer = setTimeout(() => {
        dismissReconnected();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline, dismissReconnected]);

  // Don't render anything if online and not in reconnected state
  if (isOnline && !wasOffline) {
    return null;
  }

  const isOffline = !isOnline;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-16 md:top-20 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 transform px-3 py-1.5 rounded-full shadow-lg border backdrop-blur-md flex items-center gap-2 max-w-[92vw] sm:max-w-md ${
        isOffline
          ? 'bg-amber-950/90 text-amber-200 border-amber-500/40 animate-pulse-subtle'
          : 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40 animate-bounce-short'
      }`}
    >
      {isOffline ? (
        <>
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </span>
          <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-xs sm:text-sm font-medium truncate">
            {language === 'ta'
              ? 'ஆஃப்லைன் முறை — சேமிக்கப்பட்ட தகவல்கள்'
              : 'Offline Mode — Browsing cached catalog'}
          </span>
        </>
      ) : (
        <>
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-medium truncate">
            {language === 'ta'
              ? 'மீண்டும் ஆன்லைன்! புதுப்பிக்கப்படுகிறது'
              : 'Back Online! Reconnected to workshop'}
          </span>
          <button
            onClick={dismissReconnected}
            className="p-0.5 hover:bg-white/10 rounded-full transition-colors ml-1"
            title="Dismiss"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5 opacity-80 hover:opacity-100" />
          </button>
        </>
      )}
    </div>
  );
};
