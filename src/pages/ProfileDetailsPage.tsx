import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Edit3, Camera, Upload, User } from 'lucide-react';
import { Button } from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const ProfileDetailsPage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const initialName = (user?.full_name && user.full_name !== 'Manikandan Admin')
    ? user.full_name
    : (user?.email?.includes('manikandan') ? 'Manikandan Prabhu' : (user?.full_name || 'Manikandan Prabhu'));
  const [fullName, setFullName] = useState(initialName);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [phone, setPhone] = useState(user?.phone || '+91 75400 06268');
  const [address, setAddress] = useState(user?.address || 'K. K nagar adhi colony');
  const [cityArea, setCityArea] = useState(user?.city_area || 'Kallimandhayam');
  const [loading, setLoading] = useState(false);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await updateProfile({
      full_name: fullName,
      avatar_url: avatarUrl,
      phone,
      address,
      city_area: cityArea
    });
    setLoading(false);
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-warm-bg pb-24 md:pb-12 pt-4">
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-charcoal-700 bg-white px-3.5 py-2 rounded-full border border-warm-border shadow-sm hover:bg-warm-hover transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('back')}</span>
          </button>

          {!isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              variant="outline"
              size="sm"
              icon={<Edit3 className="w-3.5 h-3.5" />}
            >
              {t('edit_profile')}
            </Button>
          )}
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-warm-border shadow-card space-y-6">
          <h2 className="text-xl font-black text-charcoal-900 border-b border-warm-muted pb-3">
            {t('my_details')}
          </h2>

          {/* Profile DP Avatar Display & Upload Section */}
          <div className="flex flex-col items-center justify-center space-y-3 pt-2 pb-4 border-b border-warm-muted">
            <div className="relative group">
              {avatarUrl || user?.avatar_url ? (
                <img
                  src={avatarUrl || user?.avatar_url}
                  alt={user?.full_name || 'Profile DP'}
                  className="w-24 h-24 rounded-full object-cover border-4 border-brand-500 shadow-md transition-all group-hover:opacity-90"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-brand-600 border-4 border-brand-500 flex items-center justify-center text-white text-3xl font-black shadow-md">
                  {(fullName || user?.full_name || 'C').charAt(0).toUpperCase()}
                </div>
              )}

              {isEditing && (
                <label className="absolute bottom-0 right-0 bg-brand-600 hover:bg-brand-700 text-white p-2 rounded-full shadow-lg cursor-pointer border-2 border-white transition-all">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <div className="text-center">
              <h3 className="text-base font-extrabold text-charcoal-900">{fullName || initialName}</h3>
              <p className="text-xs text-charcoal-500 font-medium">{user?.email || 'manikandanprabhu37@gmail.com'}</p>
            </div>

            {isEditing && (
              <div className="w-full max-w-xs pt-1">
                <label className="block text-[11px] font-bold text-charcoal-500 mb-1 text-center">
                  Or paste Profile Image DP URL
                </label>
                <div className="relative">
                  <Upload className="w-3.5 h-3.5 text-charcoal-400 absolute left-3 top-2.5" />
                  <input
                    type="url"
                    placeholder="https://..."
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs border border-warm-border rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Form Fields */}
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-charcoal-500 uppercase tracking-wider mb-1">
                {t('full_name')}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-warm-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold"
                />
              ) : (
                <p className="text-sm font-extrabold text-charcoal-900 bg-warm-bg p-3 rounded-xl border border-warm-border">
                  {fullName || initialName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal-500 uppercase tracking-wider mb-1">
                {t('email_address')}
              </label>
              <p className="text-sm font-extrabold text-charcoal-900 bg-warm-bg p-3 rounded-xl border border-warm-border opacity-70">
                {user?.email || 'manikandanprabhu37@gmail.com'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal-500 uppercase tracking-wider mb-1">
                {t('mobile_number')}
              </label>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-2.5 bg-warm-bg border border-warm-border rounded-xl font-extrabold text-xs text-charcoal-900 shrink-0 select-none shadow-sm">
                    <span className="text-base leading-none">🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone.replace(/^\+91\s?/, '')}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setPhone(`+91 ${val}`);
                    }}
                    className="flex-1 px-3.5 py-2.5 text-sm border border-warm-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold"
                  />
                </div>
              ) : (
                <p className="text-sm font-extrabold text-charcoal-900 bg-warm-bg p-3 rounded-xl border border-warm-border">
                  {phone || user?.phone || '+91 75400 06268'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal-500 uppercase tracking-wider mb-1">
                {t('address')}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-warm-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold"
                />
              ) : (
                <p className="text-sm font-extrabold text-charcoal-900 bg-warm-bg p-3 rounded-xl border border-warm-border">
                  {address || user?.address || 'K. K nagar adhi colony'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal-500 uppercase tracking-wider mb-1">
                {t('city_area')}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={cityArea}
                  onChange={(e) => setCityArea(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-warm-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold"
                />
              ) : (
                <p className="text-sm font-extrabold text-charcoal-900 bg-warm-bg p-3 rounded-xl border border-warm-border">
                  {cityArea || user?.city_area || 'Kallimandhayam'}
                </p>
              )}
            </div>

            {isEditing && (
              <div className="flex items-center gap-3 pt-3">
                <Button type="submit" variant="primary" loading={loading} icon={<Save className="w-4 h-4" />}>
                  {t('save_changes')}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>
                  {t('cancel')}
                </Button>
              </div>
            )}
          </form>

        </div>
      </div>
    </div>
  );
};
