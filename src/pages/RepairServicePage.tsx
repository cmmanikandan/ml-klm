import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Wrench, 
  ArrowLeft, 
  Phone, 
  Zap, 
  CheckCircle2, 
  Clock, 
  Camera, 
  Trash2, 
  MessageSquare, 
  ChevronRight,
  Sparkles,
  History,
  Plus,
  Package,
  AlertCircle,
  ExternalLink,
  ListFilter
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_SHOP_INFO, supabase } from '../lib/supabase';
import { uploadFileToCloudinary } from '../lib/cloudinary';
import { getNextRepairTicketId } from '../lib/idGenerator';

const COMPACT_REPAIR_CATEGORIES = [
  {
    id: 'tractor_agri',
    image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=300&auto=format&fit=crop&q=80',
    title_en: 'Tractor & Agri Implements',
    title_ta: '7-கலப்பை & விவசாயக் கருவிகள்',
  },
  {
    id: 'heavy_arc',
    image: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=300&auto=format&fit=crop&q=80',
    title_en: 'ARC Welding & Gates/Grills',
    title_ta: 'ARC வெல்டிங் & கேட் கிரில்',
  },
  {
    id: 'shaft_turning',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=80',
    title_en: 'Shaft Turning & Bushing',
    title_ta: 'ஷாப்ட் டர்னிங் & புஷ் வேலை',
  },
  {
    id: 'axle_keyway',
    image: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=300&auto=format&fit=crop&q=80',
    title_en: 'Axle Straightening & Keyway',
    title_ta: 'ஆக்சில் வளைவு நீக்குதல் & கீவே',
  },
  {
    id: 'motor_pump',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=300&auto=format&fit=crop&q=80',
    title_en: 'Borewell Pump & Motor',
    title_ta: 'போர்வெல் பம்ப் & மோட்டார்',
  },
  {
    id: 'custom_lathe',
    image: 'https://images.unsplash.com/photo-1581092162384-8987c1d64718?w=300&auto=format&fit=crop&q=80',
    title_en: 'Custom Industrial Lathe',
    title_ta: 'தனிப்பயன் லேத் & இயந்திரங்கள்',
  },
];

export const RepairServicePage: React.FC = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isTamil = language === 'ta';

  // Default view shows the user's created requests. If no requests, or when clicked '+ New Request', opens form.
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form State
  const [selectedService, setSelectedService] = useState('tractor_agri');
  const [urgency, setUrgency] = useState<'normal' | 'urgent' | 'emergency'>('urgent');
  const [guestPhone, setGuestPhone] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<any | null>(null);

  // Sent Requests State
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  const customerName = user?.full_name?.trim() || 'Customer';
  const customerPhone = user?.phone?.trim() || guestPhone.trim();
  const customerLocation = user?.city_area?.trim() || 'Kallimandhayam';

  useEffect(() => {
    fetchMyRepairRequests();
  }, [user?.id, user?.phone]);

  const fetchMyRepairRequests = async () => {
    setLoadingRequests(true);
    try {
      const { data: allEnquiries } = await supabase
        .from('enquiries')
        .select('*')
        .order('created_at', { ascending: false });

      // Filter repair items for this user
      const filtered = (allEnquiries || []).filter((e: any) => {
        const isRepair = 
          String(e.product_name || '').toLowerCase().includes('repair') ||
          String(e.product_name || '').toLowerCase().includes('பழுது') ||
          String(e.enquiry_number || '').toLowerCase().includes('rep');

        if (!isRepair) return false;

        // Match user ID or phone number
        if (user?.id && e.user_id === user.id) return true;
        if (user?.phone && e.customer_phone === user.phone) return true;
        return false;
      });

      setMyRequests(filtered);
    } catch (err) {
      console.warn('Failed to load my repair requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

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

    const serviceObj = COMPACT_REPAIR_CATEGORIES.find((s) => s.id === selectedService) || COMPACT_REPAIR_CATEGORIES[0];
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
    fetchMyRepairRequests();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenWhatsApp = (ticket: any) => {
    const text = encodeURIComponent(
      `🛠️ *MANIKANDAN LATHE WORKS — MACHINING & REPAIR REQUEST*\n` +
      `--------------------------------------\n` +
      `📌 *Ticket ID:* #${ticket.ticketId || ticket.enquiry_number || ticket.id}\n` +
      `🔧 *Work Type:* ${ticket.serviceTitle || ticket.product_name}\n` +
      `👤 *Customer:* ${ticket.customerName || ticket.customer_name} (${ticket.customerPhone || ticket.customer_phone})\n` +
      `📍 *Location:* ${ticket.location || ticket.delivery_location || 'Kallimandhayam'}\n` +
      `📝 *Issue:* ${ticket.description || ticket.custom_notes || 'Inspection & quote required'}\n` +
      `--------------------------------------\n` +
      `Hello Manikandan Lathe Works! I am following up on my repair ticket.`
    );
    window.open(`https://wa.me/919659286268?text=${text}`, '_blank');
  };

  const handleResetForm = () => {
    setSubmittedTicket(null);
    setDescription('');
    setPhotos([]);
    setShowCreateForm(false);
  };

  return (
    <div className="min-h-screen bg-warm-bg pb-24 md:pb-12 pt-4">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-4">
        
        {/* Top Header Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              if (showCreateForm) {
                setShowCreateForm(false);
              } else {
                navigate(-1);
              }
            }}
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

        {/* Page Title & Top-Right "+ New Request" Action Button */}
        <div className="flex items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-warm-border shadow-card">
          <div className="space-y-0.5">
            <h1 className="text-base sm:text-lg font-black text-charcoal-900 leading-tight">
              {isTamil ? 'லேத் & ARC பழுது பார்க்கும் சேவை' : 'Machining & ARC Repair Service'}
            </h1>
            <p className="text-[11px] text-charcoal-500 font-medium">
              {showCreateForm 
                ? (isTamil ? 'பழுது விபரங்களை பதிவு செய்யவும்' : 'Fill details for instant workshop quote')
                : (isTamil ? `${myRequests.length} கோரிக்கைகள் சமர்ப்பிக்கப்பட்டுள்ளன` : `${myRequests.length} submitted repair requests`)}
            </p>
          </div>

          {/* Top-Right Toggle Button */}
          {showCreateForm ? (
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="inline-flex items-center gap-1.5 bg-warm-bg hover:bg-warm-muted text-charcoal-700 font-black px-3.5 py-2 rounded-2xl text-xs border border-warm-border transition-all shrink-0 shadow-xs"
            >
              <ListFilter className="w-3.5 h-3.5 text-brand-600" />
              <span>{isTamil ? 'கோரிக்கைகள்' : 'View Requests'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setSubmittedTicket(null);
                setShowCreateForm(true);
              }}
              className="inline-flex items-center gap-1.5 bg-gradient-to-r from-brand-600 to-amber-500 hover:from-brand-700 hover:to-amber-600 text-white font-black px-3.5 py-2 rounded-2xl text-xs transition-all shrink-0 shadow-md active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{isTamil ? 'புதிய கோரிக்கை' : '+ New Request'}</span>
            </button>
          )}
        </div>

        {/* VIEW 1: CREATE REPAIR REQUEST FORM */}
        {showCreateForm ? (
          <>
            {submittedTicket ? (
              /* SUCCESS STATE */
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

                {/* Direct Actions */}
                <div className="space-y-2.5 max-w-md mx-auto pt-1">
                  <button
                    type="button"
                    onClick={() => handleOpenWhatsApp(submittedTicket)}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 px-5 rounded-2xl text-xs sm:text-sm shadow-md transition-all active:scale-98"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{isTamil ? 'வாட்ஸ்அப்பில் போட்டோ அனுப்பி பேசுக' : 'Send Photos & Chat on WhatsApp'}</span>
                  </button>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSubmittedTicket(null);
                        setDescription('');
                        setPhotos([]);
                      }}
                      className="flex-1 py-2.5 text-xs font-bold text-charcoal-600 hover:text-charcoal-900 bg-warm-bg rounded-xl border border-warm-border transition-colors"
                    >
                      {isTamil ? 'மற்றொரு கோரிக்கை' : 'Submit Another'}
                    </button>

                    <button
                      type="button"
                      onClick={handleResetForm}
                      className="flex-1 py-2.5 text-xs font-bold text-brand-700 hover:text-brand-800 bg-brand-50 rounded-xl border border-brand-200 transition-colors"
                    >
                      {isTamil ? 'கோரிக்கைகளை பார்' : 'View All Requests'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* CLEAN, STREAMLINED REPAIR FORM */
              <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-5 sm:p-6 border border-warm-border shadow-card space-y-4 animate-fade-in">
                
                {/* Guest Phone Input (Only if user not logged in) */}
                {!user && (
                  <div>
                    <label className="block text-xs font-black text-charcoal-900 uppercase tracking-wider mb-1">
                      {isTamil ? 'உங்கள் மொபைல் எண் *' : 'Your Contact Mobile Number *'}
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

                {/* 1. SELECT CATEGORY (Small Card with Small Image) */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-charcoal-900 uppercase tracking-wider">
                    1. {isTamil ? 'பழுது வகை' : 'Select Category'}
                  </label>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {COMPACT_REPAIR_CATEGORIES.map((srv) => {
                      const isSelected = selectedService === srv.id;
                      return (
                        <button
                          key={srv.id}
                          type="button"
                          onClick={() => setSelectedService(srv.id)}
                          className={`p-2 rounded-2xl border text-center transition-all flex flex-col items-center justify-between gap-1.5 cursor-pointer ${
                            isSelected
                              ? 'border-brand-600 bg-brand-50/70 ring-2 ring-brand-500 shadow-xs'
                              : 'border-warm-border bg-white hover:bg-warm-bg'
                          }`}
                        >
                          <div className="w-full h-16 sm:h-20 rounded-xl overflow-hidden bg-warm-bg border border-warm-border/50">
                            <img
                              src={srv.image}
                              alt={srv.title_en}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className={`text-[11px] font-black leading-tight line-clamp-1 ${
                            isSelected ? 'text-brand-900' : 'text-charcoal-800'
                          }`}>
                            {isTamil ? srv.title_ta : srv.title_en}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. URGENCY SELECTOR */}
                <div className="space-y-1.5">
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
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-charcoal-900 uppercase tracking-wider">
                    3. {isTamil ? 'பழுது விபரம் (சுருக்கமாக)' : 'Issue Description (Brief)'}
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
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black text-charcoal-900 uppercase tracking-wider">
                      4. {isTamil ? 'புகைப்படம் (விரும்பினால்)' : 'Photos (Optional)'}
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
          </>
        ) : (
          /* VIEW 2: SHOW CREATED REPAIR REQUESTS LIST (Primary View) */
          <div className="space-y-3">
            {loadingRequests ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-warm-border shadow-card space-y-2">
                <div className="animate-spin rounded-full h-7 w-7 border-2 border-brand-500 border-t-transparent mx-auto" />
                <p className="text-xs font-bold text-charcoal-600">
                  {isTamil ? 'கோரிக்கைகள் ஏற்றப்படுகின்றன...' : 'Loading repair requests...'}
                </p>
              </div>
            ) : myRequests.length > 0 ? (
              myRequests.map((req) => {
                const ticketId = req.enquiry_number || req.id;
                const serviceTitle = (req.product_name || 'Machining & Repair').replace('[REPAIR SERVICE]', '').trim();
                const isConverted = req.status === 'converted' || Boolean(req.converted_order_id);
                const isRejected = req.status === 'rejected';

                return (
                  <div
                    key={req.id}
                    onClick={() => navigate(`/repair/${ticketId}`)}
                    className="group bg-white rounded-3xl p-4 sm:p-5 border border-warm-border/80 shadow-card hover:shadow-warm-lg hover:border-brand-300 transition-all space-y-3 animate-fade-in cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2 border-b border-warm-muted pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-black text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
                            #{ticketId}
                          </span>
                          <span className="text-[10px] text-charcoal-400 font-bold">
                            {req.created_at ? req.created_at.slice(0, 10) : 'Recent'}
                          </span>
                        </div>
                        <h3 className="text-sm font-black text-charcoal-900 mt-1 group-hover:text-brand-600 transition-colors">
                          {serviceTitle}
                        </h3>
                      </div>

                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                        isConverted
                          ? 'bg-emerald-100 text-emerald-800'
                          : isRejected
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {isConverted 
                          ? (isTamil ? 'ஆர்டராக மாற்றப்பட்டது' : 'Accepted / Converted') 
                          : isRejected 
                          ? (isTamil ? 'நிராகரிக்கப்பட்டது' : 'Rejected') 
                          : (isTamil ? 'ஆய்வில் உள்ளது' : 'Pending Inspection')}
                      </span>
                    </div>

                    {req.custom_notes && (
                      <p className="text-xs text-charcoal-600 font-medium bg-warm-bg p-2.5 rounded-xl border border-warm-border leading-relaxed line-clamp-2">
                        {req.custom_notes}
                      </p>
                    )}

                    {/* Photos Preview if available */}
                    {req.images && Array.isArray(req.images) && req.images.length > 0 && (
                      <div className="flex items-center gap-2 pt-1">
                        {req.images.slice(0, 4).map((imgUrl: string, i: number) => (
                          <img
                            key={i}
                            src={imgUrl}
                            alt="Damage Part"
                            className="w-12 h-12 rounded-xl object-cover border border-warm-border shadow-xs"
                          />
                        ))}
                        {req.images.length > 4 && (
                          <span className="text-[10px] font-bold text-charcoal-500 bg-warm-bg px-2 py-1 rounded-lg">
                            +{req.images.length - 4} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Actions Bar */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-warm-muted/60" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2 flex-1">
                        <button
                          type="button"
                          onClick={() => handleOpenWhatsApp({
                            ticketId,
                            serviceTitle,
                            customerName: req.customer_name,
                            customerPhone: req.customer_phone,
                            location: req.delivery_location,
                            description: req.custom_notes
                          })}
                          className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2 px-3 rounded-xl text-xs shadow-xs transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>{isTamil ? 'வாட்ஸ்அப்' : 'WhatsApp'}</span>
                        </button>

                        <a
                          href={`tel:${DEFAULT_SHOP_INFO.phone}`}
                          className="inline-flex items-center justify-center gap-1.5 bg-warm-bg hover:bg-brand-50 text-charcoal-800 font-bold py-2 px-3 rounded-xl text-xs border border-warm-border transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5 text-brand-600" />
                          <span>{isTamil ? 'அழைக்க' : 'Call'}</span>
                        </a>
                      </div>

                      <div 
                        onClick={() => navigate(`/repair/${ticketId}`)}
                        className="inline-flex items-center gap-1 text-xs font-extrabold text-brand-600 hover:text-brand-700 hover:translate-x-0.5 transition-all cursor-pointer"
                      >
                        <span>{isTamil ? 'விவரம் பார்க்க' : 'View Details'}</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-white rounded-3xl p-8 sm:p-10 text-center border border-warm-border shadow-card space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-warm-bg text-charcoal-500 flex items-center justify-center mx-auto border border-warm-border">
                  <Package className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-black text-charcoal-900">
                    {isTamil ? 'அனுப்பப்பட்ட கோரிக்கைகள் ஏதும் இல்லை' : 'No Repair Requests Found'}
                  </h3>
                  <p className="text-xs text-charcoal-500 font-medium max-w-xs mx-auto">
                    {isTamil
                      ? 'நீங்கள் இதுவரை எந்த பழுது அல்லது லேத் வேலை கோரிக்கையும் சமர்ப்பிக்கவில்லை.'
                      : 'You have not submitted any repair or machining requests yet.'}
                  </p>
                </div>
                <Button
                  onClick={() => setShowCreateForm(true)}
                  variant="primary"
                  size="md"
                  icon={<Plus className="w-4 h-4" />}
                  className="rounded-2xl shadow-md"
                >
                  {isTamil ? '+ புதிய கோரிக்கை சமர்ப்பிக்க' : '+ Create New Request'}
                </Button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default RepairServicePage;
