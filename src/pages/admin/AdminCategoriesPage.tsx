import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Category } from '../../types';
import { fetchActiveCategories, saveCategoryToStore, deleteCategoryFromStore } from '../../lib/categoriesStore';

export const AdminCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);

  const [nameEn, setNameEn] = useState('');
  const [nameTa, setNameTa] = useState('');
  const [slug, setSlug] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadCategories = async () => {
    setLoading(true);
    const data = await fetchActiveCategories();
    setCategories(data);
    setLoading(false);
  };

  const handleOpenAdd = () => {
    setEditingCat(null);
    setNameEn('');
    setNameTa('');
    setSlug('');
    setImageUrl('https://images.unsplash.com/photo-1580481072645-022f9a6d1270?w=600&auto=format&fit=crop&q=80');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCat(cat);
    setNameEn(cat.name_en);
    setNameTa(cat.name_ta);
    setSlug(cat.slug);
    setImageUrl(cat.image_url || '');
    setIsModalOpen(true);
  };

  const handleDeleteCategory = async (cat: Category) => {
    if (!window.confirm(`Are you sure you want to delete category "${cat.name_en}"?`)) return;
    await deleteCategoryFromStore(cat.id, cat.slug);
    showToast(`Category "${cat.name_en}" deleted successfully!`);
    loadCategories();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim()) return;

    const catSlug = slug.trim() || nameEn.toLowerCase().replace(/\s+/g, '-');
    const catId = editingCat ? editingCat.id : crypto.randomUUID();

    const categoryPayload: Category = {
      id: catId,
      name_en: nameEn.trim(),
      name_ta: nameTa.trim() || nameEn.trim(),
      slug: catSlug,
      image_url: imageUrl.trim(),
      is_active: true,
      sort_order: editingCat ? editingCat.sort_order : categories.length + 1
    };

    await saveCategoryToStore(categoryPayload);
    setIsModalOpen(false);
    showToast(`Category "${nameEn}" ${editingCat ? 'updated' : 'added'} successfully!`);
    loadCategories();
  };

  return (
    <div className="space-y-6 relative">
      
      {/* Toast Notification Card */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-bounce-subtle border border-emerald-400">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-xs font-extrabold">{toastMessage}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-charcoal-900">Category Management</h1>
          <p className="text-xs text-charcoal-500 font-semibold mt-0.5">
            Add & edit bilingual English and Tamil categories for your shop catalogue
          </p>
        </div>

        <Button onClick={handleOpenAdd} variant="primary" icon={<Plus className="w-4 h-4" />}>
          Add Category
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-3xl h-24 border border-warm-border animate-pulse p-4" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-white p-4 rounded-3xl border border-warm-border shadow-card flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={cat.image_url || 'https://images.unsplash.com/photo-1580481072645-022f9a6d1270?w=600&auto=format&fit=crop&q=80'}
                  alt={cat.name_en}
                  className="w-12 h-12 rounded-2xl object-cover border border-warm-border shrink-0"
                />
                <div>
                  <h3 className="text-sm font-extrabold text-charcoal-900">{cat.name_en}</h3>
                  <span className="text-xs text-brand-600 font-bold block">{cat.name_ta}</span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(cat)}
                  className="p-2 text-charcoal-600 hover:text-brand-600 rounded-xl hover:bg-warm-hover"
                  title="Edit Category"
                >
                  <Edit className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDeleteCategory(cat)}
                  className="p-2 text-red-500 hover:text-red-700 rounded-xl hover:bg-red-50"
                  title="Delete Category"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCat ? 'Edit Category' : 'Add Category'} maxWidth="sm">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-charcoal-700 mb-1">English Category Name *</label>
            <input
              type="text"
              required
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="e.g. Steel Chairs"
              className="w-full px-3.5 py-2.5 text-sm font-bold border border-warm-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-charcoal-700 mb-1">Tamil Category Name (தமிழ்)</label>
            <input
              type="text"
              value={nameTa}
              onChange={(e) => setNameTa(e.target.value)}
              placeholder="e.g. ஸ்டீல் நாற்காலிகள்"
              className="w-full px-3.5 py-2.5 text-sm font-bold border border-warm-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-charcoal-700 mb-1">Image URL</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3.5 py-2.5 text-xs font-bold border border-warm-border rounded-xl bg-white focus:outline-none"
            />
          </div>

          <Button type="submit" variant="primary" fullWidth size="lg">
            Save Category
          </Button>
        </form>
      </Modal>

    </div>
  );
};
