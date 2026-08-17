import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Phone, MessageSquare, CheckCircle2, XCircle, Search, Eye, ShoppingBag, User, Check } from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { NotificationModal } from '../../components/common/NotificationModal';
import { INITIAL_PRODUCTS, DEFAULT_SHOP_INFO, supabase } from '../../lib/supabase';
import { fetchActiveProducts } from '../../lib/productsStore';
import { getStatusConfig } from '../../lib/statusConfig';
import { convertEnquiryToOrderSafely } from '../../lib/orderConversionService';

export const AdminEnquiriesPage: React.FC = () => {
  const [filter, setFilter] = useState<'pending' | 'all' | 'accepted' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [productMap, setProductMap] = useState<Map<string, any>>(new Map());
  const [profileMap, setProfileMap] = useState<Map<string, any>>(new Map());

  // Converting state
  const [convertingId, setConvertingId] = useState<string | null>(null);

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

  const navigate = useNavigate();

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
    return 'Custom Lathe Fabricated Item';
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
    return 'Customer';
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

      // Filter OUT repair enquiries so only standard product fabrication enquiries appear here
      const standardEnquiries = (data || []).filter((enq: any) => {
        const pName = String(enq.product_name || enq.productName || '').toLowerCase();
        const num = String(enq.enquiry_number || enq.number || enq.id || '').toLowerCase();
        const isRepair = 
          pName.includes('[repair service]') ||
          pName.includes('repair') ||
          pName.includes('பழுது') ||
          num.includes('rep-') ||
          num.startsWith('mnk-rep');
        return !isRepair;
      });

      // Cross-check with orders table so any converted enquiry is accurately marked as CONVERTED
      const { data: dbOrders } = await supabase.from('orders').select('*');
      const orderLinkedEnquiries = new Map<string, any>();

      (dbOrders || []).forEach((o: any) => {
        if (o.enquiry_id) orderLinkedEnquiries.set(o.enquiry_id, o);
        if (o.id) orderLinkedEnquiries.set(o.id, o);
        if (o.order_number) orderLinkedEnquiries.set(o.order_number, o);
        if (o.customer_name && o.product_name) {
          orderLinkedEnquiries.set(`${o.customer_name.trim().toLowerCase()}_${o.product_name.trim().toLowerCase()}`, o);
        }
      });

      const checkedEnquiries = standardEnquiries.map((enq: any) => {
        const pName = getProductName(enq).toLowerCase();
        const cName = (enq.customer_name || enq.customerName || '').toLowerCase();
        const key = `${cName}_${pName}`;
        const matchedOrder = enq.converted_order_id 
          ? (dbOrders || []).find((o: any) => o.id === enq.converted_order_id || o.order_number === enq.converted_order_id)
          : (orderLinkedEnquiries.get(enq.id) || orderLinkedEnquiries.get(enq.enquiry_number) || orderLinkedEnquiries.get(key));

        const isConvertedInDb = enq.status === 'converted' || enq.status === 'accepted' || enq.status === 'converted_to_order' || Boolean(matchedOrder);
        const readableNum = matchedOrder?.order_number || enq.converted_order_id || '';

        if (isConvertedInDb) {
          return {
            ...enq,
            status: 'converted',
            converted_order_id: readableNum || 'MNK-ORD-1'
          };
        }

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
      if (normStatus !== 'ACCEPTED' && normStatus !== 'CONVERTED') return false;
    } else if (filter === 'rejected') {
      if (normStatus !== 'REJECTED') return false;
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

  // SINGLE ACCEPT ACTION HANDLER
  const handleAcceptEnquiry = async (enq: any) => {
    if (convertingId) return;
    setConvertingId(enq.id);

    try {
      const result = await convertEnquiryToOrderSafely({
        enquiry: enq,
        estimatedDays: 7
      });

      const orderNumber = result.order?.order_number || result.order?.id || 'MNK-ORD-1';

      // Update local enquiries state instantly
      setEnquiries((prev) =>
        prev.map((e) =>
          (e.id === enq.id || e.enquiry_number === enq.enquiry_number)
            ? { ...e, status: 'converted', converted_order_id: orderNumber }
            : e
        )
      );

      setConvertedSuccessOrder({
        enquiryNumber: enq.enquiry_number || enq.number || enq.id,
        orderNumber: orderNumber,
        orderId: result.order?.id || orderNumber,
        quotedPrice: result.order?.total_amount || 0,
        advanceRequired: result.order?.advance_amount || 0
      });
    } catch (err: any) {
      console.error('Accept enquiry conversion error:', err);
      setNotifyModal({
        isOpen: true,
        title: 'Error Accepting Enquiry',
        message: err?.message || 'Unable to accept this enquiry right now. Please try again.',
        type: 'error'
      });
    } finally {
      setConvertingId(null);
    }
  };

  // REJECT ACTION HANDLER
  const handleRejectEnquiry = async (enqId: string) => {
    const targetEnquiry = enquiries.find((e) => e.id === enqId || e.enquiry_number === enqId);
    
    // Update local state
    setEnquiries((prev) =>
      prev.map((e) => (e.id === enqId || e.enquiry_number === enqId ? { ...e, status: 'rejected' } : e))
    );

    // Update Supabase DB
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(enqId);
    try {
      if (isUuid) {
        await supabase.from('enquiries').update({ status: 'rejected' }).eq('id', enqId);
      }
      const enqNum = targetEnquiry?.enquiry_number || enqId;
      if (enqNum) {
        await supabase.from('enquiries').update({ status: 'rejected' }).eq('enquiry_number', enqNum);
      }
    } catch (e) {
      console.warn('Enquiry reject DB fallback', e);
    }

    setNotifyModal({
      isOpen: true,
      title: 'Enquiry Rejected',
      message: `Enquiry #${targetEnquiry?.enquiry_number || enqId} has been marked as rejected.`,
      type: 'info'
    });
  };

  const handleOpenWhatsApp = (enq: any) => {
    const rawPhone = (enq.customerPhone || enq.phone || enq.customer_phone || '').replace(/[^0-9]/g, '');
    const targetCustomerPhone = rawPhone ? (rawPhone.startsWith('91') ? rawPhone : `91${rawPhone}`) : DEFAULT_SHOP_INFO.whatsapp;

    const text = encodeURIComponent(
      `*MANIKANDAN LATHE WORKS*\n` +
      `--------------------------------------\n` +
      `📌 *Enquiry ID:* ${enq.enquiry_number || enq.number || enq.id}\n` +
      `👤 *Customer Name:* ${getCustomerName(enq)}\n` +
      `🛠️ *Fabrication Item:* ${getProductName(enq)}\n` +
      `📦 *Quantity:* ${enq.quantity || 1} Unit(s)\n` +
      `--------------------------------------\n` +
      `Hello! We have received your fabrication enquiry.`
    );
    window.open(`https://wa.me/${targetCustomerPhone}?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-charcoal-900">Customer Fabrication Enquiries</h1>
          <p className="text-xs text-charcoal-500 font-medium">Review customer specifications & accept enquiries to create active shop orders</p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-white p-1 rounded-2xl border border-warm-border shadow-sm">
          {(['pending', 'all', 'accepted', 'rejected'] as const).map((key) => {
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
            Loading customer enquiries...
          </div>
        ) : filteredEnquiries.length === 0 ? (
          <div className="col-span-full bg-white p-12 text-center rounded-3xl border border-warm-border space-y-2">
            <h3 className="text-base font-bold text-charcoal-800">No customer enquiries found</h3>
            <p className="text-xs text-charcoal-500">Submitted product enquiries will appear here automatically.</p>
          </div>
        ) : (
          filteredEnquiries.map((enq) => {
            const normStatus = getNormalizedStatus(enq.status);
            const isAccepted = normStatus === 'ACCEPTED' || normStatus === 'CONVERTED' || Boolean(enq.converted_order_id);
            const linkedOrderId = enq.converted_order_id || enq.convertedOrderId || enq.order_id;
            const isPending = normStatus === 'PENDING' && !isAccepted;
            const isRejected = normStatus === 'REJECTED';
            const productName = getProductName(enq);
            const customerName = getCustomerName(enq);
            const enquiryNo = enq.enquiry_number || enq.number || enq.id;
            const isThisConverting = convertingId === enq.id;

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

                    <Badge variant={isAccepted ? 'accepted' : isRejected ? 'rejected' : 'pending'}>
                      {isAccepted ? 'ACCEPTED' : normStatus}
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
                      <span className="font-bold">{enq.delivery_location || enq.location || 'Direct Workshop Counter Pickup (Kallimandhayam)'}</span>
                    </div>
                  </div>

                  {enq.size_requirement && (
                    <div className="p-2.5 rounded-xl bg-warm-bg text-xs font-medium text-charcoal-700 border border-warm-border">
                      <span className="font-bold block text-[10px] text-charcoal-500 uppercase mb-0.5">Size / Requirement:</span>
                      {enq.size_requirement}
                    </div>
                  )}

                  {enq.custom_notes && (
                    <div className="p-3 rounded-xl bg-amber-50/60 text-xs font-medium text-amber-900 border border-amber-200">
                      <span className="font-bold block text-[10px] text-amber-700 uppercase mb-0.5">Customer Notes:</span>
                      {enq.custom_notes}
                    </div>
                  )}

                </div>

                {/* Single Clean Actions Bar */}
                <div className="pt-3 border-t border-warm-border flex flex-col space-y-2.5">
                  
                  {isPending ? (
                    /* PENDING ENQUIRY: SINGLE ACCEPT ACTION + VIEW DETAILS + REJECT */
                    <div className="space-y-2">
                      <Button
                        onClick={() => handleAcceptEnquiry(enq)}
                        disabled={isThisConverting}
                        variant="primary"
                        className="w-full justify-center py-2.5 rounded-2xl font-black text-xs shadow-md bg-emerald-600 hover:bg-emerald-700 text-white"
                        icon={<Check className="w-4 h-4" />}
                      >
                        {isThisConverting ? 'Accepting & Creating Order...' : 'Accept Order'}
                      </Button>

                      <div className="grid grid-cols-3 gap-2">
                        <Link
                          to={`/admin/enquiries/${enq.id}`}
                          className="inline-flex items-center justify-center gap-1 bg-warm-bg hover:bg-brand-50 text-brand-700 font-extrabold py-2 px-2.5 rounded-xl text-xs border border-brand-200 transition-colors shadow-sm text-center"
                        >
                          <Eye className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                          <span>Details</span>
                        </Link>

                        <button
                          onClick={() => handleOpenWhatsApp(enq)}
                          className="inline-flex items-center justify-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold py-2 px-2.5 rounded-xl text-xs border border-emerald-200 transition-colors shadow-sm text-center"
                          title="WhatsApp Customer"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>WhatsApp</span>
                        </button>

                        <button
                          onClick={() => handleRejectEnquiry(enq.id)}
                          className="inline-flex items-center justify-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 font-extrabold py-2 px-2.5 rounded-xl text-xs border border-red-200 transition-colors shadow-sm text-center"
                          title="Reject Enquiry"
                        >
                          <XCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  ) : isAccepted ? (
                    /* ACCEPTED ENQUIRY: VIEW ORDER BUTTON + VIEW DETAILS */
                    <div className="space-y-2">
                      <Link
                        to={`/admin/orders/${linkedOrderId || 'MNK-ORD-1'}`}
                        className="w-full inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 px-3.5 rounded-2xl text-xs shadow-md transition-colors"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>View Order ({linkedOrderId ? `#${linkedOrderId}` : 'Shop Order'})</span>
                      </Link>

                      <Link
                        to={`/admin/enquiries/${enq.id}`}
                        className="w-full inline-flex items-center justify-center gap-1 bg-warm-bg hover:bg-brand-50 text-brand-700 font-extrabold py-2 px-3 rounded-xl text-xs border border-brand-200 transition-colors shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5 text-brand-600" />
                        <span>View Enquiry Specification</span>
                      </Link>
                    </div>
                  ) : (
                    /* REJECTED ENQUIRY */
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="rejected">REJECTED</Badge>
                      <Link
                        to={`/admin/enquiries/${enq.id}`}
                        className="inline-flex items-center justify-center gap-1 bg-warm-bg hover:bg-brand-50 text-brand-700 font-extrabold py-2 px-3 rounded-xl text-xs border border-brand-200 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-brand-600" />
                        <span>View Details</span>
                      </Link>
                    </div>
                  )}

                </div>

              </div>
            );
          })
        )}
      </div>

      {/* CONVERSION SUCCESS IN-APP MODAL CARD */}
      {convertedSuccessOrder && (
        <Modal
          isOpen={Boolean(convertedSuccessOrder)}
          onClose={() => setConvertedSuccessOrder(null)}
          title="Order Accepted Successfully 🎉"
          maxWidth="sm"
        >
          <div className="text-center space-y-4 py-2">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-base font-black text-charcoal-900">
                Enquiry #{convertedSuccessOrder.enquiryNumber} Accepted!
              </h3>
              <p className="text-xs text-charcoal-500 font-semibold mt-1">
                Active Order <span className="font-mono font-bold text-brand-600">#{convertedSuccessOrder.orderNumber}</span> created & added to Manage Orders.
              </p>
            </div>

            <div className="bg-warm-bg p-3.5 rounded-2xl border border-warm-border text-left space-y-1.5 text-xs font-semibold">
              <div className="flex justify-between">
                <span className="text-charcoal-500">Order Number:</span>
                <span className="font-mono font-bold text-brand-600">#{convertedSuccessOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-500">Quoted Price:</span>
                <span className="font-bold text-charcoal-900">₹{convertedSuccessOrder.quotedPrice.toLocaleString('en-IN')}</span>
              </div>
              <div className="text-[10px] text-charcoal-400 pt-1">
                • Order is now visible in Admin Orders and Customer Dashboard.
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={() => {
                  setConvertedSuccessOrder(null);
                  navigate(`/admin/orders/${convertedSuccessOrder.orderId}`);
                }}
                variant="primary"
                fullWidth
              >
                Go to Order Details ➔
              </Button>

              <Button
                onClick={() => setConvertedSuccessOrder(null)}
                variant="secondary"
                fullWidth
              >
                Continue Managing Enquiries
              </Button>
            </div>
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
