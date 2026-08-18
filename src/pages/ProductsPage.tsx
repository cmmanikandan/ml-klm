import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Filter, Search, X, ArrowUpDown, PackageX, Mic } from 'lucide-react';
import { ProductCard } from '../components/product/ProductCard';
import { VoiceSearchModal } from '../components/common/VoiceSearchModal';
import { useLanguage } from '../context/LanguageContext';
import { Product, Category } from '../types';
import { supabase } from '../lib/supabase';
import { fetchActiveProducts, getCachedProducts } from '../lib/productsStore';
import { fetchActiveCategories, getCachedCategories } from '../lib/categoriesStore';
import { filterProductsSmartly } from '../lib/searchHelper';

export const ProductsPage: React.FC = () => {
  const { language, t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const isTamil = language === 'ta';

  const selectedCategorySlug = searchParams.get('category') || 'all';

  const [categories, setCategories] = useState<Category[]>(() => getCachedCategories());
  const [products, setProducts] = useState<Product[]>(() => getCachedProducts());
  const [loading, setLoading] = useState(() => getCachedProducts().length === 0);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);

  // In-page search and sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'bestselling'>('newest');

  useEffect(() => {
    loadCatalogue();
  }, []);

  const loadCatalogue = async () => {
    setLoading(true);
    try {
      const activeCats = await fetchActiveCategories();
      setCategories(activeCats);

      const activeProds = await fetchActiveProducts();
      setProducts(activeProds);
    } catch (e) {
      console.warn('Catalogue loading error');
    } finally {
      setLoading(false);
    }
  };

  // 1. Filter by category
  let processedProducts = selectedCategorySlug === 'all'
    ? products
    : products.filter((p) => {
        const cat = categories.find((c) => c.slug === selectedCategorySlug);
        return cat ? p.category_id === cat.id : true;
      });

  // 2. Filter by search query using smart fuzzy, phonetic, and keyword token matching
  if (searchQuery.trim()) {
    processedProducts = filterProductsSmartly(processedProducts, searchQuery);
  }

  // 3. Sort products by price / best seller / date
  if (sortBy === 'price_asc') {
    processedProducts = [...processedProducts].sort((a, b) => (a.admin_price || 0) - (b.admin_price || 0));
  } else if (sortBy === 'price_desc') {
    processedProducts = [...processedProducts].sort((a, b) => (b.admin_price || 0) - (a.admin_price || 0));
  } else if (sortBy === 'bestselling') {
    processedProducts = [...processedProducts].sort((a, b) => (b.is_best_selling ? 1 : 0) - (a.is_best_selling ? 1 : 0));
  }

  return (
    <div className="min-h-screen bg-warm-bg pb-24 md:pb-12 pt-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-charcoal-900">{t('nav_products')}</h1>
            <p className="text-xs text-charcoal-500 font-semibold mt-0.5">
              {isTamil ? 'அனைத்து லேத் & வெல்டிங் தயாரிப்புகளின் பட்டியல்' : 'Explore fabricated products catalogue'}
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-extrabold text-brand-600 bg-brand-50 px-3 py-1.5 rounded-full border border-brand-200 shadow-sm">
            <Filter className="w-3.5 h-3.5" />
            <span>{processedProducts.length} {isTamil ? 'பொருட்கள்' : 'Items'}</span>
          </div>
        </div>

        {/* Top Interactive Search Bar & Sort Dropdown Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Bar Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-brand-600 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isTamil ? 'பொருட்கள் அல்லது பொருளின் பெயர் தேடுக...' : 'Search products by title, Tamil name, or material...'}
              className="w-full pl-10 pr-20 py-2.5 text-xs font-bold border-2 border-warm-border focus:border-brand-500 rounded-2xl bg-white focus:outline-none shadow-card transition-colors"
            />
            <div className="absolute right-2.5 top-2 flex items-center gap-1">
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-charcoal-400 hover:text-charcoal-800 rounded-full"
                  aria-label="Clear Search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsVoiceOpen(true)}
                className="p-1.5 text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-full transition-colors"
                title="Tamil & English Voice Search"
                aria-label="Voice Search"
              >
                <Mic className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Voice Search Modal */}
          <VoiceSearchModal
            isOpen={isVoiceOpen}
            onClose={() => setIsVoiceOpen(false)}
            onTranscript={(spokenText) => {
              setSearchQuery(spokenText);
            }}
          />

          {/* Price & Priority Sort Dropdown */}
          <div className="relative w-full sm:w-auto shrink-0 flex items-center gap-2 bg-white px-3 py-2 rounded-2xl border-2 border-warm-border shadow-card">
            <ArrowUpDown className="w-4 h-4 text-brand-600 shrink-0" />
            <span className="text-xs font-bold text-charcoal-500 hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs font-extrabold text-charcoal-900 focus:outline-none cursor-pointer pr-2"
            >
              <option value="newest">{isTamil ? 'புதியவை முதலிடம் (Newest)' : 'Newest Arrivals'}</option>
              <option value="price_asc">{isTamil ? 'விலை: குறைந்ததிலிருந்து அதிகம் (Low to High)' : 'Price: Low to High'}</option>
              <option value="price_desc">{isTamil ? 'விலை: அதிகத்திலிருந்து குறைவு (High to Low)' : 'Price: High to Low'}</option>
              <option value="bestselling">{isTamil ? 'பிரபலமானவை முதலிடம் (Bestsellers)' : 'Bestsellers First'}</option>
            </select>
          </div>
        </div>

        {/* Category Horizontal Filter Pills */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSearchParams({})}
              className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all whitespace-nowrap border ${
                selectedCategorySlug === 'all'
                  ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                  : 'bg-white text-charcoal-700 border-warm-border hover:border-brand-300'
              }`}
            >
              {isTamil ? 'அனைத்தும்' : 'All Products'}
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSearchParams({ category: cat.slug })}
                className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all whitespace-nowrap border ${
                  selectedCategorySlug === cat.slug
                    ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                    : 'bg-white text-charcoal-700 border-warm-border hover:border-brand-300'
                }`}
              >
                {isTamil ? cat.name_ta || cat.name_en : cat.name_en}
              </button>
            ))}

            {/* Special Repair & Machining Service Link */}
            <Link
              to="/repair"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-extrabold transition-all whitespace-nowrap border bg-gradient-to-r from-brand-50 to-amber-50 text-brand-700 border-brand-300 hover:from-brand-100 hover:to-amber-100 shadow-xs"
            >
              🔧 {isTamil ? 'பழுது & இயந்திர சேவை' : 'Repair & Machining'}
            </Link>
          </div>
        )}

        {/* Products Grid Showcase */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white rounded-2xl h-64 border border-warm-border animate-pulse p-4">
                <div className="w-full h-40 bg-warm-bg rounded-xl mb-3" />
                <div className="w-3/4 h-4 bg-warm-bg rounded mb-2" />
                <div className="w-1/2 h-3 bg-warm-bg rounded" />
              </div>
            ))}
          </div>
        ) : processedProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {processedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-warm-border shadow-card max-w-md mx-auto my-6 space-y-3">
            <div className="w-14 h-14 rounded-full bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center mx-auto">
              <PackageX className="w-7 h-7" />
            </div>
            <h3 className="text-base font-black text-charcoal-900">
              {isTamil ? 'தயாரிப்புகள் ஏதும் இல்லை' : 'No Products Matching Filter'}
            </h3>
            <p className="text-xs text-charcoal-500 font-medium leading-relaxed">
              {isTamil
                ? 'உங்கள் தேடலுக்கு ஏற்ற பொருட்கள் ஏதும் கிடைக்கவில்லை. வேறு சொல்லைப் பயன்படுத்தி தேடவும்.'
                : 'No products match your search or filter selection. Try adjusting your search query or sorting option.'}
            </p>
          </div>
        )}

      </div>
    </div>
  );
};
