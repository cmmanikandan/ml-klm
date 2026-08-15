import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Phone, 
  User, 
  MapPin, 
  Calendar, 
  Printer, 
  DollarSign, 
  CreditCard, 
  Trash2, 
  ExternalLink, 
  Package, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle,
  History,
  MessageSquare,
  QrCode,
  Send,
  Check
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { InvoicePreviewModal } from '../../components/invoice/InvoicePreviewModal';
import { OrderStatus } from '../../types';
import { DEFAULT_SHOP_INFO, supabase } from '../../lib/supabase';
import { fetchActiveProducts } from '../../lib/productsStore';
import { getStatusConfig } from '../../lib/statusConfig';

export const AdminOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<any | null>(null);
  const [paymentsHistory, setPaymentsHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [orderToDelete, setOrderToDelete] = useState<any | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [customPayAmount, setCustomPayAmount] = useState<number>(0);
  const [customPayNotes, setCustomPayNotes] = useState<string>('Payment collected at workshop');
  const [showGeneratedQr, setShowGeneratedQr] = useState(false);
  const [showInvoicePreviewModal, setShowInvoicePreviewModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchOrderDetails(id);
    }
  }, [id]);

  const fetchOrderDetails = async (orderId: string) => {
    setLoading(true);
    try {
      const activeProducts = await fetchActiveProducts();
      const productMap = new Map(activeProducts.map(p => [p.id, p]));

      const { data: profilesData } = await supabase.from('profiles').select('*');
      const profileMap = new Map((profilesData || []).map((prof: any) => [prof.id, prof]));

      // 1. Fetch Order Record
      const { data: dbOrder } = await supabase.from('orders').select('*').eq('id', orderId).maybeSingle();
      
      let ordRecord = dbOrder;
      if (!ordRecord) {
        const local = JSON.parse(localStorage.getItem('ml_orders') || '[]');
        ordRecord = local.find((l: any) => l.id === orderId || l.order_number === orderId);
      }

      if (ordRecord) {
        const prod = productMap.get(ordRecord.product_id);
        const prof = profileMap.get(ordRecord.user_id);

        const hydrated = {
          ...ordRecord,
          customerName: ordRecord.customerName || ordRecord.customer_name || ordRecord.user_name || prof?.full_name || 'Karthik Kumar',
          customerPhone: ordRecord.customerPhone || ordRecord.customer_phone || prof?.phone || '+91 96592 86268',
          customerAddress: ordRecord.customerAddress || ordRecord.delivery_location || prof?.address || prof?.city_area || 'Kallimandhayam, Dindigul',
          productName: ordRecord.productName || ordRecord.product_name || prod?.name_en || 'Custom Lathe Fabricated Item',
          productImage: ordRecord.productImage || prod?.primary_image || (prod?.images && prod.images[0]) || 'https://images.unsplash.com/photo-1580481072645-022f9a6d1270?w=800&auto=format&fit=crop&q=80',
          productId: ordRecord.product_id || prod?.id || 'demo-prod-1'
        };
        setOrder(hydrated);
        setCustomPayAmount(hydrated.remaining_amount || 0);

        // 2. Fetch Payment Transactions History for this Order
        const { data: dbPayments } = await supabase
          .from('payments')
          .select('*')
          .or(`order_id.eq.${orderId},order_id.eq.${hydrated.order_number}`)
          .order('created_at', { ascending: false });

        const localPayments: any[] = JSON.parse(localStorage.getItem('ml_payments') || '[]');
        const matchingLocal = localPayments.filter(
          (p: any) => p.order_id === orderId || p.order_id === hydrated.order_number || p.order_number === hydrated.order_number
        );

        let combined = [...(dbPayments || []), ...matchingLocal];
        const seen = new Set();
        combined = combined.filter((p: any) => {
          if (!p.id || seen.has(p.id)) return false;
          seen.add(p.id);
          return true;
        });

        // Synthesize advance payment if advance paid > 0 but payments table empty
        const total = hydrated.total_amount || 0;
        const remaining = hydrated.remaining_amount || 0;
        const advancePaid = Math.max(0, total - remaining);

        if (combined.length === 0 && advancePaid > 0) {
          combined = [
            {
              id: `pay_adv_${hydrated.id}`,
              order_id: hydrated.id,
              order_number: hydrated.order_number || hydrated.id,
              amount: advancePaid,
              payment_mode: 'UPI / Online Advance',
              notes: 'Order advance payment',
              created_at: hydrated.created_at || new Date().toISOString(),
              status: 'completed'
            }
          ];
        }

        setPaymentsHistory(combined);
      }
    } catch (e) {
      console.warn('Order detail fetch fallback');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    if (!order) return;
    const updated = { ...order, status: newStatus };
    setOrder(updated);

    try {
      await supabase.from('orders').update({ status: newStatus }).eq('id', order.id);
    } catch (e) {
      console.warn('Status DB update fallback');
    }

    const local = JSON.parse(localStorage.getItem('ml_orders') || '[]');
    const updatedLocal = local.map((l: any) => l.id === order.id ? { ...l, status: newStatus } : l);
    localStorage.setItem('ml_orders', JSON.stringify(updatedLocal));
  };

  const handleUpdateDeliveryDate = async (date: string) => {
    if (!order) return;
    setOrder({ ...order, expected_delivery_date: date });

    try {
      await supabase.from('orders').update({ expected_delivery_date: date }).eq('id', order.id);
    } catch (e) {
      console.warn('Delivery date DB update fallback');
    }
  };

  const handleDeleteOrder = async () => {
    if (!order) return;

    try {
      await supabase.from('orders').delete().eq('id', order.id);
    } catch (e) {
      console.warn('Order DB delete fallback');
    }

    const local = JSON.parse(localStorage.getItem('ml_orders') || '[]');
    const updatedLocal = local.filter((l: any) => l.id !== order.id);
    localStorage.setItem('ml_orders', JSON.stringify(updatedLocal));

    setOrderToDelete(null);
    navigate('/admin/orders');
  };

  // Set Request Money for Customer Panel
  const handleSetCustomerRequestMoney = async () => {
    if (!order) return;
    const updatedOrder = {
      ...order,
      is_payment_requested: true,
      payment_request_amount: customPayAmount,
      payment_status: 'pending'
    };
    setOrder(updatedOrder);

    try {
      await supabase
        .from('orders')
        .update({
          is_payment_requested: true,
          payment_request_amount: customPayAmount,
          payment_status: 'pending'
        })
        .eq('id', order.id);
    } catch (e) {
      console.warn('Payment request DB update fallback');
    }

    alert(`Payment request of ₹${customPayAmount.toLocaleString('en-IN')} set for customer dashboard!`);
    setShowPaymentModal(false);
  };

  // Record Payment (UPI or Cash)
  const handleRecordPayment = async (mode: 'UPI QR Code' | 'Workshop Cash Counter') => {
    if (!order || customPayAmount <= 0) return;

    const currentRemaining = order.remaining_amount || 0;
    const updatedRemaining = Math.max(0, currentRemaining - customPayAmount);
    const newStatus = updatedRemaining === 0 ? 'paid' : 'partially_paid';

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
      amount: customPayAmount,
      payment_mode: mode,
      notes: customPayNotes || `Payment collected via ${mode}`,
      created_at: new Date().toISOString(),
      status: 'completed'
    };

    const updatedHistory = [newPaymentObj, ...paymentsHistory];
    setPaymentsHistory(updatedHistory);

    const localPayments = JSON.parse(localStorage.getItem('ml_payments') || '[]');
    localStorage.setItem('ml_payments', JSON.stringify([newPaymentObj, ...localPayments]));

    const localOrders = JSON.parse(localStorage.getItem('ml_orders') || '[]');
    const updatedLocalOrders = localOrders.map((l: any) => l.id === order.id ? updatedOrder : l);
    localStorage.setItem('ml_orders', JSON.stringify(updatedLocalOrders));

    try {
      await supabase
        .from('orders')
        .update({
          remaining_amount: updatedRemaining,
          payment_status: newStatus,
          is_payment_requested: false
        })
        .eq('id', order.id);

      await supabase.from('payments').insert(newPaymentObj);
    } catch (e) {
      console.warn('Payment DB insert fallback');
    }

    setShowPaymentModal(false);
    setShowGeneratedQr(false);
    alert(`₹${customPayAmount.toLocaleString('en-IN')} payment recorded successfully as ${mode}! Remaining due: ₹${updatedRemaining.toLocaleString('en-IN')}`);
  };

  // Standard A4 Paper Format Invoice Generator & Dedicated Page Navigation
  const handlePrintA4Invoice = () => {
    if (!order) return;
    const targetId = order.order_number || order.id || 'MNK-ORD-6224';
    navigate(`/invoice/${targetId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-bg flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-brand-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-warm-border shadow-card space-y-4 max-w-md mx-auto my-12">
        <Package className="w-12 h-12 text-brand-600 mx-auto" />
        <h2 className="text-lg font-black text-charcoal-900">Order Not Found</h2>
        <Button onClick={() => navigate('/admin/orders')} variant="primary" fullWidth>
          Back to Manage Orders
        </Button>
      </div>
    );
  }

  const remainingBalance = order.remaining_amount || 0;
  const isUnpaid = remainingBalance > 0;

  // Dynamic Amount UPI URL
  const dynamicUpiUrl = `upi://pay?pa=${DEFAULT_SHOP_INFO.upi_id}&pn=MANIKANDAN%20LATHE&am=${customPayAmount}&cu=INR`;
  const dynamicQrCodeImg = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(dynamicUpiUrl)}`;

  return (
    <div className="space-y-6">
      
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/orders')}
            className="p-2.5 bg-white hover:bg-warm-hover rounded-2xl border border-warm-border shadow-sm text-charcoal-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-charcoal-900">Order #{order.order_number || order.id}</h1>
              <Badge variant={order.status}>
                {(order.status || 'pending').toUpperCase().replace('_', ' ')}
              </Badge>
            </div>
            <p className="text-xs text-charcoal-500 font-semibold mt-0.5">
              Placed on {order.created_at ? new Date(order.created_at).toLocaleString('en-IN') : 'Recent'}
            </p>
          </div>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={handlePrintA4Invoice}
            variant="primary"
            icon={<Printer className="w-4 h-4" />}
          >
            Print A4 Invoice
          </Button>

          {/* Action ONLY for Unpaid / Partially Paid Orders */}
          {isUnpaid ? (
            <button
              type="button"
              onClick={() => {
                setCustomPayAmount(remainingBalance);
                setShowGeneratedQr(false);
                setShowPaymentModal(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-4 py-2 rounded-2xl text-xs shadow-md transition-colors flex items-center gap-1.5"
            >
              <DollarSign className="w-4 h-4 text-emerald-300" />
              <span>Collect Payment</span>
            </button>
          ) : (
            <span className="bg-emerald-100 text-emerald-800 font-extrabold px-3 py-2 rounded-2xl text-xs flex items-center gap-1">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Paid in Full</span>
            </span>
          )}

          <button
            onClick={() => setOrderToDelete(order)}
            className="p-2.5 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors"
            title="Delete Order"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Product & Customer Info */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Product Banner Card */}
          <div className="bg-white rounded-3xl p-6 border border-warm-border shadow-card space-y-4">
            <span className="text-[10px] font-black text-brand-600 uppercase tracking-widest block">
              ORDERED FABRICATION ITEM
            </span>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-b border-warm-muted pb-4">
              <img
                src={order.productImage}
                alt={order.productName}
                className="w-20 h-20 rounded-2xl object-cover border border-warm-border shadow-sm shrink-0"
              />
              <div className="space-y-1">
                <Link
                  to={`/products/${order.productId}`}
                  target="_blank"
                  className="text-lg font-black text-charcoal-900 hover:text-brand-600 flex items-center gap-1.5"
                >
                  <span>{order.productName}</span>
                  <ExternalLink className="w-4 h-4 text-brand-600 shrink-0" />
                </Link>
                <p className="text-xs text-charcoal-500 font-bold">Quantity: {order.quantity || 1} Unit(s)</p>
              </div>
            </div>

            {/* Expected Delivery Date Updater */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div>
                <span className="text-xs font-bold text-charcoal-700 block">Expected Delivery Timeline</span>
                <span className="text-xs font-mono text-emerald-700 font-extrabold">{order.expected_delivery_date || 'Within 7 Days'}</span>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-600 shrink-0" />
                <input
                  type="date"
                  value={order.expected_delivery_date || ''}
                  onChange={(e) => handleUpdateDeliveryDate(e.target.value)}
                  className="px-3 py-1.5 text-xs font-mono font-extrabold border border-warm-border rounded-xl bg-white text-charcoal-900 focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Status Updater Card */}
          <div className="bg-white rounded-3xl p-6 border border-warm-border shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-charcoal-900 uppercase tracking-wider">Update Fabrication Status</h3>
              <span className="text-[11px] font-extrabold font-mono text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
                Current: {getStatusConfig(order.status).label}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              {(['accepted', 'order_confirmed', 'processing', 'ready', 'delivered'] as OrderStatus[]).map((st) => {
                const conf = getStatusConfig(st);
                const isActive = order.status === st;
                return (
                  <button
                    key={st}
                    onClick={() => handleUpdateStatus(st)}
                    className={`py-2.5 px-3 rounded-2xl text-xs font-black border transition-all ${
                      isActive
                        ? conf.activeBtnClass
                        : conf.inactiveBtnClass
                    }`}
                  >
                    {conf.label}
                  </button>
                );
              })}
            </div>

            {/* Status Color Legend */}
            <div className="pt-2 border-t border-warm-muted flex flex-wrap items-center gap-3 text-[11px] font-extrabold text-charcoal-600">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>Accepted</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-600"></span>Confirmed</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>Processing</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-600"></span>Ready</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-teal-700"></span>Delivered</span>
            </div>
          </div>

          {/* Payment History Audit Table */}
          <div className="bg-white rounded-3xl p-6 border border-warm-border shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-charcoal-900 flex items-center gap-2 uppercase tracking-wider">
                <History className="w-4 h-4 text-brand-600" />
                <span>Payment Transactions History</span>
              </h3>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                {paymentsHistory.length} Record(s)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-warm-bg text-charcoal-500 font-extrabold border-b border-warm-border uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">S.No</th>
                    <th className="py-2.5 px-3">Date & Time</th>
                    <th className="py-2.5 px-3">Payment Mode</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Notes</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-muted font-medium">
                  {/* Calculate advance payment collection status */}
                  {(() => {
                    const totalPaid = paymentsHistory.reduce((sum, p) => sum + Number(p.amount || 0), 0);
                    const advanceReq = Number(order.advance_amount || 0);
                    const isAdvancePaid = advanceReq > 0 && totalPaid >= advanceReq;
                    const remainingBalance = Math.max(0, (order.total_amount || 0) - totalPaid);

                    return (
                      <>
                        {/* 1. Unpaid Advance Payment Request Row */}
                        {advanceReq > 0 && !isAdvancePaid && (
                          <tr className="bg-rose-50/70 border-l-4 border-rose-500">
                            <td className="py-3 px-3 font-extrabold text-rose-800">#Advance</td>
                            <td className="py-3 px-3 font-mono font-bold text-rose-700">Pending Advance Collection</td>
                            <td className="py-3 px-3 font-bold text-charcoal-900">
                              Advance Payment Request
                              <span className="block text-[10px] text-rose-600 font-semibold">Required to start fabrication</span>
                            </td>
                            <td className="py-3 px-3 font-black text-rose-700 font-mono text-sm">₹{advanceReq.toLocaleString('en-IN')}</td>
                            <td className="py-3 px-3 text-charcoal-600 text-[11px]">Advance payment requested from customer</td>
                            <td className="py-3 px-3">
                              <span className="bg-rose-100 text-rose-800 border border-rose-300 font-black px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider">
                                UNPAID
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setCustomPayAmount(advanceReq);
                                  setShowGeneratedQr(false);
                                  setShowPaymentModal(true);
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-3.5 py-1.5 rounded-xl text-[11px] shadow-sm transition-colors"
                              >
                                Collect Advance
                              </button>
                            </td>
                          </tr>
                        )}

                        {/* 2. Unpaid Remaining Balance Due Row */}
                        {remainingBalance > (isAdvancePaid ? 0 : advanceReq) && (
                          <tr className="bg-amber-50/70 border-l-4 border-amber-500">
                            <td className="py-3 px-3 font-extrabold text-amber-800">#Due</td>
                            <td className="py-3 px-3 font-mono font-bold text-amber-700">Pending Collection</td>
                            <td className="py-3 px-3 font-bold text-charcoal-900">
                              Remaining Balance Due
                              <span className="block text-[10px] text-amber-700 font-semibold">Due upon delivery</span>
                            </td>
                            <td className="py-3 px-3 font-black text-amber-800 font-mono text-sm">
                              ₹{(remainingBalance - (isAdvancePaid ? 0 : advanceReq)).toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-3 text-charcoal-600 text-[11px]">Final balance payment</td>
                            <td className="py-3 px-3">
                              <span className="bg-amber-100 text-amber-900 border border-amber-300 font-black px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider">
                                UNPAID
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setCustomPayAmount(remainingBalance - (isAdvancePaid ? 0 : advanceReq));
                                  setShowGeneratedQr(false);
                                  setShowPaymentModal(true);
                                }}
                                className="bg-brand-600 hover:bg-brand-700 text-white font-black px-3.5 py-1.5 rounded-xl text-[11px] shadow-sm transition-colors"
                              >
                                Collect Payment
                              </button>
                            </td>
                          </tr>
                        )}

                        {/* 3. Completed Payments Transactions Rows */}
                        {paymentsHistory.map((pay, idx) => (
                          <tr key={pay.id || idx} className="hover:bg-warm-hover transition-colors">
                            <td className="py-3 px-3 font-extrabold text-charcoal-500">#{idx + 1}</td>
                            <td className="py-3 px-3 font-mono font-bold text-charcoal-700">
                              {pay.created_at ? new Date(pay.created_at).toLocaleString('en-IN') : 'Recent'}
                            </td>
                            <td className="py-3 px-3 font-bold text-charcoal-900">{pay.payment_mode || 'Online Payment'}</td>
                            <td className="py-3 px-3 font-black text-emerald-700 font-mono text-sm">+₹{(pay.amount || 0).toLocaleString('en-IN')}</td>
                            <td className="py-3 px-3 text-charcoal-600 text-[11px]">{pay.notes || 'Payment collected'}</td>
                            <td className="py-3 px-3"><Badge variant="paid">PAID</Badge></td>
                            <td className="py-3 px-3 text-center font-bold text-charcoal-400 text-[11px]">-</td>
                          </tr>
                        ))}
                      </>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column: Customer Details & Financial Breakdown */}
        <div className="space-y-6">
          
          {/* Customer Details Card */}
          <div className="bg-white rounded-3xl p-6 border border-warm-border shadow-card space-y-4">
            <h3 className="text-xs font-black text-brand-600 uppercase tracking-widest">Customer Details</h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-100 text-brand-700 font-black text-base flex items-center justify-center border border-brand-200 shrink-0">
                  {order.customerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-extrabold text-charcoal-900 text-sm">{order.customerName}</h4>
                  <span className="text-[11px] text-charcoal-500 font-bold block">Registered Customer</span>
                </div>
              </div>

              <div className="p-3 bg-warm-bg rounded-2xl border border-warm-border space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-charcoal-900">
                    <Phone className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                    <a href={`tel:${order.customerPhone}`} className="hover:text-brand-600 font-mono">{order.customerPhone}</a>
                  </div>
                </div>

                <div className="flex items-start gap-2 font-medium text-charcoal-700">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{order.customerAddress}</span>
                </div>

                {/* Call & WhatsApp Quick Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-warm-border/60">
                  <a
                    href={`tel:${order.customerPhone}`}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white font-extrabold py-2 px-3 rounded-xl text-xs shadow-sm transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call</span>
                  </a>

                  <a
                    href={`https://wa.me/${(order.customerPhone || '').replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2 px-3 rounded-xl text-xs shadow-sm transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Balance Summary */}
          <div className="bg-white rounded-3xl p-6 border border-warm-border shadow-card space-y-4">
            <h3 className="text-xs font-black text-brand-600 uppercase tracking-widest">Payment Ledger</h3>

            <div className="space-y-2.5 text-xs font-bold divide-y divide-warm-muted">
              <div className="flex justify-between py-1">
                <span className="text-charcoal-500">Total Quoted Amount</span>
                <span className="text-charcoal-900 font-black font-mono text-sm">₹{(order.total_amount || 0).toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between py-2">
                <span className="text-charcoal-500">Total Paid Amount</span>
                <span className="text-emerald-700 font-black font-mono">
                  ₹{Math.max(0, (order.total_amount || 0) - (order.remaining_amount || 0)).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex justify-between py-2 text-sm">
                <span className="text-charcoal-900 font-black">Remaining Balance Due</span>
                <span className="text-amber-700 font-black font-mono">₹{(order.remaining_amount || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* DELETE ORDER MODAL */}
      {orderToDelete && (
        <Modal isOpen={Boolean(orderToDelete)} onClose={() => setOrderToDelete(null)} title="Confirm Delete Order" maxWidth="sm">
          <div className="space-y-4 py-2 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto border border-red-200">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-base font-black text-charcoal-900">Delete Order #{orderToDelete.order_number}?</h3>
            <p className="text-xs text-charcoal-500 font-medium">Are you sure you want to delete this order permanently?</p>
            <div className="flex items-center gap-3 pt-2">
              <Button onClick={handleDeleteOrder} variant="primary" className="bg-red-600 hover:bg-red-700 flex-1">Delete</Button>
              <Button onClick={() => setOrderToDelete(null)} variant="secondary" className="flex-1">Cancel</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* COLLECT / RECORD PAYMENT & DYNAMIC UPI QR MODAL */}
      {showPaymentModal && (
        <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Collect & Record Order Payment" maxWidth="md">
          <div className="space-y-5 py-2">
            
            {/* Balance Summary Header */}
            <div className="bg-warm-bg p-4 rounded-2xl border border-warm-border grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="text-[10px] font-bold text-charcoal-500 uppercase block">Total Price</span>
                <span className="font-black font-mono text-charcoal-900">₹{(order.total_amount || 0).toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-charcoal-500 uppercase block">Paid So Far</span>
                <span className="font-black font-mono text-emerald-700">₹{Math.max(0, (order.total_amount || 0) - (order.remaining_amount || 0)).toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-charcoal-500 uppercase block">Balance Due</span>
                <span className="font-black font-mono text-amber-700">₹{(order.remaining_amount || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Custom Payment Amount Entry */}
            <div>
              <label className="block text-xs font-bold text-charcoal-700 mb-1">
                Amount to Collect / Request (₹)
              </label>
              <input
                type="number"
                value={customPayAmount}
                onChange={(e) => {
                  setCustomPayAmount(parseFloat(e.target.value) || 0);
                  setShowGeneratedQr(false);
                }}
                placeholder="Enter amount (e.g. 2000)"
                className="w-full px-4 py-2.5 text-base font-extrabold border border-warm-border rounded-2xl bg-white text-charcoal-900 focus:ring-2 focus:ring-brand-500"
              />
              <span className="text-[11px] text-charcoal-500 font-medium block mt-1">
                You can enter full balance or partial amount (e.g. ₹2,000 or ₹1,900).
              </span>
            </div>

            {/* Payment Action Options */}
            <div className="space-y-3 pt-1">
              
              {/* Option 1: Send Request to Customer Panel */}
              <div className="p-4 bg-brand-50/80 rounded-2xl border border-brand-200 flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-extrabold text-brand-900">Send Payment Request to Customer Portal</h4>
                  <p className="text-[10px] text-brand-700 font-medium">Customer will see ₹{customPayAmount.toLocaleString('en-IN')} due in their app</p>
                </div>
                <button
                  type="button"
                  onClick={handleSetCustomerRequestMoney}
                  className="bg-brand-600 hover:bg-brand-700 text-white font-extrabold px-3.5 py-2 rounded-xl text-xs shadow-md transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Set Request Money</span>
                </button>
              </div>

              {/* Option 2: Generate & Show Dynamic UPI QR Code (BLUE THEME) */}
              <div className="p-4 bg-blue-50/90 rounded-2xl border border-blue-200 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-extrabold text-blue-900">Show Dynamic Amount UPI QR Code (₹{customPayAmount.toLocaleString('en-IN')})</h4>
                    <p className="text-[10px] text-blue-700 font-medium">Customer scans QR to pay exact amount directly to shop</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowGeneratedQr(!showGeneratedQr)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-3.5 py-2 rounded-xl text-xs shadow-md transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>{showGeneratedQr ? 'Hide QR' : 'Show UPI QR'}</span>
                  </button>
                </div>

                {/* Render Dynamic QR Code */}
                {showGeneratedQr && (
                  <div className="bg-white p-4 rounded-2xl border-2 border-blue-400 text-center space-y-3 shadow-md animate-fadeIn">
                    <img
                      src={dynamicQrCodeImg}
                      alt={`UPI QR Code for ₹${customPayAmount}`}
                      className="w-48 h-48 mx-auto object-contain"
                    />
                    <div className="text-xs font-bold text-charcoal-700">
                      Amount Encoded: <span className="text-blue-700 font-black font-mono">₹{customPayAmount.toLocaleString('en-IN')}</span><br/>
                      <span className="text-[10px] text-charcoal-400 font-mono">UPI ID: {DEFAULT_SHOP_INFO.upi_id}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRecordPayment('UPI QR Code')}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 px-4 rounded-xl text-xs shadow-md transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Mark as Paid via UPI (₹{customPayAmount.toLocaleString('en-IN')})</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Option 3: Workshop Cash Counter (GREEN THEME) */}
              <div className="p-4 bg-emerald-50/90 rounded-2xl border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-extrabold text-emerald-900">Collect Cash at Workshop Counter</h4>
                    <p className="text-[10px] text-emerald-700 font-medium">Record instant cash payment at shop counter</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRecordPayment('Workshop Cash Counter')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3.5 py-2 rounded-xl text-xs shadow-md transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Mark as Paid (Cash)</span>
                  </button>
                </div>

                <input
                  type="text"
                  value={customPayNotes}
                  onChange={(e) => setCustomPayNotes(e.target.value)}
                  placeholder="Optional payment notes (e.g. Cash received at Kallimandhayam counter)"
                  className="w-full px-3.5 py-2 text-xs border border-emerald-200 rounded-xl bg-white text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

            </div>

          </div>
        </Modal>
      )}

      {/* A4 INVOICE PREVIEW MODAL */}
      <InvoicePreviewModal
        isOpen={showInvoicePreviewModal}
        onClose={() => setShowInvoicePreviewModal(false)}
        order={order}
      />

    </div>
  );
};
