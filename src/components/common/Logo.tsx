import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', variant = 'light', className = '' }) => {
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
    sm: 'text-[10px] font-black tracking-[0.2em]',
    md: 'text-xs sm:text-sm font-black tracking-[0.22em]',
    lg: 'text-sm sm:text-base font-black tracking-[0.25em]',
  };

  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3 select-none ${className}`}>
      {/* ML Brand Mark Image */}
      <img
        src="/logo.png"
        alt="ML Manikandan Lathe Symbol"
        className={`${logoSizes[size]} object-contain drop-shadow-sm transition-transform duration-200 hover:scale-105`}
        onError={(e) => {
          // Fallback rendering if image path is unavailable
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
        }}
      />

      {/* Brand Text Stack */}
      <div className="flex flex-col justify-center">
        {/* MANIKANDAN / மணிகண்டன் */}
        <span className={`text-brand-600 font-sans ${manikandanSizes[size]} uppercase drop-shadow-[0_1px_1px_rgba(234,88,12,0.15)]`}>
          {isTamil ? 'மணிகண்டன்' : 'MANIKANDAN'}
        </span>

        {/* LATHE / லேத் with extra bold font and subtle side lines */}
        <div className={`flex items-center justify-center gap-1.5 uppercase mt-0.5 ${variant === 'dark' ? 'text-white' : 'text-charcoal-900'}`}>
          <span className={`h-[2px] w-3.5 sm:w-5 rounded-full ${variant === 'dark' ? 'bg-brand-400' : 'bg-brand-500'}`}></span>
          <span className={`${latheSizes[size]} text-center font-black tracking-[0.22em] uppercase drop-shadow-sm`}>
            {isTamil ? 'லேத்' : 'LATHE'}
          </span>
          <span className={`h-[2px] w-3.5 sm:w-5 rounded-full ${variant === 'dark' ? 'bg-brand-400' : 'bg-brand-500'}`}></span>
        </div>
      </div>
    </div>
  );
};
