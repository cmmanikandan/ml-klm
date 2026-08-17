import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Wrench, 
  Clock, 
  CheckCircle2, 
  Phone, 
  MessageSquare, 
  Calendar, 
  MapPin, 
  User, 
  Camera, 
  ExternalLink, 
  ChevronRight, 
  Sparkles,
  AlertCircle,
  Copy,
  Check,
  Package,
  Layers
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_SHOP_INFO, supabase } from '../lib/supabase';

export const RepairDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const isTamil = language === 'ta';

  const [ticket, setTicket] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchRepairDetails();
  }, [id]);

  const fetchRepairDetails = async () => {
    setLoading(true);
    if (!id) {
      setLoading(false);
      return;
    }

    // Strip leading # if present (e.g. "#MNK-REP-1001" → "MNK-REP-1001")
    const cleanId = id.startsWith('#') ? id.slice(1) : id;

    try {
      // Strategy 1: Match by enquiry_number exactly (MNK-REP-1001 format)
      const { data: byNum } = await supabase
        .from('enquiries')
        .select('*')
        .eq('enquiry_number', cleanId)
        .limit(1);

      if (byNum && byNum.length > 0) {
        setTicket(byNum[0]);
        return;
      }

      // Strategy 2: Case-insensitive ilike match for enquiry_number
      const { data: byNumIlike } = await supabase
        .from('enquiries')
        .select('*')
        .ilike('enquiry_number', cleanId)
        .limit(1);

      if (byNumIlike && byNumIlike.length > 0) {
        setTicket(byNumIlike[0]);
        return;
      }

      // Strategy 3: Match by UUID id field (if it's a UUID)
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);
      if (isUuid) {
        const { data: byId } = await supabase
          .from('enquiries')
          .select('*')
          .eq('id', cleanId)
          .limit(1);
        if (byId && byId.length > 0) {
          setTicket(byId[0]);
          return;
        }
      }

      // Strategy 4: Fallback - search in localStorage (offline / cached)
      const local = JSON.parse(localStorage.getItem('ml_enquiries') || '[]');
      const match = local.find(
        (e: any) =>
          e.enquiry_number === cleanId ||
          e.enquiry_number === id ||
          e.id === cleanId ||
          e.id === id
      );
      if (match) {
        setTicket(match);
        return;
      }

      // Not found — ticket stays null → shows "not found" UI
    } catch (err) {
      console.warn('Error loading repair ticket:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTicketId = () => {
    const ticketNum = ticket?.enquiry_number || ticket?.id || id || '';
    navigator.clipboard.writeText(ticketNum);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    if (!ticket) return;
    const ticketId = ticket.enquiry_number || ticket.id;
    const serviceTitle = (ticket.product_name || 'Repair Service').replace('[REPAIR SERVICE]', '').trim();
    const text = encodeURIComponent(
      `🛠️ *MANIKANDAN LATHE WORKS — MACHINING & REPAIR TICKET FOLLOW-UP*\n` +
      `--------------------------------------\n` +
      `📌 *Ticket ID:* #${ticketId}\n` +
      `🔧 *Work Type:* ${serviceTitle}\n` +
      `👤 *Customer:* ${ticket.customer_name} (${ticket.customer_phone})\n` +
      `📍 *Location:* ${ticket.delivery_location || 'Kallimandhayam'}\n` +
      `📝 *Issue:* ${ticket.custom_notes || 'Inspection required'}\n` +
      `--------------------------------------\n` +
      `Hello Manikandan Lathe Works! I would like an update on my repair request #${ticketId}.`
    );
    window.open(`https://wa.me/919659286268?text=${text}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-bg flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 text-center border border-warm-border shadow-card space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-3 border-brand-500 border-t-transparent mx-auto" />
          <p className="text-xs font-bold text-charcoal-700">
            {isTamil ? 'பழுது விபரம் ஏற்றப்படுகிறது...' : 'Loading repair details...'}
          </p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-warm-bg pb-24 pt-8 px-4">
        <div className="max-w-md mx-auto bg-white rounded-3xl p-8 text-center border border-warm-border shadow-card space-y-4">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-base font-black text-charcoal-900">
            {isTamil ? 'கோரிக்கை காணப்படவில்லை' : 'Repair Ticket Not Found'}
          </h2>
          <p className="text-xs text-charcoal-500 font-medium">
            {isTamil 
              ? 'இந்த பழுது எண் கொண்ட கோரிக்கை தகவல் எதுவும் இல்லை அல்லது நீக்கப்பட்டிருக்கலாம்.' 
              : 'The requested repair ticket ID could not be found.'}
          </p>
          <Button
            onClick={() => navigate('/repair')}
            variant="primary"
            size="md"
            className="rounded-2xl"
          >
            {isTamil ? 'பழுது பக்கத்திற்குச் செல்க' : 'Back to Repair Page'}
          </Button>
        </div>
      </div>
    );
  }

  const ticketId = ticket.enquiry_number || ticket.id;
  const serviceTitle = (ticket.product_name || 'Repair Service').replace('[REPAIR SERVICE]', '').trim();
  const isConverted = ticket.status === 'converted' || Boolean(ticket.converted_order_id);
  const isRejected = ticket.status === 'rejected';

  // Clean description — strip old "Scope:" prefix if present
  const rawNotes = ticket.custom_notes || '';
  const cleanDescription = rawNotes.startsWith('Scope:')
    ? rawNotes.replace(/^Scope:\s*/i, '').replace(/\.?\s*Photos:\s*\d+\.?$/i, '').trim()
    : rawNotes;

  // Extract urgency from size_requirement (strip 'Urgency:' prefix)
  const urgencyRaw = ticket.size_requirement || '';
  const urgencyLabel = urgencyRaw.replace(/^Urgency:\s*/i, '').trim() || 'STANDARD';

  // Determine Timeline Step (1: Submitted, 2: Inspection, 3: Machining, 4: Ready)
  let currentStep = 1;
  if (isConverted) {
    currentStep = 3;
  }

  // Images — support both 'images' array and 'primary_image' string
  const imagesList: string[] = [];
  if (Array.isArray(ticket.images)) {
    ticket.images.forEach((u: string) => { if (u) imagesList.push(u); });
  } else if (ticket.primary_image) {
    imagesList.push(ticket.primary_image);
  }

  return (
    <div className="min-h-screen bg-warm-bg pb-32 md:pb-16 pt-4">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-4">
        
        {/* Top Header Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/repair')}
            className="inline-flex items-center gap-2 p-2 text-charcoal-700 bg-white rounded-full border border-warm-border shadow-sm hover:bg-warm-bg transition-colors text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4 text-brand-600" />
            <span>{isTamil ? 'கோரிக்கைகள் பட்டியல்' : 'All Repairs'}</span>
          </button>

          <a
            href={`tel:${DEFAULT_SHOP_INFO.phone}`}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-brand-50 text-brand-700 font-extrabold px-3.5 py-1.5 rounded-full border border-warm-border text-xs transition-colors shadow-xs"
          >
            <Phone className="w-3.5 h-3.5 text-brand-600" />
            <span>{DEFAULT_SHOP_INFO.phone}</span>
          </a>
        </div>

        {/* Top Ticket Status Banner */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-warm-border shadow-card space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-black text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
                  #{ticketId}
                </span>
                <button
                  type="button"
                  onClick={handleCopyTicketId}
                  className="p-1 text-charcoal-400 hover:text-brand-600 transition-colors"
                  title="Copy Ticket ID"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <h1 className="text-base sm:text-lg font-black text-charcoal-900 mt-2 leading-snug">
                {serviceTitle}
              </h1>

              <div className="flex items-center gap-2 text-xs text-charcoal-500 font-medium mt-1">
                <Calendar className="w-3.5 h-3.5 text-charcoal-400" />
                <span>{ticket.created_at ? new Date(ticket.created_at).toLocaleString() : 'Recently Submitted'}</span>
              </div>
            </div>

            <span className={`text-xs font-black uppercase px-3 py-1 rounded-full shrink-0 ${
              isConverted
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : isRejected
                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}>
              {isConverted 
                ? (isTamil ? 'ஏற்றுக்கொள்ளப்பட்டது' : 'Accepted / Quoted') 
                : isRejected 
                ? (isTamil ? 'நிராகரிக்கப்பட்டது' : 'Rejected') 
                : (isTamil ? 'ஆய்வில் உள்ளது' : 'Pending Inspection')}
            </span>
          </div>
        </div>

        {/* Live Progress Tracker Timeline */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-warm-border shadow-card space-y-4">
          <h2 className="text-xs font-black text-charcoal-900 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-600" />
            <span>{isTamil ? 'வேலை நிலை அறிதல்' : 'Live Repair Status'}</span>
          </h2>

          <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-warm-border">
            
            {/* Step 1: Request Submitted */}
            <div className="relative">
              <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center ${
                currentStep >= 1 ? 'bg-emerald-600 text-white' : 'bg-warm-muted text-charcoal-400'
              }`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-xs font-extrabold text-charcoal-900">
                  {isTamil ? '1. கோரிக்கை பதிவு செய்யப்பட்டது' : '1. Request Received'}
                </h3>
                <p className="text-[11px] text-charcoal-500 font-medium">
                  {isTamil 
                    ? 'உங்கள் பழுது பார்க்கும் விவரம் பட்டறைக்கு வந்துள்ளது.' 
                    : 'Ticket details sent to workshop supervisor.'}
                </p>
              </div>
            </div>

            {/* Step 2: Inspection & Estimation */}
            <div className="relative">
              <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center ${
                currentStep >= 2 ? 'bg-emerald-600 text-white' : isConverted ? 'bg-emerald-600 text-white' : 'bg-brand-500 text-white animate-pulse'
              }`}>
                <Wrench className="w-3 h-3" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-xs font-extrabold text-charcoal-900">
                  {isTamil ? '2. பட்டறை ஆய்வு & மதிப்பீடு' : '2. Workshop Inspection & Quote'}
                </h3>
                <p className="text-[11px] text-charcoal-500 font-medium">
                  {isTamil 
                    ? 'உடைந்த பாகத்தின் பரிமாணங்களை ஆய்வு செய்து கட்டணம் உறுதி செய்தல்.' 
                    : 'Technical inspection of damaged axle/implement & cost estimation.'}
                </p>
              </div>
            </div>

            {/* Step 3: Lathe Machining / Fabrication */}
            <div className="relative">
              <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center ${
                isConverted ? 'bg-emerald-600 text-white' : 'bg-warm-muted text-charcoal-400'
              }`}>
                <Sparkles className="w-3 h-3" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-xs font-extrabold text-charcoal-900">
                  {isTamil ? '3. லேத் வேலை & வெல்டிங்' : '3. Machining & ARC Welding'}
                </h3>
                <p className="text-[11px] text-charcoal-500 font-medium">
                  {isTamil 
                    ? 'துல்லிய லேத் டர்னிங், ஹைட்ராலிக் பிரஸ் நேராக்குதல் & வெல்டிங்.' 
                    : 'Lathe precision machining, shaft turning, and reinforcement welding.'}
                </p>
              </div>
            </div>

            {/* Step 4: Ready for Delivery */}
            <div className="relative">
              <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center ${
                ticket.status === 'completed' ? 'bg-emerald-600 text-white' : 'bg-warm-muted text-charcoal-400'
              }`}>
                <Package className="w-3 h-3" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-xs font-extrabold text-charcoal-900">
                  {isTamil ? '4. வேலை முடிந்தது / விநியோகத்திற்கு தயார்' : '4. Completed & Ready for Pickup'}
                </h3>
                <p className="text-[11px] text-charcoal-500 font-medium">
                  {isTamil 
                    ? 'பட்டறையில் பெற்றுக்கொள்ளலாம் அல்லது டெலிவரி செய்யப்படும்.' 
                    : 'Quality checked and ready at workshop in Kallimandhayam.'}
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Issue Description & Customer Notes */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-warm-border shadow-card space-y-3">
          <h2 className="text-xs font-black text-charcoal-900 uppercase tracking-wider">
            {isTamil ? 'பழுது விபரம் & குறிப்புகள்' : 'Problem Description & Details'}
          </h2>

          <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200 text-xs text-charcoal-800 font-medium leading-relaxed">
            {cleanDescription || (isTamil ? 'விபரம் எதுவும் குறிப்பிடப்படவில்லை' : 'No additional notes provided.')}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
            <div className="bg-warm-bg p-3 rounded-xl border border-warm-border">
              <span className="text-[10px] font-bold text-charcoal-400 block uppercase">
                {isTamil ? 'தேவை நிலை' : 'Urgency'}
              </span>
              <span className="font-extrabold text-brand-700">
                {urgencyLabel}
              </span>
            </div>

            <div className="bg-warm-bg p-3 rounded-xl border border-warm-border">
              <span className="text-[10px] font-bold text-charcoal-400 block uppercase">
                {isTamil ? 'இடம்' : 'Location'}
              </span>
              <span className="font-extrabold text-charcoal-900">
                {ticket.delivery_location || 'Kallimandhayam'}
              </span>
            </div>
          </div>
        </div>

        {/* Uploaded Damage Photos Gallery */}
        {imagesList.length > 0 && (
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-warm-border shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black text-charcoal-900 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-brand-600" />
                <span>{isTamil ? 'இணைக்கப்பட்ட புகைப்படங்கள்' : 'Attached Photos'}</span>
              </h2>
              <span className="text-xs font-bold text-charcoal-400">{imagesList.length} Photos</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {imagesList.map((imgUrl: string, idx: number) => (
                <div
                  key={idx}
                  onClick={() => setSelectedImage(imgUrl)}
                  className="group relative h-28 sm:h-32 rounded-2xl overflow-hidden border border-warm-border shadow-xs cursor-pointer bg-warm-bg"
                >
                  <img
                    src={imgUrl}
                    alt={`Damaged part ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                    <span>{isTamil ? 'பெரிதாக்குக' : 'Zoom'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* If converted to an order, show direct link */}
        {isConverted && (
          <div className="bg-emerald-50 rounded-3xl p-5 border-2 border-emerald-300 shadow-sm flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider bg-emerald-200/80 px-2 py-0.5 rounded-full">
                {isTamil ? 'உறுதிசெய்யப்பட்ட ஆர்டர்' : 'CONFIRMED ORDER'}
              </span>
              <h3 className="text-sm font-black text-emerald-950 mt-1">
                {isTamil ? 'இந்த வேலை ஆர்டராக மாற்றப்பட்டது' : 'This repair is converted to an active order'}
              </h3>
            </div>

            <Link
              to={`/orders/${ticket.converted_order_id || 'MNK-ORD-1'}`}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs shadow-md transition-colors shrink-0"
            >
              <span>{isTamil ? 'ஆர்டர் அறிதல்' : 'Track Order'}</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Workshop Contact Details Card */}
        <div className="bg-white rounded-3xl p-5 border border-warm-border shadow-card space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-black text-lg border border-brand-200">
              🛠️
            </div>
            <div>
              <h3 className="text-xs font-black text-charcoal-900">{DEFAULT_SHOP_INFO.name}</h3>
              <p className="text-[11px] text-charcoal-500 font-medium">
                {DEFAULT_SHOP_INFO.address}
              </p>
            </div>
          </div>
        </div>

        {/* Fixed Bottom Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-warm-border z-40">
          <div className="max-w-2xl mx-auto flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 px-4 rounded-2xl text-xs sm:text-sm shadow-md transition-all active:scale-98"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{isTamil ? 'வாட்ஸ்அப் உரையாடல்' : 'WhatsApp Shop'}</span>
            </button>

            <a
              href={`tel:${DEFAULT_SHOP_INFO.phone}`}
              className="inline-flex items-center justify-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white font-extrabold py-3.5 px-5 rounded-2xl text-xs sm:text-sm shadow-md transition-all active:scale-98"
            >
              <Phone className="w-4 h-4" />
              <span>{isTamil ? 'அழைக்க' : 'Call'}</span>
            </a>
          </div>
        </div>

        {/* Zoom Image Modal */}
        {selectedImage && (
          <Modal
            isOpen={Boolean(selectedImage)}
            onClose={() => setSelectedImage(null)}
            title={isTamil ? 'புகைப்படம்' : 'Damaged Part Photo'}
          >
            <div className="space-y-3">
              <img
                src={selectedImage}
                alt="Enlarged part preview"
                className="w-full max-h-[70vh] object-contain rounded-2xl"
              />
              <Button
                variant="outline"
                fullWidth
                onClick={() => setSelectedImage(null)}
                className="rounded-xl"
              >
                {isTamil ? 'மூடுக' : 'Close'}
              </Button>
            </div>
          </Modal>
        )}

      </div>
    </div>
  );
};

export default RepairDetailPage;
