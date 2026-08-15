import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Package, PhoneCall, ShoppingBag, User } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { DEFAULT_SHOP_INFO } from '../../lib/supabase';

export const MobileNav: React.FC = () => {
  const { t } = useLanguage();

  const handleCallShop = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.href = `tel:${DEFAULT_SHOP_INFO.phone.replace(/[^0-9+]/g, '')}`;
  };

  const navItems = [
    {
      to: '/home',
      label: t('nav_home'),
      icon: Home,
      isCall: false,
    },
    {
      to: '/products',
      label: t('nav_products'),
      icon: Package,
      isCall: false,
    },
    {
      to: '#call',
      label: t('nav_call'),
      icon: PhoneCall,
      isCall: true,
      onClick: handleCallShop,
    },
    {
      to: '/orders',
      label: t('nav_orders'),
      icon: ShoppingBag,
      isCall: false,
    },
    {
      to: '/profile',
      label: t('nav_profile'),
      icon: User,
      isCall: false,
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-warm-border/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] safe-area-pb">
      <div className="grid grid-cols-5 h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;

          if (item.isCall) {
            return (
              <button
                key="call-nav"
                onClick={item.onClick}
                className="flex flex-col items-center justify-center text-brand-600 active:scale-95 transition-all group"
                aria-label={item.label}
              >
                <div className="p-1.5 rounded-full bg-brand-50 group-active:bg-brand-600 group-active:text-white transition-colors">
                  <Icon className="w-5 h-5 stroke-[2.5]" />
                </div>
                <span className="text-[11px] font-extrabold tracking-tight mt-0.5">{item.label}</span>
              </button>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center transition-all ${
                  isActive
                    ? 'text-brand-600 font-bold scale-105'
                    : 'text-charcoal-500 hover:text-charcoal-800'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-brand-100/80' : ''}`}>
                    <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
                  </div>
                  <span className={`text-[11px] leading-none mt-1 ${isActive ? 'font-extrabold' : 'font-medium'}`}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
