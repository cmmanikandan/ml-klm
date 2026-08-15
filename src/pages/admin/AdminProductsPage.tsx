import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, EyeOff, Search, Upload, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { Product } from '../../types';
import { fetchActiveProducts, deleteProductFromStore, clearAllDemoProductsFromStore, saveProductToStore } from '../../lib/productsStore';

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Delete Confirmation Modal State
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Success Toast Card State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadProducts = async () => {
    setLoading(true);
    const data = await fetchActiveProducts();
    setProducts(data);
    setLoading(false);
  };

  const toggleProductActive = async (prod: Product) => {
    const newStatus = !prod.is_active;
    const updated = { ...prod, is_active: newStatus };
    
    setProducts(products.map((p) => (p.id === prod.id ? updated : p)));
    await saveProductToStore(updated);

    showToast(`Product visibility updated to ${newStatus ? 'Active' : 'Disabled'}`);
  };

  const confirmDeleteProduct = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);

    await deleteProductFromStore(deleteTargetId);

    setProducts(products.filter((p) => p.id !== deleteTargetId));
    showToast('Product successfully deleted!');

    setIsDeleting(false);
    setDeleteTargetId(null);
  };

  // Clear all sample demo products completely
  const handlePurgeAllDemoProducts = async () => {
    if (!window.confirm('Are you sure you want to clear all sample demo products from shop catalogue?')) return;
    setLoading(true);
    await clearAllDemoProductsFromStore();
    await loadProducts();
    showToast('All sample demo products cleared successfully!');
  };

  const filtered = products.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const titleEn = (p.name_en || '').toLowerCase();
    const titleTa = (p.name_ta || '').toLowerCase();
    return titleEn.includes(q) || titleTa.includes(q);
  });

  return (
    <div className="space-y-6 relative">
      
      {/* Floating Success Toast Notification Card */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-bounce-subtle border border-emerald-400">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-xs font-extrabold">{toastMessage}</span>
        </div>
      )}

      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-charcoal-900">Products Inventory</h1>
          <p className="text-xs text-charcoal-500 font-semibold mt-0.5">
            Manage live shop catalogue, pricing, specifications, and visibility
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
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

      {/* Search Bar & Refresh Trigger */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-brand-600 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products by English or Tamil title..."
            className="w-full pl-10 pr-4 py-2.5 text-xs font-bold border border-warm-border rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
          />
        </div>

        <button
          onClick={loadProducts}
          className="p-2.5 bg-white hover:bg-warm-bg text-charcoal-700 rounded-2xl border border-warm-border shadow-sm transition-colors"
          title="Refresh products list"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-600' : ''}`} />
        </button>
      </div>

      {/* Product List Cards */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-3xl p-6 border border-warm-border animate-pulse h-24" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((prod) => (
            <div
              key={prod.id}
              className="bg-white rounded-3xl border border-warm-border p-4 shadow-card flex flex-col sm:flex-row items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5 w-full sm:w-auto">
                {prod.primary_image || (prod.images && prod.images[0]) ? (
                  <img
                    src={prod.primary_image || prod.images![0]}
                    alt={prod.name_en}
                    className="w-16 h-16 rounded-2xl object-cover border border-warm-border shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-warm-bg border border-warm-border flex items-center justify-center text-brand-600 font-extrabold text-xs shrink-0">
                    No Image
                  </div>
                )}

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
                  onClick={() => toggleProductActive(prod)}
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
                  onClick={() => setDeleteTargetId(prod.id)}
                  className="p-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors"
                  title="Delete Product"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-warm-border shadow-card space-y-3">
          <div className="w-14 h-14 rounded-full bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center mx-auto">
            <Plus className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-charcoal-900">No Products in Inventory</h3>
          <p className="text-xs text-charcoal-500 font-medium">Click "Add New Product" above to create your first product item!</p>
          <Link
            to="/admin/products/new"
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-extrabold px-5 py-2.5 rounded-2xl text-xs shadow-md transition-all mt-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product Now</span>
          </Link>
        </div>
      )}

      {/* Confirmation Modal Card for Deleting Product */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full border-2 border-red-200 shadow-2xl text-center space-y-4 animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto border border-red-200">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-charcoal-900">Confirm Product Delete</h3>
              <p className="text-xs text-charcoal-600 font-medium leading-relaxed">
                Are you sure you want to permanently delete this product from the shop catalogue?
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                disabled={isDeleting}
                className="flex-1 bg-warm-bg hover:bg-warm-hover text-charcoal-800 font-bold py-3 px-4 rounded-2xl text-xs border border-warm-border transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDeleteProduct}
                disabled={isDeleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-extrabold py-3 px-4 rounded-2xl text-xs shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-1.5"
              >
                {isDeleting ? (
                  <span>Deleting...</span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
