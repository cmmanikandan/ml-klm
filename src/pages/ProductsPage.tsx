import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Sparkles } from 'lucide-react';
import { ProductCard } from '../components/product/ProductCard';
import { useLanguage } from '../context/LanguageContext';
import { Product, Category } from '../types';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from '../lib/supabase';

export const ProductsPage: React.FC = () => {
  const { language, t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const isTamil = language === 'ta';

  const selectedCategorySlug = searchParams.get('category') || 'all';

  const [categories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [products] = useState<Product[]>(INITIAL_PRODUCTS);

  const filteredProducts = selectedCategorySlug === 'all'
    ? products
    : products.filter((p) => {
        const cat = categories.find((c) => c.slug === selectedCategorySlug);
        return cat ? p.category_id === cat.id : true;
      });

  return (
    <div className="min-h-screen bg-warm-bg pb-24 md:pb-12 pt-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-charcoal-900">{t('nav_products')}</h1>
            <p className="text-xs text-charcoal-500 font-semibold mt-0.5">
              {isTamil ? 'அனைத்து லேத் & வெல்டிங் தயாரிப்புகளின் பட்டியல்' : 'Explore fabricated products catalogue'}
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-extrabold text-brand-600 bg-brand-50 px-3 py-1.5 rounded-full border border-brand-200">
            <Filter className="w-3.5 h-3.5" />
            <span>{filteredProducts.length} {isTamil ? 'பொருட்கள்' : 'Items'}</span>
          </div>
        </div>

        {/* Category Horizontal Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
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
              {isTamil ? cat.name_ta : cat.name_en}
            </button>
          ))}
        </div>

        {/* Responsive Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
};
