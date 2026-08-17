import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Heart, ShoppingBag, Globe, HelpCircle, LogOut, ChevronRight, Bell, Camera, LayoutDashboard, ShieldCheck, Smartphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNetworkStatus } from '../context/NetworkStatusContext';

export const ProfilePage: React.FC = () => {
  const { user, isAdmin, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { isInstallable, isInstalled, isIOS, promptInstall } = useNetworkStatus();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const displayName = (user?.full_name && user.full_name.trim() !== '')
    ? user.full_name
    : (user?.email ? (user.email.includes('manikandan') ? 'Manikandan Prabhu' : user.email.split('@')[0]) : 'Manikandan Prabhu');

  return (
    <div className="min-h-screen bg-warm-bg pb-24 md:pb-12 pt-4">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Profile Card Header with DP Avatar */}
        <div className="bg-white rounded-3xl p-6 border border-warm-border shadow-card flex items-center gap-4 relative">
          <Link to="/profile/details" className="relative group shrink-0">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={displayName}
                className="w-16 h-16 rounded-full object-cover border-4 border-brand-500 shadow-sm transition-opacity group-hover:opacity-80"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-brand-600 text-white font-black text-xl flex items-center justify-center shadow-md">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute bottom-0 right-0 bg-brand-600 text-white p-1 rounded-full shadow-sm border border-white">
              <Camera className="w-3 h-3" />
            </div>
          </Link>

          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-black text-charcoal-900 truncate">{displayName}</h2>
            <p className="text-xs text-charcoal-500 font-medium truncate">{user?.email}</p>

            <div className="flex items-center gap-2 mt-1.5">
              <span className="bg-brand-100 text-brand-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                {isAdmin ? 'Master Admin' : (user?.role || 'Customer')}
              </span>
              <span className="text-[10px] text-charcoal-500 font-bold truncate">
                {user?.city_area || 'Kallimandhayam'}
              </span>
            </div>
          </div>

          <Link
            to="/profile/details"
            className="text-xs font-extrabold text-brand-600 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-full border border-brand-200 transition-colors shrink-0"
          >
            Edit DP
          </Link>
        </div>

        {/* ADMIN DASHBOARD LINK (Visible for Master Admin accounts) */}
        {isAdmin && (
          <Link
            to="/admin/dashboard"
            className="bg-gradient-to-r from-charcoal-900 via-charcoal-800 to-brand-900 text-white rounded-3xl p-5 border-2 border-brand-500 shadow-xl flex items-center justify-between group hover:scale-[1.01] transition-all"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-brand-600 text-white shadow-md">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-white">Open Admin SaaS Dashboard</h3>
                  <span className="bg-brand-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                    MASTER ADMIN
                  </span>
                </div>
                <p className="text-xs text-brand-200 font-medium mt-0.5">
                  Manage orders, products, price quotes & payments ledger
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-brand-400 group-hover:translate-x-1 transition-transform" />
          </Link>
        )}

        {/* Options List */}
        <div className="bg-white rounded-3xl border border-warm-border shadow-card divide-y divide-warm-muted overflow-hidden">
          
          {/* My Details & Profile DP */}
          <Link
            to="/profile/details"
            className="flex items-center justify-between p-4 hover:bg-warm-hover transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2 rounded-xl bg-brand-100 text-brand-600">
                <User className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-charcoal-900 block">{t('my_details')}</span>
                <span className="text-[11px] text-charcoal-500 font-medium">Update name, phone, address & Profile DP</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-charcoal-400" />
          </Link>

          {/* Wishlist */}
          <Link
            to="/wishlist"
            className="flex items-center justify-between p-4 hover:bg-warm-hover transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2 rounded-xl bg-rose-100 text-rose-600">
                <Heart className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-charcoal-900">{t('my_wishlist')}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-charcoal-400" />
          </Link>

          {/* My Orders */}
          <Link
            to="/orders"
            className="flex items-center justify-between p-4 hover:bg-warm-hover transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-charcoal-900">{t('my_orders')}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-charcoal-400" />
          </Link>

          {/* App Language */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}
            className="w-full flex items-center justify-between p-4 hover:bg-warm-hover transition-colors text-left"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-charcoal-900">{t('language_setting')}</span>
                <span className="text-xs text-charcoal-500 block font-medium">
                  {language === 'en' ? 'English (ஆங்கிலம்)' : 'தமிழ் (Tamil)'}
                </span>
              </div>
            </div>
            <span className="text-xs font-extrabold text-brand-600 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
              {language === 'en' ? 'Switch to தமிழ்' : 'Switch to English'}
            </span>
          </button>

          {/* Notifications */}
          <Link
            to="/notifications"
            className="flex items-center justify-between p-4 hover:bg-warm-hover transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-600">
                <Bell className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-charcoal-900">{t('nav_notifications')}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-charcoal-400" />
          </Link>

          {/* Install Mobile App (PWA) */}
          <button
            onClick={async () => {
              if (isIOS) {
                alert(
                  language === 'ta'
                    ? 'ஐபோனில் நிறுவ: Safari கீழே உள்ள Share (பகிர்) பொத்தானை அழுத்தி "Add to Home Screen" என்பதைத் தேர்ந்தெடுக்கவும்.'
                    : 'To install on iOS: Tap the Share button at the bottom of Safari and select "Add to Home Screen".'
                );
              } else if (isInstallable) {
                await promptInstall();
              } else if (isInstalled) {
                alert(
                  language === 'ta'
                    ? 'செயலி ஏற்கனவே உங்கள் சாதனத்தில் நிறுவப்பட்டுள்ளது!'
                    : 'App is already installed on your device!'
                );
              } else {
                alert(
                  language === 'ta'
                    ? 'உலாவியின் மெனுவை (⋮) திறந்து "Install App" அல்லது "Add to Home Screen" என்பதைத் தேர்ந்தெடுக்கவும்.'
                    : 'Open browser menu (⋮) and tap "Install App" or "Add to Home Screen".'
                );
              }
            }}
            className="w-full flex items-center justify-between p-4 hover:bg-warm-hover transition-colors text-left"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2 rounded-xl bg-orange-100 text-orange-600">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-charcoal-900 block">
                  {language === 'ta' ? 'மொபைல் செயலியை நிறுவுக' : 'Install Mobile App (PWA)'}
                </span>
                <span className="text-[11px] text-charcoal-500 font-medium">
                  {isInstalled
                    ? (language === 'ta' ? 'நிறுவப்பட்டுள்ளது ✓' : 'App Installed ✓')
                    : (language === 'ta' ? 'முகப்புத் திரையில் சேர்க்க' : 'Add to home screen for offline access')}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-charcoal-400" />
          </button>

          {/* Help & Shop Contact */}
          <Link
            to="/help"
            className="flex items-center justify-between p-4 hover:bg-warm-hover transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2 rounded-xl bg-indigo-100 text-indigo-600">
                <HelpCircle className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-charcoal-900">{t('help_contact')}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-charcoal-400" />
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3.5 p-4 hover:bg-red-50 text-red-600 transition-colors text-left font-extrabold text-sm"
          >
            <div className="p-2 rounded-xl bg-red-100 text-red-600">
              <LogOut className="w-5 h-5" />
            </div>
            <span>{t('logout')}</span>
          </button>

        </div>
      </div>
    </div>
  );
};
