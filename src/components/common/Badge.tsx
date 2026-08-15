import React from 'react';
import { getStatusConfig } from '../../lib/statusConfig';

interface BadgeProps {
  children: React.ReactNode;
  variant?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', size = 'md' }) => {
  const config = getStatusConfig(variant);

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-semibold',
    md: 'text-xs px-2.5 py-1 font-extrabold',
  };

  return (
    <span className={`inline-flex items-center rounded-full border ${config.badgeClass} ${sizeStyles[size]}`}>
      {children}
    </span>
  );
};
