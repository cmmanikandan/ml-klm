import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Sparkles, Star, Flame, TrendingUp, Wrench, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from '../../lib/supabase';

export const AdminProductEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const isEdit = Boolean(id && id !== 'new');
  const existingProd = isEdit ? INITIAL_PRODUCTS.find((p) => p.id === id) : null;

  const [nameEn, setNameEn] = useState(existingProd?.name_en || '');
  const [nameTa, setNameTa] = useState(existingProd?.name_ta || '');
  const [descEn, setDescEn] = useState(existingProd?.description_en || '');
  const [descTa, setDescTa] = useState(existingProd?.description_ta || '');
  const [categorySlug, setCategorySlug] = useState('steel-chairs');
  const [materials, setMaterials] = useState(existingProd?.materials || '304 Stainless Steel');
  const [availableSizes, setAvailableSizes] = useState(existingProd?.available_sizes || 'Standard Size');
  const [adminPrice, setAdminPrice] = useState<number>(existingProd?.admin_price || 2800);

  // Expanded Product Feature Badges / Flags
  const [isBestSelling, setIsBestSelling] = useState<boolean>(existingProd?.is_best_selling || false);
  const [isNew, setIsNew] = useState<boolean>(existingProd?.is_new !== false);
  const [isFeatured, setIsFeatured] = useState<boolean>(true);
  const [isPopular, setIsPopular] = useState<boolean>(false);
  const [isCustomFabrication, setIsCustomFabrication] = useState<boolean>(true);
  const [isInStock, setIsInStock] = useState<boolean>(true);

  const [images, setImages] = useState<string[]>(
    existingProd?.images || [
      'https://images.unsplash.com/photo-1580481072645-022f9a6d1270?w=800&auto=format&fit=crop&q=80'
    ]
  );
  const [newImageUrl, setNewImageUrl] = useState('');

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      setImages([...images, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Product ${isEdit ? 'updated' : 'created'} successfully!`);
    navigate('/admin/products');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/admin/products')}
          className="inline-flex items-center gap-1.5 text-xs font-extrabold text-charcoal-700 bg-white px-3.5 py-2 rounded-full border border-warm-border shadow-sm hover:bg-warm-hover transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Products</span>
        </button>

        <h1 className="text-xl font-black text-charcoal-900">
          {isEdit ? 'Edit Product' : 'Add New Product'}
        </h1>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 sm:p-8 border border-warm-border shadow-card space-y-6">
        
        {/* Basic Titles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-charcoal-700 mb-1">Product Name (English) *</label>
            <input
              type="text"
              required
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm font-bold border border-warm-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-charcoal-700 mb-1">Product Name (தமிழ்) *</label>
            <input
              type="text"
              required
              value={nameTa}
              onChange={(e) => setNameTa(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm font-bold border border-warm-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Category & Workshop Price */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-charcoal-700 mb-1">Category *</label>
            <select
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm font-bold border border-warm-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {INITIAL_CATEGORIES.map((c) => (
                <option key={c.id} value={c.slug}>{c.name_en} ({c.name_ta})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-600 mb-1">Internal Base Price (₹) [ADMIN ONLY]</label>
            <input
              type="number"
              required
              value={adminPrice}
              onChange={(e) => setAdminPrice(parseFloat(e.target.value) || 0)}
              className="w-full px-3.5 py-2.5 text-sm font-extrabold border-2 border-brand-300 rounded-xl bg-warm-bg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Descriptions */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-charcoal-700 mb-1">Description (English)</label>
            <textarea
              rows={3}
              value={descEn}
              onChange={(e) => setDescEn(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-warm-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-charcoal-700 mb-1">Description (தமிழ்)</label>
            <textarea
              rows={3}
              value={descTa}
              onChange={(e) => setDescTa(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-warm-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>
        </div>

        {/* Specs & Sizes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-charcoal-700 mb-1">Materials Used</label>
            <input
              type="text"
              value={materials}
              onChange={(e) => setMaterials(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm font-bold border border-warm-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-charcoal-700 mb-1">Available Sizes / Options</label>
            <input
              type="text"
              value={availableSizes}
              onChange={(e) => setAvailableSizes(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm font-bold border border-warm-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Expanded Product Badges & Flags */}
        <div className="space-y-3 pt-4 border-t border-warm-muted">
          <label className="block text-xs font-extrabold text-charcoal-900 uppercase tracking-wider">
            Product Display Flags & Badges
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <label className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-2.5 ${isBestSelling ? 'border-amber-500 bg-amber-50' : 'border-warm-border hover:border-gray-300'}`}>
              <input
                type="checkbox"
                checked={isBestSelling}
                onChange={(e) => setIsBestSelling(e.target.checked)}
                className="w-4 h-4 text-amber-500 rounded"
              />
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-charcoal-900">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Best Selling</span>
              </div>
            </label>

            <label className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-2.5 ${isNew ? 'border-brand-600 bg-brand-50' : 'border-warm-border hover:border-gray-300'}`}>
              <input
                type="checkbox"
                checked={isNew}
                onChange={(e) => setIsNew(e.target.checked)}
                className="w-4 h-4 text-brand-600 rounded"
              />
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-charcoal-900">
                <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                <span>New Arrival</span>
              </div>
            </label>

            <label className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-2.5 ${isFeatured ? 'border-orange-500 bg-orange-50' : 'border-warm-border hover:border-gray-300'}`}>
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 text-orange-500 rounded"
              />
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-charcoal-900">
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                <span>Featured</span>
              </div>
            </label>

            <label className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-2.5 ${isPopular ? 'border-blue-500 bg-blue-50' : 'border-warm-border hover:border-gray-300'}`}>
              <input
                type="checkbox"
                checked={isPopular}
                onChange={(e) => setIsPopular(e.target.checked)}
                className="w-4 h-4 text-blue-500 rounded"
              />
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-charcoal-900">
                <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                <span>Popular</span>
              </div>
            </label>

            <label className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-2.5 ${isCustomFabrication ? 'border-purple-500 bg-purple-50' : 'border-warm-border hover:border-gray-300'}`}>
              <input
                type="checkbox"
                checked={isCustomFabrication}
                onChange={(e) => setIsCustomFabrication(e.target.checked)}
                className="w-4 h-4 text-purple-500 rounded"
              />
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-charcoal-900">
                <Wrench className="w-3.5 h-3.5 text-purple-500" />
                <span>Custom Lathe</span>
              </div>
            </label>

            <label className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-2.5 ${isInStock ? 'border-emerald-500 bg-emerald-50' : 'border-warm-border hover:border-gray-300'}`}>
              <input
                type="checkbox"
                checked={isInStock}
                onChange={(e) => setIsInStock(e.target.checked)}
                className="w-4 h-4 text-emerald-500 rounded"
              />
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-charcoal-900">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>In Stock</span>
              </div>
            </label>
          </div>
        </div>

        {/* Multi-Image Manager */}
        <div className="space-y-3 pt-4 border-t border-warm-muted">
          <label className="block text-xs font-bold text-charcoal-700 uppercase tracking-wider">
            Product Images Management (Cloudinary & Web URLs)
          </label>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const { uploadImageToCloudinary } = await import('../../lib/cloudinary');
                  const uploadedUrl = await uploadImageToCloudinary(file);
                  setImages([...images, uploadedUrl]);
                  alert('Image uploaded to Cloudinary successfully!');
                } catch (err) {
                  alert('Cloudinary upload fallback: Please paste web image URL');
                }
              }}
              className="text-xs text-charcoal-600 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-brand-600 file:text-white hover:file:bg-brand-700 cursor-pointer"
            />

            <div className="flex-1 flex gap-2">
              <input
                type="url"
                placeholder="Or paste Image URL (https://...)"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                className="flex-1 px-3.5 py-2 text-xs border border-warm-border rounded-xl bg-white focus:outline-none"
              />
              <Button type="button" onClick={handleAddImage} variant="secondary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
                Add URL
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            {images.map((img, idx) => (
              <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-warm-border shadow-sm group">
                <img src={img} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-warm-muted">
          <Button type="submit" variant="primary" size="lg" fullWidth icon={<Save className="w-4 h-4" />}>
            Save Product to Catalogue
          </Button>
        </div>

      </form>
    </div>
  );
};
