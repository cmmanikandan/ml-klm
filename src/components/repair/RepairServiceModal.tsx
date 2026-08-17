import React, { useState } from 'react';
import { 
  Wrench, 
  X, 
  Camera, 
  Upload, 
  Phone, 
  MapPin, 
  User, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare,
  Sparkles,
  Zap,
  Trash2
} from 'lucide-react';
import { Button } from '../common/Button';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { supabase, DEFAULT_SHOP_INFO } from '../../lib/supabase';
import { uploadFileToCloudinary } from '../../lib/cloudinary';
import { getNextRepairTicketId } from '../../lib/idGenerator';

interface RepairServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const REPAIR_SERVICES = [
  {
    id: 'tractor_agri',
    icon: '🚜',
    title_en: 'Tractor & Agri Parts Repair',
    title_ta: 'டிராக்டர் & கலப்பை பாகங்கள் பழுது',
    desc_en: '7-Kallapai ploughs, rotavator hooks, cultivator joints',
    desc_ta: '7-கலப்பை, ரொட்டவேட்டர் ஹூக், கல்டிவேட்டர் பழுது',
  },
  {
    id: 'shaft_turning',
    icon: '⚙️',
    title_en: 'Shaft Turning & Bushing',
    title_ta: 'ஷாப்ட் லேத் டர்னிங் & புஷ் வேலை',
    desc_en: 'Precision OD/ID turning, threading, bronze bush fitting',
    desc_ta: 'துல்லியமான லேத் டர்னிங், திரெடிங் & புஷ்ஷிங்',
  },
  {
    id: 'welding_patch',
    icon: '🔥',
    title_en: 'Heavy ARC Welding & Crack Repair',
    title_ta: 'ஹெவி வெல்டிங் & விரிசல் பழுது',
    desc_en: 'Cast iron welding, frame crack repair, steel reinforcement',
    desc_ta: 'காஸ்ட் அயர்ன் வெல்டிங், சேஸ் விரிசல் சரிசெய்தல்',
  },
  {
    id: 'axle_keyway',
    icon: '📏',
    title_en: 'Axle Straightening & Keyway Cutting',
    title_ta: 'ஆக்சில் வளைவு & கீவே வெட்டுதல்',
    desc_en: 'Hydraulic press straightening, slot & keyway machining',
    desc_ta: 'ஆக்சில் வளைவு நீக்குதல், கியர் கீவே வெட்டுதல்',
  },
  {
    id: 'motor_pump',
    icon: '⚡',
    title_en: 'Motor & Borewell Pump Machining',
    title_ta: 'மோட்டார் & பம்ப் லேத் வேலை',
    desc_en: 'Impeller facing, motor shaft sleeving & balancing',
    desc_ta: 'இம்பெல்லர் பேஸிங், மோட்டார் ஷாப்ட் ஸ்லீவிங்',
  },
  {
    id: 'custom_lathe',
    icon: '🛠️',
    title_en: 'General Custom Lathe Work',
    title_ta: 'பொதுவான லேத் & வெல்டிங் வேலை',
    desc_en: 'Custom metal fabrication, drilling, pipe fitting',
    desc_ta: 'இதர அனைத்து வகை லேத் மற்றும் வெல்டிங் வேலைகள்',
  },
];

export const RepairServiceModal: React.FC<RepairServiceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isTamil = language === 'ta';

  const [selectedService, setSelectedService] = useState('tractor_agri');
  const [urgency, setUrgency] = useState<'normal' | 'urgent' | 'emergency'>('urgent');
  const [customerName, setCustomerName] = useState(user?.full_name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [location, setLocation] = useState('Kallimandhayam / Dindigul');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<any | null>(null);

  if (!isOpen) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const file = files[0];
      const result = await uploadFileToCloudinary(file);
      setPhotos((prev) => [...prev, result.url]);
    } catch (err) {
      console.warn('Repair photo upload failed, using local preview fallback', err);
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
      alert(isTamil ? 'தயவுசெய்து தொலைபேசி எண்ணை உள்ளிடவும்' : 'Please provide your phone number');
      return;
    }

    setSubmitting(true);

    const serviceObj = REPAIR_SERVICES.find((s) => s.id === selectedService) || REPAIR_SERVICES[0];
    const serviceTitle = isTamil ? serviceObj.title_ta : serviceObj.title_en;
    const ticketId = await getNextRepairTicketId();

    const repairPayload = {
      id: crypto.randomUUID(),
      enquiry_number: ticketId,
      user_id: user?.id || null,
      customer_name: customerName.trim() || 'Farmer / Customer',
      customer_phone: customerPhone.trim(),
      delivery_location: location.trim(),
      product_name: `[REPAIR SERVICE] ${serviceTitle}`,
      quantity: 1,
      size_requirement: `Urgency: ${urgency.toUpperCase()}`,
      custom_notes: `Repair Requirement: ${description.trim() || 'Broken part needs inspection'}. Photos Attached: ${photos.length}`,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    try {
      await supabase.from('enquiries').insert(repairPayload);
    } catch (dbErr) {
      console.warn('Repair enquiry DB fallback:', dbErr);
    }

    // Save to LocalStorage enquiries for instant local UI sync
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
      photoCount: photos.length,
    });

    setSubmitting(false);
  };

  const handleOpenWhatsApp = () => {
    if (!submittedTicket) return;
    const text = encodeURIComponent(
      `🛠️ *MANIKANDAN LATHE - MACHINING & REPAIR REQUEST*\n` +
      `--------------------------------------\n` +
      `📌 *Ticket ID:* #${submittedTicket.ticketId}\n` +
      `🔧 *Service:* ${submittedTicket.serviceTitle}\n` +
      `⚡ *Urgency:* ${submittedTicket.urgency.toUpperCase()}\n` +
      `👤 *Customer:* ${submittedTicket.customerName} (${submittedTicket.customerPhone})\n` +
      `📍 *Location:* ${submittedTicket.location}\n` +
      `📝 *Issue:* ${submittedTicket.description || 'Inspection required'}\n` +
      `--------------------------------------\n` +
      `Hello Manikandan Lathe Works! I need machining / repair service for my broken equipment. Please provide an estimate.`
    );
    window.open(`https://wa.me/919659286268?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-7 border border-warm-border shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto space-y-5 animate-slide-up">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-charcoal-400 hover:text-charcoal-800 rounded-full hover:bg-warm-bg transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {submittedTicket ? (
          /* SUCCESS SUBMISSION CARD */
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-300 shadow-md">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block">
                Ticket Created: #{submittedTicket.ticketId}
              </span>
              <h2 className="text-xl font-black text-charcoal-900">
                {isTamil ? 'பழுது வேலை கோரிக்கை பதிவு செய்யப்பட்டது!' : 'Repair Request Submitted Successfully!'}
              </h2>
              <p className="text-xs text-charcoal-600 font-medium max-w-sm mx-auto">
                {isTamil
                  ? 'எங்கள் லேத் பட்டறை தொழில்நுட்ப வல்லுநர் உங்கள் விவரங்களை சரிபார்த்து உடனடி அழைப்பில் மதிப்பீட்டை வழங்குவார்.'
                  : 'Our workshop lathe engineer has received your request and will call you with a repair quote & timeline.'}
              </p>
            </div>

            <div className="bg-warm-bg p-4 rounded-2xl border border-warm-border text-left space-y-2 text-xs font-semibold">
              <div className="flex justify-between">
                <span className="text-charcoal-500">Service:</span>
                <span className="font-bold text-charcoal-900">{submittedTicket.serviceTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-500">Urgency:</span>
                <span className="font-bold text-brand-700 uppercase">{submittedTicket.urgency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-500">Workshop Location:</span>
                <span className="font-bold text-charcoal-800">Kallimandhayam, Dindigul</span>
              </div>
            </div>

            {/* Direct Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleOpenWhatsApp}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 px-4 rounded-2xl text-xs sm:text-sm shadow-md transition-all active:scale-98"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{isTamil ? 'வாட்ஸ்அப்பில் போட்டோ அனுப்பி பேசுக' : 'Send Photos & Chat on WhatsApp'}</span>
              </button>

              <a
                href={`tel:${DEFAULT_SHOP_INFO.phone}`}
                className="w-full flex items-center justify-center gap-2 bg-warm-bg hover:bg-warm-hover text-charcoal-900 font-extrabold py-3 px-4 rounded-2xl text-xs border border-warm-border transition-all"
              >
                <Phone className="w-4 h-4 text-brand-600" />
                <span>Call Workshop Directly ({DEFAULT_SHOP_INFO.phone})</span>
              </a>

              <Button onClick={onClose} variant="secondary" fullWidth className="mt-1">
                {isTamil ? 'மூடுக' : 'Close'}
              </Button>
            </div>
          </div>
        ) : (
          /* REPAIR SERVICE FORM */
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Header */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-[11px] font-black uppercase tracking-wider mb-2 border border-brand-200">
                <Wrench className="w-3.5 h-3.5" />
                <span>{isTamil ? 'லேத் & வெல்டிங் பழுது சேவை' : 'Machining & Lathe Repair Service'}</span>
              </div>
              <h2 className="text-xl font-black text-charcoal-900">
                {isTamil ? 'உடைந்த பாகங்கள் & லேத் வேலைக்கான கோரிக்கை' : 'Request Machining or Repair Work'}
              </h2>
              <p className="text-xs text-charcoal-500 font-medium mt-0.5">
                {isTamil
                  ? 'டிராக்டர் பாகங்கள், ஷாப்ட் வளைவு, உடைந்த பாகங்களின் புகைப்படத்தைப் பதிவேற்றி உடனடி மதிப்பீடு பெறுக.'
                  : 'Bring or send broken tractor parts, shafts, bent axles, or industrial pumps for precision repair.'}
              </p>
            </div>

            {/* 1. Select Service Category */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-charcoal-900 uppercase tracking-wider">
                1. {isTamil ? 'சேவை வகையைத் தேர்ந்தெடுக்கவும்' : 'Select Machining / Repair Category'} *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {REPAIR_SERVICES.map((srv) => {
                  const isSelected = selectedService === srv.id;
                  return (
                    <button
                      key={srv.id}
                      type="button"
                      onClick={() => setSelectedService(srv.id)}
                      className={`p-3 rounded-2xl border-2 text-left transition-all flex flex-col justify-between gap-1.5 ${
                        isSelected
                          ? 'border-brand-600 bg-brand-50/80 ring-2 ring-brand-500/20 shadow-sm'
                          : 'border-warm-border bg-white hover:border-brand-300'
                      }`}
                    >
                      <span className="text-xl">{srv.icon}</span>
                      <div>
                        <h4 className={`text-xs font-black leading-tight ${isSelected ? 'text-brand-900' : 'text-charcoal-900'}`}>
                          {isTamil ? srv.title_ta : srv.title_en}
                        </h4>
                        <p className="text-[10px] text-charcoal-500 mt-0.5 line-clamp-1">
                          {isTamil ? srv.desc_ta : srv.desc_en}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Urgency Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-charcoal-900 uppercase tracking-wider">
                2. {isTamil ? 'அவசர நிலை / தேவைப்படும் காலம்' : 'Urgency Level'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'normal', label_en: 'Standard (2-3 Days)', label_ta: 'சாதாரணம் (2-3 நாட்கள்)', icon: Clock, color: 'text-emerald-700 bg-emerald-50 border-emerald-300' },
                  { id: 'urgent', label_en: 'Urgent (24 Hours)', label_ta: 'அவசரம் (24 மணிநேரம்)', icon: Zap, color: 'text-amber-800 bg-amber-50 border-amber-300' },
                  { id: 'emergency', label_en: 'Same-Day Urgent', label_ta: 'அதே நாளில் தேவை', icon: Sparkles, color: 'text-rose-800 bg-rose-50 border-rose-300' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setUrgency(item.id as any)}
                    className={`py-2 px-2.5 rounded-xl border-2 text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                      urgency === item.id
                        ? `${item.color} shadow-sm ring-2 ring-brand-500/20`
                        : 'border-warm-border bg-white text-charcoal-600 hover:bg-warm-bg'
                    }`}
                  >
                    <item.icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-[11px] truncate">{isTamil ? item.label_ta : item.label_en}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Photo Upload of Damaged Part */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-charcoal-900 uppercase tracking-wider">
                3. {isTamil ? 'உடைந்த பாகத்தின் புகைப்படம் (விரும்பினால்)' : 'Upload Photo of Damaged Part (Optional)'}
              </label>

              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-warm-bg hover:bg-brand-50 border-2 border-dashed border-brand-300 text-brand-700 text-xs font-extrabold cursor-pointer transition-colors">
                  <Camera className="w-4 h-4" />
                  <span>{uploading ? (isTamil ? 'ஏற்றப்படுகிறது...' : 'Uploading...') : (isTamil ? 'கேமரா / கேலரி' : 'Take Photo / Upload')}</span>
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
                  <div key={idx} className="relative w-14 h-14 rounded-xl overflow-hidden border border-warm-border shadow-xs group">
                    <img src={url} alt={`Damaged Part ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-0.5 right-0.5 bg-rose-600 text-white p-1 rounded-full shadow-md hover:bg-rose-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Description of Problem */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-charcoal-900 uppercase tracking-wider">
                4. {isTamil ? 'பழுது விபரம் / அளவு' : 'Issue Description & Dimensions'}
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  isTamil
                    ? 'எ.கா: டிராக்டர் 7-கலப்பை ஹூக் விரிசல் ஏற்பட்டுள்ளது, ஷாப்ட் 3mm வளைந்துள்ளது...'
                    : 'e.g., Tractor plough hook broken, 50mm shaft bent, thread stripped...'
                }
                className="w-full px-3.5 py-2 text-xs font-medium border border-warm-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>

            {/* 5. Contact Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-charcoal-700 mb-1">
                  {isTamil ? 'உங்கள் பெயர்' : 'Your Name'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-charcoal-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full pl-9 pr-3 py-2 text-xs font-bold border border-warm-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-charcoal-700 mb-1">
                  {isTamil ? 'மொபைல் எண் *' : 'Phone Number *'}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-brand-600 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+91 96592 86268"
                    className="w-full pl-9 pr-3 py-2 text-xs font-extrabold border border-warm-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={submitting}
                variant="primary"
                fullWidth
                size="lg"
                icon={<Wrench className="w-4 h-4" />}
                className="py-3.5 text-sm font-black rounded-2xl shadow-lg bg-brand-600 hover:bg-brand-700"
              >
                {submitting
                  ? (isTamil ? 'பதிவு செய்யப்படுகிறது...' : 'Submitting Request...')
                  : (isTamil ? 'உடனடி பழுது மதிப்பீடு பெறுக' : 'Submit Repair Request & Get Quote')}
              </Button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
