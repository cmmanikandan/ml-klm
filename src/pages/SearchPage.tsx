import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ArrowLeft, Clock, Sparkles } from 'lucide-react';
import { ProductCard } from '../components/product/ProductCard';
import { useLanguage } from '../context/LanguageContext';
import { Product } from '../types';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from '../lib/supabase';

export const SearchPage: React.FC = () => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const isTamil = language === 'ta';
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const saved = localStorage.getItem('ml_recent_searches');
    return saved ? JSON.parse(saved) : ['Steel Chair', 'Main Gate', 'Grill'];
  });

  useEffect(() => {
    // Focus search input on page load for immediate keyboard trigger
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleClear = () => {
    setQuery('');
    if (inputRef.current) inputRef.current.focus();
  };

  const handleSelectRecent = (term: string) => {
    setQuery(term);
  };

  const handleRemoveRecent = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter((item) => item !== term);
    setRecentSearches(updated);
    localStorage.setItem('ml_recent_searches', JSON.stringify(updated));
  };

  // Filter products based on English title, Tamil title, or Category
  const filteredProducts: Product[] = query.trim()
    ? INITIAL_PRODUCTS.filter((prod) => {
        const q = query.toLowerCase().trim();
        return (
          prod.name_en.toLowerCase().includes(q) ||
          (prod.name_ta && prod.name_ta.toLowerCase().includes(q)) ||
          (prod.category_name && prod.category_name.toLowerCase().includes(q)) ||
          (prod.materials && prod.materials.toLowerCase().includes(q))
        );
      })
    : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !recentSearches.includes(query.trim())) {
      const updated = [query.trim(), ...recentSearches].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('ml_recent_searches', JSON.stringify(updated));
    }
  };

  return (
    <div className="min-h-screen bg-warm-bg pb-24 md:pb-12">
      {/* Sticky Mobile Keyboard-Aware Search Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-warm-border p-3 sm:p-4 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="max-w-3xl mx-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2.5 text-charcoal-600 hover:text-brand-600 rounded-full hover:bg-warm-hover transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="relative flex-1">
            <Search className="w-4 h-4 text-brand-600 absolute left-3.5 top-3.5" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('search_placeholder')}
              className="w-full pl-10 pr-10 py-3 text-sm border-2 border-brand-200 focus:border-brand-600 rounded-2xl bg-warm-bg focus:bg-white focus:outline-none font-bold text-charcoal-900 shadow-inner"
            />
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-3 p-1 text-charcoal-400 hover:text-charcoal-800 rounded-full hover:bg-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* If query is empty, show recent searches and popular categories */}
        {!query.trim() && (
          <div className="space-y-6 max-w-3xl mx-auto">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-charcoal-500 font-extrabold text-xs uppercase tracking-wider">
                  <Clock className="w-4 h-4" />
                  <span>{t('search_recent')}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term) => (
                    <div
                      key={term}
                      onClick={() => handleSelectRecent(term)}
                      className="inline-flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-warm-border hover:border-brand-500 text-xs font-bold text-charcoal-800 cursor-pointer shadow-sm group"
                    >
                      <span>{term}</span>
                      <button
                        onClick={(e) => handleRemoveRecent(term, e)}
                        className="text-gray-400 hover:text-red-500 p-0.5 rounded-full"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Suggested Categories */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-brand-600 font-extrabold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>{t('search_suggested')}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {INITIAL_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setQuery(isTamil ? cat.name_ta : cat.name_en)}
                    className="p-3 bg-white rounded-2xl border border-warm-border hover:border-brand-500 text-left flex items-center gap-3 transition-all shadow-card hover:shadow-warm"
                  >
                    <img
                      src={cat.image_url}
                      alt={cat.name_en}
                      className="w-10 h-10 rounded-xl object-cover border border-warm-border"
                    />
                    <span className="text-xs font-bold text-charcoal-900 line-clamp-1">
                      {isTamil ? cat.name_ta : cat.name_en}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Search Results Display */}
        {query.trim() && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-charcoal-700">
                {isTamil ? `"${query}"க்கான முடிவுகள் (${filteredProducts.length})` : `Results for "${query}" (${filteredProducts.length})`}
              </h2>
            </div>

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                {filteredProducts.map((prod) => (
                  <ProductCard key={prod.id} product={prod} />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center space-y-3 bg-white rounded-3xl border border-warm-border p-8 max-w-md mx-auto">
                <div className="w-16 h-16 bg-warm-bg text-brand-600 rounded-full flex items-center justify-center mx-auto">
                  <Search className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-extrabold text-charcoal-900">{t('search_no_results')}</h3>
                <p className="text-xs text-charcoal-500">{t('search_no_results_sub')}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
