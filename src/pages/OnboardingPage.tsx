import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight, Globe, User, MapPin, Sparkles } from 'lucide-react';
import { Logo } from '../components/common/Logo';
import { Button } from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Language } from '../types';

export const OnboardingPage: React.FC = () => {
  const { user, completeOnboarding } = useAuth();
  const { setLanguage } = useLanguage();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedLang, setSelectedLang] = useState<Language>('en');

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phoneDigits, setPhoneDigits] = useState(
    user?.phone ? user.phone.replace(/^\+91\s?/, '') : ''
  );
  const [address, setAddress] = useState(user?.address || '');
  const [cityArea, setCityArea] = useState(user?.city_area || 'Kallimandhayam');
  const [loading, setLoading] = useState(false);

  const handleSelectLanguage = (lang: Language) => {
    setSelectedLang(lang);
    setLanguage(lang);
  };

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const fullPhone = `+91 ${phoneDigits.trim()}`;
    
    await completeOnboarding({
      full_name: fullName,
      phone: fullPhone,
      address,
      city_area: cityArea,
      language: selectedLang
    });
    setLoading(false);
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-warm-bg flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border-2 border-brand-200 shadow-2xl p-6 sm:p-8 max-w-lg w-full space-y-6">
        
        {/* Header Logo & Progress Indicators */}
        <div className="text-center space-y-3">
          <Logo size="md" className="justify-center" />
          
          <div className="flex items-center justify-center gap-2 pt-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all duration-300 ${
                  step === s ? 'w-8 bg-brand-600' : step > s ? 'w-3 bg-brand-300' : 'w-3 bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* STEP 1: WELCOME */}
        {step === 1 && (
          <div className="text-center space-y-6 animate-fade-in">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-xs font-extrabold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>WELCOME</span>
              </div>
              <h2 className="text-2xl font-black text-charcoal-900">
                {selectedLang === 'ta'
                  ? 'மணிகண்டன் லேத் நிறுவனத்திற்கு நல்வரவு'
                  : 'Welcome to Manikandan Lathe'}
              </h2>
            </div>

            {/* Google Profile Card */}
            <div className="bg-warm-bg p-5 rounded-2xl border border-warm-border flex flex-col items-center space-y-3">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name}
                  className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-brand-600 text-white font-black text-2xl flex items-center justify-center shadow-md">
                  {(fullName || 'C').charAt(0)}
                </div>
              )}
              <div>
                <h3 className="font-extrabold text-charcoal-900 text-base">{fullName || 'Customer'}</h3>
                <p className="text-xs text-charcoal-500 font-medium">{user?.email}</p>
              </div>
            </div>

            <Button onClick={() => setStep(2)} variant="primary" size="lg" fullWidth icon={<ArrowRight className="w-4 h-4" />}>
              {selectedLang === 'ta' ? 'தொடர்க' : 'Get Started'}
            </Button>
          </div>
        )}

        {/* STEP 2: LANGUAGE SELECTION */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in text-center">
            <div className="space-y-1">
              <span className="text-xs font-extrabold text-brand-600 uppercase tracking-wider block">
                STEP 2 OF 3
              </span>
              <h2 className="text-2xl font-black text-charcoal-900">Choose your language</h2>
              <p className="text-xs text-charcoal-500 font-medium">
                Everything will be displayed in your selected language
              </p>
            </div>

            {/* Two Large Language Options */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleSelectLanguage('en')}
                className={`p-6 rounded-2xl border-2 text-center transition-all flex flex-col items-center justify-center space-y-2 ${
                  selectedLang === 'en'
                    ? 'border-brand-600 bg-brand-50 shadow-md ring-2 ring-brand-500/30'
                    : 'border-warm-border hover:border-brand-300 bg-white'
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${selectedLang === 'en' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  <Globe className="w-6 h-6" />
                </div>
                <span className="text-lg font-black text-charcoal-900">English</span>
                {selectedLang === 'en' && <span className="text-xs font-bold text-brand-600 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Selected</span>}
              </button>

              <button
                type="button"
                onClick={() => handleSelectLanguage('ta')}
                className={`p-6 rounded-2xl border-2 text-center transition-all flex flex-col items-center justify-center space-y-2 ${
                  selectedLang === 'ta'
                    ? 'border-brand-600 bg-brand-50 shadow-md ring-2 ring-brand-500/30'
                    : 'border-warm-border hover:border-brand-300 bg-white'
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${selectedLang === 'ta' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  <Globe className="w-6 h-6" />
                </div>
                <span className="text-lg font-black text-charcoal-900">தமிழ்</span>
                {selectedLang === 'ta' && <span className="text-xs font-bold text-brand-600 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> தேர்ந்தெடுக்கப்பட்டது</span>}
              </button>
            </div>

            <Button onClick={() => setStep(3)} variant="primary" size="lg" fullWidth icon={<ArrowRight className="w-4 h-4" />}>
              {selectedLang === 'ta' ? 'அடுத்த படி' : 'Next Step'}
            </Button>
          </div>
        )}

        {/* STEP 3: REQUIRED PROFILE DETAILS */}
        {step === 3 && (
          <form onSubmit={handleFinish} className="space-y-4 animate-fade-in">
            <div className="text-center space-y-1">
              <span className="text-xs font-extrabold text-brand-600 uppercase tracking-wider block">
                STEP 3 OF 3
              </span>
              <h2 className="text-xl font-black text-charcoal-900">
                {selectedLang === 'ta' ? 'தேவையான சுயவிவர விவரங்கள்' : 'Required Profile Details'}
              </h2>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-charcoal-700 mb-1">
                {selectedLang === 'ta' ? 'முழு பெயர்' : 'Full Name'} *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Enter full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-warm-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                />
              </div>
            </div>

            {/* Mobile Number with fixed India Flag 🇮🇳 +91 Badge */}
            <div>
              <label className="block text-xs font-bold text-charcoal-700 mb-1">
                {selectedLang === 'ta' ? 'மொபைல் எண்' : 'Mobile Phone Number'} *
              </label>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-2.5 bg-warm-bg border border-warm-border rounded-xl font-extrabold text-xs text-charcoal-900 shrink-0 select-none shadow-sm">
                  <span className="text-base leading-none">🇮🇳</span>
                  <span>+91</span>
                </div>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="10-digit Mobile Number"
                  value={phoneDigits}
                  onChange={(e) => setPhoneDigits(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="flex-1 px-3.5 py-2.5 text-sm font-bold border border-warm-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-bold text-charcoal-700 mb-1">
                {selectedLang === 'ta' ? 'முகவரி' : 'Address / Door No.'} *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Street / Door No / Landmark"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-warm-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                />
              </div>
            </div>

            {/* City / Area */}
            <div>
              <label className="block text-xs font-bold text-charcoal-700 mb-1">
                {selectedLang === 'ta' ? 'நகரம் / பகுதி' : 'City / Area'} *
              </label>
              <input
                type="text"
                required
                placeholder="Kallimandhayam / Dindigul"
                value={cityArea}
                onChange={(e) => setCityArea(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-warm-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              />
            </div>

            <div className="pt-2">
              <Button type="submit" variant="primary" size="lg" loading={loading} fullWidth>
                {selectedLang === 'ta' ? 'சுயவிவரத்தைப் பதிவு செய்க' : 'Save & Continue to Shop'}
              </Button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
