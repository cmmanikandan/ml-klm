import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Phone, MapPin, CheckCircle2, CreditCard, QrCode, Star, Package, Printer, Share2 } from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { NotificationModal } from '../components/common/NotificationModal';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_SHOP_INFO, INITIAL_PRODUCTS, supabase } from '../lib/supabase';
import { fetchActiveProducts } from '../lib/productsStore';
import { Order, OrderStatus, PaymentStatus } from '../types';
import { InvoicePreviewModal } from '../components/invoice/InvoicePreviewModal';
import confetti from 'canvas-confetti';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const isTamil = language === 'ta';

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showInvoicePreviewModal, setShowInvoicePreviewModal] = useState(false);

  // Feedback State
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isFeedbackSubmitted, setIsFeedbackSubmitted] = useState(false);

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

  // Realtime subscription ref
  const realtimeChannelRef = useRef<any>(null);

  useEffect(() => {
    fetchLiveOrderDetails();
    // Cleanup realtime on unmount
    return () => {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
    };
  }, [id]);

  // Subscribe to realtime order changes once order is fetched
  useEffect(() => {
    if (!order?.id) return;

    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
    }

    const channel = supabase
      .channel(`customer-order-${order.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${order.id}`
        },
        (payload) => {
          if (payload.new) {
            setOrder((prev: any) => ({
              ...prev,
              ...payload.new,
              // Preserve hydrated product object
              product: prev?.product
            }));
          }
        }
      )
      .subscribe();

    realtimeChannelRef.current = channel;
  }, [order?.id]);

  const fetchLiveOrderDetails = async () => {
    setLoading(true);
    try {
      if (id) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        let ordRecord: any = null;

        // 1. If UUID, query by id
        if (isUuid) {
          const { data: dbByUuid } = await supabase
            .from('orders')
            .select('*')
            .eq('id', id)
            .maybeSingle();
          if (dbByUuid) ordRecord = dbByUuid;
        }

        // 2. Query by order_number (e.g. MNK-ORD-2)
        if (!ordRecord) {
          const { data: dbByOrderNum } = await supabase
            .from('orders')
            .select('*')
            .eq('order_number', id)
            .maybeSingle();
          if (dbByOrderNum) ordRecord = dbByOrderNum;
        }

        // 3. Fallback: fetch all orders and match client side (safe against URL casing or formatting)
        if (!ordRecord) {
          const { data: allOrders } = await supabase.from('orders').select('*');
          if (allOrders && allOrders.length > 0) {
            ordRecord = allOrders.find(
              (o: any) =>
                o.id === id ||
                o.order_number === id ||
                o.order_number?.toLowerCase() === id.toLowerCase() ||
                o.enquiry_id === id
            );
          }
        }

        if (ordRecord) {
          // Hydrate product from Supabase products table
          let hydratedProduct = undefined;
          try {
            const activeProducts = await fetchActiveProducts();
            hydratedProduct = activeProducts.find(
              (p) => p.id === ordRecord.product_id || p.name_en?.toLowerCase() === (ordRecord.product_name || '').toLowerCase()
            );
          } catch {}

          const prodTitle = ordRecord.product_name || hydratedProduct?.name_en || 'Custom Lathe Fabricated Item';
          const prodImg = ordRecord.product_image || hydratedProduct?.primary_image || (hydratedProduct?.images && hydratedProduct.images[0]) || '';

          setOrder({
            ...ordRecord,
            product_name: prodTitle,
            productName: prodTitle,
            product_image: prodImg,
            productImage: prodImg,
            product: hydratedProduct
          } as any);
        } else {
          // Check local storage cache as emergency fallback
          const localOrders: any[] = JSON.parse(localStorage.getItem('ml_orders') || '[]');
          const matchOrd = localOrders.find((o) => o.id === id || o.order_number === id || o.enquiry_id === id);
          if (matchOrd) {
            setOrder(matchOrd);
          } else {
            setOrder(null);
          }
        }
      }
    } catch (e) {
      console.warn('Live order fetch fallback', e);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const timelineSteps: { key: OrderStatus; label_en: string; label_ta: string }[] = [
    { key: 'accepted', label_en: 'Enquiry Accepted', label_ta: 'விசாரணை ஏற்கப்பட்டது' },
    { key: 'order_confirmed', label_en: 'Order Confirmed', label_ta: 'ஆர்டர் உறுதி செய்யப்பட்டது' },
    { key: 'processing', label_en: 'Processing / Fabrication', label_ta: 'தயாரிப்பில் உள்ளது' },
    { key: 'ready', label_en: 'Ready for Shop Pickup', label_ta: 'கடையில் பெற தயார்' },
    { key: 'delivered', label_en: 'Completed & Handed Over', label_ta: 'நிறைவடைந்து ஒப்படைக்கப்பட்டது' },
  ];

  const getStepIdx = (st?: OrderStatus) => {
    switch (st) {
      case 'accepted': return 0;
      case 'order_confirmed': return 1;
      case 'processing': return 2;
      case 'ready': return 3;
      case 'out_for_delivery': return 3;
      case 'delivered': return 4;
      default: return 1;
    }
  };

  const recordCustomerPayment = async (paidAmount: number, paymentMode: string) => {
    if (!order) return;
    const currentRemaining = order.remaining_amount || 0;
    const updatedRemaining = Math.max(0, currentRemaining - paidAmount);
    const newStatus: PaymentStatus = updatedRemaining === 0 ? 'paid' : 'partially_paid';

    const updatedOrder = {
      ...order,
      remaining_amount: updatedRemaining,
      payment_status: newStatus,
      is_payment_requested: false
    };
    setOrder(updatedOrder);

    const newPaymentObj = {
      id: `pay_${Date.now()}`,
      order_id: order.id,
      order_number: order.order_number || order.id,
      user_id: user?.id || order.user_id || '',
      amount: paidAmount,
      payment_mode: paymentMode,
      notes: `Customer paid ₹${paidAmount} via ${paymentMode}`,
      created_at: new Date().toISOString(),
      status: 'completed'
    };

    try {
      await supabase
        .from('orders')
        .update({
          remaining_amount: updatedRemaining,
          payment_status: newStatus,
          is_payment_requested: false
        })
        .eq('id', order.id);

      // Strip local 'id' before DB insert — Supabase generates its own UUID
      const { id: _localId, ...dbPayObj } = newPaymentObj;
      await supabase.from('payments').insert(dbPayObj);
    } catch (e) {
      console.warn('Customer payment DB update fallback');
    }

    const localOrders = JSON.parse(localStorage.getItem('ml_orders') || '[]');
    const updatedLocal = localOrders.map((l: any) => l.id === order.id ? updatedOrder : l);
    localStorage.setItem('ml_orders', JSON.stringify(updatedLocal));
  };

  // Razorpay Pay Handler
  const handlePayNow = () => {
    const rzpKey = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_T547lttHOVL633';
    const amount = order?.payment_request_amount || order?.remaining_amount || order?.advance_amount || 1000;

    const options = {
      key: rzpKey,
      amount: amount * 100,
      currency: 'INR',
      name: 'MANIKANDAN LATHE',
      description: `Payment for Order #${order?.order_number}`,
      image: '/logo.png',
      handler: function (response: any) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        recordCustomerPayment(amount, 'Online Payment');
        setNotifyModal({
          isOpen: true,
          title: 'Payment Successful',
          message: t('payment_success'),
          type: 'success'
        });
      },
      prefill: {
        name: user?.full_name || 'Manikandan Customer',
        email: user?.email || '',
        contact: user?.phone || ''
      },
      theme: {
        color: '#ea580c'
      }
    };

    try {
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      confetti({ particleCount: 100, spread: 70 });
      recordCustomerPayment(amount, 'Online Payment');
      setNotifyModal({
        isOpen: true,
        title: 'Payment Successful',
        message: t('payment_success'),
        type: 'success'
      });
    }
  };

  // One-time Feedback Handler
  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsFeedbackSubmitted(true);
    confetti({ particleCount: 120, spread: 80 });

    if (user?.id && order?.id) {
      try {
        await supabase.from('feedback').insert({
          order_id: order.id,
          user_id: user.id,
          rating,
          comment
        });
      } catch (err) {
        console.warn('Feedback save fallback');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-bg pt-12 pb-24 text-center">
        <p className="text-xs font-bold text-charcoal-500 animate-pulse">Loading order details from Supabase DB...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-warm-bg pt-12 pb-24 text-center space-y-4 px-4">
        <Package className="w-16 h-16 text-brand-500 mx-auto" />
        <h2 className="text-xl font-black text-charcoal-900">Order Not Found</h2>
        <p className="text-xs text-charcoal-500">This order may have been updated or removed.</p>
        <Button onClick={() => navigate('/orders')} variant="primary">
          Back to My Orders
        </Button>
      </div>
    );
  }

  const handleShareOrder = () => {
    if (!order) return;
    const invoiceUrl = `${window.location.origin}/invoice/${order.order_number || order.id}`;
    const text = `📦 *Manikandan Lathe Order Details*\n\nOrder Number: #${order.order_number}\nStatus: ${(order.status || '').toUpperCase()}\nTotal Amount: ₹${order.total_amount || 0}\nRemaining Due: ₹${order.remaining_amount || 0}\n\n📄 View Official Tax Invoice: ${invoiceUrl}`;

    if (navigator.share) {
      navigator.share({
        title: `Order #${order.order_number} - Manikandan Lathe`,
        text: text,
        url: invoiceUrl
      }).catch(() => {});
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  const currentStepIdx = getStepIdx(order.status);
  const prodTitle = order.product ? (isTamil ? order.product.name_ta : order.product.name_en) : 'Fabrication Item';

  return (
    <div className="min-h-screen bg-warm-bg pb-24 md:pb-12 pt-4">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Back Button & Share Order Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/orders')}
            className="inline-flex items-center gap-2 text-xs font-extrabold text-charcoal-700 bg-white px-4 py-2 rounded-full border border-warm-border shadow-sm hover:bg-warm-hover transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-brand-600" />
            <span>{isTamil ? 'ஆர்டர்களுக்குத் திரும்புக' : 'Back to My Orders'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShareOrder}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-full text-xs font-black shadow-sm transition-colors"
              title="Share Order & Invoice"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{isTamil ? 'பகிரவும்' : 'Share Order'}</span>
            </button>

            <span className="text-xs font-mono font-black text-brand-600 bg-white px-3 py-1.5 rounded-full border border-warm-border">
              #{order.order_number}
            </span>
          </div>
        </div>

        {/* Main Order Detail Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-warm-border shadow-card space-y-6">
          
          {/* Header & Status */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-warm-muted pb-4">
            <div>
              <span className="text-[11px] font-extrabold text-charcoal-400 uppercase tracking-widest block mb-0.5">
                ORDER DETAILS
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-charcoal-900">
                {prodTitle}
              </h1>
              <p className="text-xs text-charcoal-500 font-medium mt-1">
                Placed on: {order.created_at?.slice(0, 10) || 'Recently'}
              </p>
            </div>

            <Badge variant={order.status}>
              {(order.status || 'pending').toUpperCase().replace('_', ' ')}
            </Badge>
          </div>

          {/* Product Image & Specs Card */}
          <div className="flex flex-col sm:flex-row gap-4 bg-warm-bg p-4 rounded-2xl border border-warm-border">
            {order.product?.primary_image ? (
              <img
                src={order.product.primary_image}
                alt={prodTitle}
                className="w-24 h-24 rounded-xl object-cover shrink-0 border border-warm-border"
              />
            ) : (
              <div className="w-24 h-24 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-2xl shrink-0">
                <Package className="w-8 h-8" />
              </div>
            )}

            <div className="space-y-1.5 flex-1">
              <span className="text-[10px] font-extrabold text-brand-600 uppercase tracking-wider block">
                {order.product?.category_name || 'PRECISION LATHE WORK'}
              </span>
              <h3 className="text-sm font-bold text-charcoal-900">
                {prodTitle}
              </h3>
              <p className="text-xs text-charcoal-600 font-medium">
                Quantity: <strong className="text-charcoal-900">{order.quantity || 1} Unit(s)</strong>
              </p>
              {order.specifications && (
                <p className="text-xs text-charcoal-500 font-medium">
                  Specs: {order.specifications}
                </p>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-extrabold text-charcoal-700 uppercase tracking-wider block">
              Order Progress Timeline
            </span>

            <div className="relative py-3">
              {/* Horizontal Progress Line Centered Across All 5 Step Circles */}
              <div className="absolute left-6 right-6 top-7 h-1 bg-gray-200 z-0" />
              <div
                className="absolute left-6 top-7 h-1 bg-brand-600 z-0 transition-all duration-500"
                style={{ width: `calc(${((currentStepIdx / (timelineSteps.length - 1)) * 100)}% - 24px)` }}
              />

              <div className="flex items-start justify-between relative z-10">
                {timelineSteps.map((step, idx) => {
                  const isDone = idx <= currentStepIdx;
                  return (
                    <div key={step.key} className="flex-1 flex flex-col items-center text-center px-1">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all shrink-0 ${
                          isDone
                            ? 'bg-brand-600 text-white ring-4 ring-brand-100 shadow-sm'
                            : 'bg-white text-gray-400 border-2 border-gray-300'
                        }`}
                      >
                        {isDone ? '✓' : idx + 1}
                      </div>
                      <span
                        className={`text-[10px] font-extrabold mt-2 leading-tight ${
                          isDone ? 'text-charcoal-900' : 'text-gray-400'
                        }`}
                      >
                        {isTamil ? step.label_ta : step.label_en}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* DYNAMIC PAYMENT / NOTIFICATION CARD SECTION */}
          {(() => {
            const isFullyPaid = order.payment_status === 'paid';
            // Only show payment UI if admin has set a payment request amount
            const hasPaymentRequested = order.is_payment_requested && (order.payment_request_amount || 0) > 0;
            const requestedAmount = order.payment_request_amount || 0;

            if (isFullyPaid) {
              return (
                <div className="bg-emerald-50 border-2 border-emerald-300 p-4.5 rounded-2xl flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-2.5 text-emerald-900 font-black text-xs sm:text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>{isTamil ? 'கட்டணம் முழுவதும் செலுத்தப்பட்டது' : 'Payment Completed in Full'}</span>
                  </div>
                  <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300 font-mono">
                    ₹{(order.total_amount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              );
            }

            if (hasPaymentRequested && requestedAmount > 0) {
              return (
                <div className="bg-gradient-to-r from-amber-500/15 via-brand-500/15 to-orange-500/15 p-5 rounded-3xl border-2 border-brand-400 shadow-md space-y-4 animate-pulse-subtle">
                  
                  {/* Highlight Banner */}
                  <div className="bg-brand-600 text-white p-3 rounded-2xl flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📢</span>
                      <div>
                        <span className="text-xs font-black uppercase tracking-wider block">
                          {isTamil ? 'கட்டண அறிவிப்பு' : 'Payment Requested by Admin'}
                        </span>
                        <span className="text-[11px] font-bold text-amber-100">
                          {isTamil ? 'ஆர்டர் கட்டணம் நிர்ணயிக்கப்பட்டுள்ளது' : 'Workshop admin has set the payment amount for your order.'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div>
                      <span className="text-[10px] font-black text-brand-700 uppercase tracking-widest block">PAYMENT DUE</span>
                      <div className="flex items-center gap-2 text-charcoal-900 font-black text-sm">
                        <CreditCard className="w-5 h-5 text-brand-600" />
                        <span>{isTamil ? 'செலுத்த வேண்டிய தொகை' : 'Requested Payment Amount'}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-2xl sm:text-3xl font-black text-brand-600 font-mono">
                        ₹{requestedAmount.toLocaleString('en-IN')}
                      </span>
                      {Number(order.total_amount || 0) > 0 && (
                        <span className="text-[10px] font-bold text-charcoal-500 block">
                          Total Quoted: ₹{Number(order.total_amount).toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-1">
                    <Button
                      onClick={handlePayNow}
                      variant="primary"
                      fullWidth
                      icon={<CreditCard className="w-4 h-4" />}
                      className="py-3.5 text-sm font-black rounded-2xl shadow-lg bg-brand-600 hover:bg-brand-700"
                    >
                      {isTamil ? 'ஆன்லைன் மூலம் பாதுகாப்பாக செலுத்துக (Razorpay)' : 'Pay Securely via Razorpay (UPI / Card / NetBanking)'}
                    </Button>
                  </div>

                  <div className="bg-white/90 p-3 rounded-xl border border-warm-border text-center text-xs font-bold text-charcoal-700">
                    💵 Or pay Cash directly at Workshop Counter (<span className="text-brand-600">Kallimandhayam</span>)
                  </div>
                </div>
              );
            }

            // PENDING PRICE CALCULATION BY ADMIN (DEFAULT STATE BEFORE ADMIN SETS AMOUNT)
            return (
              <div className="bg-amber-50/80 p-5 rounded-3xl border-2 border-amber-300 space-y-3">
                <div className="flex items-center gap-2.5 text-amber-900">
                  <span className="text-2xl">📞</span>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider">
                      {isTamil ? 'விலை தொலைபேசி அழைப்பில் தீர்மானிக்கப்படும்' : 'Price Discussed via Call / Weight Calculation Pending'}
                    </h3>
                    <p className="text-xs font-medium text-amber-800 mt-0.5 leading-relaxed">
                      {isTamil 
                        ? 'இந்த தயாரிப்பின் இறுதி விலை எடை (kg) அல்லது அளவின்படி வொர்க்ஷாப் நிர்வாகியால் கணக்கிடப்படும். நிர்வாகி தொகையை நிர்ணயித்தவுடன் உங்களுக்கு அறிவிப்பு அனுப்பப்படும்.' 
                        : 'The product price is calculated based on exact total weight (kg) or square feet after work completion by shop admin. Notification card to pay will appear once set.'}
                    </p>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-2xl border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-xs font-extrabold text-charcoal-800">
                    {isTamil ? 'வொர்க்ஷாப்பை தொடர்பு கொள்ள:' : 'Have questions about price or estimation?'}
                  </span>
                  <a
                    href={`tel:${DEFAULT_SHOP_INFO.phone}`}
                    className="inline-flex items-center gap-1.5 text-xs font-extrabold text-white bg-brand-600 px-4 py-2 rounded-full shadow-sm hover:bg-brand-700 transition-colors shrink-0"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{DEFAULT_SHOP_INFO.phone}</span>
                  </a>
                </div>
              </div>
            );
          })()}

          {/* Payment complete secondary notice - only show when not fully paid and order is delivered */}
          {order.payment_status === 'paid' && order.status === 'delivered' && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Payment Paid Successfully</span>
              </div>
              <span className="text-xs font-bold text-emerald-700">Payment Complete</span>
            </div>
          )}

          {/* Workshop Pickup & Contact Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-warm-muted">
            <div className="bg-warm-bg p-4 rounded-2xl border border-warm-border space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-charcoal-900">
                <MapPin className="w-4 h-4 text-brand-600" />
                <span>Shop Counter Pickup Location</span>
              </div>
              <p className="text-xs text-charcoal-700 font-bold">
                Manikandan Lathe Works, K. Keeranur Road, Kallimandhayam
              </p>
            </div>

            <div className="bg-warm-bg p-4 rounded-2xl border border-warm-border space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-charcoal-900">
                <Calendar className="w-4 h-4 text-brand-600" />
                <span>Fulfillment Mode</span>
              </div>
              <p className="text-xs font-black text-emerald-700">
                Direct Workshop Counter Pickup Only
              </p>
            </div>
          </div>

          {/* Direct Shop Support Contact CTA */}
          <div className="pt-2">
            <a
              href={`tel:${DEFAULT_SHOP_INFO.phone}`}
              className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-md transition-all text-sm"
            >
              <Phone className="w-4 h-4" />
              <span>Call Shop for Fabrication Inquiry ({DEFAULT_SHOP_INFO.phone})</span>
            </a>
          </div>

        </div>
      </div>

      {/* UPI QR PAYMENT MODAL */}
      <Modal isOpen={showQrModal} onClose={() => setShowQrModal(false)} title={t('view_upi_qr')} maxWidth="sm">
        <div className="text-center space-y-4 py-3">
          <p className="text-xs text-charcoal-600 font-bold">
            Scan using any GPay, PhonePe, Paytm, or BHIM app
          </p>

          <div className="p-4 bg-white border-2 border-brand-300 rounded-2xl inline-block shadow-md">
            <img src={DEFAULT_SHOP_INFO.upi_qr_url} alt="Shop UPI QR" className="w-52 h-52 mx-auto object-contain" />
          </div>

          <div className="bg-warm-bg p-3 rounded-xl border border-warm-border">
            <span className="text-xs text-charcoal-500 block font-bold">Shop UPI ID</span>
            <span className="text-sm font-extrabold font-mono text-brand-600">{DEFAULT_SHOP_INFO.upi_id}</span>
          </div>

          <Button
            onClick={() => {
              setShowQrModal(false);
              const amount = order?.payment_request_amount || order?.remaining_amount || order?.advance_amount || 0;
              recordCustomerPayment(amount, 'Online Payment (UPI QR)');
              setNotifyModal({
                isOpen: true,
                title: 'Payment Recorded',
                message: 'Payment notification sent to shop admin! Your receipt has been updated.',
                type: 'success'
              });
            }}
            variant="primary"
            fullWidth
          >
            {isTamil ? 'கட்டணம் செலுத்திவிட்டேன்' : 'I Have Paid via QR'}
          </Button>
        </div>
      </Modal>

      {/* A4 INVOICE PREVIEW MODAL */}
      <InvoicePreviewModal
        isOpen={showInvoicePreviewModal}
        onClose={() => setShowInvoicePreviewModal(false)}
        order={order}
      />

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
