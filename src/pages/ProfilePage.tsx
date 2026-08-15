import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Heart, ShoppingBag, Globe, HelpCircle, LogOut, ChevronRight, Bell, Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const ProfilePage: React.FC = () => {
  const { user, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-warm-bg pb-24 md:pb-12 pt-4">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Profile Card Header with DP Avatar & Edit DP Trigger */}
        <div className="bg-white rounded-3xl p-6 border border-warm-border shadow-card flex items-center gap-4 relative">
          <Link to="/profile/details" className="relative group shrink-0">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name}
                className="w-16 h-16 rounded-full object-cover border-4 border-brand-500 shadow-sm transition-opacity group-hover:opacity-80"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-brand-600 text-white font-black text-xl flex items-center justify-center shadow-md">
                {(user?.full_name || 'C').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute bottom-0 right-0 bg-brand-600 text-white p-1 rounded-full shadow-sm border border-white">
              <Camera className="w-3 h-3" />
            </div>
          </Link>

          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-black text-charcoal-900 truncate">{user?.full_name}</h2>
            <p className="text-xs text-charcoal-500 font-medium truncate">{user?.email}</p>

            <div className="flex items-center gap-2 mt-1.5">
              <span className="bg-brand-100 text-brand-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                {user?.role || 'Customer'}
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
