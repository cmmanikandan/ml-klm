import React, { useState } from 'react';
import { Plus, Edit, Trash2, FolderTree } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Category } from '../../types';
import { INITIAL_CATEGORIES } from '../../lib/supabase';

export const AdminCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);

  const [nameEn, setNameEn] = useState('');
  const [nameTa, setNameTa] = useState('');
  const [slug, setSlug] = useState('');
  const [imageUrl, setImageUrl] = useState('');

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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCat) {
      setCategories(
        categories.map((c) =>
          c.id === editingCat.id ? { ...c, name_en: nameEn, name_ta: nameTa, slug, image_url: imageUrl } : c
        )
      );
    } else {
      const newCat: Category = {
        id: `cat_${Date.now()}`,
        name_en: nameEn,
        name_ta: nameTa,
        slug: slug || nameEn.toLowerCase().replace(/\s+/g, '-'),
        image_url: imageUrl,
        is_active: true,
        sort_order: categories.length + 1
      };
      setCategories([...categories, newCat]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-charcoal-900">Category Management</h1>
          <p className="text-xs text-charcoal-500 font-semibold mt-0.5">
            Add & edit English and Tamil category titles and image icons
          </p>
        </div>

        <Button onClick={handleOpenAdd} variant="primary" icon={<Plus className="w-4 h-4" />}>
          Add Category
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-white p-4 rounded-3xl border border-warm-border shadow-card flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img src={cat.image_url} alt={cat.name_en} className="w-12 h-12 rounded-2xl object-cover border border-warm-border" />
              <div>
                <h3 className="text-sm font-extrabold text-charcoal-900">{cat.name_en}</h3>
                <span className="text-xs text-brand-600 font-bold block">{cat.name_ta}</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => handleOpenEdit(cat)}
                className="p-2 text-charcoal-600 hover:text-brand-600 rounded-xl hover:bg-warm-hover"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCat ? 'Edit Category' : 'Add Category'} maxWidth="sm">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-charcoal-700 mb-1">English Category Name *</label>
            <input
              type="text"
              required
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm font-bold border border-warm-border rounded-xl bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-charcoal-700 mb-1">Tamil Category Name (தமிழ்) *</label>
            <input
              type="text"
              required
              value={nameTa}
              onChange={(e) => setNameTa(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm font-bold border border-warm-border rounded-xl bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-charcoal-700 mb-1">Image URL</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
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
