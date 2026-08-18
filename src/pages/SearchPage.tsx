import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Search, 
  X, 
  ArrowLeft, 
  Clock, 
  Sparkles, 
  Mic, 
  TrendingUp,
  Wrench,
  MessageSquare
} from 'lucide-react';
import { ProductCard } from '../components/product/ProductCard';
import { VoiceSearchModal } from '../components/common/VoiceSearchModal';
import { useLanguage } from '../context/LanguageContext';
import { Product } from '../types';
import { fetchActiveProducts, getCachedProducts } from '../lib/productsStore';
import { filterProductsSmartly } from '../lib/searchHelper';

const POPULAR_SEARCH_TAGS = [
  { en: '7-Kallapai', ta: '7-ஏர் கலப்பை' },
  { en: 'Main Gate', ta: 'மெயின் கேட்' },
  { en: 'Safety Grill', ta: 'பாதுகாப்பு கிரில்' },
  { en: 'Roofing Structure', ta: 'கூரை ஸ்ட்ரக்சர்' },
  { en: 'ARC Welding', ta: 'ARC வெல்டிங்' },
  { en: 'Shaft Lathe Turning', ta: 'லேத் டர்னிங்' },
  { en: 'Rolling Shutter', ta: 'ரோலிங் ஷட்டர்' },
  { en: 'Steel Chair', ta: 'ஸ்டீல் நாற்காலி' },
];

export const SearchPage: React.FC = () => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const isTamil = language === 'ta';
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>(() => getCachedProducts());
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const saved = localStorage.getItem('ml_recent_searches');
    return saved ? JSON.parse(saved) : ['7-Kallapai', 'Main Gate', 'Safety Grill', 'Lathe Work'];
  });

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const active = await fetchActiveProducts();
    setProducts(active);
  };

  const handleClear = () => {
    setQuery('');
    if (inputRef.current) inputRef.current.focus();
  };

  const handleSelectTag = (term: string) => {
    setQuery(term);
    saveRecentSearch(term);
  };

  const saveRecentSearch = (term: string) => {
    if (!term.trim()) return;
    const clean = term.trim();
    const updated = [clean, ...recentSearches.filter((item) => item.toLowerCase() !== clean.toLowerCase())].slice(0, 8);
    setRecentSearches(updated);
    localStorage.setItem('ml_recent_searches', JSON.stringify(updated));
  };

  const handleRemoveRecent = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter((item) => item !== term);
    setRecentSearches(updated);
    localStorage.setItem('ml_recent_searches', JSON.stringify(updated));
  };

  const handleWhatsAppQuickChat = () => {
    const text = encodeURIComponent(
      `Hello Manikandan Lathe Works! I am searching for custom metal fabrication & lathe work.`
    );
    window.open(`https://wa.me/919659286268?text=${text}`, '_blank');
  };

  // Filter products live using smart phonetic, multi-keyword, and fuzzy matching
  const filteredProducts: Product[] = query.trim()
    ? filterProductsSmartly(products, query)
    : [];

  return (
    <div className="min-h-screen bg-warm-bg pb-52 md:pb-24 pt-3 safe-area-pb">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        
        {/* Top Floating Search Header Bar */}
        <div className="flex items-center gap-2.5 bg-white p-2 sm:p-2.5 rounded-full border-2 border-brand-300 focus-within:border-brand-600 shadow-card transition-colors">
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
              onKeyDown={(e) => {
                if (e.key === 'Enter' && query.trim()) {
                  saveRecentSearch(query.trim());
                }
              }}
              placeholder={t('search_placeholder')}
              className="w-full bg-transparent text-xs sm:text-sm font-extrabold text-charcoal-900 focus:outline-none placeholder:text-charcoal-400"
            />
          </div>

          {query ? (
            <button
              onClick={handleClear}
              className="p-1.5 text-charcoal-400 hover:text-charcoal-800 rounded-full hover:bg-warm-bg transition-colors mr-1"
              aria-label="Clear Search"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsVoiceOpen(true)}
              className="p-2 text-white bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 hover:to-amber-600 rounded-full transition-all mr-1 shrink-0 flex items-center justify-center shadow-md active:scale-95"
              title="Tamil & English Voice Search"
              aria-label="Voice Search"
            >
              <Mic className="w-4 h-4 animate-pulse" />
            </button>
          )}
        </div>

        {/* Voice Search Modal */}
        <VoiceSearchModal
          isOpen={isVoiceOpen}
          onClose={() => setIsVoiceOpen(false)}
          onTranscript={(spokenText) => {
            setQuery(spokenText);
            saveRecentSearch(spokenText);
          }}
        />

        {/* POPULAR SEARCH TAGS & RECENT SEARCHES (When query is empty) */}
        {!query && (
          <div className="space-y-3.5">
            
            {/* Popular Trending Search Tags */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-warm-border shadow-card space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-charcoal-900 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-brand-600" />
                  <span>{isTamil ? 'பிரபலமான தேடல்கள்' : 'Trending Search Terms'}</span>
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {POPULAR_SEARCH_TAGS.map((tag, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectTag(tag.en)}
                    className="inline-flex items-center gap-1.5 bg-warm-bg hover:bg-brand-50 hover:border-brand-400 border border-warm-border px-3.5 py-1.5 rounded-full text-xs font-bold text-charcoal-800 transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    <span>{isTamil ? tag.ta : tag.en}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Searches List */}
            {recentSearches.length > 0 && (
              <div className="bg-white rounded-3xl p-4 sm:p-5 border border-warm-border shadow-card space-y-2.5">
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
                      onClick={() => handleSelectTag(term)}
                      className="inline-flex items-center gap-2 bg-warm-bg hover:bg-brand-50 border border-warm-border hover:border-brand-300 px-3.5 py-1.5 rounded-full text-xs font-bold text-charcoal-800 cursor-pointer transition-colors"
                    >
                      <span>{term}</span>
                      <button
                        type="button"
                        onClick={(e) => handleRemoveRecent(term, e)}
                        className="text-charcoal-400 hover:text-red-500 rounded-full"
                        aria-label="Remove search"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* SEARCH RESULTS DISPLAY (When query has text) */}
        {query && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-extrabold text-charcoal-600">
                {filteredProducts.length} {isTamil ? 'முடிவுகள் கண்டறியப்பட்டன' : 'products found'} for "{query}"
              </span>

              <button
                type="button"
                onClick={handleClear}
                className="text-xs font-bold text-brand-600 hover:underline"
              >
                {isTamil ? 'அனைத்தையும் நீக்குக' : 'Clear search'}
              </button>
            </div>

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-8 text-center border border-warm-border shadow-card space-y-4">
                <Sparkles className="w-10 h-10 text-brand-600 mx-auto" />
                <div>
                  <h3 className="text-sm font-black text-charcoal-900">
                    {isTamil ? 'பொருட்கள் ஏதும் கிடைக்கவில்லை' : 'No matching products found'}
                  </h3>
                  <p className="text-xs text-charcoal-500 font-medium mt-1">
                    {isTamil
                      ? 'உங்கள் விருப்பத்திற்கேற்ப புதிய தயாரிப்பை உருவாக்க அல்லது பழுது பார்க்க எங்களை நேரடியாக தொடர்பு கொள்ளலாம்.'
                      : 'Looking for a custom metal size or repair work? Request a machining quote directly.'}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
                  <Link
                    to="/repair"
                    className="inline-flex items-center justify-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs shadow-md transition-colors"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>{isTamil ? 'பழுது / புதிய வேலை கோரிக்கை' : 'Request Machining / Repair'}</span>
                  </Link>

                  <button
                    type="button"
                    onClick={handleWhatsAppQuickChat}
                    className="inline-flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold px-4 py-2.5 rounded-xl text-xs border border-emerald-200 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{isTamil ? 'வாட்ஸ்அப்பில் கேளுங்கள்' : 'Ask on WhatsApp'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default SearchPage;
