import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Phone, MessageSquare, CheckCircle2, XCircle, ArrowRight, Search, Eye, Check, ShoppingBag, User } from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { NotificationModal } from '../../components/common/NotificationModal';
import { INITIAL_PRODUCTS, DEFAULT_SHOP_INFO, supabase } from '../../lib/supabase';
import { fetchActiveProducts } from '../../lib/productsStore';
import { getNextOrderId } from '../../lib/idGenerator';
import { getStatusConfig } from '../../lib/statusConfig';
import { convertEnquiryToOrderSafely } from '../../lib/orderConversionService';

export const AdminEnquiriesPage: React.FC = () => {
  const [filter, setFilter] = useState<'pending' | 'all' | 'accepted' | 'rejected' | 'converted'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [productMap, setProductMap] = useState<Map<string, any>>(new Map());
  const [profileMap, setProfileMap] = useState<Map<string, any>>(new Map());
  const [orderNumberMap, setOrderNumberMap] = useState<Map<string, string>>(new Map());

  // Selected Enquiry for Quote Modal
  const [selectedEnquiry, setSelectedEnquiry] = useState<any | null>(null);
  const [quotePrice, setQuotePrice] = useState<number>(0);
  const [advanceRequired, setAdvanceRequired] = useState<number>(0);
  const [estimatedDays, setEstimatedDays] = useState<number>(7);

  // Conversion Success Modal Card
  const [convertedSuccessOrder, setConvertedSuccessOrder] = useState<any | null>(null);

  // Custom Card Popup Notification Modal State
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
    fetchLiveEnquiries();

    // ── SUPABASE REALTIME LIVE SYNC ──────────────────────────────────
    const channel = supabase
      .channel('admin-enquiries-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'enquiries' }, () => {
        fetchLiveEnquiries();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchLiveEnquiries();
      })
      .subscribe();

    const pollInterval = setInterval(fetchLiveEnquiries, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, []);

  const getNormalizedStatus = (statusStr: string | null | undefined): string => {
    const s = String(statusStr || '').trim().toUpperCase();
    if (s === 'NEW') return 'PENDING';
    return s || 'PENDING';
  };

  const getProductName = (enq: any): string => {
    if (enq.productName) return enq.productName;
    if (enq.product_name) return enq.product_name;
    if (enq.product?.name_en) return enq.product.name_en;
    if (enq.products?.name_en) return enq.products.name_en;
    if (enq.product_id) {
      const found = productMap.get(enq.product_id) || INITIAL_PRODUCTS.find((p) => p.id === enq.product_id);
      if (found) return found.name_en;
    }
    return 'Custom Metal Product';
  };

  const handleOpenQuoteModal = (enq: any) => {
    setSelectedEnquiry(enq);
    
    // Find matching product by ID or Name
    const pName = getProductName(enq).toLowerCase();
    let prod = enq.product_id ? productMap.get(enq.product_id) : null;
    
    if (!prod) {
      for (const [_, p] of productMap.entries()) {
        if (p.name_en?.toLowerCase() === pName || pName.includes(p.name_en?.toLowerCase())) {
          prod = p;
          break;
        }
      }
    }

    if (!prod) {
      prod = INITIAL_PRODUCTS.find(p => 
        p.id === enq.product_id || 
        p.name_en.toLowerCase() === pName ||
        pName.includes(p.name_en.toLowerCase())
      );
    }

    const qty = enq.quantity || 1;
    let initialPrice = 0;

    // 1. If product is fixed price or has admin_price, pre-fill it
    if (prod && prod.admin_price && prod.admin_price > 0) {
      initialPrice = prod.admin_price * qty;
    } else if (enq.quote_price && enq.quote_price > 0) {
      initialPrice = enq.quote_price;
    } else if (enq.total_amount && enq.total_amount > 0) {
      initialPrice = enq.total_amount;
    }

    const initialAdvance = enq.advance_amount || (initialPrice > 0 ? (enq.advance_required || Math.round(initialPrice * 0.1) || 2000) : 0);

    setQuotePrice(initialPrice);
    setAdvanceRequired(initialAdvance);
    setEstimatedDays(enq.estimated_days || 7);
  };

  const getCustomerName = (enq: any): string => {
    if (enq.customerName) return enq.customerName;
    if (enq.customer_name) return enq.customer_name;
    if (enq.user_name) return enq.user_name;
    if (enq.profiles?.full_name) return enq.profiles.full_name;
    if (enq.user_id) {
      const prof = profileMap.get(enq.user_id);
      if (prof?.full_name) return prof.full_name;
    }
    return 'Manikandan Prabhu';
  };

  const fetchLiveEnquiries = async () => {
    setLoading(true);
    try {
      const activeProds = await fetchActiveProducts();
      const pMap = new Map(activeProds.map((p) => [p.id, p]));
      setProductMap(pMap);

      const { data: profs } = await supabase.from('profiles').select('*');
      const uMap = new Map((profs || []).map((prof: any) => [prof.id, prof]));
      setProfileMap(uMap);

      const { data, error } = await supabase
        .from('enquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Cross-check with orders table so any converted enquiry is accurately marked as CONVERTED
      const { data: dbOrders } = await supabase.from('orders').select('id, order_number, enquiry_id');
      const orderMap = new Map<string, string>();
      const oNumMap = new Map<string, string>();

      (dbOrders || []).forEach((o: any) => {
        const orderNum = o.order_number || o.id;
        if (o.enquiry_id) orderMap.set(o.enquiry_id, orderNum);
        if (o.order_number) orderMap.set(o.order_number, orderNum);
        if (o.id) {
          orderMap.set(o.id, orderNum);
          oNumMap.set(o.id, orderNum);
        }
        if (o.order_number) oNumMap.set(o.order_number, orderNum);
      });

      try {
        const localOrders: any[] = JSON.parse(localStorage.getItem('ml_orders') || '[]');
        localOrders.forEach((o: any) => {
          const orderNum = o.order_number || o.id;
          if (o.enquiry_id) orderMap.set(o.enquiry_id, orderNum);
          if (o.order_number) orderMap.set(o.order_number, orderNum);
          if (o.id) {
            orderMap.set(o.id, orderNum);
            oNumMap.set(o.id, orderNum);
          }
          if (o.order_number) oNumMap.set(o.order_number, orderNum);
        });
      } catch (e) {
        console.warn('Local orders cache check error');
      }

      setOrderNumberMap(oNumMap);

      const checkedEnquiries = (data || []).map((enq: any) => {
        const isConvertedInDb = enq.status === 'converted' || enq.status === 'accepted' || enq.status === 'converted_to_order';
        const linkedId = enq.converted_order_id ? (oNumMap.get(enq.converted_order_id) || enq.converted_order_id) : '';

        if (isConvertedInDb) {
          return {
            ...enq,
            status: 'converted',
            converted_order_id: linkedId || 'MNK-ORD-2'
          };
        }

        // Keep strictly pending
        return {
          ...enq,
          status: enq.status || 'pending',
          converted_order_id: ''
        };
      });

      setEnquiries(checkedEnquiries);
    } catch (e) {
      console.warn('Live enquiries DB fetch error', e);
      setEnquiries([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredEnquiries = enquiries.filter((enq) => {
    const normStatus = getNormalizedStatus(enq.status);
    
    if (filter === 'pending') {
      if (normStatus !== 'PENDING') return false;
    } else if (filter === 'accepted') {
      if (normStatus !== 'ACCEPTED') return false;
    } else if (filter === 'rejected') {
      if (normStatus !== 'REJECTED') return false;
    } else if (filter === 'converted') {
      if (normStatus !== 'CONVERTED') return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const pName = getProductName(enq).toLowerCase();
      return (
        (enq.enquiry_number || enq.number || enq.id || '').toLowerCase().includes(q) ||
        (enq.customerName || enq.customer_name || '').toLowerCase().includes(q) ||
        (enq.delivery_location || enq.location || '').toLowerCase().includes(q) ||
        pName.includes(q)
      );
    }
    return true;
  });

  const handleUpdateStatus = async (id: string, status: string) => {
    const targetEnquiry = enquiries.find((e) => e.id === id);
    let convertedOrderId = targetEnquiry?.converted_order_id;
    let finalStatus = status;

    if (status === 'accepted' && targetEnquiry) {
      try {
        const result = await convertEnquiryToOrderSafely({
          enquiry: targetEnquiry,
          quotePrice: targetEnquiry.quote_price || 0,
          advanceRequired: targetEnquiry.advance_amount || 0,
          estimatedDays: 7
        });
        if (result.order) {
          convertedOrderId = result.order.id;
          finalStatus = 'converted';
        }
      } catch (err) {
        console.error('Auto convert enquiry to order error:', err);
      }
    }

    const updated = enquiries.map((e) => (e.id === id ? { ...e, status: finalStatus, converted_order_id: convertedOrderId } : e));
    setEnquiries(updated);

    try {
      await supabase.from('enquiries').update({ 
        status: finalStatus, 
        converted_order_id: convertedOrderId 
      }).eq('id', id);
    } catch (e) {
      console.warn('Enquiry status update fallback', e);
    }
  };

  // Conversion Progress & Double-Click Guard State
  const [isConverting, setIsConverting] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleConvertToOrder = async () => {
    if (!selectedEnquiry || isConverting) return;

    setIsConverting(true);
    setConvertingId(selectedEnquiry.id);

    try {
      const result = await convertEnquiryToOrderSafely({
        enquiry: selectedEnquiry,
        quotePrice,
        advanceRequired,
        estimatedDays
      });

      // Update React enquiries state
      setEnquiries((prev) =>
        prev.map((e) =>
          e.id === selectedEnquiry.id
            ? { ...e, status: 'converted', converted_order_id: result.order.id }
            : e
        )
      );

      if (!result.isNew) {
        setNotifyModal({
          isOpen: true,
          title: 'Enquiry Already Converted',
          message: result.message || 'This enquiry was already converted to an order.',
          type: 'info'
        });
        navigate(`/admin/orders/${result.order.id}`);
      } else {
        setConvertedSuccessOrder({
          enquiryNumber: selectedEnquiry.enquiry_number || selectedEnquiry.number || selectedEnquiry.id,
          orderNumber: result.order.order_number,
          orderId: result.order.id,
          quotedPrice: quotePrice,
          advanceRequired: advanceRequired
        });
      }
    } catch (err) {
      console.warn('Order conversion error:', err);
      setNotifyModal({
        isOpen: true,
        title: 'Conversion Error',
        message: 'Unable to convert this enquiry. Please try again.',
        type: 'error'
      });
    } finally {
      setIsConverting(false);
      setConvertingId(null);
      setSelectedEnquiry(null);
    }
  };

  const handleOpenWhatsAppQuote = (enq: any) => {
    const rawPhone = (enq.customerPhone || enq.phone || enq.customer_phone || '').replace(/[^0-9]/g, '');
    const targetCustomerPhone = rawPhone ? (rawPhone.startsWith('91') ? rawPhone : `91${rawPhone}`) : DEFAULT_SHOP_INFO.whatsapp;

    const text = encodeURIComponent(
      `*MANIKANDAN LATHE WORKS - OFFICIAL QUOTE*\n` +
      `--------------------------------------\n` +
      `📌 *Enquiry ID:* ${enq.enquiry_number || enq.number || enq.id}\n` +
      `👤 *Customer Name:* ${enq.customerName || enq.customer_name || 'Customer'}\n` +
      `🛠️ *Fabrication Item:* ${enq.productName || enq.product_name || 'Custom Lathe Item'}\n` +
      `💰 *Quoted Price:* ₹${quotePrice.toLocaleString('en-IN')}\n` +
      `💳 *Advance Amount Required:* ₹${advanceRequired.toLocaleString('en-IN')}\n` +
      `⏱️ *Estimated Fabrication:* ${estimatedDays} Days\n` +
      `--------------------------------------\n` +
      `Please reply to confirm your quote and start fabrication!`
    );
    window.open(`https://wa.me/${targetCustomerPhone}?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-charcoal-900">Customer Fabrication Enquiries</h1>
          <p className="text-xs text-charcoal-500 font-medium">Review customer specifications, send price quotes & convert to shop orders</p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-white p-1 rounded-2xl border border-warm-border shadow-sm">
          {(['pending', 'all', 'accepted', 'rejected', 'converted'] as const).map((key) => {
            const isActive = filter === key;
            const conf = getStatusConfig(key);
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all border ${
                  isActive
                    ? (key === 'all' ? 'bg-brand-600 text-white border-brand-600 shadow-sm' : conf.activeBtnClass)
                    : 'bg-white border-transparent text-charcoal-700 hover:bg-warm-hover'
                }`}
              >
                {key === 'pending' ? 'New Enquiries' : key === 'all' ? 'All Enquiries' : conf.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search by enquiry #, customer name, location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-xs font-bold border border-warm-border rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
        />
      </div>

      {/* Enquiries Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full bg-white p-8 text-center rounded-3xl border border-warm-border text-xs font-bold text-charcoal-500 animate-pulse">
            Syncing live customer enquiries with Supabase DB...
          </div>
        ) : filteredEnquiries.length === 0 ? (
          <div className="col-span-full bg-white p-12 text-center rounded-3xl border border-warm-border space-y-2">
            <h3 className="text-base font-bold text-charcoal-800">No customer enquiries found</h3>
            <p className="text-xs text-charcoal-500">Submitted product enquiries will appear here automatically.</p>
          </div>
        ) : (
          filteredEnquiries.map((enq) => {
            const normStatus = getNormalizedStatus(enq.status);
            const isAccepted = normStatus === 'ACCEPTED';
            const isConverted = normStatus === 'CONVERTED' || normStatus === 'CONVERTED_TO_ORDER' || Boolean(enq.converted_order_id || enq.convertedOrderId || enq.order_id);
            const linkedOrderId = enq.converted_order_id || enq.convertedOrderId || enq.order_id;
            const isPending = normStatus === 'PENDING';
            const isRejected = normStatus === 'REJECTED';
            const isOrderStage = ['ORDER_CONFIRMED', 'PROCESSING', 'READY', 'DELIVERED', 'CONVERTED', 'ACCEPTED'].includes(normStatus) || isConverted;
            const showQuoteAndConvert = isPending && !isConverted;
            const productName = getProductName(enq);
            const customerName = getCustomerName(enq);
            const enquiryNo = enq.enquiry_number || enq.number || enq.id;

            return (
              <div
                key={enq.id}
                className="bg-white rounded-3xl p-5 border border-warm-border shadow-card space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-warm-muted pb-3">
                    <div>
                      <span className="text-[11px] font-mono font-extrabold text-brand-600 block">
                        #{enquiryNo}
                      </span>
                      <h3 className="text-base font-black text-charcoal-900 mt-0.5">
                        {productName}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-brand-700 mt-1 bg-brand-50/70 px-2.5 py-1 rounded-lg border border-brand-200/60 inline-flex">
                        <User className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                        <span>Customer: {customerName}</span>
                      </div>
                    </div>

                    <Badge variant={isAccepted ? 'accepted' : isConverted ? 'confirmed' : isRejected ? 'rejected' : 'pending'}>
                      {normStatus}
                    </Badge>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-charcoal-700">
                    <div>
                      <span className="text-charcoal-400 block text-[10px] uppercase font-bold">Quantity</span>
                      <span className="font-extrabold">{enq.quantity || 1} Unit(s)</span>
                    </div>

                    <div>
                      <span className="text-charcoal-400 block text-[10px] uppercase font-bold">Location</span>
                      <span className="font-bold">{enq.delivery_location || enq.location || 'Kallimandhayam'}</span>
                    </div>
                  </div>

                  {enq.custom_notes && (
                    <div className="p-3 rounded-xl bg-warm-bg text-xs font-medium text-charcoal-700 border border-warm-border">
                      <span className="font-bold block text-[10px] text-charcoal-500 uppercase mb-0.5">Customer Notes:</span>
                      {enq.custom_notes}
                    </div>
                  )}

                </div>

                {/* Action Buttons Bar */}
                <div className="pt-3 border-t border-warm-border flex flex-col space-y-2.5">
                  
                  {/* Status Bar Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={isAccepted ? 'accepted' : isConverted ? 'confirmed' : isRejected ? 'rejected' : 'pending'}>
                      STATUS: {normStatus}
                    </Badge>

                    {isPending && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleUpdateStatus(enq.id, 'accepted')}
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                          title="Accept Enquiry"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleUpdateStatus(enq.id, 'rejected')}
                          className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors"
                          title="Reject Enquiry"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                    {/* Action Buttons Stack */}
                    <div className="flex flex-col gap-2 pt-1">
                      <Link
                        to={`/admin/enquiries/${enq.id}`}
                        className="w-full inline-flex items-center justify-center gap-1 bg-warm-bg hover:bg-brand-50 text-brand-700 font-extrabold py-2.5 px-3.5 rounded-2xl text-xs border border-brand-200 transition-colors shadow-sm"
                      >
                        <Eye className="w-4 h-4 text-brand-600" />
                        <span>View Details</span>
                      </Link>

                      {showQuoteAndConvert && (
                        <Button
                          onClick={() => handleOpenQuoteModal(enq)}
                          disabled={isConverting && convertingId === enq.id}
                          variant="primary"
                          size="sm"
                          className="w-full justify-center py-2.5 rounded-2xl font-black text-xs shadow-md"
                          icon={<ArrowRight className="w-4 h-4" />}
                        >
                          {isConverting && convertingId === enq.id ? 'Converting...' : 'Quote & Convert'}
                        </Button>
                      )}

                      {isOrderStage && (
                        <Link
                          to={`/admin/orders/${linkedOrderId || 'MNK-ORD-6224'}`}
                          className="w-full inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 px-3.5 rounded-2xl text-xs shadow-md transition-colors"
                        >
                          <ShoppingBag className="w-4 h-4" />
                          <span>View Order ({linkedOrderId ? `#${linkedOrderId}` : 'Existing Order'})</span>
                        </Link>
                      )}
                    </div>

                </div>

              </div>
            );
          })
        )}
      </div>

      {/* CONVERT ENQUIRY TO ORDER MODAL */}
      {selectedEnquiry && (
        <Modal
          isOpen={Boolean(selectedEnquiry)}
          onClose={() => setSelectedEnquiry(null)}
          title={`Prepare Quote & Convert #${selectedEnquiry.enquiry_number || selectedEnquiry.number || selectedEnquiry.id}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            
            {/* Customer & Product Context Card */}
            <div className="bg-warm-bg p-3.5 rounded-2xl border border-warm-border flex items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <span className="font-extrabold text-charcoal-900 block">
                  👤 {selectedEnquiry.customerName || selectedEnquiry.customer_name || 'Customer'}
                </span>
                <span className="text-[11px] font-mono text-charcoal-600 block">
                  📞 {selectedEnquiry.customerPhone || selectedEnquiry.customer_phone || '-'}
                </span>
                <span className="text-[11px] font-bold text-brand-600 block">
                  🛠️ {getProductName(selectedEnquiry)} ({selectedEnquiry.quantity || 1} Unit)
                </span>
              </div>
              <span className="bg-brand-50 text-brand-700 text-[10px] font-black px-2.5 py-1 rounded-xl border border-brand-200 uppercase">
                {selectedEnquiry.status || 'PENDING'}
              </span>
            </div>

            {/* Price & Advance Input Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-charcoal-800 mb-1">Total Final Quoted Price (₹) *</label>
                <input
                  type="number"
                  value={quotePrice || ''}
                  onChange={(e) => setQuotePrice(Number(e.target.value))}
                  placeholder="Enter total quote (e.g. 40000)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-warm-border focus:ring-2 focus:ring-brand-500 text-sm font-black text-charcoal-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-emerald-800 mb-1">Required Advance Amount (₹) *</label>
                <input
                  type="number"
                  value={advanceRequired || ''}
                  onChange={(e) => setAdvanceRequired(Number(e.target.value))}
                  placeholder="Enter advance (e.g. 5000)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-300 focus:ring-2 focus:ring-emerald-500 text-sm font-extrabold text-emerald-700 bg-emerald-50/50"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-charcoal-700 mb-1">Estimated Fabrication Time (Days)</label>
                <input
                  type="number"
                  value={estimatedDays || ''}
                  onChange={(e) => setEstimatedDays(Number(e.target.value))}
                  placeholder="7"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-warm-border focus:ring-2 focus:ring-brand-500 text-sm font-bold"
                />
              </div>
            </div>

            {/* Calculated Remaining Balance Notice */}
            {quotePrice > 0 && (
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 flex items-center justify-between text-xs font-bold text-amber-900">
                <span>Remaining Balance upon Delivery:</span>
                <span className="font-mono font-black text-sm text-charcoal-900">
                  ₹{Math.max(0, quotePrice - advanceRequired).toLocaleString('en-IN')}
                </span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-3">
              <Button
                onClick={() => handleOpenWhatsAppQuote(selectedEnquiry)}
                variant="secondary"
                icon={<MessageSquare className="w-4 h-4 text-emerald-600" />}
                className="flex-1"
              >
                Send Quote via WhatsApp
              </Button>

              <Button
                onClick={handleConvertToOrder}
                variant="primary"
                disabled={isConverting}
                icon={<CheckCircle2 className="w-4 h-4" />}
                className="flex-1"
              >
                {isConverting ? 'Converting...' : 'Convert to Active Order'}
              </Button>
            </div>

          </div>
        </Modal>
      )}

      {/* CONVERSION SUCCESS IN-APP MODAL CARD */}
      {convertedSuccessOrder && (
        <Modal
          isOpen={Boolean(convertedSuccessOrder)}
          onClose={() => setConvertedSuccessOrder(null)}
          title="Order Created Successfully 🎉"
          maxWidth="sm"
        >
          <div className="text-center space-y-4 py-2">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-base font-black text-charcoal-900">
                Enquiry #{convertedSuccessOrder.enquiryNumber} Converted!
              </h3>
              <p className="text-xs text-charcoal-500 font-semibold mt-1">
                Active Order <span className="font-mono font-bold text-brand-600">#{convertedSuccessOrder.orderNumber}</span> created & assigned to shop.
              </p>
            </div>

            <div className="bg-warm-bg p-3.5 rounded-2xl border border-warm-border text-left space-y-1.5 text-xs font-semibold">
              <div className="flex justify-between">
                <span className="text-charcoal-500">Total Quoted Price:</span>
                <span className="font-bold text-charcoal-900">₹{convertedSuccessOrder.quotedPrice.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-500">Required Advance:</span>
                <span className="font-extrabold text-emerald-600">₹{convertedSuccessOrder.advanceRequired.toLocaleString('en-IN')}</span>
              </div>
              <div className="text-[10px] text-charcoal-400 pt-1">
                • Payment card sent to customer portal automatically.
              </div>
            </div>

            <Button
              onClick={() => setConvertedSuccessOrder(null)}
              variant="primary"
              fullWidth
            >
              Done & Continue
            </Button>
          </div>
        </Modal>
      )}

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
