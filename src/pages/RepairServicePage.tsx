import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Wrench, 
  ArrowLeft, 
  Phone, 
  ShieldCheck, 
  Sparkles, 
  Zap, 
  CheckCircle2, 
  Clock, 
  Flame, 
  Camera, 
  Trash2, 
  MessageSquare, 
  User, 
  MapPin, 
  Layers, 
  ExternalLink,
  ChevronRight
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
    desc_en: '7-Kallapai ploughs, rotavator hooks, cultivator shanks & disc hubs',
    desc_ta: '7-கலப்பை, ரொட்டவேட்டர் ஹூக், கல்டிவேட்டர் கம்பி வெல்டிங்',
    badge_en: 'Agri Heavy-Duty',
    badge_ta: 'விவசாய பயன்பாடு'
  },
  {
    id: 'heavy_arc',
    icon: '🔥',
    title_en: 'Heavy ARC Welding & Structural Work',
    title_ta: 'ஹெவி ARC வெல்டிங் & கிரில் கேட் பழுது',
    desc_en: 'Main entrance gates, safety grills, roofing trusses, shed pillars & crack patching',
    desc_ta: 'மெயின் கேட், சேஃப்டி கிரில், கூரை டிரஸ்கள் & விரிசல் வெல்டிங்',
    badge_en: 'High-Strength ARC',
    badge_ta: 'உறுதியான வெல்டிங்'
  },
  {
    id: 'shaft_turning',
    icon: '⚙️',
    title_en: 'Shaft Turning & Precision Bushing',
    title_ta: 'துல்லியமான ஷாப்ட் டர்னிங் & புஷ் வேலை',
    desc_en: 'Precision OD/ID turning, threading, bronze/brass bush fitting & surface facing',
    desc_ta: 'துல்லியமான லேத் டர்னிங், திரெடிங், பிராஸ் புஷ் அமைத்தல்',
    badge_en: 'Micro Tolerance',
    badge_ta: 'துல்லிய லேத்'
  },
  {
    id: 'axle_keyway',
    icon: '📏',
    title_en: 'Axle Straightening & Keyway Cutting',
    title_ta: 'ஆக்சில் வளைவு நேராக்குதல் & கீவே வெட்டுதல்',
    desc_en: 'Hydraulic press alignment for bent axles, shafts, rotors & gear keyway slots',
    desc_ta: 'ஹைட்ராலிக் பிரஸ் மூலம் வளைவு நீக்குதல், கியர் கீவே ஸ்லாட்',
    badge_en: 'Hydraulic Press',
    badge_ta: 'ஹைட்ராலிக் பிரஸ்'
  },
  {
    id: 'motor_pump',
    icon: '⚡',
    title_en: 'Borewell Pump & Motor Machining',
    title_ta: 'போர்வெல் பம்ப் & மோட்டார் லேத் வேலை',
    desc_en: 'Submersible motor shaft repair, impeller facing, dynamic balancing & sleeving',
    desc_ta: 'சப்மெர்சிபிள் மோட்டார் ஷாப்ட் பழுது, இம்பெல்லர் ஃபேசிங்',
    badge_en: 'Motors & Pumps',
    badge_ta: 'மோட்டார் & பம்ப்'
  },
  {
    id: 'machinery_industrial',
    icon: '🏗️',
    title_en: 'Industrial Machinery Breakdown Repair',
    title_ta: 'தொழிற்துறை & ஆலை இயந்திர பழுது',
    desc_en: 'Factory equipment repair, conveyor shafts, bracket welding & heavy metal restore',
    desc_ta: 'தொழிற்சாலை இயந்திரங்கள், கன்வேயர் ஷாப்ட் & உடைந்த பாகங்கள்',
    badge_en: 'Industrial Grade',
    badge_ta: 'தொழிற்துறை'
  },
  {
    id: 'custom_lathe',
    icon: '🛠️',
    title_en: 'All Custom ARC & Lathe Fabrication',
    title_ta: 'இதர அனைத்து வகை லேத் & ARC வெல்டிங்',
    desc_en: 'Custom bracket cutting, precision drilling, pipe threading, domestic & commercial',
    desc_ta: 'வீட்டு மற்றும் வணிக பயன்பாட்டு உலோகம், வெல்டிங் வேலைகள்',
    badge_en: 'Custom Lathe Works',
    badge_ta: 'தனிப்பயன் லேத்'
  },
];

export const RepairServicePage: React.FC = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isTamil = language === 'ta';

  const [selectedService, setSelectedService] = useState('tractor_agri');
  const [urgency, setUrgency] = useState<'normal' | 'urgent' | 'emergency'>('urgent');
  const [customerName, setCustomerName] = useState(user?.full_name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [location, setLocation] = useState(user?.city_area || 'Kallimandhayam / Dindigul');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<any | null>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (photos.length >= 5) {
      alert(isTamil ? 'அதிகபட்சம் 5 புகைப்படங்கள் மட்டுமே பதிவேற்ற முடியும்' : 'You can upload a maximum of 5 photos');
      return;
    }

    setUploading(true);
    try {
      const file = files[0];
      const result = await uploadFileToCloudinary(file);
      setPhotos((prev) => [...prev, result.url]);
    } catch (err) {
      console.warn('Repair photo upload failed, using local base64 preview fallback', err);
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
    if (!customerPhone.trim()) {
      alert(isTamil ? 'தயவுசெய்து உங்கள் தொடர்பு எண்ணை உள்ளிடவும்' : 'Please provide your mobile phone number');
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
      customer_name: customerName.trim() || 'Customer',
      customer_phone: customerPhone.trim(),
      delivery_location: location.trim() || 'Kallimandhayam',
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
        message_en: `${repairPayload.customer_name} requested repair for ${serviceTitle}.`,
        message_ta: `${repairPayload.customer_name} ${serviceTitle} பழுது வேலைக்கு கோரிக்கை விடுத்துள்ளார்.`,
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
      customerName: repairPayload.customer_name,
      customerPhone: repairPayload.customer_phone,
      location: repairPayload.delivery_location,
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
      `📝 *Issue Description:* ${submittedTicket.description || 'Inspection & quote required'}\n` +
      `📷 *Photos Attached:* ${submittedTicket.photos?.length || 0}\n` +
      `--------------------------------------\n` +
      `Hello Manikandan Lathe Works! I have submitted a repair enquiry for my broken equipment/welding work. Please provide a turnaround estimate.`
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Top Breadcrumb Header Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 p-2 text-charcoal-700 bg-white rounded-full border border-warm-border shadow-sm hover:bg-warm-bg transition-colors text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{isTamil ? 'பின்னே' : 'Back'}</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black text-brand-600 bg-brand-50 px-3.5 py-1 rounded-full border border-brand-200 uppercase tracking-wider shadow-xs">
              ⚙️ MANIKANDAN LATHE & ARC WORKS
            </span>
          </div>
        </div>

        {/* Hero Branding Section */}
        <div className="bg-gradient-to-br from-charcoal-950 via-charcoal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-9 border border-slate-700 shadow-2xl relative overflow-hidden space-y-4">
          <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-black uppercase tracking-wider border border-brand-500/30">
              <Wrench className="w-3.5 h-3.5 text-brand-400" />
              <span>{isTamil ? 'அனைத்து வகை லேத் & ARC வெல்டிங் பழுது சேவை' : 'All Lathe Machining & Heavy ARC Repair'}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">
              {isTamil 
                ? 'டிராக்டர் பாகங்கள், ARC வெல்டிங் & உடைந்த இயந்திர பழுது சேவை' 
                : 'Tractor Implements, ARC Welding & Precision Lathe Repair'}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl leading-relaxed">
              {isTamil
                ? 'விவசாய டிராக்டர் 7-கலப்பை, மெயின் கேட் கிரில் பழுது, வளைந்த ஷாப்ட் நேராக்குதல், போர்வெல் மோட்டார் மற்றும் தொழிற்சாலை இயந்திரங்களுக்கான லேத் & ஹெவி ARC வெல்டிங் பழுது வேலைகள் துல்லியமாக செய்து தரப்படும்.'
                : 'We repair damaged tractor implements, bent axles, gates, grills, submersible pump shafts, and industrial machinery parts with heavy ARC welding and precision lathe machining.'}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <a
                href={`tel:${DEFAULT_SHOP_INFO.phone.replace(/[^0-9+]/g, '')}`}
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 px-4 rounded-xl text-xs border border-white/20 transition-all shadow-sm"
              >
                <Phone className="w-3.5 h-3.5 text-brand-400" />
                <span>Call Shop: {DEFAULT_SHOP_INFO.phone}</span>
              </a>

              <a
                href="https://wa.me/919659286268"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 font-bold py-2.5 px-4 rounded-xl text-xs border border-emerald-500/30 transition-all shadow-sm"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>WhatsApp: +91 96592 86268</span>
              </a>
            </div>
          </div>
        </div>

        {/* INTERACTIVE FORM OR SUCCESS VIEW (Direct Page Experience) */}
        {submittedTicket ? (
          /* SUCCESS SUBMISSION VIEW */
          <div className="bg-white rounded-3xl p-6 sm:p-9 border border-warm-border shadow-card space-y-6 text-center animate-slide-up">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-300 shadow-md">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-300 inline-block font-mono">
                TICKET ID: #{submittedTicket.ticketId}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-charcoal-900">
                {isTamil ? 'பழுது வேலை கோரிக்கை வெற்றிகரமாக பதிவு செய்யப்பட்டது!' : 'Repair Request Received Successfully!'}
              </h2>
              <p className="text-xs sm:text-sm text-charcoal-600 font-medium max-w-lg mx-auto leading-relaxed">
                {isTamil
                  ? 'எங்கள் லேத் பட்டறை பொறுப்பாளர் உங்கள் கோரிக்கையை ஆய்வு செய்து, மதிப்பீடு மற்றும் பழுதுபார்க்கும் நேரத்தை தொலைபேசி அல்லது வாட்ஸ்அப் மூலம் உங்களுக்கு தெரிவிப்பார்.'
                  : 'Our workshop master craftsman has received your repair ticket and will call you with a precise repair estimate & turnaround timeline.'}
              </p>
            </div>

            {/* Summary Box */}
            <div className="bg-warm-bg p-5 rounded-2xl border border-warm-border text-left space-y-2.5 text-xs max-w-lg mx-auto font-semibold">
              <div className="flex justify-between items-center border-b border-warm-border pb-2">
                <span className="text-charcoal-500">Service Category:</span>
                <span className="font-extrabold text-charcoal-900 text-right">{submittedTicket.serviceTitle}</span>
              </div>
              <div className="flex justify-between items-center border-b border-warm-border pb-2">
                <span className="text-charcoal-500">Urgency Level:</span>
                <span className="font-black text-brand-700 uppercase bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                  {submittedTicket.urgency}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-warm-border pb-2">
                <span className="text-charcoal-500">Customer:</span>
                <span className="font-bold text-charcoal-900">{submittedTicket.customerName} ({submittedTicket.customerPhone})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-charcoal-500">Workshop Location:</span>
                <span className="font-bold text-charcoal-800">Kallimandhayam, Dindigul</span>
              </div>
            </div>

            {/* Direct Action Buttons */}
            <div className="space-y-3 max-w-md mx-auto pt-2">
              <button
                type="button"
                onClick={handleOpenWhatsApp}
                className="w-full flex items-center justify-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 px-6 rounded-2xl text-xs sm:text-sm shadow-lg shadow-emerald-600/20 transition-all active:scale-98"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{isTamil ? 'வாட்ஸ்அப்பில் போட்டோ அனுப்பி பேசுக' : 'Send Photos & Chat on WhatsApp'}</span>
              </button>

              <a
                href={`tel:${DEFAULT_SHOP_INFO.phone.replace(/[^0-9+]/g, '')}`}
                className="w-full flex items-center justify-center gap-2 bg-white hover:bg-warm-hover text-charcoal-900 font-extrabold py-3 px-6 rounded-2xl text-xs border border-warm-border transition-all shadow-sm"
              >
                <Phone className="w-4 h-4 text-brand-600" />
                <span>Call Workshop Directly ({DEFAULT_SHOP_INFO.phone})</span>
              </a>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="flex-1 py-2.5 text-xs font-bold text-charcoal-600 hover:text-charcoal-900 bg-warm-bg rounded-xl border border-warm-border transition-colors"
                >
                  {isTamil ? 'மற்றொரு பழுது கோரிக்கை' : 'Submit Another Request'}
                </button>

                <Link
                  to="/products"
                  className="flex-1 py-2.5 text-xs font-bold text-brand-700 hover:text-brand-800 bg-brand-50 rounded-xl border border-brand-200 transition-colors inline-flex items-center justify-center gap-1"
                >
                  <span>{isTamil ? 'பொருட்களைப் பார்' : 'Explore Products'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* EMBEDDED DIRECT REPAIR FORM */
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-warm-border shadow-card space-y-6">
            
            <div className="border-b border-warm-border pb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-black uppercase tracking-wider mb-2 border border-brand-200">
                <Flame className="w-3.5 h-3.5 text-brand-600" />
                <span>{isTamil ? 'உடனடி மதிப்பீட்டு படிவம்' : 'Instant Repair & Machining Quote Form'}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-charcoal-900">
                {isTamil ? 'உடைந்த பாகங்களின் விபரங்களைப் பதிவு செய்க' : 'Submit Broken Equipment & Repair Details'}
              </h2>
              <p className="text-xs text-charcoal-500 font-medium mt-1">
                {isTamil
                  ? 'டிராக்டர் கலப்பை, கேட் கிரில் விரிசல், ஷாப்ட் வளைவு அல்லது மோட்டார் பாகங்களின் புகைப்படத்தைப் பதிவேற்றி நேரடி பட்டறை மதிப்பீடு பெறுங்கள்.'
                  : 'Fill the specifications below or upload damaged part photos for direct workshop inspection and quotation.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* 1. SELECT REPAIR / WELDING SERVICE TYPE */}
              <div className="space-y-3">
                <label className="block text-xs font-black text-charcoal-900 uppercase tracking-wider">
                  1. {isTamil ? 'பழுது பார்க்கும் சேவையைத் தேர்ந்தெடுக்கவும்' : 'Select Machining / Welding Category'} *
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {EXPANDED_REPAIR_SERVICES.map((srv) => {
                    const isSelected = selectedService === srv.id;
                    return (
                      <button
                        key={srv.id}
                        type="button"
                        onClick={() => setSelectedService(srv.id)}
                        className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                          isSelected
                            ? 'border-brand-600 bg-brand-50/80 ring-2 ring-brand-500/20 shadow-sm'
                            : 'border-warm-border bg-white hover:border-brand-300 hover:bg-warm-bg'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-2xl">{srv.icon}</span>
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                            isSelected ? 'bg-brand-600 text-white border-brand-600' : 'bg-warm-bg text-charcoal-600 border-warm-border'
                          }`}>
                            {isTamil ? srv.badge_ta : srv.badge_en}
                          </span>
                        </div>

                        <div>
                          <h4 className={`text-xs font-black leading-snug ${isSelected ? 'text-brand-950' : 'text-charcoal-900'}`}>
                            {isTamil ? srv.title_ta : srv.title_en}
                          </h4>
                          <p className="text-[11px] text-charcoal-500 mt-1 line-clamp-2 leading-relaxed">
                            {isTamil ? srv.desc_ta : srv.desc_en}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. URGENCY SELECTOR */}
              <div className="space-y-2.5">
                <label className="block text-xs font-black text-charcoal-900 uppercase tracking-wider">
                  2. {isTamil ? 'அவசர நிலை / தேவைப்படும் காலம்' : 'Urgency Level / Required Turnaround'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'normal', label_en: 'Standard (2-3 Days)', label_ta: 'சாதாரணம் (2-3 நாட்கள்)', icon: Clock, desc_en: 'Routine overhaul & repair', desc_ta: 'வழக்கமான பழுது வேலை', color: 'text-emerald-800 bg-emerald-50 border-emerald-300' },
                    { id: 'urgent', label_en: 'Urgent (24 Hours)', label_ta: 'அவசரம் (24 மணிநேரம்)', icon: Zap, desc_en: 'Priority workbench repair', desc_ta: 'முன்னுரிமை பழுது வேலை', color: 'text-amber-900 bg-amber-50 border-amber-300' },
                    { id: 'emergency', label_en: 'Same-Day Emergency', label_ta: 'அதே நாளில் தேவை', icon: Sparkles, desc_en: 'Breakdown immediate lathe fix', desc_ta: 'உடனடி அவசர லேத் பழுது', color: 'text-rose-900 bg-rose-50 border-rose-300' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setUrgency(item.id as any)}
                      className={`p-3 rounded-2xl border-2 text-left transition-all flex items-start gap-2.5 ${
                        urgency === item.id
                          ? `${item.color} shadow-sm ring-2 ring-brand-500/20`
                          : 'border-warm-border bg-white text-charcoal-600 hover:bg-warm-bg'
                      }`}
                    >
                      <item.icon className="w-4 h-4 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-xs font-black block">{isTamil ? item.label_ta : item.label_en}</span>
                        <span className="text-[10px] text-charcoal-500 block">{isTamil ? item.desc_ta : item.desc_en}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. PHOTO UPLOAD */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-charcoal-900 uppercase tracking-wider">
                    3. {isTamil ? 'உடைந்த பாகத்தின் புகைப்படம் (விரும்பினால்)' : 'Upload Photos of Damaged Equipment (Optional)'}
                  </label>
                  <span className="text-[10px] text-charcoal-400 font-bold">Max 5 Photos</span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-warm-bg hover:bg-brand-50 border-2 border-dashed border-brand-300 text-brand-700 text-xs font-extrabold cursor-pointer transition-colors">
                    <Camera className="w-4 h-4 text-brand-600" />
                    <span>{uploading ? (isTamil ? 'ஏற்றப்படுகிறது...' : 'Uploading...') : (isTamil ? 'கேமரா / போட்டோ சேர்' : 'Take Photo / Upload')}</span>
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
                    <div key={idx} className="relative w-16 h-16 rounded-2xl overflow-hidden border border-warm-border shadow-xs group">
                      <img src={url} alt={`Damaged Part ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute top-1 right-1 bg-rose-600 text-white p-1 rounded-full shadow-md hover:bg-rose-700 transition-colors"
                        title="Remove photo"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. ISSUE DESCRIPTION & DIMENSIONS */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-charcoal-900 uppercase tracking-wider">
                  4. {isTamil ? 'பழுது விபரம் / அளவு / இயந்திர வகை' : 'Issue Description, Dimensions & Machine Type'}
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    isTamil
                      ? 'எ.கா: டிராக்டர் 7-கலப்பை ஹூக் வெல்டிங் உடைந்துள்ளது, 50mm மோட்டார் ஷாப்ட் வளைந்துள்ளது, மெயின் கேட் கீல் விரிசல்...'
                      : 'e.g., Tractor 7-Kallapai shank broken, 50mm pump shaft bent 3mm, gate hinge crack welding needed...'
                  }
                  className="w-full px-4 py-3 text-xs font-medium border border-warm-border rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-inner resize-none leading-relaxed"
                />
              </div>

              {/* 5. CONTACT INFORMATION */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-charcoal-700 mb-1">
                    {isTamil ? 'உங்கள் பெயர்' : 'Your Name'}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-charcoal-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full pl-9 pr-3 py-2.5 text-xs font-bold border border-warm-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal-700 mb-1">
                    {isTamil ? 'மொபைல் எண் *' : 'Mobile Phone *'}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-brand-600 absolute left-3 top-3" />
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+91 96592 86268"
                      className="w-full pl-9 pr-3 py-2.5 text-xs font-extrabold border border-warm-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal-700 mb-1">
                    {isTamil ? 'ஊர் / முகவரி' : 'Town / Village'}
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-charcoal-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Kallimandhayam / Oddanchatram"
                      className="w-full pl-9 pr-3 py-2.5 text-xs font-bold border border-warm-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs"
                    />
                  </div>
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <div className="pt-3">
                <Button
                  type="submit"
                  disabled={submitting}
                  variant="primary"
                  fullWidth
                  size="lg"
                  icon={<Wrench className="w-4 h-4" />}
                  className="py-4 text-sm font-black rounded-2xl shadow-xl shadow-brand-600/30 bg-gradient-to-r from-brand-600 to-amber-600 hover:from-brand-700 hover:to-amber-700 text-white"
                >
                  {submitting
                    ? (isTamil ? 'பதிவு செய்யப்படுகிறது...' : 'Submitting Request...')
                    : (isTamil ? 'உடனடி பழுது மதிப்பீடு பெறுக' : 'Submit Repair Request & Get Quote')}
                </Button>
              </div>

            </form>
          </div>
        )}

        {/* WORKSHOP CAPABILITIES & QUALITY ASSURANCE */}
        <div className="bg-white rounded-3xl p-6 border border-warm-border shadow-card grid grid-cols-1 sm:grid-cols-3 gap-5 text-center">
          <div className="space-y-1.5 p-2">
            <ShieldCheck className="w-8 h-8 text-brand-600 mx-auto" />
            <h4 className="text-xs font-black text-charcoal-900">25+ Years Experience</h4>
            <p className="text-[11px] text-charcoal-500 font-medium">Expert lathe master craftsmen & precision turning</p>
          </div>

          <div className="space-y-1.5 p-2">
            <Zap className="w-8 h-8 text-amber-600 mx-auto" />
            <h4 className="text-xs font-black text-charcoal-900">Fast Turnaround</h4>
            <p className="text-[11px] text-charcoal-500 font-medium">Same-day breakdown service for agriculture & mills</p>
          </div>

          <div className="space-y-1.5 p-2">
            <Sparkles className="w-8 h-8 text-emerald-600 mx-auto" />
            <h4 className="text-xs font-black text-charcoal-900">Heavy ARC Welding</h4>
            <p className="text-[11px] text-charcoal-500 font-medium">Extreme durability finish with high structural strength</p>
          </div>
        </div>

        {/* WORKSHOP DIRECT LOCATION BANNER */}
        <div className="bg-warm-bg rounded-3xl p-5 border border-warm-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white rounded-2xl border border-warm-border shadow-xs text-brand-600 shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-charcoal-900 font-bold">MANIKANDAN LATHE & WELDING WORKS</h5>
              <p className="text-charcoal-500 text-[11px] mt-0.5">K. Keeranur Road, Kallimandhayam - 624616, Dindigul District</p>
            </div>
          </div>

          <a
            href={DEFAULT_SHOP_INFO.google_maps_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 bg-white hover:bg-brand-50 text-brand-700 px-4 py-2 rounded-xl border border-brand-200 transition-colors shrink-0"
          >
            <span>Open Google Maps</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

      </div>
    </div>
  );
};

export default RepairServicePage;
