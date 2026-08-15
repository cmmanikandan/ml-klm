import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Logo } from '../components/common/Logo';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const LoginPage: React.FC = () => {
  const { user, isAdmin, needsOnboarding, signInWithGoogle, loading } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const isTamil = language === 'ta';

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

  const handleGoogleLogin = async () => {
    await signInWithGoogle();
  };

  return (
    <div className="min-h-screen bg-warm-bg flex flex-col justify-between p-4">
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
      <div className="bg-white rounded-3xl border-2 border-brand-200 shadow-2xl p-6 sm:p-8 max-w-md w-full mx-auto text-center space-y-6 my-auto">
        
        {/* Brand Header */}
        <div className="py-2 flex justify-center">
          <Logo size="lg" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-charcoal-900">
            {isTamil ? 'மணிகண்டன் லேத் கணக்கில் நுழைக' : 'Sign In to Manikandan Lathe'}
          </h2>
          <p className="text-xs text-charcoal-500 font-medium leading-relaxed">
            {isTamil
              ? 'உங்கள் கூகிள் (Google) கணக்கு மூலம் நொடியில் நுழையலாம். கடவுச்சொல் (Password) தேவையில்லை.'
              : 'One-click sign in with Google. No passwords required.'}
          </p>
        </div>

        {/* Benefits bullets */}
        <div className="bg-warm-bg p-3.5 rounded-2xl border border-warm-border text-left space-y-2 text-xs font-bold text-charcoal-700">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{isTamil ? 'விசாரணை மற்றும் ஆர்டர் நிலையை அறிந்துகொள்ளலாம்' : 'Track live enquiry & fabrication order progress'}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{isTamil ? 'விருப்பப் பட்டியலை (Wishlist) சேமிக்கலாம்' : 'Save products to wishlist across devices'}</span>
          </div>
        </div>

        {/* Google Sign-In Button */}
        <div className="pt-2">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-warm-hover text-charcoal-800 font-bold px-6 py-4 rounded-2xl border-2 border-charcoal-200 shadow-md transition-all active:scale-98 disabled:opacity-50"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
            <span className="text-sm font-extrabold">{isTamil ? 'கூகிள் மூலம் தொடர்க' : 'Continue with Google'}</span>
          </button>
        </div>

        <div className="border-t border-warm-muted pt-4 text-xs text-charcoal-500 font-medium">
          <p>{isTamil ? 'பாதுகாப்பான மற்றும் விரைவான கூகிள் உள்நுழைவு' : '100% Safe & Secure Single Sign-On'}</p>
        </div>
      </div>

      <div className="pb-2 text-center text-xs text-charcoal-400 font-bold">
        © {new Date().getFullYear()} MANIKANDAN LATHE
      </div>
    </div>
  );
};
