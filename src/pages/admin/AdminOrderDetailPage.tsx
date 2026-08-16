import React, { useState, useEffect, useRef } from 'react';
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
  Check,
  RefreshCw
} from 'lucide-react';
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

  // Pricing Mode & Calculator States
  const [pricingMode, setPricingMode] = useState<'fixed' | 'weight'>('fixed');
  const [isEditingCalc, setIsEditingCalc] = useState<boolean>(false);
  const [calcParts, setCalcParts] = useState<{ id: string; name: string; weight_kg: number }[]>([]);
  const [calcRatePerKg, setCalcRatePerKg] = useState<number>(160);
  const [calcExtraCharges, setCalcExtraCharges] = useState<{ id: string; description: string; amount: number }[]>([]);
  const [calcAdvanceReq, setCalcAdvanceReq] = useState<number>(0);

  // Fixed Pricing & Discount States
  const [isEditingFixedPrice, setIsEditingFixedPrice] = useState<boolean>(false);
  const [fixedQuantity, setFixedQuantity] = useState<number>(1);
  const [fixedUnitPrice, setFixedUnitPrice] = useState<number>(40000);
  const [fixedDiscount, setFixedDiscount] = useState<number>(0);
  const [fixedDiscountNotes, setFixedDiscountNotes] = useState<string>('');
  const [fixedExtraCharges, setFixedExtraCharges] = useState<number>(0);
  const [fixedAdvanceReq, setFixedAdvanceReq] = useState<number>(0);
  const [isSyncingPayments, setIsSyncingPayments] = useState<boolean>(false);

  // Realtime subscription ref
  const realtimeChannelRef = useRef<any>(null);

  useEffect(() => {
    if (id) {
      fetchOrderDetails(id);
    }
    // Cleanup realtime on unmount
    return () => {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
    };
  }, [id]);

  // Comprehensive payment transactions fetcher
  const fetchPaymentsHistoryForOrder = async (ord: any) => {
    if (!ord) return;
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ord.id);
      let dbPayments: any[] = [];

      if (isUuid) {
        const { data: byUuid } = await supabase
          .from('payments')
          .select('*')
          .eq('order_id', ord.id)
          .order('created_at', { ascending: false });
        if (byUuid) dbPayments.push(...byUuid);
      }

      if (ord.order_number) {
        const { data: byOrderNum } = await supabase
          .from('payments')
          .select('*')
          .eq('order_number', ord.order_number)
          .order('created_at', { ascending: false });
        if (byOrderNum) dbPayments.push(...byOrderNum);
      }

      // Also search local storage
      const localPayments: any[] = JSON.parse(localStorage.getItem('ml_payments') || '[]');
      const matchingLocal = localPayments.filter(
        (p: any) => p.order_id === ord.id || p.order_id === ord.order_number || p.order_number === ord.order_number
      );

      let combined = [...dbPayments, ...matchingLocal];
      const seen = new Set();
      combined = combined.filter((p: any) => {
        const key = p.id || `${p.amount}_${p.created_at}_${p.status}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Synthesize advance payment if advance paid > 0 but payments table empty
      const total = Number(ord.total_amount) || 0;
      const remaining = Number(ord.remaining_amount) || 0;
      const advancePaid = Math.max(0, total - remaining);
      const reqAdvance = Number(ord.advance_amount || ord.payment_request_amount || 0);

      if (combined.length === 0 && (advancePaid > 0 || (reqAdvance > 0 && (ord.payment_status === 'paid' || ord.payment_status === 'partially_paid')))) {
        const advAmt = advancePaid > 0 ? advancePaid : reqAdvance;
        combined = [
          {
            id: `pay_adv_${ord.id}`,
            order_id: ord.id,
            order_number: ord.order_number || ord.id,
            amount: advAmt,
            payment_mode: 'Advance Payment',
            notes: 'Order advance payment collected for fabrication',
            created_at: ord.created_at || new Date().toISOString(),
            status: 'completed'
          }
        ];
      }

      // Sort newest first
      combined.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      setPaymentsHistory(combined);
    } catch (e) {
      console.warn('Live fetch payments error:', e);
    }
  };

  // Subscribe to realtime order and payment changes after order is loaded
  useEffect(() => {
    if (!order?.id) return;

    // Remove old channel if exists
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
    }

    const channel = supabase
      .channel(`admin-order-live-${order.id}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${order.id}`
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' && payload.new) {
            const updated = payload.new as any;
            setOrder((prev: any) => ({ ...prev, ...updated }));
            fetchPaymentsHistoryForOrder(updated);

            const wc = updated.weight_calculation;
            if (wc) {
              if (wc.parts && wc.parts.length > 0) setCalcParts(wc.parts);
              if (wc.rate_per_kg) setCalcRatePerKg(wc.rate_per_kg);
              if (wc.extra_charges) setCalcExtraCharges(wc.extra_charges);
              if (wc.advance_amount !== undefined) setCalcAdvanceReq(wc.advance_amount);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments'
        },
        (payload) => {
          const rec: any = payload.new || payload.old;
          if (rec && (rec.order_id === order.id || rec.order_number === order.order_number || rec.order_id === order.order_number)) {
            fetchPaymentsHistoryForOrder(order);
          }
        }
      )
      .subscribe();

    realtimeChannelRef.current = channel;

    return () => {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
      }
    };
  }, [order?.id, order?.order_number]);

  const fetchOrderDetails = async (orderId: string) => {
    setLoading(true);
    try {
      const activeProducts = await fetchActiveProducts();
      const productMap = new Map(activeProducts.map(p => [p.id, p]));

      const { data: profilesData } = await supabase.from('profiles').select('*');
      const profileMap = new Map((profilesData || []).map((prof: any) => [prof.id, prof]));

      // 1. Fetch Order Record
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
      let ordRecord: any = null;

      if (isUuid) {
        const { data: dbByUuid } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .maybeSingle();
        if (dbByUuid) ordRecord = dbByUuid;
      }

      if (!ordRecord) {
        const { data: dbByOrderNum } = await supabase
          .from('orders')
          .select('*')
          .eq('order_number', orderId)
          .maybeSingle();
        if (dbByOrderNum) ordRecord = dbByOrderNum;
      }

      if (!ordRecord) {
        const { data: allOrders } = await supabase.from('orders').select('*');
        if (allOrders && allOrders.length > 0) {
          ordRecord = allOrders.find(
            (o: any) =>
              o.id === orderId ||
              o.order_number === orderId ||
              o.order_number?.toLowerCase() === orderId.toLowerCase() ||
              o.enquiry_id === orderId
          );
        }
      }
      
      if (!ordRecord) {
        const local = JSON.parse(localStorage.getItem('ml_orders') || '[]');
        ordRecord = local.find((l: any) => l.id === orderId || l.order_number === orderId);
      }

      if (ordRecord) {
        const prod = productMap.get(ordRecord.product_id);
        const prof = profileMap.get(ordRecord.user_id);
        const defaultUnitPrice = prod?.admin_price || 40000;
        const qty = ordRecord.quantity || 1;
        const computedTotal = (Number(ordRecord.total_amount) > 0) ? Number(ordRecord.total_amount) : (defaultUnitPrice * qty);
        const computedRemaining = (ordRecord.remaining_amount != null && Number(ordRecord.remaining_amount) > 0) 
          ? Number(ordRecord.remaining_amount) 
          : (Number(ordRecord.total_amount) > 0 ? (ordRecord.remaining_amount ?? computedTotal) : computedTotal);

        const hydrated = {
          ...ordRecord,
          total_amount: computedTotal,
          remaining_amount: computedRemaining,
          customerName: ordRecord.customerName || ordRecord.customer_name || ordRecord.user_name || prof?.full_name || 'Karthik Kumar',
          customerPhone: ordRecord.customerPhone || ordRecord.customer_phone || prof?.phone || '+91 96592 86268',
          customerAddress: ordRecord.customerAddress || ordRecord.delivery_location || prof?.address || prof?.city_area || 'Kallimandhayam, Dindigul',
          productName: ordRecord.productName || ordRecord.product_name || prod?.name_en || 'Custom Lathe Fabricated Item',
          productImage: ordRecord.productImage || prod?.primary_image || (prod?.images && prod.images[0]) || 'https://images.unsplash.com/photo-1580481072645-022f9a6d1270?w=800&auto=format&fit=crop&q=80',
          productId: ordRecord.product_id || prod?.id || 'demo-prod-1'
        };
        setOrder(hydrated);
        setCustomPayAmount(hydrated.remaining_amount || 0);

        const isWeightType = hydrated.pricing_type === 'weight' || (hydrated.weight_calculation && hydrated.weight_calculation.parts && hydrated.weight_calculation.parts.some((p: any) => Number(p.weight_kg) > 0));
        setPricingMode(isWeightType ? 'weight' : 'fixed');

        const orderTotalAmount = Number(hydrated.total_amount) || 0;
        const computedBaseUnit = orderTotalAmount > 0 ? Math.round(orderTotalAmount / qty) : defaultUnitPrice;
        const savedUnitPrice = Number(hydrated.unit_price) > 0 ? Number(hydrated.unit_price) : computedBaseUnit;
        setFixedQuantity(Number(hydrated.quantity) || 1);
        setFixedUnitPrice(savedUnitPrice);
        setFixedDiscount(Number(hydrated.discount_amount) || 0);
        setFixedDiscountNotes(hydrated.discount_notes || '');
        setFixedExtraCharges(Number(hydrated.extra_charges_amount) || 0);
        setFixedAdvanceReq(Number(hydrated.advance_amount) || 0);

        if (hydrated.weight_calculation) {
          // Restore calculator state from saved DB data
          const wc = hydrated.weight_calculation;
          if (wc.parts && wc.parts.length > 0) {
            setCalcParts(wc.parts);
          } else {
            // No parts saved yet — initialize with one empty part for user to fill
            setCalcParts([{ id: 'part_1', name: 'Part 1', weight_kg: 0 }]);
          }
          if (wc.rate_per_kg) setCalcRatePerKg(wc.rate_per_kg);
          else if (prod?.price_per_kg) setCalcRatePerKg(prod.price_per_kg);
          if (wc.extra_charges) setCalcExtraCharges(wc.extra_charges);
          if (wc.advance_amount !== undefined) setCalcAdvanceReq(wc.advance_amount);
        } else {
          // No calculation saved yet — initialize defaults
          setCalcParts([{ id: 'part_1', name: 'Part 1', weight_kg: 0 }]);
          if (prod?.price_per_kg) setCalcRatePerKg(prod.price_per_kg);
          if (hydrated.advance_amount) setCalcAdvanceReq(hydrated.advance_amount);
        }

        // 2. Fetch Payment Transactions History for this Order
        await fetchPaymentsHistoryForOrder(hydrated);
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
    const orderId = String(order.id);
    const enquiryId = String(order.enquiry_id || order.enquiryId || orderId);
    const orderNum = String(order.order_number || order.orderNumber || orderId);

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);

    // 1. Delete orders row from Supabase
    try {
      if (isUuid) {
        await supabase.from('orders').delete().eq('id', orderId);
      }
      if (orderNum) {
        await supabase.from('orders').delete().eq('order_number', orderNum);
      }
      if (enquiryId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(enquiryId)) {
        await supabase.from('orders').delete().eq('enquiry_id', enquiryId);
      }
    } catch (e) {
      console.warn('Orders table delete warning', e);
    }

    // 2. Delete enquiry row from Supabase
    try {
      if (enquiryId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(enquiryId)) {
        await supabase.from('enquiries').delete().eq('id', enquiryId);
      }
      if (orderNum) {
        await supabase.from('enquiries').delete().eq('enquiry_number', orderNum);
      }
    } catch (e) {
      console.warn('Enquiries table delete warning', e);
    }

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
    if (!order || customPayAmount <= 0) return;
    const updatedOrder = {
      ...order,
      is_payment_requested: true,
      payment_request_amount: customPayAmount,
      payment_status: 'pending'
    };
    setOrder(updatedOrder);

    const localPayId = `pay_req_${Date.now()}`;
    const newReqPayRecord = {
      id: localPayId,
      order_id: order.id,
      order_number: order.order_number || order.id,
      user_id: order.user_id || '',
      amount: customPayAmount,
      payment_mode: 'Payment Request Sent to Customer',
      notes: `Payment request of ₹${customPayAmount.toLocaleString('en-IN')} sent to customer`,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    setPaymentsHistory((prev) => [newReqPayRecord, ...prev.filter((p: any) => p.status !== 'pending')]);

    const localPay = JSON.parse(localStorage.getItem('ml_payments') || '[]');
    localStorage.setItem(
      'ml_payments',
      JSON.stringify([newReqPayRecord, ...localPay.filter((p: any) => p.order_id !== order.id || p.status !== 'pending')])
    );

    const localOrders: any[] = JSON.parse(localStorage.getItem('ml_orders') || '[]');
    const updatedLocal = localOrders.map((o) => (o.id === order.id ? updatedOrder : o));
    localStorage.setItem('ml_orders', JSON.stringify(updatedLocal));

    try {
      await supabase
        .from('orders')
        .update({
          is_payment_requested: true,
          payment_request_amount: customPayAmount,
          payment_status: 'pending'
        })
        .eq('id', order.id);

      const { id: _localId, ...dbPayRecord } = newReqPayRecord;
      await supabase.from('payments').insert(dbPayRecord);

      await supabase.from('notifications').insert({
        id: crypto.randomUUID(),
        user_id: order.user_id || 'customer',
        title_en: `Payment Requested for Order #${order.order_number || order.id}`,
        title_ta: `ஆர்டர் #${order.order_number || order.id}க்கு கட்டணம் கோரப்பட்டுள்ளது`,
        message_en: `Workshop admin requested payment of ₹${customPayAmount.toLocaleString('en-IN')}. Please click to pay online.`,
        message_ta: `வொர்க்ஷாப் நிர்வாகி ₹${customPayAmount.toLocaleString('en-IN')} கட்டணம் செலுத்துமாறு கோரியுள்ளார்.`,
        type: 'payment',
        link: `/orders/${order.order_number || order.id}`,
        is_read: false,
        created_at: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Payment request DB update fallback', e);
    }

    setNotifyModal({
      isOpen: true,
      title: 'Payment Request Sent',
      message: `Payment request of ₹${customPayAmount.toLocaleString('en-IN')} sent to customer! Recorded as UNPAID in Payment History.`,
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
      is_payment_requested: false,
      payment_request_amount: 0
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
    
    // Replace any pending payment request in paymentsHistory with this completed payment
    setPaymentsHistory((prev) => [newPayRecord, ...prev.filter((p: any) => p.status !== 'pending')]);

    const localPay = JSON.parse(localStorage.getItem('ml_payments') || '[]');
    localStorage.setItem(
      'ml_payments', 
      JSON.stringify([newPayRecord, ...localPay.filter((p: any) => p.order_id !== order.id || p.status !== 'pending')])
    );

    try {
      await supabase
        .from('orders')
        .update({
          remaining_amount: updatedRemaining,
          advance_amount: updatedOrder.advance_amount,
          payment_status: newStatus,
          is_payment_requested: false,
          payment_request_amount: 0
        })
        .eq('id', order.id);

      // Update any pending request record to completed in payments table
      await supabase
        .from('payments')
        .delete()
        .eq('order_id', order.id)
        .eq('status', 'pending');

      // Strip local 'id' before DB insert — Supabase generates its own UUID
      const { id: _localId, ...dbPayRecord } = newPayRecord;
      await supabase.from('payments').insert(dbPayRecord);
    } catch (e) {
      console.warn('Payment DB insert fallback', e);
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

  // Delete Payment Transaction Record & Recalculate Balance
  const handleDeletePayment = async (payToDelete: any) => {
    if (!order || !payToDelete) return;
    const targetId = payToDelete.id;

    // Filter out the deleted payment from state
    const updatedHistory = paymentsHistory.filter((p) => (p.id ? p.id !== targetId : p !== payToDelete));
    setPaymentsHistory(updatedHistory);

    // Calculate new total paid from remaining completed payments
    const completedPayments = updatedHistory.filter((p) => p.status === 'completed' || p.status === 'paid');
    const newPaid = completedPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const orderTotal = Number(order.total_amount || 0);
    const newRemaining = Math.max(0, orderTotal - newPaid);
    const newStatus: PaymentStatus = newRemaining === 0 && orderTotal > 0 ? 'paid' : newPaid > 0 ? 'partially_paid' : 'pending';

    const updatedOrder = {
      ...order,
      remaining_amount: newRemaining,
      advance_amount: Math.min(newPaid, orderTotal),
      payment_status: newStatus
    };
    setOrder(updatedOrder);

    // Sync localStorage
    const localPay = JSON.parse(localStorage.getItem('ml_payments') || '[]');
    localStorage.setItem(
      'ml_payments',
      JSON.stringify(localPay.filter((p: any) => (p.id ? p.id !== targetId : true)))
    );

    const localOrders: any[] = JSON.parse(localStorage.getItem('ml_orders') || '[]');
    localStorage.setItem('ml_orders', JSON.stringify(localOrders.map((o) => (o.id === order.id ? updatedOrder : o))));

    // Delete from Supabase payments table
    try {
      if (targetId && !targetId.startsWith('pay_')) {
        await supabase.from('payments').delete().eq('id', targetId);
      } else {
        await supabase
          .from('payments')
          .delete()
          .eq('order_id', order.id)
          .eq('amount', payToDelete.amount);
      }

      // Update order remaining balance and status in DB
      await supabase
        .from('orders')
        .update({
          remaining_amount: newRemaining,
          advance_amount: updatedOrder.advance_amount,
          payment_status: newStatus
        })
        .eq('id', order.id);
    } catch (e) {
      console.warn('Payment record delete DB fallback', e);
    }

    setNotifyModal({
      isOpen: true,
      title: 'Payment Record Deleted',
      message: `Payment entry of ₹${Number(payToDelete.amount || 0).toLocaleString('en-IN')} removed. Remaining due updated to ₹${newRemaining.toLocaleString('en-IN')}.`,
      type: 'info'
    });
  };

  // One-Click Direct Cash Collection for Advance or Pending Request
  const handleQuickCollectCash = async (amount: number, noteDesc?: string) => {
    if (!order || amount <= 0) return;
    const currentRemaining = order.remaining_amount || 0;
    const updatedRemaining = Math.max(0, currentRemaining - amount);
    const newStatus = updatedRemaining === 0 ? 'paid' : 'partially_paid';

    const updatedOrder = {
      ...order,
      remaining_amount: updatedRemaining,
      advance_amount: (order.advance_amount || 0) + amount,
      payment_status: newStatus as PaymentStatus,
      is_payment_requested: false,
      payment_request_amount: 0
    };

    setOrder(updatedOrder);

    const localPayId = `pay_cash_${Date.now()}`;
    const newPayRecord = {
      id: localPayId,
      order_id: order.id,
      order_number: order.order_number || order.id,
      user_id: order.user_id || '',
      amount: amount,
      payment_mode: 'Cash',
      notes: noteDesc || `Cash payment received at workshop counter`,
      status: 'completed',
      created_at: new Date().toISOString()
    };

    setPaymentsHistory((prev) => [newPayRecord, ...prev.filter((p: any) => p.status !== 'pending')]);

    const localPay = JSON.parse(localStorage.getItem('ml_payments') || '[]');
    localStorage.setItem(
      'ml_payments',
      JSON.stringify([newPayRecord, ...localPay.filter((p: any) => p.order_id !== order.id || p.status !== 'pending')])
    );

    const localOrders: any[] = JSON.parse(localStorage.getItem('ml_orders') || '[]');
    localStorage.setItem('ml_orders', JSON.stringify(localOrders.map((o) => (o.id === order.id ? updatedOrder : o))));

    try {
      await supabase
        .from('orders')
        .update({
          remaining_amount: updatedRemaining,
          advance_amount: updatedOrder.advance_amount,
          payment_status: newStatus,
          is_payment_requested: false,
          payment_request_amount: 0
        })
        .eq('id', order.id);

      await supabase
        .from('payments')
        .delete()
        .eq('order_id', order.id)
        .eq('status', 'pending');

      const { id: _localId, ...dbPayRecord } = newPayRecord;
      await supabase.from('payments').insert(dbPayRecord);
    } catch (e) {
      console.warn('Quick cash DB insert fallback', e);
    }

    setNotifyModal({
      isOpen: true,
      title: 'Cash Payment Recorded',
      message: `₹${amount.toLocaleString('en-IN')} Cash payment collected successfully! Remaining due: ₹${updatedRemaining.toLocaleString('en-IN')}`,
      type: 'success'
    });
  };

  // Send WhatsApp Payment Request Reminder to Customer
  const handleSendPaymentReminderWhatsApp = (amount: number) => {
    if (!order) return;
    const phone = order.customerPhone || order.customer_phone || '';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const payUrl = `${window.location.origin}/orders/${order.id}`;
    const text = `🔔 *Manikandan Lathe Payment Request*\n\nDear ${order.customerName || 'Customer'},\nAn advance/payment of *₹${amount.toLocaleString('en-IN')}* has been requested for your Order *#${order.order_number || order.id}*.\n\n💳 Pay securely online via Razorpay / UPI:\n${payUrl}\n\nThank you!\n*Manikandan Lathe Works*`;
    window.open(`https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`}?text=${encodeURIComponent(text)}`, '_blank');
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

  // ── PRICING MODE SWITCHER ─────────────────────────────────────────
  const handleSwitchPricingMode = async (mode: 'fixed' | 'weight') => {
    setPricingMode(mode);
    if (!order) return;

    const updated = { ...order, pricing_type: mode };
    setOrder(updated);

    // Persist mode to local storage & Supabase
    const localOrders = JSON.parse(localStorage.getItem('ml_orders') || '[]');
    const updatedLocal = localOrders.map((l: any) => (l.id === order.id || l.order_number === order.order_number) ? updated : l);
    localStorage.setItem('ml_orders', JSON.stringify(updatedLocal));

    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(order.id);
      if (isUuid) {
        await supabase.from('orders').update({ pricing_type: mode }).eq('id', order.id);
      }
      if (order.order_number) {
        await supabase.from('orders').update({ pricing_type: mode }).eq('order_number', order.order_number);
      }
    } catch (e) {
      console.warn('Mode switch update error:', e);
    }
  };

  // ── SAVE FIXED PRICE CALCULATION ──────────────────────────────────
  const handleSaveFixedPricing = async () => {
    if (!order) return;
    const qty = Number(fixedQuantity) || Number(order.quantity) || 1;
    const unitPrice = Number(fixedUnitPrice) || 0;
    const discount = Number(fixedDiscount) || 0;
    const extraCharges = Number(fixedExtraCharges) || 0;
    const advanceReq = Number(fixedAdvanceReq) || 0;

    const subtotal = unitPrice * qty;
    const grandTotal = Math.max(0, subtotal - discount + extraCharges);

    // Calculate total already paid in history
    const totalPaid = paymentsHistory
      .filter((p) => p.status === 'completed' || p.status === 'paid')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const remaining = Math.max(0, grandTotal - totalPaid);
    const payReqAmount = advanceReq > totalPaid ? advanceReq - totalPaid : (remaining > 0 ? remaining : 0);

    const updatePayload: any = {
      quantity: qty,
      unit_price: unitPrice,
      discount_amount: discount,
      discount_notes: fixedDiscountNotes || '',
      extra_charges_amount: extraCharges,
      total_amount: grandTotal,
      advance_amount: advanceReq,
      remaining_amount: remaining,
      payment_request_amount: payReqAmount > 0 ? payReqAmount : remaining,
      is_payment_requested: payReqAmount > 0,
      pricing_type: 'fixed'
    };

    const updatedOrder = {
      ...order,
      ...updatePayload
    };

    setOrder(updatedOrder);

    // Save to LocalStorage
    const localOrders = JSON.parse(localStorage.getItem('ml_orders') || '[]');
    const updatedLocal = localOrders.map((l: any) => (l.id === order.id || l.order_number === order.order_number) ? updatedOrder : l);
    localStorage.setItem('ml_orders', JSON.stringify(updatedLocal));

    // Save to Supabase DB (both by UUID and order_number)
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(order.id);
      if (isUuid) {
        await supabase.from('orders').update(updatePayload).eq('id', order.id);
      }
      if (order.order_number) {
        await supabase.from('orders').update(updatePayload).eq('order_number', order.order_number);
      }

      if (order.user_id && order.user_id !== 'guest_user') {
        await supabase.from('notifications').insert({
          id: crypto.randomUUID(),
          user_id: order.user_id,
          title_en: 'Order Price Updated!',
          title_ta: 'ஆர்டர் விலை புதுப்பிக்கப்பட்டது!',
          message_en: `Your order #${order.order_number || order.id} price has been updated. Total: ₹${grandTotal.toLocaleString('en-IN')}. Advance: ₹${advanceReq.toLocaleString('en-IN')}.`,
          message_ta: `உங்கள் ஆர்டர் #${order.order_number || order.id} விலை புதுப்பிக்கப்பட்டது. மொத்த தொகை: ₹${grandTotal.toLocaleString('en-IN')}. முன்பணம்: ₹${advanceReq.toLocaleString('en-IN')}.`,
          type: 'order_update',
          link: `/orders/${order.id}`,
          is_read: false,
          created_at: new Date().toISOString()
        });
      }
    } catch (e) {
      console.warn('DB update error for fixed price:', e);
    }

    setIsEditingFixedPrice(false);
    setNotifyModal({
      isOpen: true,
      title: 'Fixed Pricing Saved',
      message: `Fixed price configuration saved successfully!\n• Unit Price: ₹${unitPrice.toLocaleString('en-IN')}\n• Quantity: ${qty}\n• Subtotal: ₹${subtotal.toLocaleString('en-IN')}\n• Discount: -₹${discount.toLocaleString('en-IN')}\n• Extra Charges: +₹${extraCharges.toLocaleString('en-IN')}\n• Final Order Total: ₹${grandTotal.toLocaleString('en-IN')}\n• Required Advance: ₹${advanceReq.toLocaleString('en-IN')}\n• Remaining Due: ₹${remaining.toLocaleString('en-IN')}`,
      type: 'success'
    });
  };

  // ── SAVE WEIGHT & PARTS CALCULATION ───────────────────────────────
  const handleSaveWeightCalculation = async () => {
    if (!order) return;
    const totalWeight = calcParts.reduce((sum, p) => sum + (Number(p.weight_kg) || 0), 0);
    const weightCost = Math.round(totalWeight * calcRatePerKg);
    const extraTotal = calcExtraCharges.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    const grandTotal = weightCost + extraTotal;
    const advance = Number(calcAdvanceReq) || 0;
    
    // Calculate total already paid in history
    const totalPaid = paymentsHistory
      .filter((p) => p.status === 'completed' || p.status === 'paid')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
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

    const updatePayload: any = {
      total_amount: grandTotal,
      advance_amount: advance,
      remaining_amount: remaining,
      payment_request_amount: payReqAmount > 0 ? payReqAmount : remaining,
      is_payment_requested: payReqAmount > 0,
      weight_calculation: calcData,
      pricing_type: 'weight'
    };

    const updatedOrder = {
      ...order,
      ...updatePayload
    };
    setOrder(updatedOrder);

    // Save to LocalStorage
    const localOrders = JSON.parse(localStorage.getItem('ml_orders') || '[]');
    const updatedLocal = localOrders.map((l: any) => (l.id === order.id || l.order_number === order.order_number) ? updatedOrder : l);
    localStorage.setItem('ml_orders', JSON.stringify(updatedLocal));

    // Save to Supabase DB (both by UUID and order_number)
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(order.id);
      if (isUuid) {
        await supabase.from('orders').update(updatePayload).eq('id', order.id);
      }
      if (order.order_number) {
        await supabase.from('orders').update(updatePayload).eq('order_number', order.order_number);
      }

      if (order.user_id && order.user_id !== 'guest_user') {
        await supabase.from('notifications').insert({
          id: crypto.randomUUID(),
          user_id: order.user_id,
          title_en: 'Order Price & Weight Updated!',
          title_ta: 'ஆர்டர் விலை நிர்ணயிக்கப்பட்டது!',
          message_en: `Shop admin calculated total weight (${totalWeight} kg). Total Amount: ₹${grandTotal.toLocaleString('en-IN')}. Click to pay.`,
          message_ta: `வொர்க்ஷாப் நிர்வாகி உங்கள் ஆர்டர் தொகையை நிர்ணயித்துள்ளார்: ₹${grandTotal.toLocaleString('en-IN')}. ஆன்லைனில் செலுத்தவும்.`,
          type: 'order_update',
          link: `/orders/${order.id}`,
          is_read: false,
          created_at: new Date().toISOString()
        });
      }
    } catch (e) {
      console.warn('DB update fallback for weight calc', e);
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
    navigate(`/admin/invoice/${targetId}`);
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
                  defaultValue={order.expected_delivery_date || ''}
                  key={order.expected_delivery_date || 'no-date'}
                  onBlur={(e) => {
                    if (e.target.value) handleUpdateDeliveryDate(e.target.value);
                  }}
                  onChange={(e) => {
                    // Update local display only; DB save happens onBlur when date is complete
                    setOrder((prev: any) => ({ ...prev, expected_delivery_date: e.target.value }));
                  }}
                  className="px-3 py-1.5 text-xs font-mono font-extrabold border border-warm-border rounded-xl bg-white text-charcoal-900 focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          {/* PRICING SECTION: FIXED PRICE & DISCOUNT MANAGER OR WEIGHT CALCULATOR */}
          {pricingMode === 'fixed' ? (
            /* ========================================================================= */
            /* CASE A: CLEAN & COMPREHENSIVE FIXED PRODUCT PRICE & DISCOUNT MANAGER      */
            /* ========================================================================= */
            <div className="bg-white rounded-3xl p-6 border border-warm-border shadow-card space-y-5">
              
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-warm-muted pb-4 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-50 flex items-center justify-center text-xl shrink-0 border border-brand-200">
                    🏷️
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-charcoal-900 tracking-tight">
                        Order Pricing & Discount
                      </h3>
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-200">
                        Fixed Price Mode
                      </span>
                    </div>
                    <p className="text-xs text-charcoal-500 font-medium">
                      {isEditingFixedPrice ? 'Edit unit price, quantity, discount concessions, and set advance' : 'Base product price, discounts, and payment terms summary'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleSwitchPricingMode('weight')}
                    className="bg-warm-bg hover:bg-warm-hover text-charcoal-700 text-xs font-extrabold px-3.5 py-2 rounded-xl border border-warm-border transition-colors flex items-center gap-1.5"
                    title="Switch to weight-based itemized calculation"
                  >
                    <span>⚖️ Switch to Weight Mode</span>
                  </button>

                  {!isEditingFixedPrice ? (
                    <button
                      type="button"
                      onClick={() => setIsEditingFixedPrice(true)}
                      className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-extrabold px-3.5 py-2 rounded-xl shadow-md transition-colors flex items-center gap-1.5"
                    >
                      <span>✏️ Edit Price</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditingFixedPrice(false)}
                      className="bg-warm-bg hover:bg-warm-hover text-charcoal-700 text-xs font-bold px-3.5 py-2 rounded-xl border border-warm-border transition-colors"
                    >
                      <span>Cancel</span>
                    </button>
                  )}
                </div>
              </div>

              {(() => {
                const qty = Number(fixedQuantity) || Number(order.quantity) || 1;
                const subtotal = fixedUnitPrice * qty;
                const grandTotal = Math.max(0, subtotal - fixedDiscount + fixedExtraCharges);
                const totalPaid = paymentsHistory
                  .filter((p) => p.status === 'completed' || p.status === 'paid')
                  .reduce((sum, p) => sum + Number(p.amount || 0), 0);
                const remainingDue = Math.max(0, grandTotal - totalPaid);

                if (!isEditingFixedPrice) {
                  return (
                    <div className="space-y-4">
                      {/* Read-Only Summary Metric Cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-warm-bg p-3 rounded-2xl border border-warm-border">
                          <span className="text-[10px] font-black text-charcoal-400 uppercase tracking-wider block">Unit Price</span>
                          <span className="text-sm font-black font-mono text-charcoal-900">₹{fixedUnitPrice.toLocaleString('en-IN')}</span>
                        </div>

                        <div className="bg-warm-bg p-3 rounded-2xl border border-warm-border">
                          <span className="text-[10px] font-black text-charcoal-400 uppercase tracking-wider block">Quantity</span>
                          <span className="text-sm font-black font-mono text-charcoal-900">{qty} Unit(s)</span>
                        </div>

                        <div className="bg-warm-bg p-3 rounded-2xl border border-warm-border">
                          <span className="text-[10px] font-black text-charcoal-400 uppercase tracking-wider block">Base Subtotal</span>
                          <span className="text-sm font-black font-mono text-charcoal-900">₹{subtotal.toLocaleString('en-IN')}</span>
                        </div>

                        <div className="bg-warm-bg p-3 rounded-2xl border border-warm-border">
                          <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider block">Discount</span>
                          <span className="text-sm font-black font-mono text-rose-600">{fixedDiscount > 0 ? `-₹${fixedDiscount.toLocaleString('en-IN')}` : '₹0'}</span>
                        </div>
                      </div>

                      {/* Extra Charges or Discount Notes Banner */}
                      {(fixedExtraCharges > 0 || fixedDiscountNotes) && (
                        <div className="bg-warm-bg/70 p-3 rounded-2xl border border-warm-border text-xs flex flex-wrap items-center justify-between gap-2">
                          {fixedExtraCharges > 0 && (
                            <div>
                              <span className="text-charcoal-500 font-bold">Extra Charges: </span>
                              <span className="font-mono font-black text-charcoal-900">+₹{fixedExtraCharges.toLocaleString('en-IN')}</span>
                            </div>
                          )}
                          {fixedDiscountNotes && (
                            <div>
                              <span className="text-charcoal-500 font-bold">Discount Reason: </span>
                              <span className="font-semibold text-charcoal-800 italic">"{fixedDiscountNotes}"</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Grand Total & Advance Summary Bar */}
                      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                          <div>
                            <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest block">GRAND TOTAL AMOUNT</span>
                            <span className="text-2xl font-black font-mono text-emerald-900">₹{grandTotal.toLocaleString('en-IN')}</span>
                          </div>

                          <div className="border-l border-emerald-200 pl-4">
                            <span className="text-[10px] font-black text-charcoal-500 uppercase tracking-wider block">Required Advance</span>
                            <span className="text-sm font-black font-mono text-charcoal-900">₹{fixedAdvanceReq.toLocaleString('en-IN')}</span>
                          </div>

                          <div className="border-l border-emerald-200 pl-4">
                            <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider block">Remaining Due</span>
                            <span className="text-sm font-black font-mono text-amber-800">₹{remainingDue.toLocaleString('en-IN')}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setIsEditingFixedPrice(true)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 shrink-0"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Edit & Update Price</span>
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    {/* Interactive Input Form */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-warm-bg/70 p-3.5 rounded-2xl border border-warm-border">
                      <div>
                        <label className="text-[10px] font-black text-charcoal-500 uppercase tracking-wider block mb-1">
                          Unit Price (₹)
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-charcoal-400 font-bold text-xs">₹</span>
                          <input
                            type="number"
                            value={fixedUnitPrice}
                            onChange={(e) => setFixedUnitPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                            className="w-full pl-6 pr-2 py-2 text-sm font-black font-mono border border-warm-border rounded-xl bg-white text-charcoal-900 focus:ring-2 focus:ring-brand-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-charcoal-500 uppercase tracking-wider block mb-1">
                          Quantity
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={fixedQuantity}
                          onChange={(e) => setFixedQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full px-3 py-2 text-sm font-black font-mono border border-warm-border rounded-xl bg-white text-charcoal-900 focus:ring-2 focus:ring-brand-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-charcoal-500 uppercase tracking-wider block mb-1">
                          Discount (₹)
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-rose-500 font-bold text-xs">-₹</span>
                          <input
                            type="number"
                            value={fixedDiscount || ''}
                            onChange={(e) => setFixedDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                            placeholder="0"
                            className="w-full pl-7 pr-2 py-2 text-sm font-black font-mono border border-warm-border rounded-xl bg-white text-rose-600 focus:ring-2 focus:ring-rose-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-charcoal-500 uppercase tracking-wider block mb-1">
                          Extra Charges (₹)
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-charcoal-400 font-bold text-xs">+₹</span>
                          <input
                            type="number"
                            value={fixedExtraCharges || ''}
                            onChange={(e) => setFixedExtraCharges(Math.max(0, parseFloat(e.target.value) || 0))}
                            placeholder="0"
                            className="w-full pl-7 pr-2 py-2 text-sm font-black font-mono border border-warm-border rounded-xl bg-white text-charcoal-900 focus:ring-2 focus:ring-brand-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Discount Reason & Advance Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-warm-bg/70 p-3.5 rounded-2xl border border-warm-border">
                      <div>
                        <label className="text-[10px] font-black text-charcoal-500 uppercase tracking-wider block mb-1">
                          Discount Notes / Reason (Optional)
                        </label>
                        <input
                          type="text"
                          value={fixedDiscountNotes}
                          onChange={(e) => setFixedDiscountNotes(e.target.value)}
                          placeholder="e.g. Loyal Farmer Discount / Bulk Order Promo"
                          className="w-full px-3 py-2 text-xs font-bold border border-warm-border rounded-xl bg-white text-charcoal-900 focus:ring-2 focus:ring-brand-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-charcoal-500 uppercase tracking-wider block mb-1">
                          Required Advance Amount (₹)
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-charcoal-400 font-bold text-xs">₹</span>
                          <input
                            type="number"
                            value={fixedAdvanceReq || ''}
                            onChange={(e) => setFixedAdvanceReq(Math.max(0, parseFloat(e.target.value) || 0))}
                            placeholder="0"
                            className="w-full pl-6 pr-2 py-2 text-sm font-black font-mono border border-warm-border rounded-xl bg-white text-charcoal-900 focus:ring-2 focus:ring-brand-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Summary Bar & Save Button */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-warm-bg p-4 rounded-2xl border border-warm-border">
                      <div className="flex flex-wrap items-center gap-4">
                        <div>
                          <span className="text-[10px] font-black text-charcoal-400 uppercase tracking-wider block">Calculated Grand Total</span>
                          <span className="text-2xl font-black font-mono text-emerald-700">₹{grandTotal.toLocaleString('en-IN')}</span>
                        </div>

                        <div className="border-l border-warm-border pl-4 hidden md:block">
                          <span className="text-[10px] font-black text-charcoal-400 uppercase tracking-wider block">Remaining Due</span>
                          <span className="text-sm font-black font-mono text-amber-700">₹{remainingDue.toLocaleString('en-IN')}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsEditingFixedPrice(false)}
                          className="bg-white hover:bg-warm-hover text-charcoal-700 text-xs font-bold px-4 py-2.5 rounded-xl border border-warm-border transition-colors"
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          onClick={handleSaveFixedPricing}
                          className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-black px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 shrink-0"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Save Price & Update Order</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            /* ========================================================================= */
            /* CASE B: WEIGHT & FABRICATION COST CALCULATOR                               */
            /* ========================================================================= */
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
                  <button
                    type="button"
                    onClick={() => handleSwitchPricingMode('fixed')}
                    className="bg-warm-bg hover:bg-warm-hover text-charcoal-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-warm-border transition-colors flex items-center gap-1.5"
                    title="Switch to fixed product pricing"
                  >
                    <span>🏷️ Switch to Fixed</span>
                  </button>

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
          )}

          {/* INTERACTIVE WORKSHOP FABRICATION PROGRESS TRACKER */}
          <div className="bg-white rounded-3xl p-6 border-2 border-brand-500/30 shadow-card space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-warm-muted pb-3 gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🛠️</span>
                  <h3 className="text-sm font-black text-charcoal-900 uppercase tracking-wider">
                    Workshop Fabrication Progress Tracker
                  </h3>
                </div>
                <p className="text-[11px] text-charcoal-500 font-semibold mt-0.5">
                  Click any stage or use the button below to update fabrication milestone
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={order.status}>
                  {getStatusConfig(order.status).label}
                </Badge>
              </div>
            </div>

            {/* Interactive Milestone Timeline */}
            <div className="relative py-3">
              {(() => {
                const getStepIndex = (status: OrderStatus) => {
                  switch (status) {
                    case 'accepted': return 0;
                    case 'order_confirmed': return 1;
                    case 'processing': return 2;
                    case 'ready': return 3;
                    case 'delivered': return 4;
                    default: return 1;
                  }
                };
                const currentIdx = getStepIndex(order.status);
                const steps: { key: OrderStatus; label: string; desc: string; icon: string }[] = [
                  { key: 'accepted', label: '1. Accepted', desc: 'Queued for workshop', icon: '📝' },
                  { key: 'order_confirmed', label: '2. Confirmed', desc: 'Advance & specs locked', icon: '🔒' },
                  { key: 'processing', label: '3. Fabrication', desc: 'Lathe turning & welding', icon: '⚡' },
                  { key: 'ready', label: '4. Ready', desc: 'Quality checked for pickup', icon: '📦' },
                  { key: 'delivered', label: '5. Delivered', desc: 'Handed over to customer', icon: '✅' }
                ];

                const nextStep = currentIdx < steps.length - 1 ? steps[currentIdx + 1] : null;

                return (
                  <div className="space-y-6 pt-2">
                    {/* Milestone Nodes with Centered Track Line */}
                    <div className="relative">
                      {/* Connecting Line Track - precisely at vertical center (18px) of the 36px circles */}
                      <div className="absolute left-[10%] right-[10%] top-[18px] -translate-y-1/2 h-1.5 bg-gray-200 rounded-full z-0">
                        {/* Active Progress Fill */}
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 via-brand-500 to-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${(currentIdx / (steps.length - 1)) * 100}%` }}
                        />
                      </div>

                      {/* Milestone Nodes */}
                      <div className="flex items-start justify-between relative z-10">
                        {steps.map((step, idx) => {
                          const isDone = idx < currentIdx;
                          const isCurrent = idx === currentIdx;

                          return (
                            <div 
                              key={step.key} 
                              onClick={() => handleUpdateStatus(step.key)}
                              className="flex-1 flex flex-col items-center text-center px-1 cursor-pointer group"
                              title={`Click to set as "${step.label}"`}
                            >
                              <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs transition-all shrink-0 ${
                                  isCurrent
                                    ? 'bg-brand-600 text-white ring-4 ring-brand-200 shadow-md scale-110'
                                    : isDone
                                    ? 'bg-emerald-600 text-white shadow-sm group-hover:scale-105'
                                    : 'bg-white text-gray-400 border-2 border-gray-300 group-hover:border-brand-400'
                                }`}
                              >
                                {isDone ? '✓' : isCurrent ? '✓' : idx + 1}
                              </div>

                              <span
                                className={`text-[11px] font-black mt-2 leading-tight ${
                                  isCurrent ? 'text-brand-700' : isDone ? 'text-charcoal-900' : 'text-gray-400'
                                }`}
                              >
                                {step.label}
                              </span>
                              <span className="text-[9px] text-charcoal-400 font-medium hidden sm:block mt-0.5">
                                {step.desc}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Fast Stage Actions Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-warm-muted bg-warm-bg/60 p-3.5 rounded-2xl">
                      <div className="text-xs font-bold text-charcoal-700">
                        Current Stage: <span className="font-black text-brand-700">{steps[currentIdx]?.label}</span> — <span className="text-charcoal-500">{steps[currentIdx]?.desc}</span>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        {nextStep && (
                          <button
                            type="button"
                            onClick={() => {
                              handleUpdateStatus(nextStep.key);
                              sendStatusUpdateWhatsApp(order, nextStep.label);
                            }}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-black py-2 px-4 rounded-xl shadow-md transition-all"
                          >
                            <span>Advance to {nextStep.label} →</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => sendStatusUpdateWhatsApp(order, steps[currentIdx]?.label || order.status)}
                          className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black py-2 px-3 rounded-xl shadow-sm transition-all"
                          title="Notify Customer on WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">WhatsApp Alert</span>
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })()}
            </div>
          </div>

          {/* Payment History Audit Table */}
          <div className="bg-white rounded-3xl p-6 border border-warm-border shadow-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-warm-muted pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 border border-brand-200">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-charcoal-900 uppercase tracking-wider">
                      Payment Transactions History
                    </h3>
                    <span className="relative flex h-2 w-2" title="Realtime Live Sync Connected">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  </div>
                  <p className="text-[11px] text-charcoal-500 font-semibold">
                    Realtime ledger of online payments, workshop counter cash, UPI receipts & advance requests
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={isSyncingPayments}
                  onClick={async () => {
                    setIsSyncingPayments(true);
                    if (order) await fetchPaymentsHistoryForOrder(order);
                    setTimeout(() => setIsSyncingPayments(false), 600);
                  }}
                  className="bg-warm-bg hover:bg-warm-hover text-charcoal-700 text-xs font-extrabold px-3 py-1.5 rounded-xl border border-warm-border transition-colors flex items-center gap-1.5"
                  title="Sync transactions live from database"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-brand-600 ${isSyncingPayments ? 'animate-spin' : ''}`} />
                  <span>{isSyncingPayments ? 'Syncing...' : 'Sync Live'}</span>
                </button>

                <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  {paymentsHistory.length} Record(s)
                </span>
              </div>
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
                  {/* Render All Transactions & Requests from paymentsHistory */}
                  {(() => {
                    const completedPayments = paymentsHistory.filter((p) => p.status === 'completed' || p.status === 'paid');
                    const totalPaid = completedPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
                    const totalOrderPrice = Number(order.total_amount) || 0;
                    const remainingBalance = Math.max(0, totalOrderPrice - totalPaid);

                    return (
                      <>
                        {/* 1. If no transactions or requests exist yet and remaining balance > 0 */}
                        {paymentsHistory.length === 0 && remainingBalance > 0 && (
                          <tr className="bg-amber-50/70 border-l-4 border-amber-500">
                            <td className="py-3 px-3 font-extrabold text-amber-800">#Due</td>
                            <td className="py-3 px-3 font-mono font-bold text-amber-700">Order Placed</td>
                            <td className="py-3 px-3 font-bold text-charcoal-900">
                              Full Balance Due
                              <span className="block text-[10px] text-amber-700 font-semibold">Payment not requested yet</span>
                            </td>
                            <td className="py-3 px-3 font-black text-amber-800 font-mono text-sm">
                              ₹{remainingBalance.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-3 text-charcoal-600 text-[11px]">Awaiting advance/full payment request</td>
                            <td className="py-3 px-3">
                              <span className="bg-amber-100 text-amber-900 border border-amber-300 font-black px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider">
                                UNPAID
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setCustomPayAmount(remainingBalance);
                                  setShowGeneratedQr(false);
                                  setShowPaymentModal(true);
                                }}
                                className="bg-brand-600 hover:bg-brand-700 text-white font-extrabold px-3.5 py-1.5 rounded-xl text-xs shadow-sm transition-colors inline-flex items-center gap-1.5"
                              >
                                <DollarSign className="w-3.5 h-3.5" />
                                <span>Collect Payment (₹{remainingBalance.toLocaleString('en-IN')})</span>
                              </button>
                            </td>
                          </tr>
                        )}

                        {/* 2. All Actual Payment Records (Pending Requests & Completed Payments) */}
                        {paymentsHistory.map((pay, idx) => {
                          const isPending = pay.status === 'pending' || pay.status === 'unpaid';

                          if (isPending) {
                            return (
                              <tr key={pay.id || idx} className="bg-rose-50/70 border-l-4 border-rose-500">
                                <td className="py-3 px-3 font-extrabold text-rose-800">#{idx + 1}</td>
                                <td className="py-3 px-3 font-mono font-bold text-rose-700">
                                  {pay.created_at ? new Date(pay.created_at).toLocaleString('en-IN') : 'Recent Request'}
                                </td>
                                <td className="py-3 px-3 font-bold text-charcoal-900">
                                  {pay.payment_mode || 'Advance Payment Request'}
                                  <span className="block text-[10px] text-rose-600 font-semibold">Waiting for customer online / cash payment</span>
                                </td>
                                <td className="py-3 px-3 font-black text-rose-700 font-mono text-sm">
                                  ₹{(Number(pay.amount) || 0).toLocaleString('en-IN')}
                                </td>
                                <td className="py-3 px-3 text-charcoal-600 text-[11px]">
                                  {pay.notes || 'Payment requested by shop admin'}
                                </td>
                                <td className="py-3 px-3">
                                  <span className="bg-rose-100 text-rose-800 border border-rose-300 font-black px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider animate-pulse">
                                    UNPAID
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCustomPayAmount(Number(pay.amount) || remainingBalance);
                                        setShowGeneratedQr(false);
                                        setShowPaymentModal(true);
                                      }}
                                      className="bg-brand-600 hover:bg-brand-700 text-white font-extrabold px-3.5 py-1.5 rounded-xl text-xs shadow-sm transition-colors inline-flex items-center gap-1.5"
                                    >
                                      <DollarSign className="w-3.5 h-3.5" />
                                      <span>Collect Payment (₹{(Number(pay.amount) || remainingBalance).toLocaleString('en-IN')})</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleDeletePayment(pay)}
                                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-100 rounded-lg transition-colors"
                                      title="Delete payment request"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          }

                          return (
                            <tr key={pay.id || idx} className="hover:bg-warm-hover transition-colors">
                              <td className="py-3 px-3 font-extrabold text-charcoal-500">#{idx + 1}</td>
                              <td className="py-3 px-3 font-mono font-bold text-charcoal-700">
                                {pay.created_at ? new Date(pay.created_at).toLocaleString('en-IN') : 'Recent'}
                              </td>
                              <td className="py-3 px-3 font-bold text-charcoal-900">{pay.payment_mode || 'Online Payment'}</td>
                              <td className="py-3 px-3 font-black text-emerald-700 font-mono text-sm">+₹{(Number(pay.amount) || 0).toLocaleString('en-IN')}</td>
                              <td className="py-3 px-3 text-charcoal-600 text-[11px]">{pay.notes || 'Payment collected'}</td>
                              <td className="py-3 px-3">
                                <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-black px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider">
                                  PAID
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <div className="flex items-center justify-center gap-2.5">
                                  <span className="font-bold text-emerald-600 text-xs">✓ Received</span>
                                  <button
                                    type="button"
                                    onClick={() => handleDeletePayment(pay)}
                                    className="p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                    title="Delete payment record"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
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

            {(() => {
              const effectiveTotal = (order.total_amount && Number(order.total_amount) > 0) 
                ? Number(order.total_amount) 
                : Math.max(0, (fixedUnitPrice * (order.quantity || 1)) - fixedDiscount + fixedExtraCharges);
              const totalPaid = paymentsHistory
                .filter((p) => p.status === 'completed' || p.status === 'paid')
                .reduce((sum, p) => sum + Number(p.amount || 0), 0);
              const effectiveRemaining = order.remaining_amount != null && Number(order.remaining_amount) >= 0 && Number(order.total_amount) > 0
                ? Number(order.remaining_amount)
                : Math.max(0, effectiveTotal - totalPaid);

              return (
                <div className="space-y-2.5 text-xs font-bold divide-y divide-warm-muted">
                  <div className="flex justify-between py-1">
                    <span className="text-charcoal-500">Total Quoted Amount</span>
                    <span className="text-charcoal-900 font-black font-mono text-sm">₹{effectiveTotal.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="flex justify-between py-2">
                    <span className="text-charcoal-500">Total Paid Amount</span>
                    <span className="text-emerald-700 font-black font-mono">
                      ₹{totalPaid.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex justify-between py-2 text-sm">
                    <span className="text-charcoal-900 font-black">Remaining Balance Due</span>
                    <span className="text-amber-700 font-black font-mono">₹{effectiveRemaining.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              );
            })()}
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
