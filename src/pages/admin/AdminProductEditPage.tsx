import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Sparkles, Star, Flame, TrendingUp, Wrench, CheckCircle2, Package, Eye } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { NotificationModal } from '../../components/common/NotificationModal';
import { INITIAL_CATEGORIES } from '../../lib/supabase';
import { fetchProductById, saveProductToStore } from '../../lib/productsStore';
import { fetchActiveCategories } from '../../lib/categoriesStore';
import { Category, Product } from '../../types';

export const AdminProductEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const isEdit = Boolean(id && id !== 'new');

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [savedProductId, setSavedProductId] = useState<string>('');

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
  const [pricingType, setPricingType] = useState<'fixed' | 'weight' | 'sqft'>('weight');
  const [pricePerKg, setPricePerKg] = useState<number>(160);
  const [pricePerSqft, setPricePerSqft] = useState<number>(150);

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

  // Custom Notification Modal State
  const [notifyModal, setNotifyModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'error' | 'warning' | 'success' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning'
  });

  useEffect(() => {
    loadCategories();
    if (isEdit && id) {
      loadProductForEdit(id);
    }
  }, [id, isEdit]);

  const loadCategories = async () => {
    const liveCats = await fetchActiveCategories();
    if (liveCats.length > 0) {
      setCategories(liveCats);
      setCategorySlug(liveCats[0].slug);
      setCategoryId(liveCats[0].id);
      setCategoryName(liveCats[0].name_en);
    }
  };

  const loadProductForEdit = async (prodId: string) => {
    setLoading(true);
    const existing = await fetchProductById(prodId);
    if (existing) {
      setNameEn(existing.name_en || '');
      setNameTa(existing.name_ta || '');
      setDescEn(existing.description_en || '');
      setDescTa(existing.description_ta || '');
      setCategoryId(existing.category_id || '');
      setCategoryName(existing.category_name || 'General');
      setMaterials(existing.materials || '');
      setAvailableSizes(existing.available_sizes || '');
      setAdminPrice(existing.admin_price || 0);
      setPricingType(existing.pricing_type || 'weight');
      setPricePerKg(existing.price_per_kg || 160);
      setPricePerSqft(existing.price_per_sqft || 150);
      setIsBestSelling(existing.is_best_selling || false);
      setIsNew(existing.is_new !== false);
      setIsFeatured(existing.is_featured !== false);
      setIsPopular(existing.is_popular || false);
      setIsCustomFabrication(existing.is_custom_fabrication !== false);
      setIsInStock(existing.is_in_stock !== false);
      if (existing.images && existing.images.length > 0) {
        setImages(existing.images);
      } else if (existing.primary_image) {
        setImages([existing.primary_image]);
      }
    }
    setLoading(false);
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
    if (!nameEn.trim()) {
      setNotifyModal({
        isOpen: true,
        title: 'Product Name Required',
        message: 'Please enter product English name before saving.',
        type: 'warning'
      });
      return;
    }
    setSaving(true);

    const productId = isEdit && id ? id : crypto.randomUUID();
    const primaryImg = images[0] || 'https://images.unsplash.com/photo-1580481072645-022f9a6d1270?w=800&auto=format&fit=crop&q=80';

    const selectedCat = categories.find((c) => c.slug === categorySlug) || categories[0];
    const targetCategoryId = selectedCat?.id || '11111111-1111-1111-1111-111111111111';
    const targetCategoryName = selectedCat?.name_en || 'Steel Chairs';

    const productPayload: Product = {
      id: productId,
      category_id: targetCategoryId,
      category_name: targetCategoryName,
      name_en: nameEn.trim(),
      name_ta: nameTa.trim() || nameEn.trim(),
      description_en: descEn.trim(),
      description_ta: descTa.trim() || descEn.trim(),
      materials: materials.trim(),
      available_sizes: availableSizes.trim(),
      specifications: {
        'Gauge': '16 Gauge SS',
        'Finish': 'Mirror Polish',
        'Warranty': '5 Years Structural Warranty'
      },
      is_best_selling: isBestSelling,
      is_new: isNew,
      is_active: true,
      admin_price: adminPrice,
      pricing_type: pricingType,
      price_per_kg: pricePerKg,
      price_per_sqft: pricePerSqft,
      primary_image: primaryImg,
      images: images,
      created_at: new Date().toISOString()
    };

    // Save to Store (Unified Supabase DB + Local Backup Store)
    await saveProductToStore(productPayload);

    setSavedProductId(productId);
    setSaving(false);
    setShowSuccessCard(true);
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
      
      {/* Success Card Modal Overlay with Direct Product Page Links */}
      {showSuccessCard && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full border-2 border-emerald-500 shadow-2xl text-center space-y-5 animate-bounce-subtle">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-300 shadow-md">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-charcoal-900">
                Product {isEdit ? 'Updated' : 'Added'} Successfully!
              </h3>
              <p className="text-xs text-emerald-800 font-bold">
                Item has been saved to Manikandan Lathe shop catalogue.
              </p>
            </div>

            {/* Direct Action Links */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                to={`/products/${savedProductId || (isEdit ? id : '')}`}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-extrabold py-3 px-4 rounded-2xl text-xs shadow-md transition-all"
              >
                <Eye className="w-4 h-4" />
                <span>Open Product Page</span>
              </Link>

              <Link
                to="/admin/products"
                className="flex-1 inline-flex items-center justify-center gap-2 bg-charcoal-900 hover:bg-black text-white font-extrabold py-3 px-4 rounded-2xl text-xs shadow-md transition-all"
              >
                <Package className="w-4 h-4" />
                <span>Go to Inventory</span>
              </Link>
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
              placeholder="e.g. Heavy Duty Steel Chair"
              className="w-full px-3.5 py-2.5 text-sm font-bold border border-warm-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-charcoal-700 mb-1">Product Name (தமிழ்)</label>
            <input
              type="text"
              value={nameTa}
              onChange={(e) => setNameTa(e.target.value)}
              placeholder="e.g. ஹெவி டியூட்டி ஸ்டீல் நாற்காலி"
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

          {pricingType === 'fixed' ? (
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
          ) : (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs font-bold text-amber-800 flex items-center justify-center">
              <span>⚖️ Price calculated dynamically via Rate Per {pricingType === 'weight' ? 'KG (₹/kg)' : 'SqFt (₹/sqft)'}</span>
            </div>
          )}
        </div>

        {/* Pricing Type & Unit Rates Configuration */}
        <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 space-y-3">
          <label className="block text-xs font-extrabold text-charcoal-900 uppercase tracking-wider">
            Pricing Calculation Type for this Product
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setPricingType('weight')}
              className={`p-3 rounded-xl border-2 text-xs font-black transition-all flex flex-col items-center gap-1 ${
                pricingType === 'weight'
                  ? 'border-brand-600 bg-brand-50 text-brand-700'
                  : 'border-warm-border bg-white text-charcoal-600 hover:border-gray-300'
              }`}
            >
              <span>⚖️ Per KG Weight</span>
              <span className="text-[10px] font-bold text-charcoal-500">e.g. Gates, Heavy Grills</span>
            </button>

            <button
              type="button"
              onClick={() => setPricingType('sqft')}
              className={`p-3 rounded-xl border-2 text-xs font-black transition-all flex flex-col items-center gap-1 ${
                pricingType === 'sqft'
                  ? 'border-brand-600 bg-brand-50 text-brand-700'
                  : 'border-warm-border bg-white text-charcoal-600 hover:border-gray-300'
              }`}
            >
              <span>📐 Per SqFt Area</span>
              <span className="text-[10px] font-bold text-charcoal-500">e.g. Rolling Shutters, Windows</span>
            </button>

            <button
              type="button"
              onClick={() => setPricingType('fixed')}
              className={`p-3 rounded-xl border-2 text-xs font-black transition-all flex flex-col items-center gap-1 ${
                pricingType === 'fixed'
                  ? 'border-brand-600 bg-brand-50 text-brand-700'
                  : 'border-warm-border bg-white text-charcoal-600 hover:border-gray-300'
              }`}
            >
              <span>🏷️ Fixed Unit Price</span>
              <span className="text-[10px] font-bold text-charcoal-500">e.g. Standard Chairs, Tables</span>
            </button>
          </div>

          {pricingType === 'weight' && (
            <div className="pt-2">
              <label className="block text-xs font-bold text-charcoal-700 mb-1">Rate Per KG (₹/kg)</label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-charcoal-700">₹</span>
                <input
                  type="number"
                  value={pricePerKg}
                  onChange={(e) => setPricePerKg(parseFloat(e.target.value) || 0)}
                  placeholder="160"
                  className="w-full px-3.5 py-2 text-sm font-extrabold border border-warm-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <span className="text-xs font-bold text-charcoal-500 shrink-0">per kg</span>
              </div>
              <p className="text-[11px] text-charcoal-500 font-medium mt-1">Default shop rate is ₹160/kg. You can customize per product.</p>
            </div>
          )}

          {pricingType === 'sqft' && (
            <div className="pt-2">
              <label className="block text-xs font-bold text-charcoal-700 mb-1">Rate Per Square Feet (₹/sqft)</label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-charcoal-700">₹</span>
                <input
                  type="number"
                  value={pricePerSqft}
                  onChange={(e) => setPricePerSqft(parseFloat(e.target.value) || 0)}
                  placeholder="150"
                  className="w-full px-3.5 py-2 text-sm font-extrabold border border-warm-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <span className="text-xs font-bold text-charcoal-500 shrink-0">per sqft</span>
              </div>
              <p className="text-[11px] text-charcoal-500 font-medium mt-1">Default rate per sqft is ₹150. You can customize per product.</p>
            </div>
          )}
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
            Product Display Flags & Pricing Badges
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <label className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-2.5 ${pricingType === 'weight' ? 'border-brand-600 bg-brand-50' : 'border-warm-border hover:border-gray-300'}`}>
              <input
                type="checkbox"
                checked={pricingType === 'weight'}
                onChange={() => setPricingType('weight')}
                className="w-4 h-4 text-brand-600 rounded"
              />
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-charcoal-900">
                <span>⚖️ Weight Based</span>
              </div>
            </label>

            <label className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-2.5 ${pricingType === 'sqft' ? 'border-brand-600 bg-brand-50' : 'border-warm-border hover:border-gray-300'}`}>
              <input
                type="checkbox"
                checked={pricingType === 'sqft'}
                onChange={() => setPricingType('sqft')}
                className="w-4 h-4 text-brand-600 rounded"
              />
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-charcoal-900">
                <span>📐 SqFt Based</span>
              </div>
            </label>

            <label className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-2.5 ${pricingType === 'fixed' ? 'border-brand-600 bg-brand-50' : 'border-warm-border hover:border-gray-300'}`}>
              <input
                type="checkbox"
                checked={pricingType === 'fixed'}
                onChange={() => setPricingType('fixed')}
                className="w-4 h-4 text-brand-600 rounded"
              />
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-charcoal-900">
                <span>🏷️ Fixed Price</span>
              </div>
            </label>

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
                  setNotifyModal({
                    isOpen: true,
                    title: 'Image Uploaded',
                    message: 'Image uploaded to Cloudinary successfully!',
                    type: 'success'
                  });
                } catch (err) {
                  setNotifyModal({
                    isOpen: true,
                    title: 'Image URL Fallback',
                    message: 'Cloudinary upload fallback: Please paste web image URL.',
                    type: 'info'
                  });
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
            {saving ? 'Saving Product...' : 'Save Product to Catalogue'}
          </Button>
        </div>

      </form>

      <NotificationModal
        isOpen={notifyModal.isOpen}
        onClose={() => setNotifyModal((prev) => ({ ...prev, isOpen: false }))}
        title={notifyModal.title}
        message={notifyModal.message}
        type={notifyModal.type}
      />

    </div>
  );
};
