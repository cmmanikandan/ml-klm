import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Mail, Lock, User, Eye, EyeOff, AlertCircle, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import { Logo } from '../components/common/Logo';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const LoginPage: React.FC = () => {
  const { user, isAdmin, needsOnboarding, signInWithGoogle, signInWithEmail, signUpWithEmail, loading } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const isTamil = language === 'ta';

  // Auth Mode: 'signin' | 'signup'
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      if (isAdmin) {
        navigate('/admin/dashboard', { replace: true });
      } else if (needsOnboarding) {
        navigate('/onboarding', { replace: true });
      } else {
        navigate('/home', { replace: true });
      }
    }
  }, [user, isAdmin, needsOnboarding, navigate]);

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage(isTamil ? 'மின்னஞ்சல் முகவரியை உள்ளிடவும்' : 'Please enter your email address');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage(isTamil ? 'கடவுச்சொல் குறைந்தது 6 எழுத்துகள் இருக்க வேண்டும்' : 'Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      const currentLang = isTamil ? 'ta' : 'en';
      if (authMode === 'signin') {
        const res = await signInWithEmail(email, password, currentLang);
        if (!res.success) {
          setErrorMessage(res.error || (isTamil ? 'உள்நுழைய முடியவில்லை' : 'Failed to sign in'));
        }
      } else {
        const res = await signUpWithEmail(email, password, fullName, currentLang);
        if (!res.success) {
          setErrorMessage(res.error || (isTamil ? 'கணக்கு உருவாக்க முடியவில்லை' : 'Failed to create account'));
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    await signInWithGoogle();
  };

  // Quick fill demo / Razorpay verification reviewer credentials
  const handleAutoFillReviewer = () => {
    setEmail('verifier@razorpay.com');
    setPassword('Password123!');
    if (authMode === 'signup') {
      setFullName('Razorpay Verification Reviewer');
    }
    setErrorMessage(null);
  };

  return (
    <div
      className="min-h-screen bg-[#FFF9F2] flex flex-col justify-between p-4 relative"
      style={{
        backgroundColor: '#FFF9F2',
        backgroundImage: `
          linear-gradient(to right, rgba(234, 88, 12, 0.045) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(234, 88, 12, 0.045) 1px, transparent 1px)
        `,
        backgroundSize: '36px 36px'
      }}
    >
      {/* Top Bar with Back to Website Button */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between pt-2">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-extrabold text-charcoal-700 hover:text-brand-600 bg-white px-4 py-2 rounded-full border border-warm-border shadow-sm transition-all hover:scale-105"
        >
          <ArrowLeft className="w-4 h-4 text-brand-600" />
          <span>{isTamil ? 'முகப்பிற்குத் திரும்பு' : 'Back to Website'}</span>
        </Link>

        <span className="text-xs font-bold text-brand-600 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
          MANIKANDAN LATHE
        </span>
      </div>

      {/* Main Login Card */}
      <div className="bg-white rounded-3xl border-2 border-brand-200 shadow-2xl p-6 sm:p-8 max-w-md w-full mx-auto space-y-5 my-6">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Logo size="md" />
          <h2 className="text-xl sm:text-2xl font-black text-charcoal-900 mt-2">
            {authMode === 'signin'
              ? (isTamil ? 'கணக்கில் உள்நுழைக' : 'Sign In to Your Account')
              : (isTamil ? 'புதிய கணக்கை உருவாக்கவும்' : 'Create Customer Account')}
          </h2>
          <p className="text-xs text-charcoal-500 font-medium leading-relaxed max-w-xs">
            {authMode === 'signin'
              ? (isTamil ? 'மின்னஞ்சல் அல்லது கூகிள் மூலம் பாதுகாப்பாக நுழையுங்கள்.' : 'Sign in with your Email & Password or Google account.')
              : (isTamil ? 'உங்கள் விவரங்களைப் பதிவு செய்து நொடியில் தொடங்கவும்.' : 'Enter your details below to create an account.')}
          </p>
        </div>

        {/* Razorpay Merchant Verification Auto-Fill Helper Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-3 rounded-2xl flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2 text-left min-w-0">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <div className="truncate">
              <span className="text-[11px] font-extrabold text-blue-900 block">
                Razorpay Verification Tester
              </span>
              <span className="text-[10px] text-blue-600 font-medium">
                Click to 1-tap pre-fill test login
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAutoFillReviewer}
            className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg shadow-xs transition-colors shrink-0 flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3" />
            <span>Auto-Fill</span>
          </button>
        </div>

        {/* Auth Mode Toggle Tabs (Sign In / Sign Up) */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => {
              setAuthMode('signin');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
              authMode === 'signin'
                ? 'bg-white text-brand-600 shadow-sm'
                : 'text-charcoal-500 hover:text-charcoal-900'
            }`}
          >
            {isTamil ? 'உள்நுழைக (Sign In)' : 'Sign In'}
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('signup');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
              authMode === 'signup'
                ? 'bg-white text-brand-600 shadow-sm'
                : 'text-charcoal-500 hover:text-charcoal-900'
            }`}
          >
            {isTamil ? 'பதிவு செய்க (Sign Up)' : 'Sign Up'}
          </button>
        </div>

        {/* Error Alert Message */}
        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 font-semibold animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}

        {/* Email & Password Form */}
        <form onSubmit={handleEmailAuthSubmit} className="space-y-3.5 text-left">
          {/* Full Name field for Sign Up */}
          {authMode === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-charcoal-700 mb-1">
                {isTamil ? 'முழு பெயர்' : 'Full Name'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-charcoal-400">
                  <User className="w-4 h-4 text-brand-600" />
                </div>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={isTamil ? 'உங்கள் பெயர்' : 'e.g. Ramesh Kumar'}
                  className="w-full pl-11 pr-4 py-3 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:bg-white focus:outline-hidden transition-all text-charcoal-900 font-medium"
                />
              </div>
            </div>
          )}

          {/* Email Address */}
          <div>
            <label className="block text-xs font-bold text-charcoal-700 mb-1">
              {isTamil ? 'மின்னஞ்சல் முகவரி' : 'Email Address'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-charcoal-400">
                <Mail className="w-4 h-4 text-brand-600" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                autoComplete="email"
                className="w-full pl-11 pr-4 py-3 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:bg-white focus:outline-hidden transition-all text-charcoal-900 font-medium"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-charcoal-700">
                {isTamil ? 'கடவுச்சொல்' : 'Password'}
              </label>
              <span className="text-[10px] text-charcoal-400 font-medium">
                {authMode === 'signup' ? 'Min 6 characters' : ''}
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-charcoal-400">
                <Lock className="w-4 h-4 text-brand-600" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={authMode === 'signin' ? 'current-password' : 'new-password'}
                className="w-full pl-11 pr-11 py-3 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:bg-white focus:outline-hidden transition-all text-charcoal-900 font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-charcoal-400 hover:text-charcoal-700"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || loading}
            className="w-full mt-2 bg-brand-600 hover:bg-brand-700 active:scale-98 text-white font-extrabold py-3 px-4 rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>{isTamil ? 'சரிபார்க்கப்படுகிறது...' : 'Processing...'}</span>
              </>
            ) : (
              <span>
                {authMode === 'signin'
                  ? (isTamil ? 'உள்நுழைக' : 'Sign In with Email')
                  : (isTamil ? 'கணக்கை உருவாக்கு' : 'Create Account')}
              </span>
            )}
          </button>
        </form>

        {/* Symmetrical Centered Divider */}
        <div className="flex items-center my-4 gap-3">
          <div className="flex-1 border-t border-slate-200"></div>
          <span className="text-[11px] font-extrabold text-charcoal-400 uppercase tracking-wider select-none shrink-0">
            {isTamil ? 'அல்லது' : 'OR'}
          </span>
          <div className="flex-1 border-t border-slate-200"></div>
        </div>

        {/* Google Sign-In Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading || isSubmitting}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-warm-hover text-charcoal-800 font-bold px-4 py-3 rounded-xl border border-charcoal-200 shadow-sm transition-all active:scale-98 disabled:opacity-50"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span className="text-xs sm:text-sm font-bold">
            {isTamil ? 'கூகிள் மூலம் தொடர்க' : 'Continue with Google'}
          </span>
        </button>

        {/* Benefits Info */}
        <div className="bg-warm-bg p-3 rounded-2xl border border-warm-border text-left space-y-1.5 text-[11px] font-bold text-charcoal-700">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{isTamil ? 'நேரடி ஆர்டர் நிலை & கட்டண ரசீதுகள்' : 'Instant Order Tracking & Digital Tax Invoices'}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{isTamil ? 'ரேஸர்பே பாதுகாப்பான ஆன்லைன் கட்டணம்' : 'Secure Razorpay Online Payments & Receipts'}</span>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-3 text-[11px] text-charcoal-400 font-medium text-center">
          <p>{isTamil ? '256-பிட் பாதுகாப்பான குறியாக்கம்' : '256-Bit SSL Encrypted & Verified'}</p>
        </div>
      </div>

      <div className="pb-2 text-center text-xs text-charcoal-400 font-bold">
        © {new Date().getFullYear()} MANIKANDAN LATHE — Welding Works
      </div>
    </div>
  );
};
