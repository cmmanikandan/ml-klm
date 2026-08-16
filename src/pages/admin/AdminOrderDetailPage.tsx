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
  Plus,
  Check
} from 'lucide-react';
import { FabricationTimeline, FabricationStage } from '../../components/orders/FabricationTimeline';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { NotificationModal } from '../../components/common/NotificationModal';
import { InvoicePreviewModal } from '../../components/invoice/InvoicePreviewModal';
import { OrderStatus, PaymentStatus } from '../../types';
import { DEFAULT_SHOP_INFO, supabase } from '../../lib/supabase';
import { fetchActiveProducts } from '../../lib/productsStore';
import { getStatusConfig } from '../../lib/statusConfig';
import { 
  sendOrderConfirmationWhatsApp, 
  sendStatusUpdateWhatsApp, 
  sendInvoiceLinkWhatsApp, 
  sendPaymentReceiptWhatsApp 
} from '../../lib/whatsappService';

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

  // Weight & Price Calculator State
  const [isEditingCalc, setIsEditingCalc] = useState<boolean>(false);
  const [calcParts, setCalcParts] = useState<{ id: string; name: string; weight_kg: number }[]>([]);
  const [calcRatePerKg, setCalcRatePerKg] = useState<number>(160);
  const [calcExtraCharges, setCalcExtraCharges] = useState<{ id: string; description: string; amount: number }[]>([]);
  const [calcAdvanceReq, setCalcAdvanceReq] = useState<number>(0);

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
      const { data: dbOrder } = await supabase
        .from('orders')
        .select('*')
        .or(`id.eq.${orderId},order_number.eq.${orderId},enquiry_id.eq.${orderId}`)
        .maybeSingle();
      
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

        if (hydrated.weight_calculation) {
          if (hydrated.weight_calculation.parts && hydrated.weight_calculation.parts.length > 0) {
            setCalcParts(hydrated.weight_calculation.parts);
          }
          if (hydrated.weight_calculation.rate_per_kg) {
            setCalcRatePerKg(hydrated.weight_calculation.rate_per_kg);
          }
          if (hydrated.weight_calculation.extra_charges) {
            setCalcExtraCharges(hydrated.weight_calculation.extra_charges);
          }
          if (hydrated.weight_calculation.advance_amount !== undefined) {
            setCalcAdvanceReq(hydrated.weight_calculation.advance_amount);
          }
        } else {
          if (prod?.price_per_kg) setCalcRatePerKg(prod.price_per_kg);
          if (hydrated.advance_amount) setCalcAdvanceReq(hydrated.advance_amount);
        }

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
        const reqAdvance = hydrated.advance_amount || hydrated.payment_request_amount || 0;

        if (combined.length === 0 && (advancePaid > 0 || (reqAdvance > 0 && (hydrated.payment_status === 'paid' || hydrated.payment_status === 'partially_paid')))) {
          const advAmt = advancePaid > 0 ? advancePaid : reqAdvance;
          combined = [
            {
              id: `pay_adv_${hydrated.id}`,
              order_id: hydrated.id,
              order_number: hydrated.order_number || hydrated.id,
              amount: advAmt,
              payment_mode: 'Advance Payment',
              notes: 'Order advance payment collected for fabrication',
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

  const handleUpdateFabricationStage = async (stage: FabricationStage) => {
    if (!order) return;
    let mappedStatus: OrderStatus = order.status;
    if (stage === 'accepted') mappedStatus = 'accepted';
    if (stage === 'material_cut' || stage === 'welding') mappedStatus = 'processing';
    if (stage === 'painting') mappedStatus = 'processing';
    if (stage === 'ready') mappedStatus = 'ready';
    if (stage === 'delivered') mappedStatus = 'delivered';

    const updatedOrder = { ...order, fabrication_stage: stage, status: mappedStatus };
    setOrder(updatedOrder);

    const local = JSON.parse(localStorage.getItem('ml_orders') || '[]');
    const updatedLocal = local.map((l: any) => l.id === order.id ? updatedOrder : l);
    localStorage.setItem('ml_orders', JSON.stringify(updatedLocal));

    try {
      await supabase.from('orders').update({
        fabrication_stage: stage,
        status: mappedStatus
      }).eq('id', order.id);
    } catch (e) {
      console.warn('Fabrication stage DB update fallback', e);
    }
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
    const orderId = String(order.id);
    const enquiryId = String(order.enquiry_id || order.enquiryId || orderId);
    const orderNum = String(order.order_number || order.orderNumber || orderId);

    // 1. Update enquiry status to 'deleted' in Supabase FIRST (cross-device sync)
    //    Must happen BEFORE delete so all other devices read status='deleted' from DB
    const enqFilter = [];
    if (enquiryId && enquiryId !== orderId) enqFilter.push(`id.eq.${enquiryId}`);
    enqFilter.push(`id.eq.${orderId}`);
    if (orderNum && orderNum !== orderId) enqFilter.push(`enquiry_number.eq.${orderNum}`);
    await supabase
      .from('enquiries')
      .update({ status: 'deleted' })
      .or(enqFilter.join(','));

    // 2. Delete orders row from Supabase
    await supabase
      .from('orders')
      .delete()
      .or(`id.eq.${orderId},order_number.eq.${orderNum}`);

    // 3. Delete enquiry row from Supabase (status already saved above)
    await supabase
      .from('enquiries')
      .delete()
      .or(enqFilter.join(','));

    // 4. Track in LocalStorage as secondary safety net
    const deletedIds: string[] = JSON.parse(localStorage.getItem('ml_deleted_ids') || '[]');
    localStorage.setItem('ml_deleted_ids', JSON.stringify(Array.from(new Set([...deletedIds, orderId, enquiryId, orderNum]))));

    // 5. Remove from LocalStorage caches
    const localOrders = JSON.parse(localStorage.getItem('ml_orders') || '[]');
    localStorage.setItem('ml_orders', JSON.stringify(localOrders.filter(
      (l: any) => String(l.id) !== orderId && String(l.order_number) !== orderNum && String(l.enquiry_id) !== enquiryId
    )));
    const localEnquiries = JSON.parse(localStorage.getItem('ml_enquiries') || '[]');
    localStorage.setItem('ml_enquiries', JSON.stringify(localEnquiries.filter(
      (e: any) => String(e.id) !== enquiryId && String(e.id) !== orderId && String(e.enquiry_number) !== orderNum
    )));

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

    setNotifyModal({
      isOpen: true,
      title: 'Payment Request Sent',
      message: `Payment request of ₹${customPayAmount.toLocaleString('en-IN')} set for customer dashboard!`,
      type: 'success'
    });
    setShowPaymentModal(false);
  };

  // Record Payment (Cash, UPI, Card, Net Banking, Cheque, etc.)
  const handleRecordPayment = async (mode: string) => {
    if (!order || customPayAmount <= 0) return;

    const currentRemaining = order.remaining_amount || 0;
    const updatedRemaining = Math.max(0, currentRemaining - customPayAmount);
    const newStatus = updatedRemaining === 0 ? 'paid' : 'partially_paid';

    const updatedOrder = {
      ...order,
      remaining_amount: updatedRemaining,
      advance_amount: (order.advance_amount || 0) + customPayAmount,
      payment_status: newStatus as PaymentStatus,
      is_payment_requested: false
    };

    setOrder(updatedOrder);

    const localOrders: any[] = JSON.parse(localStorage.getItem('ml_orders') || '[]');
    const updatedLocal = localOrders.map((o) => (o.id === order.id ? updatedOrder : o));
    localStorage.setItem('ml_orders', JSON.stringify(updatedLocal));

    const localPayId = `pay_${Date.now()}`;
    const newPayRecord = {
      id: localPayId,
      order_id: order.id,
      order_number: order.order_number || order.id,
      user_id: order.user_id || '',
      amount: customPayAmount,
      payment_mode: mode,
      notes: customPayNotes || `${mode} payment collected at shop counter`,
      status: 'completed',
      created_at: new Date().toISOString()
    };
    
    setPaymentsHistory((prev) => [newPayRecord, ...prev]);

    const localPay = JSON.parse(localStorage.getItem('ml_payments') || '[]');
    localStorage.setItem('ml_payments', JSON.stringify([newPayRecord, ...localPay]));

    try {
      await supabase
        .from('orders')
        .update({
          remaining_amount: updatedRemaining,
          advance_amount: updatedOrder.advance_amount,
          payment_status: newStatus,
          is_payment_requested: false
        })
        .eq('id', order.id);

      // Strip local 'id' before DB insert — Supabase generates its own UUID
      const { id: _localId, ...dbPayRecord } = newPayRecord;
      await supabase.from('payments').insert(dbPayRecord);
    } catch (e) {
      console.warn('Payment DB insert fallback');
    }

    setShowPaymentModal(false);
    setShowGeneratedQr(false);
    setNotifyModal({
      isOpen: true,
      title: 'Payment Recorded',
      message: `₹${customPayAmount.toLocaleString('en-IN')} payment recorded successfully as ${mode}! Remaining due: ₹${updatedRemaining.toLocaleString('en-IN')}`,
      type: 'success'
    });
  };

  // Calculation Helper Methods
  const handleAddPart = () => {
    setCalcParts([...calcParts, { id: `part_${Date.now()}`, name: `Part ${calcParts.length + 1}`, weight_kg: 0 }]);
  };

  const handleUpdatePart = (partId: string, field: 'name' | 'weight_kg', val: any) => {
    setCalcParts(calcParts.map(p => p.id === partId ? { ...p, [field]: val } : p));
  };

  const handleRemovePart = (partId: string) => {
    setCalcParts(calcParts.filter(p => p.id !== partId));
  };

  const handleAddExtraCharge = () => {
    setCalcExtraCharges([...calcExtraCharges, { id: `extra_${Date.now()}`, description: 'Outsourced Fitting / Extra Lock', amount: 500 }]);
  };

  const handleUpdateExtraCharge = (chargeId: string, field: 'description' | 'amount', val: any) => {
    setCalcExtraCharges(calcExtraCharges.map(c => c.id === chargeId ? { ...c, [field]: val } : c));
  };

  const handleRemoveExtraCharge = (chargeId: string) => {
    setCalcExtraCharges(calcExtraCharges.filter(c => c.id !== chargeId));
  };

  const handleSaveWeightCalculation = async () => {
    if (!order) return;
    const totalWeight = calcParts.reduce((sum, p) => sum + (Number(p.weight_kg) || 0), 0);
    const weightCost = Math.round(totalWeight * calcRatePerKg);
    const extraTotal = calcExtraCharges.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    const grandTotal = weightCost + extraTotal;
    const advance = Number(calcAdvanceReq) || 0;
    
    // Calculate total already paid in history
    const totalPaid = paymentsHistory.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const remaining = Math.max(0, grandTotal - totalPaid);
    const payReqAmount = advance > totalPaid ? advance - totalPaid : remaining;

    const calcData = {
      parts: calcParts,
      rate_per_kg: calcRatePerKg,
      total_weight_kg: totalWeight,
      weight_subtotal: weightCost,
      extra_charges: calcExtraCharges,
      extra_subtotal: extraTotal,
      grand_total: grandTotal,
      advance_amount: advance,
      remaining_balance: remaining,
      calculated_at: new Date().toISOString()
    };

    const updatedOrder = {
      ...order,
      total_amount: grandTotal,
      advance_amount: advance,
      remaining_amount: remaining,
      payment_request_amount: payReqAmount > 0 ? payReqAmount : remaining,
      is_payment_requested: payReqAmount > 0,
      weight_calculation: calcData,
      pricing_type: 'weight'
    };
    setOrder(updatedOrder);

    // Save to LocalStorage & Supabase DB
    const localOrders = JSON.parse(localStorage.getItem('ml_orders') || '[]');
    const updatedLocal = localOrders.map((l: any) => l.id === order.id ? updatedOrder : l);
    localStorage.setItem('ml_orders', JSON.stringify(updatedLocal));

    try {
      await supabase.from('orders').update({
        total_amount: grandTotal,
        advance_amount: advance,
        remaining_amount: remaining,
        payment_request_amount: payReqAmount > 0 ? payReqAmount : remaining,
        is_payment_requested: payReqAmount > 0,
        weight_calculation: calcData
      }).eq('id', order.id);

      await supabase.from('notifications').insert({
        user_id: order.user_id || 'customer',
        title_en: 'Order Price & Weight Updated!',
        title_ta: 'ஆர்டர் விலை நிர்ணயிக்கப்பட்டது!',
        message_en: `Shop admin calculated total weight (${totalWeight} kg). Total Amount: ₹${grandTotal.toLocaleString('en-IN')}. Click to pay.`,
        message_ta: `வொர்க்ஷாப் நிர்வாகி உங்கள் ஆர்டர் தொகையை நிர்ணயித்துள்ளார்: ₹${grandTotal.toLocaleString('en-IN')}. ஆன்லைனில் செலுத்தவும்.`,
        type: 'order_update',
        link: `/orders/${order.id}`,
        is_read: false
      });
    } catch (e) {
      console.warn('DB update fallback for weight calc');
    }

    setIsEditingCalc(false);
    setNotifyModal({
      isOpen: true,
      title: 'Weight Calculation Saved',
      message: `Weight calculation saved successfully!\n• Total Weight: ${totalWeight} kg\n• Rate: ₹${calcRatePerKg}/kg\n• Base Weight Cost: ₹${weightCost.toLocaleString('en-IN')}\n• Extra Charges: ₹${extraTotal.toLocaleString('en-IN')}\n• Grand Total: ₹${grandTotal.toLocaleString('en-IN')}\n\nCustomer notified with payment card!`,
      type: 'success'
    });
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

          {/* Action based on real payment history and advance status */}
          {(() => {
            const totalPaidInHistory = paymentsHistory.reduce((sum, p) => sum + Number(p.amount || 0), 0);
            const totalOrderPrice = Number(order.total_amount) || 0;
            const requiredAdvance = Number(order.advance_amount || order.payment_request_amount || calcAdvanceReq) || 0;
            
            const isFullyPaid = totalOrderPrice > 0 && totalPaidInHistory >= totalOrderPrice;
            const isAdvancePending = requiredAdvance > 0 && totalPaidInHistory < requiredAdvance;
            const advanceDue = requiredAdvance - totalPaidInHistory;
            const balanceDue = Math.max(0, totalOrderPrice - totalPaidInHistory);

            if (isFullyPaid) {
              return (
                <span className="bg-emerald-100 text-emerald-800 font-extrabold px-3.5 py-2 rounded-2xl text-xs flex items-center gap-1.5 border border-emerald-300 shadow-sm">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Paid in Full (₹{totalOrderPrice.toLocaleString('en-IN')})</span>
                </span>
              );
            }

            if (isAdvancePending) {
              return (
                <button
                  type="button"
                  onClick={() => {
                    setCustomPayAmount(advanceDue);
                    setShowGeneratedQr(false);
                    setShowPaymentModal(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-4 py-2 rounded-2xl text-xs shadow-md transition-colors flex items-center gap-1.5"
                >
                  <DollarSign className="w-4 h-4 text-blue-200" />
                  <span>Collect Advance (₹{advanceDue.toLocaleString('en-IN')})</span>
                </button>
              );
            }

            if (balanceDue > 0) {
              return (
                <button
                  type="button"
                  onClick={() => {
                    setCustomPayAmount(balanceDue);
                    setShowGeneratedQr(false);
                    setShowPaymentModal(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-4 py-2 rounded-2xl text-xs shadow-md transition-colors flex items-center gap-1.5"
                >
                  <DollarSign className="w-4 h-4 text-blue-200" />
                  <span>Collect Balance (₹{balanceDue.toLocaleString('en-IN')})</span>
                </button>
              );
            }

            return (
              <button
                type="button"
                onClick={() => {
                  setCustomPayAmount(2000);
                  setShowGeneratedQr(false);
                  setShowPaymentModal(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-4 py-2 rounded-2xl text-xs shadow-md transition-colors flex items-center gap-1.5"
              >
                <DollarSign className="w-4 h-4" />
                <span>Collect Payment</span>
              </button>
            );
          })()}

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

          {/* WEIGHT & FABRICATION COST CALCULATOR CARD */}
          <div className="bg-white rounded-3xl p-6 border-2 border-brand-500/40 shadow-card space-y-5">
            
            {/* Header with Edit Toggle Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-warm-muted pb-3 gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚖️</span>
                <div>
                  <h3 className="text-sm font-black text-charcoal-900 uppercase tracking-wider">
                    Weight & Fabrication Cost Calculator
                  </h3>
                  <p className="text-[11px] text-charcoal-500 font-semibold">
                    {isEditingCalc ? 'Edit part weights, rate per kg, extra shop expenses & set advance' : 'Calculated parts & weight cost summary'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="bg-brand-50 text-brand-700 text-[11px] font-black px-3 py-1 rounded-full border border-brand-200">
                  Rate: ₹{calcRatePerKg}/kg
                </span>

                {!isEditingCalc ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingCalc(true)}
                    className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-extrabold px-3.5 py-1.5 rounded-xl shadow-md transition-colors flex items-center gap-1.5"
                  >
                    <span>✏️ Edit & Add Parts</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditingCalc(false)}
                    className="bg-warm-bg hover:bg-warm-hover text-charcoal-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-warm-border transition-colors"
                  >
                    View Summary
                  </button>
                )}
              </div>
            </div>

            {/* CASE 1: SAVED SUMMARY VIEW (!isEditingCalc) */}
            {!isEditingCalc ? (
              <div className="space-y-4">
                {/* Parts Breakdown Table */}
                <div className="bg-warm-bg p-4 rounded-2xl border border-warm-border space-y-3">
                  <span className="text-[10px] font-black text-charcoal-500 uppercase tracking-widest block">
                    ITEMIZED PARTS & WEIGHTS BREAKDOWN
                  </span>

                  <div className="divide-y divide-warm-muted border-t border-warm-border text-xs">
                    {calcParts.map((part, pIdx) => (
                      <div key={part.id || pIdx} className="py-2 flex items-center justify-between font-bold">
                        <div className="flex items-center gap-2">
                          <span className="text-charcoal-400 font-mono text-[11px]">#{pIdx + 1}</span>
                          <span className="text-charcoal-900">{part.name || `Section #${pIdx + 1}`}</span>
                        </div>
                        <span className="font-mono font-black text-charcoal-800">{part.weight_kg || 0} KG</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subtotals & Grand Total Summary Bar */}
                {(() => {
                  const totalWeight = calcParts.reduce((sum, p) => sum + (Number(p.weight_kg) || 0), 0);
                  const weightSubtotal = Math.round(totalWeight * calcRatePerKg);
                  const extraSubtotal = calcExtraCharges.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
                  const grandTotal = weightSubtotal + extraSubtotal;

                  return (
                    <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200 space-y-3">
                      <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
                        <div className="bg-white p-2.5 rounded-xl border border-amber-200">
                          <span className="text-[10px] text-charcoal-400 font-black block">TOTAL WEIGHT</span>
                          <span className="text-sm font-mono font-black text-charcoal-900">{totalWeight} KG</span>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-amber-200">
                          <span className="text-[10px] text-brand-600 font-black block">RATE PER KG</span>
                          <span className="text-sm font-mono font-black text-brand-700">₹{calcRatePerKg}/kg</span>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-amber-200">
                          <span className="text-[10px] text-emerald-700 font-black block">WEIGHT COST</span>
                          <span className="text-sm font-mono font-black text-emerald-800">₹{weightSubtotal.toLocaleString('en-IN')}</span>
                        </div>
                      </div>

                      {calcExtraCharges.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-amber-200 text-xs">
                          <span className="text-[10px] font-black text-charcoal-600 uppercase block">Extra Shop Charges:</span>
                          {calcExtraCharges.map((ex, exIdx) => (
                            <div key={ex.id || exIdx} className="flex justify-between font-medium">
                              <span>• {ex.description}</span>
                              <span className="font-mono font-bold text-charcoal-900">₹{ex.amount.toLocaleString('en-IN')}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="bg-brand-600 text-white p-3.5 rounded-xl flex items-center justify-between shadow-sm pt-2">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest block opacity-90">GRAND CALCULATED TOTAL</span>
                          <span className="text-xs opacity-80">Required Advance: ₹{calcAdvanceReq.toLocaleString('en-IN')}</span>
                        </div>
                        <span className="text-2xl font-black font-mono">₹{grandTotal.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              /* CASE 2: INTERACTIVE EDIT MODE (isEditingCalc) */
              <div className="space-y-5">
                {/* Part-by-Part Weight Entry */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-charcoal-800 uppercase tracking-wider">
                      Product Parts & Individual Weight (KG)
                    </label>
                    <button
                      type="button"
                      onClick={handleAddPart}
                      className="text-[11px] font-black text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1 rounded-xl border border-brand-200 transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Part / Section</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {calcParts.map((part, pIdx) => (
                      <div key={part.id || pIdx} className="flex items-center gap-2 bg-warm-bg p-2.5 rounded-xl border border-warm-border">
                        <span className="text-xs font-black text-charcoal-400 w-6 text-center">#{pIdx + 1}</span>
                        <input
                          type="text"
                          value={part.name}
                          onChange={(e) => handleUpdatePart(part.id, 'name', e.target.value)}
                          placeholder="e.g. Gate Frame / Top Arch"
                          className="flex-1 px-3 py-1.5 text-xs font-bold border border-warm-border rounded-lg bg-white"
                        />
                        <div className="flex items-center gap-1 w-28">
                          <input
                            type="number"
                            value={part.weight_kg || ''}
                            onChange={(e) => handleUpdatePart(part.id, 'weight_kg', parseFloat(e.target.value) || 0)}
                            placeholder="Weight"
                            className="w-full px-2.5 py-1.5 text-xs font-mono font-extrabold border border-warm-border rounded-lg bg-white text-right"
                          />
                          <span className="text-xs font-bold text-charcoal-600">kg</span>
                        </div>
                        {calcParts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePart(part.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rate & Weight Summary Row */}
                {(() => {
                  const totalWeight = calcParts.reduce((sum, p) => sum + (Number(p.weight_kg) || 0), 0);
                  const weightSubtotal = Math.round(totalWeight * calcRatePerKg);
                  const extraSubtotal = calcExtraCharges.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
                  const grandTotal = weightSubtotal + extraSubtotal;

                  return (
                    <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                        <div className="p-2.5 bg-white rounded-xl border border-amber-200">
                          <span className="text-[10px] font-black text-charcoal-400 uppercase tracking-widest block">TOTAL WEIGHT</span>
                          <span className="text-base font-black text-charcoal-900 font-mono">{totalWeight} KG</span>
                        </div>

                        <div className="p-2.5 bg-white rounded-xl border border-amber-200">
                          <label className="text-[10px] font-black text-brand-600 uppercase tracking-widest block mb-0.5">RATE PER KG (₹)</label>
                          <input
                            type="number"
                            value={calcRatePerKg}
                            onChange={(e) => setCalcRatePerKg(parseFloat(e.target.value) || 0)}
                            className="w-full text-center font-mono font-black text-sm text-brand-600 focus:outline-none bg-transparent"
                          />
                        </div>

                        <div className="p-2.5 bg-white rounded-xl border border-amber-200">
                          <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest block">BASE WEIGHT COST</span>
                          <span className="text-base font-black text-emerald-800 font-mono">₹{weightSubtotal.toLocaleString('en-IN')}</span>
                        </div>
                      </div>

                      {/* Extra Charges Section */}
                      <div className="space-y-2.5 pt-2 border-t border-amber-200">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-black text-charcoal-800 uppercase tracking-wider">
                            Extra Shop Charges & Outsourced Items
                          </label>
                          <button
                            type="button"
                            onClick={handleAddExtraCharge}
                            className="text-[11px] font-black text-amber-800 hover:text-amber-900 bg-amber-100 px-2.5 py-1 rounded-xl border border-amber-300 flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Extra Expense</span>
                          </button>
                        </div>

                        {calcExtraCharges.map((extra, eIdx) => (
                          <div key={extra.id || eIdx} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-amber-200">
                            <input
                              type="text"
                              value={extra.description}
                              onChange={(e) => handleUpdateExtraCharge(extra.id, 'description', e.target.value)}
                              placeholder="Item e.g. Purchased brass lock from shop B"
                              className="flex-1 px-3 py-1 text-xs font-bold border border-warm-border rounded-lg"
                            />
                            <div className="flex items-center gap-1 w-28">
                              <span className="text-xs font-extrabold text-charcoal-600">₹</span>
                              <input
                                type="number"
                                value={extra.amount || ''}
                                onChange={(e) => handleUpdateExtraCharge(extra.id, 'amount', parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-1 text-xs font-mono font-extrabold border border-warm-border rounded-lg text-right"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveExtraCharge(extra.id)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Grand Total & Advance Configuration */}
                      <div className="pt-2 border-t border-amber-300 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                        <div>
                          <label className="text-[10px] font-black text-charcoal-700 uppercase tracking-widest block">REQUIRED ADVANCE AMOUNT (₹)</label>
                          <input
                            type="number"
                            value={calcAdvanceReq}
                            onChange={(e) => setCalcAdvanceReq(parseFloat(e.target.value) || 0)}
                            placeholder="5000"
                            className="w-full px-3 py-1.5 text-sm font-mono font-extrabold border border-warm-border rounded-xl bg-white"
                          />
                        </div>

                        <div className="bg-brand-600 text-white p-3 rounded-xl text-right shadow-sm">
                          <span className="text-[10px] font-black uppercase tracking-widest block opacity-90">GRAND CALCULATED TOTAL</span>
                          <span className="text-2xl font-black font-mono">₹{grandTotal.toLocaleString('en-IN')}</span>
                        </div>
                      </div>

                      <Button
                        type="button"
                        onClick={handleSaveWeightCalculation}
                        variant="primary"
                        fullWidth
                        icon={<CheckCircle2 className="w-4 h-4" />}
                      >
                        Save Calculation
                      </Button>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* VISUAL WORKSHOP FABRICATION PROGRESS TIMELINE */}
          <FabricationTimeline 
            currentStage={order.fabrication_stage} 
            orderStatus={order.status} 
            isAdmin={true}
            onUpdateStage={handleUpdateFabricationStage}
            updatedAt={order.updated_at}
          />

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
                                className="bg-blue-600 hover:bg-blue-700 text-white font-black px-3.5 py-1.5 rounded-xl text-[11px] shadow-sm transition-colors"
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
                                className="bg-blue-600 hover:bg-blue-700 text-white font-black px-3.5 py-1.5 rounded-xl text-[11px] shadow-sm transition-colors"
                              >
                                Collect Balance
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
                    <span>Call Customer</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => sendInvoiceLinkWhatsApp(order)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2 px-3 rounded-xl text-xs shadow-sm transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp Invoice</span>
                  </button>
                </div>

                {/* 1-Click WhatsApp Quick Notifications */}
                <div className="pt-2 space-y-1.5 border-t border-warm-border/60">
                  <span className="text-[10px] font-black text-brand-600 uppercase tracking-widest block">
                    Customer WhatsApp Alerts
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => sendOrderConfirmationWhatsApp(order)}
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-extrabold p-2 rounded-xl text-[11px] border border-emerald-200 transition-colors flex items-center justify-center gap-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Order Confirm</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => sendStatusUpdateWhatsApp(order, order.status || 'processing')}
                      className="bg-brand-50 hover:bg-brand-100 text-brand-800 font-extrabold p-2 rounded-xl text-[11px] border border-brand-200 transition-colors flex items-center justify-center gap-1"
                    >
                      <Send className="w-3.5 h-3.5 text-brand-600" />
                      <span>Status Update</span>
                    </button>
                  </div>
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
