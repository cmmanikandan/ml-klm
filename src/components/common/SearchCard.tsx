import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Sparkles } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const SearchCard: React.FC = () => {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const isTamil = language === 'ta';

  return (
    <div
      onClick={() => navigate('/search')}
      className="bg-white border-2 border-brand-200 hover:border-brand-500 p-2.5 sm:p-3 rounded-full shadow-card hover:shadow-warm-md transition-all duration-300 cursor-pointer group flex items-center justify-between gap-3"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0 pl-2">
        <div className="w-9 h-9 rounded-full bg-brand-600 text-white flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-md">
          <Search className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-extrabold text-charcoal-700 group-hover:text-brand-600 transition-colors truncate">
            {isTamil ? 'தேடவும்: நாற்காலி, கேட், கிரில்...' : 'Search products by title, Tamil name, or category...'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 bg-brand-50 group-hover:bg-brand-600 text-brand-600 group-hover:text-white px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all shrink-0">
        <span>{isTamil ? 'தேடு' : 'Search'}</span>
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </div>
  );
};
