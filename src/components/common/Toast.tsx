import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'success',
  onClose,
  duration = 3000,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgStyles = {
    success: 'bg-emerald-600 text-white shadow-emerald-600/20',
    error: 'bg-red-600 text-white shadow-red-600/20',
    info: 'bg-charcoal-900 text-white shadow-black/20',
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in max-w-sm">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border border-white/20 backdrop-blur-md ${bgStyles[type]}`}>
        {type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0" />}
        {type === 'error' && <AlertCircle className="w-5 h-5 shrink-0" />}
        <span className="text-xs font-bold flex-1">{message}</span>
        <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
