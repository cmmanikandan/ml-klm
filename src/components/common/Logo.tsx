import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark';
  className?: string;
  showLocation?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', variant = 'light', className = '', showLocation = false }) => {
  const { language } = useLanguage();

  const isTamil = language === 'ta';

  const logoSizes = {
    sm: 'h-8 w-8 min-w-[32px]',
    md: 'h-11 w-11 min-w-[44px]',
    lg: 'h-16 w-16 min-w-[64px]',
  };

  const manikandanSizes = {
    sm: 'text-base leading-tight font-extrabold tracking-wider',
    md: 'text-xl sm:text-2xl leading-none font-black tracking-wider',
    lg: 'text-3xl sm:text-4xl leading-none font-black tracking-widest',
  };

  const latheSizes = {
    sm: 'text-[9px] font-black tracking-[0.22em]',
    md: 'text-xs sm:text-sm font-black tracking-[0.24em]',
    lg: 'text-sm sm:text-base font-black tracking-[0.26em]',
  };

  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3 select-none ${className}`}>
      {/* ML Brand Mark Image */}
      <img
        src="/logo.png"
        alt="ML Manikandan Lathe Symbol"
        className={`${logoSizes[size]} object-contain drop-shadow-sm transition-transform duration-200 hover:scale-105 shrink-0`}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
        }}
      />

      {/* Brand Text Stack (Center Aligned under MANIKANDAN) */}
      <div className="flex flex-col items-center justify-center text-center">
        {/* MANIKANDAN / மணிகண்டன் */}
        <span className={`text-brand-600 font-sans ${manikandanSizes[size]} uppercase drop-shadow-[0_1px_1px_rgba(234,88,12,0.15)] text-center tracking-wider`}>
          {isTamil ? 'மணிகண்டன்' : 'MANIKANDAN'}
        </span>

        {/* —— LATHE —— centered under MANIKANDAN */}
        <div className={`flex items-center justify-center gap-2 uppercase mt-0.5 w-full ${variant === 'dark' ? 'text-white' : 'text-charcoal-900'}`}>
          <span className={`h-[2px] flex-1 max-w-[24px] rounded-full ${variant === 'dark' ? 'bg-brand-400' : 'bg-brand-500'}`}></span>
          <span className={`${latheSizes[size]} font-black tracking-[0.24em] uppercase text-center shrink-0`}>
            {isTamil ? 'லேத்' : 'LATHE'}
          </span>
          <span className={`h-[2px] flex-1 max-w-[24px] rounded-full ${variant === 'dark' ? 'bg-brand-400' : 'bg-brand-500'}`}></span>
        </div>

        {/* Location Badge: KALLIMANDHAYAM (ONLY shown when explicitly showLocation=true, e.g. Splash Screen) */}
        {showLocation && (
          <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest mt-0.5 text-center ${variant === 'dark' ? 'text-amber-400' : 'text-brand-700'}`}>
            {isTamil ? 'கள்ளிமந்தையம்' : 'KALLIMANDHAYAM'}
          </span>
        )}
      </div>
    </div>
  );
};
