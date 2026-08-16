import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Phone, 
  MapPin, 
  MessageSquare, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  Package, 
  Wrench,
  ShoppingBag,
  Check
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { NotificationModal } from '../../components/common/NotificationModal';
import { DEFAULT_SHOP_INFO, INITIAL_PRODUCTS, supabase } from '../../lib/supabase';
import { fetchActiveProducts } from '../../lib/productsStore';
import { convertEnquiryToOrderSafely } from '../../lib/orderConversionService';

export const AdminEnquiryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [enquiry, setEnquiry] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConverting, setIsConverting] = useState(false);

  // Quote & Conversion Form State
  const [quotePrice, setQuotePrice] = useState<number>(0);
  const [advanceRequired, setAdvanceRequired] = useState<number>(0);
  const [estimatedDays, setEstimatedDays] = useState<number>(7);

  // Conversion Success Modal State
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
    if (id) {
      fetchEnquiryDetails(id);
    }
  }, [id]);

  const fetchEnquiryDetails = async (enquiryId: string) => {
    setLoading(true);
    try {
      const activeProducts = await fetchActiveProducts();
      const productMap = new Map(activeProducts.map(p => [p.id, p]));

      const { data: profilesData } = await supabase.from('profiles').select('*');
      const profileMap = new Map((profilesData || []).map((prof: any) => [prof.id, prof]));

      const { data: dbEnquiry } = await supabase.from('enquiries').select('*').eq('id', enquiryId).maybeSingle();

      let enqRecord = dbEnquiry;
      if (!enqRecord) {
        const local = JSON.parse(localStorage.getItem('ml_enquiries') || '[]');
        enqRecord = local.find((l: any) => l.id === enquiryId || l.enquiry_number === enquiryId);
      }

      if (enqRecord) {
        const prod = productMap.get(enqRecord.product_id) || INITIAL_PRODUCTS.find(p => p.id === enqRecord.product_id || p.name_en.toLowerCase() === (enqRecord.product_name || '').toLowerCase());
        const prof = profileMap.get(enqRecord.user_id);

        const initialPrice = enqRecord.quote_price || (prod?.admin_price ? prod.admin_price * (enqRecord.quantity || 1) : 40000);
        const initialAdvance = enqRecord.advance_amount || 0;

        setQuotePrice(initialPrice);
        setAdvanceRequired(initialAdvance);
        setEstimatedDays(enqRecord.estimated_days || 7);

        const hydrated = {
          ...enqRecord,
          customerName: enqRecord.customerName || enqRecord.customer_name || prof?.full_name || 'Customer',
          customerPhone: enqRecord.customerPhone || enqRecord.customer_phone || prof?.phone || '+91 96592 86268',
          customerEmail: enqRecord.customerEmail || prof?.email || 'customer@gmail.com',
          customerAddress: enqRecord.customerAddress || enqRecord.delivery_location || prof?.address || prof?.city_area || 'Direct Workshop Counter Pickup (Kallimandhayam)',
          customerLanguage: prof?.language === 'ta' ? 'தமிழ் (Tamil)' : 'English',
          productName: enqRecord.productName || enqRecord.product_name || prod?.name_en || 'Custom Lathe Fabrication Work',
          productImage: enqRecord.productImage || prod?.primary_image || (prod?.images && prod.images[0]) || 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&auto=format&fit=crop&q=80',
          productId: enqRecord.product_id || prod?.id || 'demo-prod-1'
        };
        setEnquiry(hydrated);
      }
    } catch (e) {
      console.warn('Enquiry detail fetch fallback');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptEnquiry = async () => {
    if (!enquiry || isConverting) return;

    setIsConverting(true);
    try {
      const result = await convertEnquiryToOrderSafely({
        enquiry,
        quotePrice,
        advanceRequired,
        estimatedDays
      });

      const orderNumber = result.order?.order_number || result.order?.id || 'MNK-ORD-1';

      setEnquiry((prev: any) => ({
        ...prev,
        status: 'converted',
        converted_order_id: orderNumber
      }));

      setConvertedSuccessOrder({
        enquiryNumber: enquiry.enquiry_number || enquiry.id,
        orderNumber: orderNumber,
        orderId: result.order?.id || orderNumber,
        quotedPrice: result.order?.total_amount || quotePrice,
        advanceRequired: result.order?.advance_amount || advanceRequired
      });
    } catch (err: any) {
      console.error('Order conversion error:', err);
      setNotifyModal({
        isOpen: true,
        title: 'Conversion Error',
        message: err?.message || 'Unable to accept this enquiry right now. Please try again.',
        type: 'error'
      });
    } finally {
      setIsConverting(false);
    }
  };

  const handleRejectEnquiry = async () => {
    if (!enquiry) return;
    
    setEnquiry((prev: any) => ({ ...prev, status: 'rejected' }));

    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(enquiry.id);
      if (isUuid) {
        await supabase.from('enquiries').update({ status: 'rejected' }).eq('id', enquiry.id);
      }
      if (enquiry.enquiry_number) {
        await supabase.from('enquiries').update({ status: 'rejected' }).eq('enquiry_number', enquiry.enquiry_number);
      }
    } catch (e) {
      console.warn('Enquiry reject DB fallback');
    }

    setNotifyModal({
      isOpen: true,
      title: 'Enquiry Rejected',
      message: `Enquiry #${enquiry.enquiry_number || enquiry.id} has been marked as rejected.`,
      type: 'info'
    });
  };

  const handleOpenWhatsAppQuote = () => {
    if (!enquiry) return;
    const rawPhone = (enquiry.customerPhone || '').replace(/[^0-9]/g, '');
    const targetCustomerPhone = rawPhone ? (rawPhone.startsWith('91') ? rawPhone : `91${rawPhone}`) : DEFAULT_SHOP_INFO.whatsapp;

    const text = encodeURIComponent(
      `*MANIKANDAN LATHE WORKS - OFFICIAL QUOTE*\n` +
      `--------------------------------------\n` +
      `📌 *Enquiry ID:* #${enquiry.enquiry_number || enquiry.id}\n` +
      `👤 *Customer Name:* ${enquiry.customerName}\n` +
      `🛠️ *Fabrication Item:* ${enquiry.productName}\n` +
      `📦 *Requested Quantity:* ${enquiry.quantity || 1} Unit(s)\n` +
      `💰 *Quoted Price:* ₹${quotePrice.toLocaleString('en-IN')}\n` +
      `💳 *Advance Required:* ₹${advanceRequired.toLocaleString('en-IN')}\n` +
      `⏱️ *Estimated Delivery:* ${estimatedDays} Days\n` +
      `--------------------------------------\n` +
      `Please reply to confirm your quote and start fabrication!`
    );
    window.open(`https://wa.me/${targetCustomerPhone}?text=${text}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-bg flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-brand-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!enquiry) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-warm-border shadow-card space-y-4 max-w-md mx-auto my-12">
        <Package className="w-12 h-12 text-brand-600 mx-auto" />
        <h2 className="text-lg font-black text-charcoal-900">Enquiry Not Found</h2>
        <Button onClick={() => navigate('/admin/enquiries')} variant="primary" fullWidth>
          Back to Enquiries List
        </Button>
      </div>
    );
  }

  const isAccepted = enquiry.status === 'converted' || enquiry.status === 'accepted' || Boolean(enquiry.converted_order_id);
  const isPending = enquiry.status === 'pending' && !isAccepted;
  const linkedOrderNumber = enquiry.converted_order_id || 'MNK-ORD-1';

  return (
    <div className="space-y-6">
      
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/enquiries')}
            className="p-2.5 bg-white hover:bg-warm-hover rounded-2xl border border-warm-border shadow-sm text-charcoal-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-charcoal-900">Enquiry #{enquiry.enquiry_number || enquiry.id}</h1>
              <Badge variant={isAccepted ? 'accepted' : enquiry.status}>
                {isAccepted ? 'ACCEPTED' : (enquiry.status || 'pending').toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs text-charcoal-500 font-semibold mt-0.5">
              Received on {enquiry.created_at ? new Date(enquiry.created_at).toLocaleString('en-IN') : 'Recent'}
            </p>
          </div>
        </div>

        {/* Action Header Buttons */}
        {isPending ? (
          <div className="flex items-center gap-2">
            <Button
              onClick={handleAcceptEnquiry}
              disabled={isConverting}
              variant="primary"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md"
              icon={<Check className="w-4 h-4" />}
            >
              {isConverting ? 'Accepting...' : 'Accept Enquiry'}
            </Button>

            <button
              onClick={handleRejectEnquiry}
              className="inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-extrabold px-3.5 py-2.5 rounded-2xl text-xs border border-red-200 transition-colors"
            >
              <XCircle className="w-4 h-4" />
              <span>Reject</span>
            </button>
          </div>
        ) : isAccepted ? (
          <Link
            to={`/admin/orders/${linkedOrderNumber}`}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-5 py-2.5 rounded-2xl text-xs shadow-md transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>View Active Order (#{linkedOrderNumber})</span>
          </Link>
        ) : null}
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Requested Product & Specifications */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Requested Product Card */}
          <div className="bg-white rounded-3xl p-6 border border-warm-border shadow-card space-y-4">
            <span className="text-[10px] font-black text-brand-600 uppercase tracking-widest block">
              ENQUIRED ITEM SPECIFICATION
            </span>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-b border-warm-muted pb-4">
              <img
                src={enquiry.productImage}
                alt={enquiry.productName}
                className="w-20 h-20 rounded-2xl object-cover border border-warm-border shadow-sm shrink-0"
              />
              <div className="space-y-1">
                <Link
                  to={`/products/${enquiry.productId}`}
                  target="_blank"
                  className="text-lg font-black text-charcoal-900 hover:text-brand-600 flex items-center gap-1.5"
                >
                  <span>{enquiry.productName}</span>
                  <ExternalLink className="w-4 h-4 text-brand-600 shrink-0" />
                </Link>
                <p className="text-xs text-charcoal-500 font-bold">Requested Quantity: {enquiry.quantity || 1} Unit(s)</p>
              </div>
            </div>

            {/* Custom Technical Notes */}
            <div className="space-y-3 text-xs">
              <div className="p-4 bg-warm-bg rounded-2xl border border-warm-border space-y-1">
                <span className="font-extrabold text-charcoal-500 block text-[10px] uppercase">Required Size / Dimensions:</span>
                <p className="font-black text-charcoal-900 text-sm">{enquiry.size_requirement || enquiry.size || 'Standard Specifications'}</p>
              </div>

              {enquiry.custom_notes && (
                <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 text-amber-900 space-y-1">
                  <span className="font-extrabold text-amber-800 block text-[10px] uppercase">Customer Custom Notes:</span>
                  <p className="font-bold">{enquiry.custom_notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Quote & Conversion Tool Card */}
          <div className="bg-white rounded-3xl p-6 border border-warm-border shadow-card space-y-4">
            <h3 className="text-sm font-black text-charcoal-900 uppercase tracking-wider flex items-center gap-2">
              <Wrench className="w-4 h-4 text-brand-600" />
              <span>Fabrication Price & Order Confirmation</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-xs font-extrabold text-charcoal-800 mb-1">Total Quoted Price (₹) *</label>
                <input
                  type="number"
                  value={quotePrice || ''}
                  onChange={(e) => setQuotePrice(parseFloat(e.target.value) || 0)}
                  placeholder="Enter total price (e.g. 40000)"
                  className="w-full px-3.5 py-2.5 text-sm font-extrabold border border-warm-border rounded-xl bg-white"
                />
              </div>

              <div>
                <label className="block font-extrabold text-emerald-800 mb-1">Required Advance Amount (₹)</label>
                <input
                  type="number"
                  value={advanceRequired || ''}
                  onChange={(e) => setAdvanceRequired(parseFloat(e.target.value) || 0)}
                  placeholder="Enter advance amount (e.g. 2000)"
                  className="w-full px-3.5 py-2.5 text-sm font-extrabold border border-emerald-300 rounded-xl bg-emerald-50/50 text-emerald-700 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-charcoal-700 mb-1">Estimated Fabrication Time (Days) *</label>
                <input
                  type="number"
                  value={estimatedDays || ''}
                  onChange={(e) => setEstimatedDays(parseInt(e.target.value) || 1)}
                  placeholder="7"
                  className="w-full px-3.5 py-2.5 text-sm font-bold border border-warm-border rounded-xl bg-white"
                />
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleOpenWhatsAppQuote}
                variant="secondary"
                icon={<MessageSquare className="w-4 h-4 text-emerald-600" />}
                className="flex-1"
              >
                Send Quote via WhatsApp
              </Button>

              {isPending ? (
                <Button
                  onClick={handleAcceptEnquiry}
                  disabled={isConverting}
                  variant="primary"
                  icon={<Check className="w-4 h-4" />}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black"
                >
                  {isConverting ? 'Accepting...' : 'Accept & Create Order'}
                </Button>
              ) : (
                <Link
                  to={`/admin/orders/${linkedOrderNumber}`}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 px-4 rounded-2xl text-xs text-center flex items-center justify-center gap-1.5 shadow-md transition-colors"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Enquiry Accepted / View Order</span>
                </Link>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Complete Customer Profile Details */}
        <div className="space-y-6">
          
          {/* Customer Card */}
          <div className="bg-white rounded-3xl p-6 border border-warm-border shadow-card space-y-4">
            <h3 className="text-xs font-black text-brand-600 uppercase tracking-widest">Customer Details</h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3 border-b border-warm-muted pb-3">
                <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white font-black text-lg flex items-center justify-center shadow-md shrink-0">
                  {enquiry.customerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-extrabold text-charcoal-900 text-base">{enquiry.customerName}</h4>
                  <span className="text-[11px] text-brand-600 font-bold block">{enquiry.customerEmail}</span>
                  <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full inline-block mt-1">
                    Lang: {enquiry.customerLanguage}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-warm-bg rounded-2xl border border-warm-border space-y-2">
                <div className="flex items-center gap-2 font-bold text-charcoal-900">
                  <Phone className="w-4 h-4 text-brand-600 shrink-0" />
                  <a href={`tel:${enquiry.customerPhone}`} className="hover:text-brand-600 font-mono text-sm">{enquiry.customerPhone}</a>
                </div>

                <div className="flex items-start gap-2 font-medium text-charcoal-700">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{enquiry.customerAddress}</span>
                </div>

                {/* Call & WhatsApp Quick Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-warm-border/60">
                  <a
                    href={`tel:${enquiry.customerPhone}`}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white font-extrabold py-2.5 px-3 rounded-xl text-xs shadow-sm transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Customer</span>
                  </a>

                  <a
                    href={`https://wa.me/${(enquiry.customerPhone || '').replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 px-3 rounded-xl text-xs shadow-sm transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* CONVERSION SUCCESS IN-APP MODAL CARD */}
      {convertedSuccessOrder && (
        <Modal
          isOpen={Boolean(convertedSuccessOrder)}
          onClose={() => {
            setConvertedSuccessOrder(null);
            navigate('/admin/orders');
          }}
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
                Active Order <span className="font-mono font-bold text-brand-600">#{convertedSuccessOrder.orderNumber}</span> created & added to shop production.
              </p>
            </div>

            <div className="bg-warm-bg p-3.5 rounded-2xl border border-warm-border text-left space-y-1.5 text-xs font-semibold">
              <div className="flex justify-between">
                <span className="text-charcoal-500">Order Number:</span>
                <span className="font-mono font-bold text-brand-600">#{convertedSuccessOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-500">Total Quoted Price:</span>
                <span className="font-bold text-charcoal-900">₹{convertedSuccessOrder.quotedPrice.toLocaleString('en-IN')}</span>
              </div>
              <div className="text-[10px] text-charcoal-400 pt-1">
                • Order is live in Admin Orders and Customer Portal.
              </div>
            </div>

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
