import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Sparkles, Star, Flame, TrendingUp, Wrench, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { supabase, INITIAL_CATEGORIES } from '../../lib/supabase';
import { Category, Product } from '../../types';

export const AdminProductEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const isEdit = Boolean(id && id !== 'new');

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);

  // Form Fields
  const [nameEn, setNameEn] = useState('');
  const [nameTa, setNameTa] = useState('');
  const [descEn, setDescEn] = useState('');
  const [descTa, setDescTa] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categorySlug, setCategorySlug] = useState('steel-chairs');
  const [categoryName, setCategoryName] = useState('Steel Chairs');
  const [materials, setMaterials] = useState('304 Stainless Steel Pipe, Heavy Gauge Sheet');
  const [availableSizes, setAvailableSizes] = useState('Standard Size (3.5ft x 1.8ft), High-back');
  const [adminPrice, setAdminPrice] = useState<number>(2800);

  // Flags & Badges
  const [isBestSelling, setIsBestSelling] = useState<boolean>(false);
  const [isNew, setIsNew] = useState<boolean>(true);
  const [isFeatured, setIsFeatured] = useState<boolean>(true);
  const [isPopular, setIsPopular] = useState<boolean>(false);
  const [isCustomFabrication, setIsCustomFabrication] = useState<boolean>(true);
  const [isInStock, setIsInStock] = useState<boolean>(true);

  // Images
  const [images, setImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1580481072645-022f9a6d1270?w=800&auto=format&fit=crop&q=80'
  ]);
  const [newImageUrl, setNewImageUrl] = useState('');

  // Success Toast Card Modal State
  const [showSuccessCard, setShowSuccessCard] = useState(false);

  useEffect(() => {
    fetchCategories();
    if (isEdit && id) {
      fetchExistingProduct(id);
    }
  }, [id, isEdit]);

  const fetchCategories = async () => {
    try {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (data && data.length > 0) {
        setCategories(data);
        if (!categoryId) {
          setCategoryId(data[0].id);
          setCategorySlug(data[0].slug);
          setCategoryName(data[0].name_en);
        }
      }
    } catch (e) {
      console.warn('Error fetching categories');
    }
  };

  const fetchExistingProduct = async (prodId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', prodId)
        .single();

      if (data && !error) {
        setNameEn(data.name_en || '');
        setNameTa(data.name_ta || '');
        setDescEn(data.description_en || '');
        setDescTa(data.description_ta || '');
        setCategoryId(data.category_id || '');
        setCategoryName(data.category_name || 'General');
        setMaterials(data.materials || '');
        setAvailableSizes(data.available_sizes || '');
        setAdminPrice(data.admin_price || 0);
        setIsBestSelling(data.is_best_selling || false);
        setIsNew(data.is_new !== false);
        setIsFeatured(data.is_featured !== false);
        setIsPopular(data.is_popular || false);
        setIsCustomFabrication(data.is_custom_fabrication !== false);
        setIsInStock(data.is_in_stock !== false);
        if (data.images && data.images.length > 0) {
          setImages(data.images);
        } else if (data.primary_image) {
          setImages([data.primary_image]);
        }
      }
    } catch (e) {
      console.warn('Error fetching product for edit');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (slug: string) => {
    setCategorySlug(slug);
    const matched = categories.find((c) => c.slug === slug);
    if (matched) {
      setCategoryId(matched.id);
      setCategoryName(matched.name_en);
    }
  };

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      setImages([...images, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const productId = isEdit && id ? id : crypto.randomUUID();
    const primaryImg = images[0] || 'https://images.unsplash.com/photo-1580481072645-022f9a6d1270?w=800&auto=format&fit=crop&q=80';

    const productPayload = {
      id: productId,
      category_id: categoryId || categories[0]?.id || '11111111-1111-1111-1111-111111111111',
      category_name: categoryName,
      name_en: nameEn.trim(),
      name_ta: nameTa.trim(),
      description_en: descEn.trim(),
      description_ta: descTa.trim(),
      materials: materials.trim(),
      available_sizes: availableSizes.trim(),
      specifications: {
        'Gauge': '16 Gauge SS',
        'Finish': 'Mirror Polish',
        'Warranty': '5 Years Structural Warranty'
      },
      is_best_selling: isBestSelling,
      is_new: isNew,
      is_featured: isFeatured,
      is_popular: isPopular,
      is_custom_fabrication: isCustomFabrication,
      is_in_stock: isInStock,
      is_active: true,
      admin_price: adminPrice,
      primary_image: primaryImg,
      images: images,
      updated_at: new Date().toISOString()
    };

    try {
      // Upsert into Supabase DB table `public.products`
      const { error } = await supabase.from('products').upsert(productPayload);

      if (error) {
        console.error('Supabase Product Upsert Error:', error);
        alert(`Error saving to database: ${error.message}`);
        setSaving(false);
        return;
      }

      // Sync images to `public.product_images`
      if (images.length > 0) {
        try {
          await supabase.from('product_images').delete().eq('product_id', productId);
          const imageRecords = images.map((url, idx) => ({
            product_id: productId,
            image_url: url,
            is_primary: idx === 0,
            sort_order: idx + 1
          }));
          await supabase.from('product_images').insert(imageRecords);
        } catch (imgErr) {
          console.warn('Image sync warning:', imgErr);
        }
      }

      setShowSuccessCard(true);
      setTimeout(() => {
        navigate('/admin/products');
      }, 1500);

    } catch (err) {
      alert('Save failed: Please check database connection.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-brand-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 relative">
      
      {/* Success Card Modal Overlay */}
      {showSuccessCard && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full border-2 border-emerald-500 shadow-2xl text-center space-y-4 animate-bounce-subtle">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-300">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-charcoal-900">
                Product {isEdit ? 'Updated' : 'Added'} Successfully!
              </h3>
              <p className="text-xs text-charcoal-600 font-bold">
                Saved directly into Manikandan Lathe Supabase Database catalogue.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/admin/products')}
          className="inline-flex items-center gap-1.5 text-xs font-extrabold text-charcoal-700 bg-white px-3.5 py-2 rounded-full border border-warm-border shadow-sm hover:bg-warm-hover transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Products</span>
        </button>

        <h1 className="text-xl font-black text-charcoal-900">
          {isEdit ? 'Edit Product in DB' : 'Add New Product to DB'}
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
              placeholder="e.g. Stainless Steel Chair"
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
              placeholder="e.g. ஸ்டெயின்லெஸ் ஸ்டீல் நாற்காலி"
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
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm font-bold border border-warm-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {categories.map((c) => (
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
              placeholder="Enter product description, structural details and features..."
              className="w-full px-3.5 py-2.5 text-sm border border-warm-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-charcoal-700 mb-1">Description (தமிழ்)</label>
            <textarea
              rows={3}
              value={descTa}
              onChange={(e) => setDescTa(e.target.value)}
              placeholder="தயாரிப்பின் விபரம் மற்றும் சிறப்பம்சங்கள்..."
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

        {/* Product Badges & Flags */}
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

            <label className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-2.5 ${isCustomFabrication ? 'border-purple-500 bg-purple-50' : 'border-warm-border hover:border-gray-300'}`}>
              <input
                type="checkbox"
                checked={isCustomFabrication}
                onChange={(e) => setIsCustomFabrication(e.target.checked)}
                className="w-4 h-4 text-purple-500 rounded"
              />
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-charcoal-900">
                <Wrench className="w-3.5 h-3.5 text-purple-500" />
                <span>Custom Specs</span>
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
            Product Images Management (Cloudinary & Web Image URLs)
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
          <Button
            type="submit"
            disabled={saving}
            variant="primary"
            size="lg"
            fullWidth
            icon={<Save className="w-4 h-4" />}
          >
            {saving ? 'Saving to Database...' : 'Save Product to Supabase Database'}
          </Button>
        </div>

      </form>
    </div>
  );
};
