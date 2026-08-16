import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Sparkles, Star, Flame, TrendingUp, Wrench, CheckCircle2, Package, Eye, ThumbsUp, ShieldCheck } from 'lucide-react';
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
  const [uploadProgress, setUploadProgress] = useState<number | null>(null); // null = idle, 0-100 = uploading
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [savedProductId, setSavedProductId] = useState<string>('');

  // Form Fields
  const [nameEn, setNameEn] = useState('');
  const [nameTa, setNameTa] = useState('');
  const [descEn, setDescEn] = useState('');
  const [descTa, setDescTa] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categorySlug, setCategorySlug] = useState('gates');
  const [categoryName, setCategoryName] = useState('Gates');
  const [materials, setMaterials] = useState('');
  const [availableSizes, setAvailableSizes] = useState('');
  const [gauge, setGauge] = useState('');
  const [finish, setFinish] = useState('');
  const [warranty, setWarranty] = useState('');
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
      // Only set default category for NEW products, not edits (edit loader sets its own)
      if (!isEdit) {
        setCategorySlug(liveCats[0].slug);
        setCategoryId(liveCats[0].id);
        setCategoryName(liveCats[0].name_en);
      }
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

      // Pre-select correct category slug from category_id
      const liveCats = await fetchActiveCategories();
      if (liveCats.length > 0) {
        setCategories(liveCats);
        const matchedCat = liveCats.find((c) => c.id === existing.category_id);
        if (matchedCat) {
          setCategorySlug(matchedCat.slug);
          setCategoryId(matchedCat.id);
          setCategoryName(matchedCat.name_en);
        }
      }

      setMaterials(existing.materials || '');
      setAvailableSizes(existing.available_sizes || '');
      if (existing.specifications) {
        setGauge(existing.specifications['Gauge'] || existing.specifications['gauge'] || '');
        setFinish(existing.specifications['Finish'] || existing.specifications['finish'] || '');
        setWarranty(existing.specifications['Warranty'] || existing.specifications['warranty'] || '');
      } else {
        setGauge('');
        setFinish('');
        setWarranty('');
      }
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

    const specObj: Record<string, string> = {};
    if (gauge.trim()) specObj['Gauge'] = gauge.trim();
    if (finish.trim()) specObj['Finish'] = finish.trim();
    if (warranty.trim()) specObj['Warranty'] = warranty.trim();

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
      specifications: specObj,
      is_best_selling: isBestSelling,
      is_new: isNew,
      is_featured: isFeatured,
      is_popular: isPopular,
      is_custom_fabrication: isCustomFabrication,
      is_in_stock: isInStock,
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



        {/* Pricing Calculation Mode */}
        <div className="space-y-3 pt-4 border-t border-warm-muted">
          <label className="block text-xs font-extrabold text-charcoal-900 uppercase tracking-wider">
            Pricing Calculation Mode
          </label>

          <div className="grid grid-cols-3 gap-3">
            <label className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-center gap-2 ${pricingType === 'weight' ? 'border-brand-600 bg-brand-50 text-brand-900 shadow-sm' : 'border-warm-border hover:border-gray-300 text-charcoal-700'}`}>
              <input
                type="radio"
                name="pricingType"
                checked={pricingType === 'weight'}
                onChange={() => setPricingType('weight')}
                className="w-4 h-4 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-xs font-extrabold">⚖️ Weight Based</span>
            </label>

            <label className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-center gap-2 ${pricingType === 'sqft' ? 'border-brand-600 bg-brand-50 text-brand-900 shadow-sm' : 'border-warm-border hover:border-gray-300 text-charcoal-700'}`}>
              <input
                type="radio"
                name="pricingType"
                checked={pricingType === 'sqft'}
                onChange={() => setPricingType('sqft')}
                className="w-4 h-4 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-xs font-extrabold">📐 SqFt Based</span>
            </label>

            <label className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-center gap-2 ${pricingType === 'fixed' ? 'border-brand-600 bg-brand-50 text-brand-900 shadow-sm' : 'border-warm-border hover:border-gray-300 text-charcoal-700'}`}>
              <input
                type="radio"
                name="pricingType"
                checked={pricingType === 'fixed'}
                onChange={() => setPricingType('fixed')}
                className="w-4 h-4 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-xs font-extrabold">🏷️ Fixed Price</span>
            </label>
          </div>
        </div>

        {/* Product Display Flags & Badges Section */}
        <div className="space-y-4 pt-4 border-t border-warm-muted">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-extrabold text-charcoal-900 uppercase tracking-wider">
              Product Display Flags & Pill Badges
            </label>
            <span className="text-[11px] font-bold text-brand-600">Select active badges</span>
          </div>

          {/* LIVE BADGES PREVIEW BOX */}
          <div className="bg-warm-bg p-4 rounded-2xl border border-warm-border space-y-2">
            <span className="text-[10px] font-extrabold text-charcoal-500 uppercase tracking-widest block">
              LIVE PREVIEW (How badges look on Product Detail Page):
            </span>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-black text-brand-700 uppercase tracking-wider bg-orange-100 px-3.5 py-1 rounded-full border border-orange-200 shadow-sm">
                {categoryName.toUpperCase()}
              </span>

              {isNew && (
                <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-xs font-extrabold px-3.5 py-1 rounded-full border border-emerald-300 shadow-sm animate-fadeIn">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>New Design</span>
                </span>
              )}

              {isFeatured && (
                <span className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-800 text-xs font-extrabold px-3.5 py-1 rounded-full border border-purple-300 shadow-sm animate-fadeIn">
                  <ThumbsUp className="w-3.5 h-3.5 text-purple-600" />
                  <span>Featured Product</span>
                </span>
              )}

              {isCustomFabrication && (
                <span className="inline-flex items-center gap-1.5 bg-orange-100 text-orange-800 text-xs font-extrabold px-3.5 py-1 rounded-full border border-orange-300 shadow-sm animate-fadeIn">
                  <Wrench className="w-3.5 h-3.5 text-orange-600" />
                  <span>Custom Dimensions Accepted</span>
                </span>
              )}

              {isInStock && (
                <span className="inline-flex items-center gap-1.5 bg-teal-100 text-teal-800 text-xs font-extrabold px-3.5 py-1 rounded-full border border-teal-300 shadow-sm animate-fadeIn">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                  <span>In Stock</span>
                </span>
              )}

              {isBestSelling && (
                <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 text-xs font-extrabold px-3.5 py-1 rounded-full border border-amber-300 shadow-sm animate-fadeIn">
                  <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                  <span>Best Selling Design</span>
                </span>
              )}

              {isPopular && (
                <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-800 text-xs font-extrabold px-3.5 py-1 rounded-full border border-blue-300 shadow-sm animate-fadeIn">
                  <Flame className="w-3.5 h-3.5 text-blue-600" />
                  <span>Popular Design</span>
                </span>
              )}
            </div>
          </div>

          {/* Interactive Flag Controls Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            
            {/* 1. New Arrival */}
            <label className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 ${isNew ? 'border-emerald-500 bg-emerald-50/70 shadow-sm' : 'border-warm-border bg-white hover:border-gray-300'}`}>
              <input
                type="checkbox"
                checked={isNew}
                onChange={(e) => setIsNew(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
              <div className="flex items-center gap-2 text-xs font-extrabold text-charcoal-900">
                <span className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-300 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </span>
                <div>
                  <span className="block">New Design</span>
                  <span className="text-[10px] text-charcoal-500 font-medium">Show green New badge</span>
                </div>
              </div>
            </label>

            {/* 2. Featured Product */}
            <label className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 ${isFeatured ? 'border-purple-500 bg-purple-50/70 shadow-sm' : 'border-warm-border bg-white hover:border-gray-300'}`}>
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
              <div className="flex items-center gap-2 text-xs font-extrabold text-charcoal-900">
                <span className="w-7 h-7 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center border border-purple-300 shrink-0">
                  <ThumbsUp className="w-4 h-4" />
                </span>
                <div>
                  <span className="block">Featured Product</span>
                  <span className="text-[10px] text-charcoal-500 font-medium">Show purple Featured badge</span>
                </div>
              </div>
            </label>

            {/* 3. Custom Dimensions Accepted */}
            <label className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 ${isCustomFabrication ? 'border-orange-500 bg-orange-50/70 shadow-sm' : 'border-warm-border bg-white hover:border-gray-300'}`}>
              <input
                type="checkbox"
                checked={isCustomFabrication}
                onChange={(e) => setIsCustomFabrication(e.target.checked)}
                className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
              />
              <div className="flex items-center gap-2 text-xs font-extrabold text-charcoal-900">
                <span className="w-7 h-7 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center border border-orange-300 shrink-0">
                  <Wrench className="w-4 h-4" />
                </span>
                <div>
                  <span className="block">Custom Dimensions</span>
                  <span className="text-[10px] text-charcoal-500 font-medium">Show orange Custom badge</span>
                </div>
              </div>
            </label>

            {/* 4. In Stock */}
            <label className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 ${isInStock ? 'border-teal-500 bg-teal-50/70 shadow-sm' : 'border-warm-border bg-white hover:border-gray-300'}`}>
              <input
                type="checkbox"
                checked={isInStock}
                onChange={(e) => setIsInStock(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
              />
              <div className="flex items-center gap-2 text-xs font-extrabold text-charcoal-900">
                <span className="w-7 h-7 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center border border-teal-300 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </span>
                <div>
                  <span className="block">In Stock</span>
                  <span className="text-[10px] text-charcoal-500 font-medium">Show teal In Stock badge</span>
                </div>
              </div>
            </label>

            {/* 5. Best Selling Design */}
            <label className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 ${isBestSelling ? 'border-amber-500 bg-amber-50/70 shadow-sm' : 'border-warm-border bg-white hover:border-gray-300'}`}>
              <input
                type="checkbox"
                checked={isBestSelling}
                onChange={(e) => setIsBestSelling(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
              />
              <div className="flex items-center gap-2 text-xs font-extrabold text-charcoal-900">
                <span className="w-7 h-7 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center border border-amber-300 shrink-0">
                  <Star className="w-4 h-4 fill-amber-500" />
                </span>
                <div>
                  <span className="block">Best Selling</span>
                  <span className="text-[10px] text-charcoal-500 font-medium">Show amber Star badge</span>
                </div>
              </div>
            </label>

            {/* 6. Popular Design */}
            <label className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 ${isPopular ? 'border-blue-500 bg-blue-50/70 shadow-sm' : 'border-warm-border bg-white hover:border-gray-300'}`}>
              <input
                type="checkbox"
                checked={isPopular}
                onChange={(e) => setIsPopular(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <div className="flex items-center gap-2 text-xs font-extrabold text-charcoal-900">
                <span className="w-7 h-7 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center border border-blue-300 shrink-0">
                  <Flame className="w-4 h-4" />
                </span>
                <div>
                  <span className="block">Popular Design</span>
                  <span className="text-[10px] text-charcoal-500 font-medium">Show blue Popular badge</span>
                </div>
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
            <div className="relative">
              <input
                type="file"
                accept="image/*,application/pdf"
                disabled={uploadProgress !== null}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploadProgress(0);
                  try {
                    const { uploadFileToCloudinary } = await import('../../lib/cloudinary');
                    const result = await uploadFileToCloudinary(file, (percent) => {
                      setUploadProgress(percent);
                    });
                    // For PDFs, store URL with a pdf: prefix so we can render correctly
                    const finalUrl = result.format === 'pdf' ? `pdf:${result.url}` : result.url;
                    setImages([...images, finalUrl]);
                    setUploadProgress(null);
                    setNotifyModal({
                      isOpen: true,
                      title: result.format === 'pdf' ? 'PDF Uploaded' : 'Image Uploaded',
                      message: `File uploaded to Cloudinary successfully!`,
                      type: 'success'
                    });
                  } catch (err: any) {
                    setUploadProgress(null);
                    setNotifyModal({
                      isOpen: true,
                      title: 'Upload Failed',
                      message: err?.message || 'Cloudinary upload failed. Ensure your upload preset is set to Unsigned.',
                      type: 'error'
                    });
                  }
                  // Reset input so same file can be re-selected after error
                  e.target.value = '';
                }}
                className="text-xs text-charcoal-600 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-brand-600 file:text-white hover:file:bg-brand-700 cursor-pointer disabled:opacity-50"
              />
              {uploadProgress !== null && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-brand-600 border-t-transparent shrink-0" />
                    <span className="text-xs font-bold text-brand-700">Uploading to Cloudinary... {uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-warm-border rounded-full h-1.5">
                    <div
                      className="bg-brand-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

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
            {images.map((img, idx) => {
              const isPdf = img.startsWith('pdf:');
              const displayUrl = isPdf ? img.replace(/^pdf:/, '') : img;
              const isPrimary = idx === 0;
              return (
                <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-warm-border shadow-sm group">
                  {isPdf ? (
                    <div className="w-full h-full bg-red-50 flex flex-col items-center justify-center text-red-600 border border-red-200">
                      <span className="text-2xl">📄</span>
                      <span className="text-[8px] font-bold text-red-700 mt-0.5">PDF</span>
                    </div>
                  ) : (
                    <img src={displayUrl} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />
                  )}
                  {isPrimary && (
                    <span className="absolute top-1 left-1 bg-brand-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">PRIMARY</span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
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
