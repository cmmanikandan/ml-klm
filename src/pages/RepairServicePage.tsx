import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Wrench, 
  ArrowLeft, 
  Phone, 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  Clock, 
  Flame, 
  Camera, 
  Trash2, 
  MessageSquare, 
  User, 
  MapPin, 
  ExternalLink,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_SHOP_INFO, supabase } from '../lib/supabase';
import { uploadFileToCloudinary } from '../lib/cloudinary';
import { getNextRepairTicketId } from '../lib/idGenerator';

const EXPANDED_REPAIR_SERVICES = [
  {
    id: 'tractor_agri',
    icon: '🚜',
    title_en: 'Tractor & Agri Implements Repair',
    title_ta: 'டிராக்டர் & விவசாயக் கருவிகள் பழுது',
    desc_en: '7-Kallapai ploughs, rotavator hooks, cultivator shanks',
    desc_ta: '7-கலப்பை, ரொட்டவேட்டர் ஹூக், கல்டிவேட்டர் கம்பி வெல்டிங்',
  },
  {
    id: 'heavy_arc',
    icon: '🔥',
    title_en: 'Heavy ARC Welding & Gate/Grill Repair',
    title_ta: 'ஹெவி ARC வெல்டிங் & கிரில் கேட் பழுது',
    desc_en: 'Main entrance gates, safety grills, roofing trusses & crack patching',
    desc_ta: 'மெயின் கேட், சேஃப்டி கிரில், கூரை டிரஸ்கள் & விரிசல் வெல்டிங்',
  },
  {
    id: 'shaft_turning',
    icon: '⚙️',
    title_en: 'Shaft Turning & Precision Bushing',
    title_ta: 'துல்லியமான ஷாப்ட் டர்னிங் & புஷ் வேலை',
    desc_en: 'Precision OD/ID turning, threading & brass bush fitting',
    desc_ta: 'துல்லியமான லேத் டர்னிங், திரெடிங், பிராஸ் புஷ் அமைத்தல்',
  },
  {
    id: 'axle_keyway',
    icon: '📏',
    title_en: 'Axle Straightening & Keyway Cutting',
    title_ta: 'ஆக்சில் வளைவு நேராக்குதல் & கீவே வெட்டுதல்',
    desc_en: 'Hydraulic press alignment for bent axles & keyway slots',
    desc_ta: 'ஹைட்ராலிக் பிரஸ் மூலம் வளைவு நீக்குதல், கியர் கீவே ஸ்லாட்',
  },
  {
    id: 'motor_pump',
    icon: '⚡',
    title_en: 'Borewell Pump & Motor Machining',
    title_ta: 'போர்வெல் பம்ப் & மோட்டார் லேத் வேலை',
    desc_en: 'Submersible motor shaft repair, impeller facing & sleeving',
    desc_ta: 'சப்மெர்சிபிள் மோட்டார் ஷாப்ட் பழுது, இம்பெல்லர் ஃபேசிங்',
  },
  {
    id: 'custom_lathe',
    icon: '🛠️',
    title_en: 'All Custom Lathe & Industrial Repair',
    title_ta: 'இதர அனைத்து வகை லேத் & இயந்திர பழுது',
    desc_en: 'Industrial machinery, custom bracket cutting & fabrication',
    desc_ta: 'தொழிற்சாலை இயந்திரங்கள் & தனிப்பயன் லேத் வேலைகள்',
  },
];

export const RepairServicePage: React.FC = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isTamil = language === 'ta';

  const [selectedService, setSelectedService] = useState('tractor_agri');
  const [urgency, setUrgency] = useState<'normal' | 'urgent' | 'emergency'>('urgent');
  
  // Guest fallback phone only if not logged in
  const [guestPhone, setGuestPhone] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<any | null>(null);

  const customerName = user?.full_name?.trim() || 'Customer';
  const customerPhone = user?.phone?.trim() || guestPhone.trim();
  const customerLocation = user?.city_area?.trim() || 'Kallimandhayam';

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (photos.length >= 5) {
      alert(isTamil ? 'அதிகபட்சம் 5 புகைப்படங்கள் மட்டுமே பதிவேற்ற முடியும்' : 'Maximum 5 photos allowed');
      return;
    }

    setUploading(true);
    try {
      const file = files[0];
      const result = await uploadFileToCloudinary(file);
      setPhotos((prev) => [...prev, result.url]);
    } catch (err) {
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

    const serviceObj = EXPANDED_REPAIR_SERVICES.find((s) => s.id === selectedService) || EXPANDED_REPAIR_SERVICES[0];
    const serviceTitle = isTamil ? serviceObj.title_ta : serviceObj.title_en;
    
    // Generate guaranteed unique sequential ID like MNK-REP-1001
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
      custom_notes: `Scope: ${description.trim() || 'Broken part needs inspection & estimate'}. Photos: ${photos.length}`,
      images: photos,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    // 1. Insert into Supabase DB enquiries table
    try {
      await supabase.from('enquiries').insert(repairPayload);
    } catch (dbErr) {
      console.warn('Repair enquiry DB fallback:', dbErr);
    }

    // 2. Create in-app notification for admin and user
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
        created_at: new Date().toISOString()
      });
    } catch (notifErr) {
      console.warn('Notification insert fallback:', notifErr);
    }

    // 3. Save to LocalStorage enquiries for instant local UI sync
    try {
      const local = JSON.parse(localStorage.getItem('ml_enquiries') || '[]');
      local.unshift(repairPayload);
      localStorage.setItem('ml_enquiries', JSON.stringify(local));
    } catch {}

    setSubmittedTicket({
      ticketId,
      serviceTitle,
      urgency,
      customerName,
      customerPhone,
      location: customerLocation,
      description: description.trim(),
      photos: photos,
    });

    setSubmitting(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenWhatsApp = () => {
    if (!submittedTicket) return;
    const text = encodeURIComponent(
      `🛠️ *MANIKANDAN LATHE WORKS — MACHINING & ARC REPAIR REQUEST*\n` +
      `--------------------------------------\n` +
      `📌 *Ticket ID:* #${submittedTicket.ticketId}\n` +
      `🔧 *Work Type:* ${submittedTicket.serviceTitle}\n` +
      `⚡ *Urgency:* ${submittedTicket.urgency.toUpperCase()}\n` +
      `👤 *Customer:* ${submittedTicket.customerName} (${submittedTicket.customerPhone})\n` +
      `📍 *Location:* ${submittedTicket.location}\n` +
      `📝 *Issue:* ${submittedTicket.description || 'Inspection & quote required'}\n` +
      `📷 *Photos:* ${submittedTicket.photos?.length || 0}\n` +
      `--------------------------------------\n` +
      `Hello Manikandan Lathe Works! I have submitted a repair enquiry. Please provide a turnaround estimate.`
    );
    window.open(`https://wa.me/919659286268?text=${text}`, '_blank');
  };

  const handleResetForm = () => {
    setSubmittedTicket(null);
    setDescription('');
    setPhotos([]);
  };

  return (
    <div className="min-h-screen bg-warm-bg pb-24 md:pb-12 pt-4">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-5">
        
        {/* Top Header */}
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
            className="inline-flex items-center gap-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 font-extrabold px-3.5 py-1.5 rounded-full border border-brand-200 text-xs transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>{DEFAULT_SHOP_INFO.phone}</span>
          </a>
        </div>

        {/* Page Title */}
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-black text-charcoal-900">
            {isTamil ? 'லேத் & ARC பழுது பார்க்கும் சேவை' : 'Machining & ARC Welding Repair'}
          </h1>
          <p className="text-xs text-charcoal-500 font-medium">
            {isTamil 
              ? 'டிராக்டர் கருவிகள், கேட் கிரில், வளைந்த ஷாப்ட் அல்லது இயந்திர பழுதுக்கான கோரிக்கை படிவம்.' 
              : 'Submit damaged parts or welding requirements for quick inspection and price estimate.'}
          </p>
        </div>

        {/* SUCCESS STATE */}
        {submittedTicket ? (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-warm-border shadow-card space-y-5 text-center animate-slide-up">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-300 shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-300 inline-block font-mono">
                TICKET ID: #{submittedTicket.ticketId}
              </span>
              <h2 className="text-lg sm:text-xl font-black text-charcoal-900">
                {isTamil ? 'கோரிக்கை வெற்றிகரமாக பதிவு செய்யப்பட்டது!' : 'Repair Request Submitted!'}
              </h2>
              <p className="text-xs text-charcoal-600 font-medium max-w-md mx-auto">
                {isTamil
                  ? 'எங்கள் லேத் பட்டறை பொறுப்பாளர் உங்கள் கோரிக்கையை ஆய்வு செய்து விரைவில் தொடர்பு கொள்வார்.'
                  : 'We have received your ticket and will call you with a repair quote and turnaround time.'}
              </p>
            </div>

            {/* Ticket Info Card */}
            <div className="bg-warm-bg p-4 rounded-2xl border border-warm-border text-left space-y-2 text-xs font-semibold max-w-md mx-auto">
              <div className="flex justify-between items-center border-b border-warm-border pb-1.5">
                <span className="text-charcoal-500">Service:</span>
                <span className="font-bold text-charcoal-900">{submittedTicket.serviceTitle}</span>
              </div>
              <div className="flex justify-between items-center border-b border-warm-border pb-1.5">
                <span className="text-charcoal-500">Urgency:</span>
                <span className="font-black text-brand-700 uppercase bg-brand-50 px-2 py-0.5 rounded border border-brand-200 text-[10px]">
                  {submittedTicket.urgency}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-charcoal-500">Contact:</span>
                <span className="font-bold text-charcoal-900">{submittedTicket.customerName} ({submittedTicket.customerPhone})</span>
              </div>
            </div>

            {/* Direct WhatsApp Action */}
            <div className="space-y-2.5 max-w-md mx-auto pt-1">
              <button
                type="button"
                onClick={handleOpenWhatsApp}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 px-5 rounded-2xl text-xs sm:text-sm shadow-md transition-all active:scale-98"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{isTamil ? 'வாட்ஸ்அப்பில் போட்டோ அனுப்பி பேசுக' : 'Send Photos & Chat on WhatsApp'}</span>
              </button>

              <button
                type="button"
                onClick={handleResetForm}
                className="w-full py-2.5 text-xs font-bold text-charcoal-600 hover:text-charcoal-900 bg-warm-bg rounded-xl border border-warm-border transition-colors"
              >
                {isTamil ? 'மற்றொரு பழுது கோரிக்கை' : 'Submit Another Request'}
              </button>
            </div>
          </div>
        ) : (
          /* SIMPLE STREAMLINED REPAIR FORM */
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-5 sm:p-7 border border-warm-border shadow-card space-y-5">
            
            {/* Account Auto-Connection Banner */}
            {user ? (
              <div className="flex items-center gap-3 bg-brand-50/60 p-3 rounded-2xl border border-brand-200/80 text-xs">
                <div className="w-8 h-8 rounded-full bg-brand-600 text-white font-black flex items-center justify-center shrink-0 text-xs">
                  {customerName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-charcoal-900 truncate">{customerName}</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-2 py-0.2 rounded-full">
                      Connected
                    </span>
                  </div>
                  <p className="text-[11px] text-charcoal-500 font-medium truncate">
                    {customerPhone || 'Mobile linked'} • {customerLocation}
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-charcoal-700 mb-1">
                  {isTamil ? 'உங்கள் மொபைல் எண் *' : 'Your Contact Phone *'}
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

            {/* 1. SELECT SERVICE CATEGORY */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-charcoal-900 uppercase tracking-wider">
                {isTamil ? '1. பழுது வகை' : '1. Select Category'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {EXPANDED_REPAIR_SERVICES.map((srv) => {
                  const isSelected = selectedService === srv.id;
                  return (
                    <button
                      key={srv.id}
                      type="button"
                      onClick={() => setSelectedService(srv.id)}
                      className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                        isSelected
                          ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-500/20 shadow-xs'
                          : 'border-warm-border bg-white hover:bg-warm-bg'
                      }`}
                    >
                      <span className="text-xl shrink-0">{srv.icon}</span>
                      <div className="min-w-0 flex-1">
                        <h4 className={`text-xs font-black truncate ${isSelected ? 'text-brand-950' : 'text-charcoal-900'}`}>
                          {isTamil ? srv.title_ta : srv.title_en}
                        </h4>
                        <p className="text-[10px] text-charcoal-500 truncate mt-0.5">
                          {isTamil ? srv.desc_ta : srv.desc_en}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. URGENCY */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-charcoal-900 uppercase tracking-wider">
                {isTamil ? '2. தேவைப்படும் அவசரம்' : '2. Urgency'}
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
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-charcoal-900 uppercase tracking-wider">
                {isTamil ? '3. பழுது விபரம் (சுருக்கமாக)' : '3. Issue Description (Brief)'}
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  isTamil
                    ? 'எ.கா: டிராக்டர் 7-கலப்பை ஹூக் வெல்டிங் உடைந்துள்ளது, மோட்டார் ஷாப்ட் வளைவு...'
                    : 'e.g., Tractor 7-Kallapai shank welding broken, 50mm shaft bent...'
                }
                className="w-full px-3.5 py-2.5 text-xs font-medium border border-warm-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-inner resize-none leading-relaxed"
              />
            </div>

            {/* 4. PHOTO UPLOAD */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black text-charcoal-900 uppercase tracking-wider">
                  {isTamil ? '4. புகைப்படம் (விரும்பினால்)' : '4. Photos (Optional)'}
                </label>
                <span className="text-[10px] text-charcoal-400 font-bold">{photos.length}/5</span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
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

                {photos.map((url, idx) => (
                  <div key={idx} className="relative w-12 h-12 rounded-xl overflow-hidden border border-warm-border shadow-xs">
                    <img src={url} alt={`Damaged Part ${idx + 1}`} className="w-full h-full object-cover" />
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

            {/* SUBMIT BUTTON */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={submitting}
                variant="primary"
                fullWidth
                size="lg"
                icon={<Wrench className="w-4 h-4" />}
                className="py-3.5 text-xs sm:text-sm font-black rounded-2xl shadow-md bg-brand-600 hover:bg-brand-700 text-white"
              >
                {submitting
                  ? (isTamil ? 'பதிவு செய்யப்படுகிறது...' : 'Submitting Request...')
                  : (isTamil ? 'பழுது கோரிக்கை அனுப்புக' : 'Submit Repair Request')}
              </Button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};

export default RepairServicePage;
