import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, Globe, Phone, Home, Package, Info, PhoneCall, Menu, X, ChevronRight } from 'lucide-react';
import { Logo } from '../common/Logo';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { DEFAULT_SHOP_INFO } from '../../lib/supabase';

export const PublicHeader: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isTamil = language === 'ta';

  const navLinks = [
    { to: '/', label_en: 'Home', label_ta: 'முகப்பு', icon: Home },
    { to: '/products', label_en: 'Products', label_ta: 'பொருட்கள்', icon: Package },
    { to: '/about', label_en: 'About Us', label_ta: 'எங்களைப் பற்றி', icon: Info },
    { to: '/contact', label_en: 'Contact', label_ta: 'தொடர்பு', icon: PhoneCall },
  ];

  return (
    <header className="bg-white border-b border-warm-border sticky top-0 z-40 shadow-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Brand Logo */}
          <Link to="/" className="flex items-center">
            <Logo size="md" />
          </Link>

          {/* Middle: Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-sm font-extrabold transition-colors relative py-1 ${
                    isActive ? 'text-brand-600' : 'text-charcoal-800 hover:text-brand-600'
                  }`}
                >
                  <span>{isTamil ? link.label_ta : link.label_en}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warm-bg hover:bg-brand-100 border border-brand-200 text-xs font-bold text-brand-700 transition-all shadow-sm"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'தமிழ்' : 'English'}</span>
            </button>

            {/* Quick Call Button */}
            <a
              href={`tel:${DEFAULT_SHOP_INFO.phone}`}
              className="hidden lg:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-warm-bg hover:bg-warm-hover border border-warm-border text-xs font-bold text-charcoal-800 transition-all"
            >
              <Phone className="w-3.5 h-3.5 text-brand-600" />
              <span>Call Shop</span>
            </a>

            {/* Sign In Button */}
            {user ? (
              <Link
                to="/home"
                className="hidden sm:flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-extrabold px-4 py-2 rounded-full text-xs transition-all shadow-md"
              >
                <User className="w-3.5 h-3.5" />
                <span>{isTamil ? 'என் கணக்கு' : 'Customer Panel'}</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white font-extrabold px-4 py-2 rounded-full text-xs transition-all shadow-md"
              >
                <User className="w-3.5 h-3.5" />
                <span>{isTamil ? 'உள்நுழைக' : 'Sign In'}</span>
              </Link>
            )}

            {/* ☰ Mobile Hamburger Menu Trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-charcoal-800 hover:text-brand-600 hover:bg-warm-bg rounded-xl transition-colors border border-warm-border"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-brand-600" /> : <Menu className="w-6 h-6" />}
            </button>

          </div>

        </div>
      </div>

      {/* ☰ Mobile Dropdown Navigation Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-warm-border px-4 pt-3 pb-5 space-y-3 animate-fade-in shadow-2xl">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-charcoal-400 uppercase tracking-widest block mb-2 px-2">
              NAVIGATION MENU
            </span>

            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              const Icon = link.icon;

              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-extrabold transition-all ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-charcoal-800 hover:bg-warm-bg'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{isTamil ? link.label_ta : link.label_en}</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 ${isActive ? 'text-white' : 'text-charcoal-400'}`} />
                </Link>
              );
            })}
          </div>

          {/* Quick Contact & Action Buttons inside Mobile Menu */}
          <div className="pt-3 border-t border-warm-border space-y-2">
            <a
              href={`tel:${DEFAULT_SHOP_INFO.phone}`}
              className="w-full flex items-center justify-center gap-2 bg-warm-bg hover:bg-warm-hover text-charcoal-800 font-bold py-2.5 px-4 rounded-xl text-xs border border-warm-border"
            >
              <Phone className="w-3.5 h-3.5 text-brand-600" />
              <span>Call Shop ({DEFAULT_SHOP_INFO.phone})</span>
            </a>

            {user ? (
              <Link
                to="/home"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs shadow-sm"
              >
                <User className="w-3.5 h-3.5" />
                <span>{isTamil ? 'என் கணக்கு' : 'Go to Customer Panel'}</span>
              </Link>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs shadow-sm"
              >
                <User className="w-3.5 h-3.5" />
                <span>{isTamil ? 'உள்நுழைக' : 'Sign In to Account'}</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
