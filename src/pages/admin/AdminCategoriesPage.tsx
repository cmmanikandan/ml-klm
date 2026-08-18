import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, CheckCircle2, Upload, Camera, AlertCircle } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { CircularImageCropModal } from '../../components/common/CircularImageCropModal';
import { Category } from '../../types';
import { fetchActiveCategories, saveCategoryToStore, deleteCategoryFromStore } from '../../lib/categoriesStore';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';

export const AdminCategoriesPage: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropObjectUrlRef = useRef<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [deleteTargetCat, setDeleteTargetCat] = useState<Category | null>(null);

  const [nameEn, setNameEn] = useState('');
  const [nameTa, setNameTa] = useState('');
  const [slug, setSlug] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Cropper Modal state
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [cropSourceImage, setCropSourceImage] = useState<string | null>(null);

  // File Validation Error Modal state
  const [invalidFileError, setInvalidFileError] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();

    return () => {
      // Cleanup any pending object URL on unmount
      if (cropObjectUrlRef.current) {
        URL.revokeObjectURL(cropObjectUrlRef.current);
        cropObjectUrlRef.current = null;
      }
    };
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
    setImageUrl('');
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

  const confirmDeleteCategory = async () => {
    if (!deleteTargetCat) return;
    await deleteCategoryFromStore(deleteTargetCat.id, deleteTargetCat.slug);
    showToast(`Category "${deleteTargetCat.name_en}" deleted successfully!`);
    setDeleteTargetCat(null);
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

  // Validate and load image file for cropper
  const processSelectedFile = (file: File) => {
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const validMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const fileName = file.name.toLowerCase();
    const isExtensionValid = validExtensions.some((ext) => fileName.endsWith(ext));
    const isMimeValid = validMimes.includes(file.type);

    if (!isExtensionValid && !isMimeValid) {
      setInvalidFileError('Please select a valid JPG, PNG, or WEBP image.');
      return;
    }

    // Clean up any previously created object URL
    if (cropObjectUrlRef.current) {
      URL.revokeObjectURL(cropObjectUrlRef.current);
      cropObjectUrlRef.current = null;
    }

    // Create a new object URL for the valid image file
    const newObjectUrl = URL.createObjectURL(file);
    cropObjectUrlRef.current = newObjectUrl;
    setCropSourceImage(newObjectUrl);
    setIsCropperOpen(true);
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    processSelectedFile(file);
    // Reset file input value so selecting the same file triggers change again
    e.target.value = '';
  };

  const handleCloseCropper = () => {
    if (cropObjectUrlRef.current) {
      URL.revokeObjectURL(cropObjectUrlRef.current);
      cropObjectUrlRef.current = null;
    }
    setCropSourceImage(null);
    setIsCropperOpen(false);
  };

  const handleCropComplete = (croppedUrl: string) => {
    setImageUrl(croppedUrl);
    handleCloseCropper();
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
                <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 shadow-xs bg-brand-50">
                  <img
                    src={cat.image_url || 'https://images.unsplash.com/photo-1580481072645-022f9a6d1270?w=600&auto=format&fit=crop&q=80'}
                    alt={cat.name_en}
                    className="w-full h-full object-cover"
                  />
                </div>
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
                  onClick={() => setDeleteTargetCat(cat)}
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

      {/* ADD / EDIT CATEGORY MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCat ? 'Edit Category' : 'Add Category'} maxWidth="sm">
        <form onSubmit={handleSave} className="space-y-4">
          
          {/* Category Image - Large Centered Circular Live Preview with Camera Overlay */}
          <div className="space-y-2 text-center pb-2">
            <label className="block text-xs font-black text-charcoal-800 uppercase tracking-wider">
              Category Image
            </label>

            {/* Circular Preview Container */}
            <div className="relative inline-block mx-auto group">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden shadow-xl bg-brand-50 cursor-pointer relative flex items-center justify-center transition-transform active:scale-95 border-2 border-brand-100"
                title="Click to choose and crop image"
              >
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Category Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-3 space-y-1">
                    <Upload className="w-8 h-8 text-brand-500 mx-auto" />
                    <span className="text-[10px] font-extrabold text-brand-700 block leading-tight">
                      Upload Image
                    </span>
                  </div>
                )}

                {/* Hover overlay hint */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-[11px] font-black uppercase tracking-wider bg-brand-600/90 px-2.5 py-1 rounded-full shadow-sm">
                    {imageUrl ? 'Change' : 'Upload'}
                  </span>
                </div>
              </div>

              {/* Camera Icon Badge Overlay at Bottom-Right */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-brand-600 hover:bg-brand-700 text-white border-2 border-white shadow-lg flex items-center justify-center transition-transform active:scale-90"
                title="Upload or Change Image"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Subtext and Change Image Button */}
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-black text-brand-600 hover:text-brand-700 hover:underline inline-flex items-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{imageUrl ? 'Change Image' : 'Select Category Image'}</span>
              </button>
              <p className="text-[10px] text-charcoal-400 font-semibold">
                1:1 circular crop preview • Matches website display
              </p>
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              onChange={handleImageFileUpload}
              className="hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-charcoal-700 mb-1">English Category Name *</label>
            <input
              type="text"
              required
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="e.g. Gates"
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

          <Button type="submit" variant="primary" fullWidth size="lg">
            Save Category
          </Button>
        </form>
      </Modal>

      {/* 1:1 CIRCULAR CROP & ADJUSTMENT MODAL */}
      <CircularImageCropModal
        isOpen={isCropperOpen}
        imageSrc={cropSourceImage}
        onClose={handleCloseCropper}
        onConfirmCrop={handleCropComplete}
        onSelectNewFile={processSelectedFile}
      />

      {/* INVALID FILE TYPE ALERT MODAL */}
      {invalidFileError && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-red-200 transform transition-all flex flex-col p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-charcoal-900 leading-tight">
                  Unable to load image
                </h3>
                <p className="text-xs text-charcoal-600 font-medium leading-relaxed">
                  {invalidFileError}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setInvalidFileError(null)}
              className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-black text-xs shadow-md transition-all active:scale-95"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* DELETE CATEGORY CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={Boolean(deleteTargetCat)}
        onClose={() => setDeleteTargetCat(null)}
        onConfirm={confirmDeleteCategory}
        title={`Delete Category "${deleteTargetCat?.name_en}"?`}
        message={`Are you sure you want to delete category "${deleteTargetCat?.name_en}" from the shop catalogue?`}
        confirmText="Delete Category"
        isDanger={true}
      />

    </div>
  );
};
