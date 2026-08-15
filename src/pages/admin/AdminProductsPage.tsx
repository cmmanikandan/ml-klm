import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, EyeOff, Search, Sparkles, Upload } from 'lucide-react';
import { Product } from '../../types';
import { INITIAL_PRODUCTS } from '../../lib/supabase';

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleProductActive = (id: string) => {
    setProducts(
      products.map((p) => (p.id === id ? { ...p, is_active: !p.is_active } : p))
    );
  };

  const handleDeleteProduct = (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      setProducts(products.filter((p) => p.id !== id));
    }
  };

  const filtered = products.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return p.name_en.toLowerCase().includes(q) || p.name_ta.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-charcoal-900">Products Inventory</h1>
          <p className="text-xs text-charcoal-500 font-semibold mt-0.5">
            Manage catalogue, bilingual fields, multi-images, and internal workshop prices
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/import"
            className="inline-flex items-center gap-1.5 bg-white hover:bg-warm-hover text-charcoal-800 border border-warm-border px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-sm"
          >
            <Upload className="w-4 h-4 text-brand-600" />
            <span>Import CSV</span>
          </Link>

          <Link
            to="/admin/products/new"
            className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-brand-600 absolute left-3.5 top-3.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search products by English or Tamil title..."
          className="w-full pl-10 pr-4 py-2.5 text-xs font-bold border border-warm-border rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Product List Cards */}
      <div className="space-y-3">
        {filtered.map((prod) => (
          <div
            key={prod.id}
            className="bg-white rounded-3xl border border-warm-border p-4 shadow-card flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3.5 w-full sm:w-auto">
              <img
                src={prod.primary_image || (prod.images && prod.images[0]) || ''}
                alt={prod.name_en}
                className="w-16 h-16 rounded-2xl object-cover border border-warm-border shrink-0"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold text-brand-600 uppercase tracking-wider">
                    {prod.category_name || 'General'}
                  </span>
                  {prod.is_best_selling && (
                    <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full">
                      BESTSELLER
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-extrabold text-charcoal-900">{prod.name_en}</h3>
                <p className="text-xs text-charcoal-500 font-bold">{prod.name_ta}</p>
                <span className="text-xs font-extrabold text-emerald-700 block mt-1">
                  Workshop Base Price: ₹{(prod.admin_price || 0).toLocaleString('en-IN')} (Admin Only)
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-warm-muted">
              <button
                onClick={() => toggleProductActive(prod.id)}
                className={`p-2.5 rounded-xl border transition-colors ${
                  prod.is_active
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                    : 'bg-gray-100 text-gray-400 border-gray-300'
                }`}
                title={prod.is_active ? 'Active' : 'Disabled'}
              >
                {prod.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>

              <Link
                to={`/admin/products/edit/${prod.id}`}
                className="p-2.5 rounded-xl bg-warm-bg hover:bg-brand-100 text-brand-600 border border-brand-200 transition-colors"
                title="Edit Product"
              >
                <Edit className="w-4 h-4" />
              </Link>

              <button
                onClick={() => handleDeleteProduct(prod.id)}
                className="p-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors"
                title="Delete Product"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
