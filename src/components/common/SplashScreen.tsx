import React from 'react';
import { Logo } from './Logo';
import { MapPin } from 'lucide-react';

export const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 bg-[#FFF9F2] flex flex-col items-center justify-center p-6 text-center animate-fade-in select-none">
      
      {/* Background Soft Warm Radial Glow */}
      <div className="absolute w-72 h-72 bg-brand-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />

      {/* Main Logo Showcase Card with Warm White Background */}
      <div className="relative z-10 p-6 sm:p-8 bg-white rounded-3xl border-2 border-brand-200 shadow-2xl flex flex-col items-center justify-center">
        <Logo size="lg" className="justify-center" showLocation={true} />
      </div>

      {/* Dual Animated Loading Spinner */}
      <div className="relative z-10 mt-10 flex flex-col items-center gap-3.5">
        <div className="relative w-12 h-12 flex items-center justify-center">
          {/* Outer Ring */}
          <div className="absolute inset-0 rounded-full border-4 border-brand-100" />
          {/* Outer Spin Ring */}
          <div className="absolute inset-0 rounded-full border-4 border-brand-600 border-t-transparent animate-spin" />
          {/* Inner Amber Reverse Spin Ring */}
          <div className="absolute w-6 h-6 rounded-full border-2 border-amber-500 border-b-transparent animate-spin-reverse" />
        </div>

        {/* Loading Subtitle */}
        <div className="flex items-center gap-1.5 text-xs font-extrabold text-charcoal-700">
          <MapPin className="w-3.5 h-3.5 text-brand-600 animate-bounce" />
          <span className="tracking-wider uppercase">Kallimandhayam • Tamil Nadu</span>
        </div>
      </div>
    </div>
  );
};
