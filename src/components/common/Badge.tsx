import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'pending' | 'accepted' | 'confirmed' | 'order_confirmed' | 'processing' | 'in_production' | 'quality_check' | 'ready' | 'ready_for_pickup' | 'delivered' | 'rejected' | 'cancelled' | 'paid' | 'unpaid' | 'neutral';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', size = 'md' }) => {
  const variantStyles = {
    pending: 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold',
    accepted: 'bg-blue-100 text-blue-900 border-blue-300 font-extrabold',
    confirmed: 'bg-blue-100 text-blue-900 border-blue-300 font-extrabold',
    order_confirmed: 'bg-blue-100 text-blue-900 border-blue-300 font-extrabold',
    processing: 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold',
    in_production: 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold',
    quality_check: 'bg-purple-100 text-purple-900 border-purple-300 font-extrabold',
    ready: 'bg-teal-100 text-teal-900 border-teal-300 font-extrabold',
    ready_for_pickup: 'bg-teal-100 text-teal-900 border-teal-300 font-extrabold',
    delivered: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-extrabold',
    rejected: 'bg-red-100 text-red-900 border-red-300 font-extrabold',
    cancelled: 'bg-red-100 text-red-900 border-red-300 font-extrabold',
    paid: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-extrabold',
    unpaid: 'bg-red-100 text-red-900 border-red-300 font-extrabold',
    neutral: 'bg-gray-100 text-gray-900 border-gray-300 font-bold',
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
