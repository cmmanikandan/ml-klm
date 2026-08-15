import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, KeyRound, ArrowLeft, Lock, Sparkles } from 'lucide-react';
import { Logo } from '../../components/common/Logo';
import { useAuth } from '../../context/AuthContext';

export const AdminLoginPage: React.FC = () => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const { switchUserRole } = useAuth();
  const navigate = useNavigate();

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Default Shop Admin Passcode (Phone or default 1234 / 9659286268)
    if (pin === '9659286268' || pin === '1234' || pin === 'admin') {
      switchUserRole('admin');
      navigate('/admin/dashboard');
    } else {
      setError('Invalid Admin Security Passcode. Please check and try again.');
    }
  };

  return (
    <div className="min-h-screen bg-charcoal-900 text-white flex flex-col justify-between p-4">
      {/* Header */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between pt-2">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-xs font-extrabold text-gray-300 hover:text-white bg-gray-800 px-4 py-2 rounded-full border border-gray-700 shadow-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-brand-400" />
          <span>Exit to Website</span>
        </button>

        <span className="inline-flex items-center gap-1 bg-brand-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
          <Sparkles className="w-3 h-3" />
          <span>Shop Owner Portal</span>
        </span>
      </div>

      {/* Admin Passcode Card */}
      <div className="bg-charcoal-800 rounded-3xl border border-gray-700 shadow-2xl p-6 sm:p-8 max-w-md w-full mx-auto text-center space-y-6 my-auto">
        <div className="py-2 flex justify-center">
          <Logo size="lg" variant="dark" />
        </div>

        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 bg-brand-500/20 text-brand-400 text-xs font-extrabold px-3 py-1 rounded-full border border-brand-500/30 mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Admin Management System</span>
          </div>
          <h2 className="text-2xl font-black text-white">Shop Owner Login</h2>
          <p className="text-xs text-gray-400 font-medium leading-relaxed">
            Enter your admin security passcode to manage live enquiries, customer orders, and shop settings.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-300 p-3 rounded-2xl text-xs font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleAdminLogin} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
              Admin Passcode / Phone PIN
            </label>
            <div className="relative">
              <KeyRound className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                placeholder="Enter passcode (e.g. 9659286268)"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-charcoal-900 border border-gray-700 rounded-2xl text-sm font-bold text-white focus:outline-none focus:border-brand-500 transition-colors"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-extrabold py-4 px-6 rounded-2xl shadow-lg transition-all text-sm"
          >
            <Lock className="w-4 h-4" />
            <span>Access Admin Operations</span>
          </button>
        </form>

        <div className="border-t border-gray-700 pt-4 text-xs text-gray-400">
          <span>Official Workshop Portal • MANIKANDAN LATHE</span>
        </div>
      </div>

      <div className="pb-2 text-center text-xs text-gray-500 font-medium">
        © {new Date().getFullYear()} MANIKANDAN LATHE – Welding Works
      </div>
    </div>
  );
};
