import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const SearchCard: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div
      onClick={() => navigate('/search')}
      className="bg-white border border-brand-200 hover:border-brand-500 rounded-2xl p-3.5 sm:p-4 shadow-card hover:shadow-warm-lg transition-all duration-300 cursor-pointer group flex items-center justify-between"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border border-brand-100">
          <Search className="w-4 h-4 stroke-[2]" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[11px] font-extrabold text-brand-600 uppercase tracking-wider block">
            SEARCH PRODUCTS
          </span>
          <p className="text-xs sm:text-sm font-medium text-charcoal-500 group-hover:text-brand-600 transition-colors truncate">
            {t('search_placeholder')}
          </p>
        </div>
      </div>

      <div className="w-8 h-8 rounded-full bg-warm-bg group-hover:bg-brand-600 text-charcoal-400 group-hover:text-white flex items-center justify-center transition-all shrink-0 ml-2">
        <ArrowRight className="w-4 h-4" />
      </div>
    </div>
  );
};
