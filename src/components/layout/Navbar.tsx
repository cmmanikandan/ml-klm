import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, User, Globe, Home, Package, ShoppingBag, Heart } from 'lucide-react';
import { Logo } from '../common/Logo';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { fetchUserNotifications } from '../../lib/notificationsStore';

export const Navbar: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const { user } = useAuth();
  const { wishlistProductIds } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();

  const isTamil = language === 'ta';
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  useEffect(() => {
    loadNotifCount();
  }, [user?.id, location.pathname]);

  const loadNotifCount = async () => {
    try {
      const notifs = await fetchUserNotifications(user?.id);
      setUnreadNotifCount(notifs.filter((n) => !n.is_read).length);
    } catch (e) {
      console.warn('Navbar notification count error', e);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ta' : 'en');
  };

  const navLinks = [
    { to: '/home', label_en: 'Home', label_ta: 'முகப்பு', icon: Home },
    { to: '/products', label_en: 'Products', label_ta: 'தயாரிப்புகள்', icon: Package },
    { to: '/orders', label_en: 'My Orders', label_ta: 'என் ஆர்டர்கள்', icon: ShoppingBag },
    { to: '/wishlist', label_en: 'Wishlist', label_ta: 'விருப்பப்பட்டியல்', icon: Heart, badge: wishlistProductIds.length },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-warm-border/60 shadow-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Left: Brand Logo */}
          <Link to="/home" className="flex items-center shrink-0">
            <Logo size="md" />
          </Link>

          {/* Desktop Search Card Bar */}
          <div
            onClick={() => navigate('/search')}
            className="hidden md:flex items-center flex-1 max-w-sm bg-warm-bg hover:bg-warm-hover border border-warm-border rounded-full px-4 py-2 cursor-pointer text-charcoal-500 transition-colors shadow-inner"
          >
            <Search className="w-4 h-4 text-brand-600 mr-2.5 shrink-0" />
            <span className="text-xs font-medium truncate">{t('search_placeholder')}</span>
          </div>

          {/* Middle: Web Customer Navigation Links (Home -> /home, Products, My Orders, Wishlist) */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to || (link.to !== '/home' && location.pathname.startsWith(link.to));
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`inline-flex items-center gap-1.5 text-xs font-extrabold transition-colors py-1 relative ${
                    isActive ? 'text-brand-600' : 'text-charcoal-700 hover:text-brand-600'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{isTamil ? link.label_ta : link.label_en}</span>
                  {link.badge && link.badge > 0 ? (
                    <span className="bg-brand-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                      {link.badge}
                    </span>
                  ) : null}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Language Switcher (Desktop Only) */}
            <button
              onClick={toggleLanguage}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warm-bg hover:bg-brand-100 border border-brand-200 text-xs font-bold text-brand-700 transition-all shadow-sm shrink-0"
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

            {/* Notifications Icon Button */}
            <button
              onClick={() => navigate('/notifications')}
              className="p-2 text-charcoal-700 hover:text-brand-600 hover:bg-warm-hover rounded-full transition-colors relative"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifCount > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 bg-brand-600 text-white text-[10px] font-black min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {unreadNotifCount}
                </span>
              ) : (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-charcoal-300 rounded-full"></span>
              )}
            </button>

            {/* User Profile Link / My Account */}
            {user ? (
              <Link
                to="/profile"
                className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-brand-500/50 transition-all"
                title="Profile Settings"
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
