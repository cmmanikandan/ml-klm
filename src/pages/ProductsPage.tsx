import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, PackageX } from 'lucide-react';
import { ProductCard } from '../components/product/ProductCard';
import { useLanguage } from '../context/LanguageContext';
import { Product, Category } from '../types';
import { supabase, INITIAL_CATEGORIES } from '../lib/supabase';
import { fetchActiveProducts } from '../lib/productsStore';
import { fetchActiveCategories } from '../lib/categoriesStore';

export const ProductsPage: React.FC = () => {
  const { language, t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const isTamil = language === 'ta';

  const selectedCategorySlug = searchParams.get('category') || 'all';

  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

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
        {categories.length > 0 && (
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
                {isTamil ? cat.name_ta || cat.name_en : cat.name_en}
              </button>
            ))}
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
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-warm-border shadow-card max-w-md mx-auto my-8 space-y-3">
            <div className="w-14 h-14 rounded-full bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center mx-auto">
              <PackageX className="w-7 h-7" />
            </div>
            <h3 className="text-base font-black text-charcoal-900">
              {isTamil ? 'தயாரிப்புகள் ஏதும் இல்லை' : 'No Products Available'}
            </h3>
            <p className="text-xs text-charcoal-500 font-medium leading-relaxed">
              {isTamil
                ? 'தற்போது பொருட்கள் எதுவும் பட்டியலில் இல்லை. புதிய தயாரிப்புகள் விரைவில் சேர்க்கப்படும்.'
                : 'No products are currently available in this catalogue section. Please check back soon!'}
            </p>
          </div>
        )}

      </div>
    </div>
  );
};
