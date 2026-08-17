import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Wrench, 
  Phone, 
  MessageSquare, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Eye, 
  ShoppingBag, 
  User, 
  Clock, 
  AlertTriangle, 
  Sparkles,
  Zap,
  DollarSign,
  Maximize2,
  Calendar,
  Filter
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { NotificationModal } from '../../components/common/NotificationModal';
import { ImageLightboxModal } from '../../components/common/ImageLightboxModal';
import { DEFAULT_SHOP_INFO, supabase } from '../../lib/supabase';
import { convertEnquiryToOrderSafely } from '../../lib/orderConversionService';

export const AdminRepairRequestsPage: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'urgent' | 'accepted' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [repairRequests, setRepairRequests] = useState<any[]>([]);

  // Quote & Conversion Modal State
  const [selectedRepairForQuote, setSelectedRepairForQuote] = useState<any | null>(null);
  const [quoteAmount, setQuoteAmount] = useState<number>(1500);
  const [advanceAmount, setAdvanceAmount] = useState<number>(500);
  const [estimatedDays, setEstimatedDays] = useState<number>(2);
  const [quoteNotes, setQuoteNotes] = useState<string>('Lathe turning, shaft alignment & heavy ARC welding');
  const [isConverting, setIsConverting] = useState(false);

  // Fullscreen Image Lightbox
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Notification Modal
  const [notifyModal, setNotifyModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'error' | 'warning' | 'success' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchRepairRequests();

    const channel = supabase
      .channel('admin-repairs-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'enquiries' }, () => {
        fetchRepairRequests();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchRepairRequests();
      })
      .subscribe();

    const poll = setInterval(fetchRepairRequests, 15000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, []);

  const fetchRepairRequests = async () => {
    setLoading(true);
    try {
      // 1. Fetch all enquiries
      const { data: dbEnquiries, error } = await supabase
        .from('enquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 2. Fetch all orders to identify converted repair orders
      const { data: dbOrders } = await supabase.from('orders').select('*');
      const orderLinkedMap = new Map<string, any>();
      (dbOrders || []).forEach((o: any) => {
        if (o.enquiry_id) orderLinkedMap.set(o.enquiry_id, o);
        if (o.order_number) orderLinkedMap.set(o.order_number, o);
        if (o.id) orderLinkedMap.set(o.id, o);
      });

      // 3. Filter only Repair & Machining Requests
      const list = (dbEnquiries || []).filter((e: any) => {
        const pName = String(e.product_name || e.productName || '').toLowerCase();
        const num = String(e.enquiry_number || e.number || e.id || '').toLowerCase();
        return (
          pName.includes('repair') ||
          pName.includes('machining') ||
          pName.includes('பழுது') ||
          pName.includes('shaft') ||
          pName.includes('டிராக்டர்') ||
          pName.includes('welding') ||
          num.includes('rep')
        );
      });

      const parsed = list.map((e: any) => {
        const matchedOrder = e.converted_order_id
          ? (dbOrders || []).find((o: any) => o.id === e.converted_order_id || o.order_number === e.converted_order_id)
          : (orderLinkedMap.get(e.id) || orderLinkedMap.get(e.enquiry_number));

        const isAccepted = e.status === 'converted' || e.status === 'accepted' || Boolean(matchedOrder);
        const orderNum = matchedOrder?.order_number || e.converted_order_id || '';

        // Extract photos if attached in custom_notes or photo array
        let photoUrls: string[] = [];
        if (e.images && Array.isArray(e.images)) {
          photoUrls = e.images;
        } else if (e.primary_image) {
          photoUrls = [e.primary_image];
        }

        const isUrgent = String(e.size_requirement || '').toLowerCase().includes('urgent');
        const isEmergency = String(e.size_requirement || '').toLowerCase().includes('emergency') || String(e.size_requirement || '').toLowerCase().includes('same-day');

        return {
          ...e,
          isAccepted,
          convertedOrderNum: orderNum,
          photos: photoUrls,
          isUrgent,
          isEmergency,
          serviceTitle: (e.product_name || e.productName || 'Machining & Repair Service').replace('[REPAIR SERVICE]', '').trim(),
          customerName: e.customer_name || e.customerName || 'Customer',
          customerPhone: e.customer_phone || e.phone || '',
          location: e.delivery_location || 'Kallimandhayam',
          ticketId: e.enquiry_number || e.number || e.id,
        };
      });

      setRepairRequests(parsed);
    } catch (e) {
      console.warn('Failed to load repair requests:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenQuoteModal = (repair: any) => {
    setSelectedRepairForQuote(repair);
    setQuoteAmount(1500);
    setAdvanceAmount(500);
    setEstimatedDays(2);
    setQuoteNotes('Lathe turning, shaft alignment & heavy ARC welding');
  };

  const handleAcceptAndConvert = async () => {
    if (!selectedRepairForQuote) return;
    setIsConverting(true);

    try {
      const result = await convertEnquiryToOrderSafely({
        enquiry: selectedRepairForQuote,
        quotePrice: quoteAmount,
        advanceRequired: advanceAmount,
        estimatedDays: estimatedDays,
      });

      const orderNumber = result.order?.order_number || result.order?.id || 'MNK-ORD-1';

      // Update state
      setRepairRequests((prev) =>
        prev.map((r) =>
          r.id === selectedRepairForQuote.id
            ? { ...r, isAccepted: true, convertedOrderNum: orderNumber, status: 'converted' }
            : r
        )
      );

      // Send WhatsApp Quote with confirmation
      const rawPhone = String(selectedRepairForQuote.customerPhone || '').replace(/[^0-9]/g, '');
      const targetPhone = rawPhone.startsWith('91') ? rawPhone : `91${rawPhone}`;
      const text = encodeURIComponent(
        `🛠️ *MANIKANDAN LATHE WORKS - REPAIR JOB ACCEPTED*\n` +
        `--------------------------------------\n` +
        `📌 *Ticket Ref:* #${selectedRepairForQuote.ticketId}\n` +
        `📦 *Active Order:* #${orderNumber}\n` +
        `🔧 *Job:* ${selectedRepairForQuote.serviceTitle}\n` +
        `💰 *Estimated Cost:* ₹${quoteAmount.toLocaleString('en-IN')}\n` +
        `⏳ *Estimated Duration:* ${estimatedDays} Day(s)\n` +
        `--------------------------------------\n` +
        `Hello ${selectedRepairForQuote.customerName}! We have reviewed your machinery repair request and accepted the job.\n` +
        `Please bring the part to our Kallimandhayam workshop counter.`
      );

      window.open(`https://wa.me/${targetPhone}?text=${text}`, '_blank');

      setSelectedRepairForQuote(null);
      setNotifyModal({
        isOpen: true,
        title: 'Repair Job Accepted & Created',
        message: `Order #${orderNumber} created for ₹${quoteAmount.toLocaleString('en-IN')}. Customer notified via WhatsApp.`,
        type: 'success',
      });
    } catch (err: any) {
      setNotifyModal({
        isOpen: true,
        title: 'Error Accepting Request',
        message: err?.message || 'Could not convert repair request to order.',
        type: 'error',
      });
    } finally {
      setIsConverting(false);
    }
  };

  const handleRejectRepair = async (repairId: string) => {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(repairId);
    try {
      if (isUuid) {
        await supabase.from('enquiries').update({ status: 'rejected' }).eq('id', repairId);
      }
      setRepairRequests((prev) =>
        prev.map((r) => (r.id === repairId ? { ...r, status: 'rejected' } : r))
      );
    } catch (e) {}

    setNotifyModal({
      isOpen: true,
      title: 'Repair Request Rejected',
      message: 'Repair request has been marked as rejected.',
      type: 'info',
    });
  };

  const handleOpenWhatsAppReply = (repair: any) => {
    const rawPhone = String(repair.customerPhone || '').replace(/[^0-9]/g, '');
    const targetPhone = rawPhone.startsWith('91') ? rawPhone : `91${rawPhone}`;
    const text = encodeURIComponent(
      `🛠️ *MANIKANDAN LATHE WORKS*\n` +
      `--------------------------------------\n` +
      `📌 *Repair Ticket:* #${repair.ticketId}\n` +
      `🔧 *Item:* ${repair.serviceTitle}\n` +
      `👤 *Customer:* ${repair.customerName}\n` +
      `--------------------------------------\n` +
      `Hello ${repair.customerName}! Regarding your lathe machining / repair enquiry, please share more details or visit our shop.`
    );
    window.open(`https://wa.me/${targetPhone}?text=${text}`, '_blank');
  };

  const filteredRequests = repairRequests.filter((r) => {
    if (filter === 'pending' && (r.isAccepted || r.status === 'rejected')) return false;
    if (filter === 'urgent' && !r.isUrgent && !r.isEmergency) return false;
    if (filter === 'accepted' && !r.isAccepted) return false;
    if (filter === 'rejected' && r.status !== 'rejected') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.ticketId.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        r.customerPhone.includes(q) ||
        r.serviceTitle.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-charcoal-900">Machining & Lathe Repair Requests</h1>
            <span className="bg-brand-100 text-brand-700 text-xs font-black px-3 py-1 rounded-full border border-brand-200">
              {repairRequests.length} Total Tickets
            </span>
          </div>
          <p className="text-xs text-charcoal-500 font-semibold mt-0.5">
            Review incoming broken tractor parts, shaft turning, motor machining & provide repair quotes
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-white p-1 rounded-2xl border border-warm-border shadow-sm">
          {[
            { id: 'all', label: `All (${repairRequests.length})` },
            { id: 'pending', label: `New (${repairRequests.filter((r) => !r.isAccepted && r.status !== 'rejected').length})` },
            { id: 'urgent', label: `Urgent (${repairRequests.filter((r) => r.isUrgent || r.isEmergency).length})` },
            { id: 'accepted', label: `Accepted (${repairRequests.filter((r) => r.isAccepted).length})` },
            { id: 'rejected', label: `Rejected (${repairRequests.filter((r) => r.status === 'rejected').length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                filter === tab.id
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-charcoal-700 hover:bg-warm-hover'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by ticket #, customer name, phone, service, or village..."
          className="w-full pl-10 pr-4 py-2.5 text-xs font-bold border border-warm-border rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
        />
      </div>

      {/* Repair Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full bg-white p-12 text-center rounded-3xl border border-warm-border space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-3 border-brand-500 border-t-transparent mx-auto" />
            <p className="text-xs font-bold text-charcoal-600">Loading live repair requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="col-span-full bg-white p-12 text-center rounded-3xl border border-warm-border space-y-3">
            <Wrench className="w-12 h-12 text-brand-600 mx-auto" />
            <h3 className="text-base font-black text-charcoal-900">No repair tickets found</h3>
            <p className="text-xs text-charcoal-500 font-medium">
              Requests submitted by farmers & customers from the website will appear here in real time.
            </p>
          </div>
        ) : (
          filteredRequests.map((rep) => (
            <div
              key={rep.id}
              className="bg-white rounded-3xl p-5 border border-warm-border shadow-card hover:shadow-warm-md transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 border-b border-warm-muted pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-extrabold text-brand-600 uppercase">
                        #{rep.ticketId}
                      </span>
                      {rep.isEmergency && (
                        <span className="bg-rose-100 text-rose-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-rose-300 animate-pulse">
                          🚨 Same-Day Emergency
                        </span>
                      )}
                      {rep.isUrgent && !rep.isEmergency && (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-amber-300">
                          ⚡ Urgent 24h
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-black text-charcoal-900 mt-1">
                      {rep.serviceTitle}
                    </h3>
                  </div>

                  <Badge variant={rep.isAccepted ? 'accepted' : rep.status === 'rejected' ? 'rejected' : 'pending'}>
                    {rep.isAccepted ? 'ACCEPTED' : (rep.status || 'pending').toUpperCase()}
                  </Badge>
                </div>

                {/* Customer Details */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-warm-bg p-3 rounded-2xl border border-warm-border">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-charcoal-400 uppercase block">Customer</span>
                    <span className="font-extrabold text-charcoal-900 block">{rep.customerName}</span>
                    <a href={`tel:${rep.customerPhone}`} className="text-brand-600 font-mono font-bold hover:underline block">
                      {rep.customerPhone || '-'}
                    </a>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-charcoal-400 uppercase block">Location</span>
                    <span className="font-bold text-charcoal-800 block">{rep.location}</span>
                    <span className="text-[10px] text-charcoal-400 block font-mono">
                      {rep.created_at ? new Date(rep.created_at).toLocaleDateString() : 'Today'}
                    </span>
                  </div>
                </div>

                {/* Issue Description */}
                {rep.custom_notes && (
                  <div className="text-xs text-charcoal-700 bg-amber-50/70 p-3 rounded-2xl border border-amber-200 space-y-1">
                    <span className="text-[10px] font-black text-amber-800 uppercase block">Reported Problem:</span>
                    <p className="font-medium leading-relaxed">{rep.custom_notes}</p>
                  </div>
                )}

                {/* Damaged Part Photos Inspection */}
                {rep.photos && rep.photos.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black text-charcoal-500 uppercase block">
                      Attached Photos ({rep.photos.length}) — Click to Inspect:
                    </span>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {rep.photos.map((url: string, idx: number) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setLightboxImages(rep.photos);
                            setLightboxOpen(true);
                          }}
                          className="relative w-16 h-16 rounded-xl overflow-hidden border border-warm-border group shrink-0 shadow-xs"
                        >
                          <img src={url} alt="Damaged part" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                            <Maximize2 className="w-4 h-4" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-warm-border flex flex-col space-y-2">
                {!rep.isAccepted && rep.status !== 'rejected' ? (
                  <div className="space-y-2">
                    <Button
                      onClick={() => handleOpenQuoteModal(rep)}
                      variant="primary"
                      fullWidth
                      className="bg-emerald-600 hover:bg-emerald-700 font-black text-xs py-2.5 shadow-md text-white"
                      icon={<DollarSign className="w-4 h-4" />}
                    >
                      Provide Quote & Accept Job
                    </Button>

                    <div className="grid grid-cols-3 gap-2">
                      <a
                        href={`tel:${rep.customerPhone}`}
                        className="inline-flex items-center justify-center gap-1 bg-warm-bg hover:bg-brand-50 text-brand-700 font-extrabold py-2 px-2 rounded-xl text-xs border border-brand-200 transition-colors text-center"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call</span>
                      </a>

                      <button
                        onClick={() => handleOpenWhatsAppReply(rep)}
                        className="inline-flex items-center justify-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold py-2 px-2 rounded-xl text-xs border border-emerald-200 transition-colors text-center"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>

                      <button
                        onClick={() => handleRejectRepair(rep.id)}
                        className="inline-flex items-center justify-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 font-extrabold py-2 px-2 rounded-xl text-xs border border-red-200 transition-colors text-center"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ) : rep.isAccepted ? (
                  <div className="space-y-2">
                    <Link
                      to={`/admin/orders/${rep.convertedOrderNum || 'MNK-ORD-1'}`}
                      className="w-full inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 px-4 rounded-2xl text-xs shadow-md transition-colors"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>View Active Job Order (#{rep.convertedOrderNum})</span>
                    </Link>

                    <button
                      onClick={() => handleOpenWhatsAppReply(rep)}
                      className="w-full inline-flex items-center justify-center gap-1 bg-warm-bg hover:bg-emerald-50 text-emerald-700 font-extrabold py-2 px-3 rounded-xl text-xs border border-emerald-200 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat on WhatsApp</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <Badge variant="rejected">REJECTED</Badge>
                    <button
                      onClick={() => handleOpenQuoteModal(rep)}
                      className="text-xs font-bold text-brand-600 hover:underline"
                    >
                      Re-open Request
                    </button>
                  </div>
                )}
              </div>

            </div>
          ))
        )}
      </div>

      {/* QUOTE & CONVERT TO ORDER MODAL */}
      {selectedRepairForQuote && (
        <Modal
          isOpen={Boolean(selectedRepairForQuote)}
          onClose={() => setSelectedRepairForQuote(null)}
          title={`Quote & Accept Repair - #${selectedRepairForQuote.ticketId}`}
          maxWidth="md"
        >
          <div className="space-y-4 py-2">
            <div className="bg-warm-bg p-3.5 rounded-2xl border border-warm-border">
              <span className="text-[10px] font-black uppercase text-brand-600 block">REPAIR ITEM</span>
              <h4 className="text-sm font-black text-charcoal-900">{selectedRepairForQuote.serviceTitle}</h4>
              <p className="text-xs text-charcoal-600 font-medium mt-0.5">
                Customer: <strong>{selectedRepairForQuote.customerName}</strong> ({selectedRepairForQuote.customerPhone})
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-charcoal-700 mb-1">
                  Estimated Repair Cost (₹) *
                </label>
                <input
                  type="number"
                  required
                  value={quoteAmount}
                  onChange={(e) => setQuoteAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 text-sm font-extrabold border border-warm-border rounded-xl bg-white focus:ring-2 focus:ring-brand-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-700 mb-1">
                  Advance Required (₹)
                </label>
                <input
                  type="number"
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 text-sm font-extrabold border border-warm-border rounded-xl bg-white focus:ring-2 focus:ring-brand-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal-700 mb-1">
                Estimated Turnaround Duration (Days)
              </label>
              <input
                type="number"
                value={estimatedDays}
                onChange={(e) => setEstimatedDays(parseInt(e.target.value) || 1)}
                className="w-full px-3.5 py-2 text-xs font-extrabold border border-warm-border rounded-xl bg-white focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal-700 mb-1">
                Machining & Repair Work Scope Notes
              </label>
              <input
                type="text"
                value={quoteNotes}
                onChange={(e) => setQuoteNotes(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-warm-border rounded-xl bg-white focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="pt-2 flex items-center gap-2">
              <Button
                onClick={handleAcceptAndConvert}
                disabled={isConverting || quoteAmount <= 0}
                variant="primary"
                fullWidth
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black"
                icon={<CheckCircle2 className="w-4 h-4" />}
              >
                {isConverting ? 'Creating Order...' : `Accept & Send Quote (₹${quoteAmount.toLocaleString('en-IN')})`}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* FULLSCREEN IMAGE LIGHTBOX */}
      <ImageLightboxModal
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        images={lightboxImages}
        productTitle="Damaged Part Inspection"
      />

      {/* NOTIFICATION MODAL */}
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
