import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wrench,
  ArrowLeft,
  Phone,
  CheckCircle2,
  Camera,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_SHOP_INFO, supabase } from '../lib/supabase';
import { uploadFileToCloudinary } from '../lib/cloudinary';
import { getNextRepairTicketId } from '../lib/idGenerator';
import { fetchActiveCategories, getCachedCategories } from '../lib/categoriesStore';

export const RepairServicePage: React.FC = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isTamil = language === 'ta';

  // Admin-created categories with instant cache hydration
  const [categories, setCategories] = useState<any[]>(() => getCachedCategories());

  // Form state
  const [selectedService, setSelectedService] = useState(() => {
    const cached = getCachedCategories();
    return cached.length > 0 ? String(cached[0].id) : '';
  });
  const [urgency, setUrgency] = useState<'normal' | 'urgent' | 'emergency'>('urgent');
  const [guestPhone, setGuestPhone] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Success popup state
  const [submittedTicketId, setSubmittedTicketId] = useState<string | null>(null);

  const customerName = user?.full_name?.trim() || 'Customer';
  const customerPhone = user?.phone?.trim() || guestPhone.trim();
  const customerLocation = user?.city_area?.trim() || 'Kallimandhayam';

  useEffect(() => {
    fetchActiveCategories().then((cats) => {
      setCategories(cats);
      if (cats.length > 0) {
        setSelectedService(String(cats[0].id));
      }
    });
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (photos.length >= 5) {
      alert(isTamil ? 'அதிகபட்சம் 5 புகைப்படங்கள்' : 'Maximum 5 photos allowed');
      return;
    }
    setUploading(true);
    try {
      const file = files[0];
      const result = await uploadFileToCloudinary(file);
      setPhotos((prev) => [...prev, result.url]);
    } catch {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setPhotos((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemovePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerPhone) {
      alert(isTamil ? 'தயவுசெய்து உங்கள் மொபைல் எண்ணை உள்ளிடவும்' : 'Please provide a contact phone number');
      return;
    }

    setSubmitting(true);

    // Resolve category name from fetched categories
    const selectedCat = categories.find((c: any) => String(c.id) === selectedService) || categories[0];
    const serviceTitle = selectedCat
      ? (isTamil ? (selectedCat.name_ta || selectedCat.name_en) : selectedCat.name_en)
      : 'General Repair';

    const ticketId = await getNextRepairTicketId();

    const repairPayload = {
      id: crypto.randomUUID(),
      enquiry_number: ticketId,
      user_id: user?.id || `guest_${Date.now()}`,
      customer_name: customerName,
      customer_phone: customerPhone,
      delivery_location: customerLocation,
      product_name: `[REPAIR SERVICE] ${serviceTitle}`,
      quantity: 1,
      size_requirement: `Urgency: ${urgency.toUpperCase()}`,
      custom_notes: description.trim() || 'Broken part needs inspection & estimate',
      images: photos,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    try {
      await supabase.from('enquiries').insert(repairPayload);
    } catch (dbErr) {
      console.warn('Repair enquiry DB fallback:', dbErr);
    }

    try {
      await supabase.from('notifications').insert({
        id: crypto.randomUUID(),
        user_id: user?.id || 'admin',
        title_en: `New Repair Request: #${ticketId}`,
        title_ta: `புதிய பழுது கோரிக்கை: #${ticketId}`,
        message_en: `${customerName} requested repair for ${serviceTitle}.`,
        message_ta: `${customerName} ${serviceTitle} பழுது வேலைக்கு கோரிக்கை விடுத்துள்ளார்.`,
        type: 'enquiry',
        link: '/admin/repairs',
        is_read: false,
        created_at: new Date().toISOString(),
      });
    } catch {}

    try {
      const local = JSON.parse(localStorage.getItem('ml_enquiries') || '[]');
      local.unshift(repairPayload);
      localStorage.setItem('ml_enquiries', JSON.stringify(local));
    } catch {}

    setSubmitting(false);
    setSubmittedTicketId(ticketId);

    // Reset form
    setDescription('');
    setPhotos([]);
    if (categories.length > 0) setSelectedService(String(categories[0].id));
    setUrgency('urgent');
  };

  return (
    <div className="min-h-screen bg-warm-bg pb-24 md:pb-12 pt-4">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-4">

        {/* Top Header Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 p-2 text-charcoal-700 bg-white rounded-full border border-warm-border shadow-sm hover:bg-warm-bg transition-colors text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4 text-brand-600" />
            <span>{isTamil ? 'பின்னே' : 'Back'}</span>
          </button>

          <a
            href={`tel:${DEFAULT_SHOP_INFO.phone}`}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-brand-50 text-brand-700 font-extrabold px-3.5 py-1.5 rounded-full border border-warm-border text-xs transition-colors shadow-xs"
          >
            <Phone className="w-3.5 h-3.5 text-brand-600" />
            <span>{DEFAULT_SHOP_INFO.phone}</span>
          </a>
        </div>

        {/* Page Title */}
        <div className="bg-white p-4 rounded-3xl border border-warm-border shadow-card">
          <h1 className="text-base sm:text-lg font-black text-charcoal-900 leading-tight">
            {isTamil ? 'லேத் & ARC பழுது பார்க்கும் சேவை' : 'Machining & ARC Repair Service'}
          </h1>
          <p className="text-[11px] text-charcoal-500 font-medium mt-0.5">
            {isTamil ? 'பழுது விபரங்களை பதிவு செய்து உடனடி மதிப்பீட்டைப் பெறுங்கள்' : 'Submit broken parts details for instant workshop quote'}
          </p>
        </div>

        {/* Authenticated Customer Info Card */}
        {user && (
          <div className="bg-brand-50/70 rounded-2xl p-3.5 border border-brand-200 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-brand-600 text-white font-black flex items-center justify-center text-xs shrink-0 shadow-xs">
                {(user.full_name || 'C').charAt(0).toUpperCase()}
              </div>
              <div className="truncate">
                <span className="font-extrabold text-charcoal-900 block truncate">
                  {user.full_name || 'Customer'}
                </span>
                <span className="text-[11px] text-charcoal-500 font-mono font-semibold">
                  {user.phone || user.email}
                </span>
              </div>
            </div>
            <span className="bg-brand-100 text-brand-800 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border border-brand-300 shrink-0">
              {isTamil ? 'சரிபார்க்கப்பட்டது' : 'Verified'}
            </span>
          </div>
        )}

        {/* REPAIR REQUEST FORM */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-5 sm:p-6 border border-warm-border shadow-card space-y-5 animate-fade-in">

          {/* Contact Phone if missing in profile */}
          {(!user || !user.phone) && (
            <div>
              <label className="block text-xs font-black text-charcoal-900 uppercase tracking-wider mb-1.5">
                {isTamil ? 'உங்கள் மொபைல் எண் *' : 'Your Contact Number *'}
              </label>
              <input
                type="tel"
                required
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                placeholder="+91 96592 86268"
                className="w-full px-3.5 py-2.5 text-xs font-extrabold border border-warm-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono shadow-xs"
              />
            </div>
          )}

          {/* 1. CATEGORY — fetched from admin Supabase categories */}
          <div className="space-y-2">
            <label className="block text-xs font-black text-charcoal-900 uppercase tracking-wider">
              1. {isTamil ? 'பழுது வகை தேர்வு' : 'Select Repair Category'}
            </label>

            {categories.length === 0 ? (
              <div className="flex items-center gap-4 overflow-x-auto pb-2 pt-1 scrollbar-none">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="shrink-0 flex flex-col items-center gap-2">
                    <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-warm-bg border border-warm-border animate-pulse" />
                    <div className="w-14 h-3 bg-warm-bg rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-start gap-3 sm:gap-4 overflow-x-auto pb-3 pt-1 scrollbar-none snap-x snap-mandatory -mx-2 px-2 sm:mx-0 sm:px-0">
                {categories.map((cat: any) => {
                  const catId = String(cat.id);
                  const isSelected = selectedService === catId;
                  const catName = isTamil ? (cat.name_ta || cat.name_en) : cat.name_en;
                  const catImage = cat.image_url || cat.primary_image || '';
                  return (
                    <button
                      key={catId}
                      type="button"
                      onClick={() => setSelectedService(catId)}
                      className="snap-start shrink-0 flex flex-col items-center text-center group cursor-pointer w-20 sm:w-22 focus:outline-none transition-transform active:scale-95"
                    >
                      {/* Perfect Circle Avatar with Active Border / Badge */}
                      <div className={`w-18 h-18 sm:w-20 sm:h-20 aspect-square rounded-full overflow-hidden transition-all duration-300 relative flex items-center justify-center bg-brand-50 border-2 ${
                        isSelected
                          ? 'border-brand-600 ring-4 ring-brand-500/30 shadow-lg scale-105 bg-brand-100'
                          : 'border-warm-border hover:border-brand-300 shadow-xs'
                      }`}>
                        {catImage ? (
                          <img src={catImage} alt={catName} className="w-full h-full rounded-full object-cover group-hover:scale-108 transition-transform duration-300" />
                        ) : (
                          <Wrench className={`w-7 h-7 ${isSelected ? 'text-brand-600' : 'text-charcoal-500'}`} />
                        )}
                        {isSelected && (
                          <div className="absolute top-0.5 right-0.5 w-5 h-5 bg-brand-600 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-black shadow-sm">
                            ✓
                          </div>
                        )}
                      </div>
                      <span className={`mt-2 text-[11px] sm:text-xs font-black line-clamp-2 leading-tight text-center max-w-[80px] sm:max-w-[88px] ${
                        isSelected ? 'text-brand-700' : 'text-charcoal-800 group-hover:text-brand-600'
                      }`}>
                        {catName}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. URGENCY */}
          <div className="space-y-2">
            <label className="block text-xs font-black text-charcoal-900 uppercase tracking-wider">
              2. {isTamil ? 'தேவைப்படும் காலம்' : 'Urgency'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'normal', label_en: 'Standard (2-3 Days)', label_ta: 'சாதாரணம்' },
                { id: 'urgent', label_en: 'Urgent (24h)', label_ta: 'அவசரம் (24h)' },
                { id: 'emergency', label_en: 'Same Day', label_ta: 'இன்றே தேவை' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setUrgency(item.id as any)}
                  className={`py-2 px-2 text-center rounded-xl border text-xs font-black transition-all ${
                    urgency === item.id
                      ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                      : 'bg-warm-bg text-charcoal-700 border-warm-border hover:bg-brand-50'
                  }`}
                >
                  {isTamil ? item.label_ta : item.label_en}
                </button>
              ))}
            </div>
          </div>

          {/* 3. ISSUE DESCRIPTION */}
          <div className="space-y-2">
            <label className="block text-xs font-black text-charcoal-900 uppercase tracking-wider">
              3. {isTamil ? 'பழுது விபரம்' : 'Issue Description'}
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                isTamil
                  ? 'எ.கா: டிராக்டர் ஷாப்ட் வளைவு, மோட்டார் உடைந்துள்ளது...'
                  : 'e.g., Tractor shaft bent, motor shaft broken, pump seized...'
              }
              className="w-full px-3.5 py-2.5 text-xs font-medium border border-warm-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none leading-relaxed shadow-inner"
            />
          </div>

          {/* 4. PHOTO UPLOAD */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black text-charcoal-900 uppercase tracking-wider">
                4. {isTamil ? 'புகைப்படம் (விரும்பினால்)' : 'Photos (Optional)'}
              </label>
              <span className="text-[10px] text-charcoal-400 font-bold">{photos.length}/5</span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {photos.length < 5 && (
                <label className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-warm-bg hover:bg-brand-50 border border-dashed border-brand-400 text-brand-700 text-xs font-extrabold cursor-pointer transition-colors">
                  <Camera className="w-3.5 h-3.5 text-brand-600" />
                  <span>{uploading ? '...' : (isTamil ? 'போட்டோ சேர்' : 'Add Photo')}</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    disabled={uploading}
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              )}

              {photos.map((url, idx) => (
                <div key={idx} className="relative w-14 h-14 rounded-xl overflow-hidden border border-warm-border shadow-xs">
                  <img src={url} alt={`Part ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    className="absolute top-0.5 right-0.5 bg-rose-600 text-white p-0.5 rounded-full shadow-md hover:bg-rose-700"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* SUBMIT */}
          <div className="pt-1">
            <Button
              type="submit"
              disabled={submitting || !selectedService}
              variant="primary"
              fullWidth
              size="lg"
              icon={<Wrench className="w-4 h-4" />}
              className="py-3.5 text-xs sm:text-sm font-black rounded-2xl shadow-md bg-brand-600 hover:bg-brand-700 text-white"
            >
              {submitting
                ? (isTamil ? 'பதிவு செய்யப்படுகிறது...' : 'Submitting...')
                : (isTamil ? 'பழுது கோரிக்கை அனுப்புக' : 'Submit Repair Request')}
            </Button>
          </div>
        </form>

      </div>

      {/* SUCCESS POPUP OVERLAY */}
      {submittedTicketId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-sm shadow-2xl border border-warm-border space-y-5 animate-slide-up">

            {/* Success Icon */}
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-300 shadow-sm">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="text-center space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-300 inline-block font-mono">
                #{submittedTicketId}
              </span>
              <h2 className="text-lg font-black text-charcoal-900">
                {isTamil ? 'கோரிக்கை பதிவு செய்யப்பட்டது!' : 'Request Submitted!'}
              </h2>
              <p className="text-xs text-charcoal-500 font-medium">
                {isTamil
                  ? 'உங்கள் கோரிக்கையை என்குரி பக்கத்தில் கண்காணிக்கலாம்.'
                  : 'Your repair request is submitted. Track it in My Orders → Enquiries tab.'}
              </p>
            </div>

            {/* View in Enquiries */}
            <button
              onClick={() => {
                setSubmittedTicketId(null);
                navigate('/orders');
              }}
              className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-extrabold py-3.5 px-5 rounded-2xl text-sm shadow-md transition-all active:scale-98"
            >
              <ExternalLink className="w-4 h-4" />
              <span>{isTamil ? 'என் என்குரிகளை பார்க்க' : 'View in My Enquiries'}</span>
            </button>

            <button
              onClick={() => setSubmittedTicketId(null)}
              className="w-full py-2.5 text-xs font-bold text-charcoal-500 hover:text-charcoal-800 transition-colors"
            >
              {isTamil ? 'இங்கே தங்கு' : 'Submit Another Request'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepairServicePage;
