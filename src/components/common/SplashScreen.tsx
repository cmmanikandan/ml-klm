import React, { useState, useEffect } from 'react';
import { Logo } from './Logo';
import { MapPin, Sparkles, Wrench, Flame } from 'lucide-react';

export const SplashScreen: React.FC = () => {
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + Math.floor(Math.random() * 20) + 10;
      });
    }, 180);

    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 sm:p-8 text-center animate-fade-in select-none"
      style={{
        backgroundColor: '#0F172A',
        backgroundImage: 'radial-gradient(ellipse 80% 80% at 50% -20%, rgba(245, 102, 0, 0.25), rgba(255, 255, 255, 0))'
      }}
    >
      {/* Top Spacer */}
      <div className="w-full max-w-xs flex justify-between items-center opacity-60">
        <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
          ESTD. 2018
        </span>
        <span className="text-[10px] font-mono font-bold tracking-widest text-brand-400 uppercase flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-brand-400" />
          <span>KALLIMANDHAYAM</span>
        </span>
      </div>

      {/* Main Center Stage */}
      <div className="relative flex flex-col items-center my-auto">
        {/* Soft Ambient Glow Halo */}
        <div className="absolute -inset-8 bg-gradient-to-r from-brand-600/30 via-amber-500/20 to-orange-600/30 rounded-full blur-3xl pointer-events-none animate-pulse" />

        {/* Brand Logo Showcase Card */}
        <div className="relative z-10 p-7 sm:p-9 bg-slate-900/90 rounded-3xl border border-brand-500/40 shadow-[0_0_50px_rgba(245,102,0,0.25)] backdrop-blur-xl flex flex-col items-center justify-center">
          <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xl border border-slate-100 mb-4">
            <img 
              src="/logo.png" 
              alt="Manikandan Lathe" 
              className="w-24 h-24 sm:w-28 sm:h-28 object-contain"
            />
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">
            MANIKANDAN LATHE
          </h1>
          <p className="text-xs font-extrabold text-brand-400 tracking-wider uppercase mt-0.5">
            WELDING & METAL WORKS
          </p>
          <p className="text-[11px] font-bold text-slate-400 mt-1">
            மணிகண்டன் லேத் & வெல்டிங் பட்டறை
          </p>
        </div>

        {/* High-Tech Lathe / Welding Animated Spinner */}
        <div className="relative z-10 mt-8 flex flex-col items-center gap-4">
          <div className="relative w-14 h-14 flex items-center justify-center">
            {/* Outer Glowing Pulsing Ring */}
            <div className="absolute inset-0 rounded-full border-2 border-brand-500/20 animate-ping opacity-50" />

            {/* Precision Lathe Gear Orbit Ring */}
            <div className="absolute inset-0 rounded-full border-3 border-slate-700" />
            <div className="absolute inset-0 rounded-full border-3 border-transparent border-t-brand-500 border-r-amber-400 animate-spin" />

            {/* Inner Reverse High-Speed Spin */}
            <div className="absolute w-8 h-8 rounded-full border-2 border-transparent border-b-orange-400 border-l-brand-300 animate-spin-reverse" />

            {/* Center Glowing Spark Center Icon */}
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-brand-500 to-amber-500 flex items-center justify-center shadow-md shadow-brand-500/50">
              <Flame className="w-3 h-3 text-white fill-white animate-pulse" />
            </div>
          </div>

          {/* Smooth Gradient Progress Bar */}
          <div className="w-48 sm:w-56 space-y-1.5">
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div 
                className="h-full bg-gradient-to-r from-brand-500 via-amber-400 to-orange-500 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(245,102,0,0.8)]"
                style={{ width: `${Math.min(100, progress)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1 text-slate-300">
                <Wrench className="w-3 h-3 text-brand-400 inline" />
                <span>Loading Workshop...</span>
              </span>
              <span className="font-bold text-brand-400">{Math.min(100, progress)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Location Pin */}
      <div className="relative z-10 flex items-center gap-1.5 text-xs font-bold text-slate-400 bg-slate-800/80 px-4 py-2 rounded-full border border-slate-700/60 shadow-md backdrop-blur-sm">
        <MapPin className="w-3.5 h-3.5 text-brand-400 shrink-0" />
        <span className="tracking-wide">Kallimandhayam - 624616 • Dindigul</span>
      </div>
    </div>
  );
};
