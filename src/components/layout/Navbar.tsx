import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, User, Globe } from 'lucide-react';
import { Logo } from '../common/Logo';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const isTamil = language === 'ta';

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ta' : 'en');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-warm-border/60 shadow-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand Logo Lockup */}
          <Link to="/" className="flex items-center">
            <Logo size="md" />
          </Link>

          {/* Desktop Search Card Bar */}
          <div
            onClick={() => navigate('/search')}
            className="hidden md:flex items-center flex-1 max-w-md mx-8 bg-warm-bg hover:bg-warm-hover border border-warm-border rounded-full px-4 py-2.5 cursor-pointer text-charcoal-500 transition-colors shadow-inner"
          >
            <Search className="w-4 h-4 text-brand-600 mr-3 shrink-0" />
            <span className="text-sm font-medium">{t('search_placeholder')}</span>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher Button (Hidden on Mobile, Available in Profile Page) */}
            <button
              onClick={toggleLanguage}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warm-bg hover:bg-brand-100 border border-brand-200 text-xs font-bold text-brand-700 transition-all shadow-sm"
              title="Switch Language / மொழியை மாற்றுக"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'தமிழ்' : 'English'}</span>
            </button>

            {/* Mobile Search Icon */}
            <button
              onClick={() => navigate('/search')}
              className="md:hidden p-2 text-charcoal-700 hover:text-brand-600 hover:bg-warm-hover rounded-full transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Notifications */}
            <button
              onClick={() => navigate('/notifications')}
              className="p-2 text-charcoal-700 hover:text-brand-600 hover:bg-warm-hover rounded-full transition-colors relative"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-600 rounded-full"></span>
            </button>

            {/* User Profile Avatar / My Account */}
            {user ? (
              <Link
                to="/profile"
                className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-brand-500/50 transition-all"
              >
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name}
                    className="w-9 h-9 rounded-full object-cover border-2 border-brand-500 shadow-sm"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-brand-100 border-2 border-brand-500 flex items-center justify-center text-brand-700 font-bold text-xs">
                    {(user.full_name || 'C').charAt(0).toUpperCase()}
                  </div>
                )}
              </Link>
            ) : (
              <Link
                to="/profile"
                className="flex items-center gap-1.5 bg-warm-bg hover:bg-brand-100 border border-brand-200 text-brand-700 px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all shadow-sm"
              >
                <User className="w-3.5 h-3.5" />
                <span>{isTamil ? 'என் கணக்கு' : 'My Account'}</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
