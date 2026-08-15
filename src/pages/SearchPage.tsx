import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ArrowLeft, Clock, Sparkles } from 'lucide-react';
import { ProductCard } from '../components/product/ProductCard';
import { useLanguage } from '../context/LanguageContext';
import { Product } from '../types';
import { supabase } from '../lib/supabase';

export const SearchPage: React.FC = () => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const isTamil = language === 'ta';
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const saved = localStorage.getItem('ml_recent_searches');
    return saved ? JSON.parse(saved) : ['Steel Chair', 'Main Gate', 'Grill'];
  });

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
    fetchLiveProducts();
  }, []);

  const fetchLiveProducts = async () => {
    try {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true);
      if (data) setProducts(data);
    } catch (e) {
      console.warn('Error fetching products for search');
    }
  };

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

  // Filter products live based on English title, Tamil title, or Category
  const filteredProducts: Product[] = query.trim()
    ? products.filter((p) => {
        const q = query.toLowerCase();
        const titleEn = (p.name_en || '').toLowerCase();
        const titleTa = (p.name_ta || '').toLowerCase();
        const catName = (p.category_name || '').toLowerCase();
        return titleEn.includes(q) || titleTa.includes(q) || catName.includes(q);
      })
    : [];

  return (
    <div className="min-h-screen bg-warm-bg pb-24 md:pb-12 pt-3">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        
        {/* Top Floating Search Header Bar */}
        <div className="flex items-center gap-2.5 bg-white p-2 sm:p-2.5 rounded-full border border-warm-border shadow-card">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-charcoal-600 hover:text-brand-600 rounded-full hover:bg-warm-bg transition-colors"
            aria-label="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 flex items-center gap-2">
            <Search className="w-4 h-4 text-brand-600 shrink-0 ml-1" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('search_placeholder')}
              className="w-full bg-transparent text-xs sm:text-sm font-extrabold text-charcoal-900 focus:outline-none placeholder:text-charcoal-400"
            />
          </div>

          {query && (
            <button
              onClick={handleClear}
              className="p-1.5 text-charcoal-400 hover:text-charcoal-800 rounded-full hover:bg-warm-bg transition-colors mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Recent Searches Pills */}
        {!query && recentSearches.length > 0 && (
          <div className="bg-white rounded-3xl p-5 border border-warm-border shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-charcoal-900 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-brand-600" />
                <span>{isTamil ? 'சமீபத்திய தேடல்கள்' : 'Recent Searches'}</span>
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {recentSearches.map((term) => (
                <div
                  key={term}
                  onClick={() => handleSelectRecent(term)}
                  className="inline-flex items-center gap-2 bg-warm-bg hover:bg-brand-50 border border-warm-border hover:border-brand-300 px-3.5 py-1.5 rounded-full text-xs font-bold text-charcoal-800 cursor-pointer transition-colors"
                >
                  <span>{term}</span>
                  <button
                    onClick={(e) => handleRemoveRecent(term, e)}
                    className="text-charcoal-400 hover:text-red-500 rounded-full"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search Results Display */}
        {query && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-extrabold text-charcoal-600">
                {filteredProducts.length} {isTamil ? 'முடிவுகள் கண்டறியப்பட்டன' : 'products found'} for "{query}"
              </span>
            </div>

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-8 text-center border border-warm-border shadow-card space-y-2">
                <Sparkles className="w-8 h-8 text-brand-600 mx-auto" />
                <h3 className="text-sm font-black text-charcoal-900">
                  {isTamil ? 'முடிவுகள் ஏதும் கிடைக்கவில்லை' : 'No matching products found'}
                </h3>
                <p className="text-xs text-charcoal-500 font-medium">
                  {isTamil ? 'வேறு வார்த்தைகளைப் பயன்படுத்தி மீண்டும் தேடவும்' : 'Try searching for chair, gate, grill, or lathe work'}
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
