import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'pending' | 'accepted' | 'confirmed' | 'processing' | 'ready' | 'delivered' | 'rejected' | 'paid' | 'unpaid' | 'neutral';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', size = 'md' }) => {
  const variantStyles = {
    pending: 'bg-amber-100 text-amber-800 border-amber-300',
    accepted: 'bg-blue-100 text-blue-800 border-blue-300',
    confirmed: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    processing: 'bg-orange-100 text-brand-700 border-brand-300',
    ready: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    delivered: 'bg-green-100 text-green-800 border-green-300',
    rejected: 'bg-red-100 text-red-800 border-red-300',
    paid: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    unpaid: 'bg-rose-100 text-rose-800 border-rose-300',
    neutral: 'bg-gray-100 text-gray-800 border-gray-300',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-semibold',
    md: 'text-xs px-2.5 py-1 font-bold',
  };

  return (
    <span className={`inline-flex items-center rounded-full border ${variantStyles[variant]} ${sizeStyles[size]}`}>
      {children}
    </span>
  );
};
