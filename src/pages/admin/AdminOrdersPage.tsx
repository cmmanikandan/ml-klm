import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Phone, 
  MessageSquare, 
  CreditCard, 
  DollarSign, 
  Calendar, 
  Printer, 
  CheckCircle2, 
  Search, 
  Trash2, 
  Eye, 
  ExternalLink,
  Package,
  User,
  MapPin,
  Clock,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { NotificationModal } from '../../components/common/NotificationModal';
import { OrderStatus } from '../../types';
import { DEFAULT_SHOP_INFO, INITIAL_PRODUCTS, supabase } from '../../lib/supabase';
import { fetchActiveProducts } from '../../lib/productsStore';
import { getStatusConfig } from '../../lib/statusConfig';
import { InvoicePreviewModal } from '../../components/invoice/InvoicePreviewModal';
import { 
  sendOrderConfirmationWhatsApp, 
  sendStatusUpdateWhatsApp, 
  sendInvoiceLinkWhatsApp, 
  sendPaymentReceiptWhatsApp 
} from '../../lib/whatsappService';

export const AdminOrdersPage: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [previewInvoiceOrder, setPreviewInvoiceOrder] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const [orders, setOrders] = useState<any[]>([]);

  // Selected Order for Full Detail & Management Modal
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Delete Order Confirmation Modal State
  const [orderToDelete, setOrderToDelete] = useState<any | null>(null);
  
  // Payment Request Modal
  const [paymentReqAmount, setPaymentReqAmount] = useState<number>(5000);
  
  // Cash Payment Recorder Modal
  const [cashAmount, setCashAmount] = useState<number>(2000);
  const [cashNotes, setCashNotes] = useState<string>('Cash received at workshop counter');
  const [showCashModal, setShowCashModal] = useState(false);

  // Custom Notification Modal State
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
    fetchLiveOrders();
  }, []);

  const fetchLiveOrders = async () => {
    setLoading(true);
    try {
      // 1. Fetch active products for hydration lookup
      const activeProducts = await fetchActiveProducts();
      const productMap = new Map(activeProducts.map(p => [p.id, p]));

      // 2. Fetch profiles for customer lookup
      const { data: profilesData } = await supabase.from('profiles').select('*');
      const profileMap = new Map((profilesData || []).map((prof: any) => [prof.id, prof]));

      // 3. Fetch orders from Supabase DB
      const { data: dbOrders, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      const local = JSON.parse(localStorage.getItem('ml_orders') || '[]');
      let combined: any[] = [...(dbOrders || []), ...local];

      const deletedIds: string[] = JSON.parse(localStorage.getItem('ml_deleted_ids') || '[]');
      const deletedSet = new Set(deletedIds);

      // Filter out permanently deleted orders
      combined = combined.filter((o: any) => {
        const idStr = String(o.id || '');
        const numStr = String(o.order_number || '');
        const enqStr = String(o.enquiry_id || '');
        return !deletedSet.has(idStr) && !deletedSet.has(numStr) && !deletedSet.has(enqStr);
      });

      // Auto-synthesize order records for accepted/converted enquiries if missing
      const localEnquiries: any[] = JSON.parse(localStorage.getItem('ml_enquiries') || '[]');
      const { data: dbEnquiries } = await supabase.from('enquiries').select('*');
      const allEnqs = [...(dbEnquiries || []), ...localEnquiries];

      for (const enq of allEnqs) {
        const enqIdStr = String(enq.id || '');
        const enqNumStr = String(enq.enquiry_number || '');
        if (deletedSet.has(enqIdStr) || deletedSet.has(enqNumStr) || enq.status === 'deleted') continue;

        const normSt = String(enq.status || '').toLowerCase();
        if (normSt === 'accepted' || normSt === 'converted') {
          const enqId = enq.id;
          const matchExisting = combined.find(
            (o) => o.enquiry_id === enqId || o.id === enqId || o.order_number === enqId || (enq.converted_order_id && (o.id === enq.converted_order_id || o.order_number === enq.converted_order_id))
          );
          if (!matchExisting) {
            const targetProd = productMap.get(enq.product_id) || INITIAL_PRODUCTS[0];
            const targetProf = profileMap.get(enq.user_id);
            const synthesizedOrd = {
              id: enq.converted_order_id || enq.enquiry_number || enq.id,
              order_number: enq.enquiry_number || enq.id,
              enquiry_id: enq.id,
              user_id: enq.user_id || 'demo-user-123',
              customerName: enq.customerName || enq.customer_name || targetProf?.full_name || 'Manikandan Prabhu',
              customerPhone: enq.customerPhone || enq.customer_phone || targetProf?.phone || '+91 96292 86268',
              customerAddress: enq.delivery_location || enq.location || 'Kallimandhayam',
              product_id: enq.product_id || targetProd.id,
              productName: enq.productName || enq.product_name || targetProd.name_en || 'Compound Wall Gate',
              productImage: targetProd.primary_image || (targetProd.images && targetProd.images[0]) || 'https://images.unsplash.com/photo-1580481072645-022f9a6d1270?w=800&auto=format&fit=crop&q=80',
              quantity: enq.quantity || 1,
              status: 'accepted',
              expected_delivery_date: 'Within 7 Days',
              total_amount: enq.quote_price || enq.total_amount || 0,
              advance_amount: enq.advance_amount || 0,
              remaining_amount: enq.quote_price || enq.total_amount || 0,
              is_payment_requested: false,
              payment_request_amount: 0,
              payment_status: 'unpaid',
              created_at: enq.created_at || new Date().toISOString()
            };
            combined.push(synthesizedOrd);
            local.push(synthesizedOrd);
            localStorage.setItem('ml_orders', JSON.stringify(local));
          }
        }
      }

      const seen = new Set();
      combined = combined.filter((o: any) => {
        const key = o.id || o.order_number;
        if (!key || seen.has(key)) return false;
        seen.add(key);
        if (o.order_number) seen.add(o.order_number);
        return true;
      });

      // Filter out demo mock orders AND POS Counter Sales permanently from Online Orders Page
      combined = combined.filter((o: any) => {
        const key = String(o.id || o.order_number || '');
        if (key.includes('ord-101') || key.includes('ord-102') || key.includes('1785163424023') || key.includes('POS')) {
          return false;
        }
        if (o.is_pos === true || (o.admin_notes && o.admin_notes.includes('POS'))) {
          return false;
        }
        return true;
      });

      // Hydrate missing customer & product info
      const hydratedOrders = combined.map((ord: any) => {
        const prod = productMap.get(ord.product_id);
        const prof = profileMap.get(ord.user_id);

        return {
          ...ord,
          customerName: ord.customerName || ord.customer_name || ord.user_name || prof?.full_name || 'Karthik Kumar (Customer)',
          customerPhone: ord.customerPhone || ord.customer_phone || prof?.phone || '+91 98421 54321',
          customerAddress: ord.customerAddress || ord.delivery_location || prof?.address || prof?.city_area || 'Kallimandhayam, Dindigul',
          productName: ord.productName || ord.product_name || prod?.name_en || 'Custom Lathe Fabricated Item',
          productImage: ord.productImage || prod?.primary_image || (prod?.images && prod.images[0]) || 'https://images.unsplash.com/photo-1580481072645-022f9a6d1270?w=800&auto=format&fit=crop&q=80',
          productId: ord.product_id || prod?.id || 'demo-prod-1'
        };
      });

      setOrders(hydratedOrders);
    } catch (e) {
      console.warn('Admin live orders load fallback');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (filterStatus !== 'all' && o.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        (o.order_number || o.id || '').toLowerCase().includes(q) ||
        (o.customerName || '').toLowerCase().includes(q) ||
        (o.customerPhone || '').includes(q) ||
        (o.productName || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    setOrders(orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
    if (selectedOrder) setSelectedOrder({ ...selectedOrder, status: newStatus });

    try {
      await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    } catch (e) {
      console.warn('Order status DB update fallback');
    }

    const local = JSON.parse(localStorage.getItem('ml_orders') || '[]');
    const updatedLocal = local.map((l: any) => l.id === orderId ? { ...l, status: newStatus } : l);
    localStorage.setItem('ml_orders', JSON.stringify(updatedLocal));
  };

  const handleUpdateDeliveryDate = async (orderId: string, date: string) => {
    setOrders(orders.map((o) => (o.id === orderId ? { ...o, expected_delivery_date: date } : o)));
    try {
      await supabase.from('orders').update({ expected_delivery_date: date }).eq('id', orderId);
    } catch (e) {
      console.warn('Delivery date update fallback');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    const enquiryId = targetOrder?.enquiry_id || targetOrder?.enquiryId || orderId;
    const orderNum = targetOrder?.order_number || targetOrder?.orderNumber || orderId;

    // 1. Update enquiry status to 'deleted' in Supabase FIRST (cross-device sync)
    //    This must happen BEFORE delete so all devices see status='deleted' via DB
    const enqFilter = [];
    if (enquiryId && enquiryId !== orderId) enqFilter.push(`id.eq.${enquiryId}`);
    if (orderId) enqFilter.push(`id.eq.${orderId}`);
    if (orderNum && orderNum !== orderId) enqFilter.push(`enquiry_number.eq.${orderNum}`);
    if (enqFilter.length > 0) {
      await supabase
        .from('enquiries')
        .update({ status: 'deleted' })
        .or(enqFilter.join(','));
    }

    // 2. Delete orders row from Supabase
    await supabase
      .from('orders')
      .delete()
      .or(`id.eq.${orderId},order_number.eq.${orderNum}`);

    // 3. Delete enquiry row from Supabase (after status update already saved)
    if (enqFilter.length > 0) {
      await supabase
        .from('enquiries')
        .delete()
        .or(enqFilter.join(','));
    }

    // 4. Track in LocalStorage as secondary safety net
    const deletedIds: string[] = JSON.parse(localStorage.getItem('ml_deleted_ids') || '[]');
    const idsToAdd = [String(orderId), String(enquiryId), String(orderNum)].filter(Boolean);
    localStorage.setItem('ml_deleted_ids', JSON.stringify(Array.from(new Set([...deletedIds, ...idsToAdd]))));

    // 5. Remove from LocalStorage caches
    const local = JSON.parse(localStorage.getItem('ml_orders') || '[]');
    localStorage.setItem('ml_orders', JSON.stringify(local.filter(
      (l: any) => l.id !== orderId && l.order_number !== orderNum && l.enquiry_id !== enquiryId
    )));
    const localEnquiries = JSON.parse(localStorage.getItem('ml_enquiries') || '[]');
    localStorage.setItem('ml_enquiries', JSON.stringify(localEnquiries.filter(
      (e: any) => e.id !== enquiryId && e.id !== orderId && e.enquiry_number !== orderNum
    )));

    // 6. Update UI state
    setOrders(orders.filter(
      (o) => o.id !== orderId && o.order_number !== orderNum && o.enquiry_id !== enquiryId
    ));
    setOrderToDelete(null);
    if (selectedOrder?.id === orderId) setSelectedOrder(null);
  };

  const handleCreatePaymentRequest = async (order: any) => {
    const updated = orders.map((o) =>
      o.id === order.id
        ? {
            ...o,
            is_payment_requested: true,
            payment_request_amount: paymentReqAmount,
            payment_status: 'pending'
          }
        : o
    );
    setOrders(updated);

    try {
      await supabase
        .from('orders')
        .update({
          is_payment_requested: true,
          payment_request_amount: paymentReqAmount,
          payment_status: 'pending'
        })
        .eq('id', order.id);
    } catch (e) {
      console.warn('Payment request DB update fallback');
    }

    setNotifyModal({
      isOpen: true,
      title: 'Payment Request Sent',
      message: `Payment request of ₹${paymentReqAmount.toLocaleString('en-IN')} sent to customer dashboard!`,
      type: 'success'
    });
    setSelectedOrder(null);
  };

  const handleRecordCashPayment = async () => {
    if (!selectedOrder) return;
    const updatedRemaining = Math.max(0, (selectedOrder.remaining_amount || 0) - cashAmount);
    const newStatus = updatedRemaining === 0 ? 'paid' : 'partially_paid';

    const updated = orders.map((o) =>
      o.id === selectedOrder.id
        ? {
            ...o,
            remaining_amount: updatedRemaining,
            payment_status: newStatus,
            is_payment_requested: false
          }
        : o
    );
    setOrders(updated);

    try {
      await supabase
        .from('orders')
        .update({
          remaining_amount: updatedRemaining,
          payment_status: newStatus,
          is_payment_requested: false
        })
        .eq('id', selectedOrder.id);

      await supabase.from('payments').insert({
        order_id: selectedOrder.id,
        amount: cashAmount,
        payment_mode: 'cash',
        notes: cashNotes,
        status: 'completed'
      });
    } catch (e) {
      console.warn('Cash payment DB insert fallback');
    }

    setNotifyModal({
      isOpen: true,
      title: 'Cash Payment Recorded',
      message: `Cash payment of ₹${cashAmount.toLocaleString('en-IN')} recorded successfully!`,
      type: 'success'
    });
    setShowCashModal(false);
    setSelectedOrder(null);
  };

  const navigate = useNavigate();

  // Standard A4 Paper Format Invoice Preview Direct Page Navigation
  const handlePrintA4Invoice = (order: any) => {
    const targetId = order.order_number || order.id || 'MNK-ORD-6224';
    navigate(`/invoice/${targetId}`);
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-charcoal-900">Manage Shop Orders</h1>
          <p className="text-xs text-charcoal-500 font-semibold mt-0.5">
            View placed customer orders, product details, delivery timelines & A4 print invoices
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {['all', 'accepted', 'order_confirmed', 'processing', 'ready', 'delivered'].map((statusKey) => {
            const isActive = filterStatus === statusKey;
            const conf = getStatusConfig(statusKey);
            const count = statusKey === 'all'
              ? orders.length
              : orders.filter((o) => (o.status || 'pending').toLowerCase() === statusKey).length;

            return (
              <button
                key={statusKey}
                onClick={() => setFilterStatus(statusKey)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all border flex items-center gap-1.5 ${
                  isActive
                    ? (statusKey === 'all' ? 'bg-brand-600 text-white border-brand-600 shadow-sm' : conf.activeBtnClass)
                    : 'bg-white border-warm-border text-charcoal-700 hover:bg-warm-hover'
                }`}
              >
                <span>{statusKey === 'all' ? 'All Orders' : conf.label}</span>
                <span
                  className={`text-[10px] font-mono font-extrabold px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-warm-bg text-charcoal-600 border border-warm-border'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-brand-600 absolute left-3.5 top-3.5" />
        <input
          type="text"
          placeholder="Search by order #, customer name, phone, or product name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-xs font-bold border border-warm-border rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
        />
      </div>

      {/* Orders List Table */}
      <div className="bg-white rounded-3xl border border-warm-border shadow-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs font-bold text-charcoal-500 animate-pulse">
            Syncing live customer orders from Supabase DB...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Package className="w-10 h-10 text-brand-600 mx-auto" />
            <h3 className="text-base font-bold text-charcoal-800">No active shop orders found</h3>
            <p className="text-xs text-charcoal-500 font-medium">Orders created by customers will appear here automatically.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-warm-bg text-charcoal-500 font-extrabold border-b border-warm-border uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Order # & Date</th>
                  <th className="py-3.5 px-4">Customer Name</th>
                  <th className="py-3.5 px-4">Fabrication Item</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Delivery Date</th>
                  <th className="py-3.5 px-4">Payment Summary</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-warm-muted font-medium">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-warm-hover/50 transition-colors">
                    
                    {/* Order # & Date */}
                    <td className="py-4 px-4 font-mono font-extrabold text-brand-600">
                      <Link to={`/admin/orders/${ord.id}`} className="cursor-pointer hover:underline">
                        #{ord.order_number || ord.id}
                      </Link>
                      <div className="flex flex-col gap-0.5 mt-0.5">
                        <span className="inline-block w-fit text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {ord.is_pos || (ord.admin_notes && ord.admin_notes.includes('POS')) || String(ord.order_number || '').includes('POS') ? 'MODE: POS' : 'MODE: ONLINE'}
                        </span>
                        <span className="text-[10px] text-charcoal-400 font-sans font-semibold">
                          {ord.created_at ? new Date(ord.created_at).toLocaleDateString() : 'Today'}
                        </span>
                      </div>
                    </td>

                    {/* Customer Name & Contact */}
                    <td className="py-4 px-4">
                      <span className="font-black text-charcoal-900 block text-sm">{ord.customerName}</span>
                      <a href={`tel:${ord.customerPhone}`} className="text-[11px] text-charcoal-600 font-mono font-bold hover:text-brand-600">
                        {ord.customerPhone}
                      </a>
                    </td>

                    {/* Product Name & Thumbnail */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={ord.productImage}
                          alt={ord.productName}
                          className="w-10 h-10 rounded-xl object-cover border border-warm-border shrink-0"
                        />
                        <div>
                          <Link
                            to={`/products/${ord.productId}`}
                            target="_blank"
                            className="font-bold text-charcoal-900 hover:text-brand-600 flex items-center gap-1 line-clamp-1"
                          >
                            <span>{ord.productName}</span>
                            <ExternalLink className="w-3 h-3 text-brand-500 shrink-0" />
                          </Link>
                          <span className="text-[11px] text-charcoal-500 font-bold block">Qty: {ord.quantity || 1} Unit(s)</span>
                        </div>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-4">
                      <Badge variant={ord.status}>
                        {(ord.status || 'pending').toUpperCase().replace('_', ' ')}
                      </Badge>
                    </td>

                    {/* Expected Delivery Date Picker */}
                    <td className="py-4 px-4">
                      <input
                        type="date"
                        value={ord.expected_delivery_date || ''}
                        onChange={(e) => handleUpdateDeliveryDate(ord.id, e.target.value)}
                        className="px-2.5 py-1 text-xs border border-warm-border rounded-xl bg-white font-mono font-extrabold text-charcoal-900 focus:ring-2 focus:ring-brand-500"
                      />
                    </td>

                    {/* Payment Summary */}
                    <td className="py-4 px-4">
                      <div className="space-y-0.5">
                        <span className="font-black text-charcoal-900 block font-mono text-xs">
                          Total: ₹{(ord.total_amount || 0).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[11px] text-emerald-700 font-extrabold block">
                          Paid: ₹{Math.max(0, (ord.total_amount || 0) - (ord.remaining_amount || 0)).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-amber-700 font-bold block">
                          Due: ₹{(ord.remaining_amount || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </td>

                    {/* Table Row Actions */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/admin/orders/${ord.id}`}
                          className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-sm transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Details</span>
                        </Link>

                        <button
                          onClick={() => sendInvoiceLinkWhatsApp(ord)}
                          className="p-1.5 rounded-xl text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                          title="Send Tax Invoice via WhatsApp"
                        >
                          <MessageSquare className="w-4 h-4 text-emerald-600" />
                        </button>

                        <button
                          onClick={() => handlePrintA4Invoice(ord)}
                          className="p-1.5 rounded-xl text-charcoal-700 hover:bg-warm-hover border border-warm-border transition-colors"
                          title="Print A4 Invoice"
                        >
                          <Printer className="w-4 h-4 text-brand-600" />
                        </button>

                        <button
                          onClick={() => setOrderToDelete(ord)}
                          className="p-1.5 rounded-xl text-red-600 hover:bg-red-50 border border-red-200 transition-colors"
                          title="Delete Order"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FULL ORDER DETAIL & MANAGEMENT MODAL */}
      {selectedOrder && (
        <Modal
          isOpen={Boolean(selectedOrder)}
          onClose={() => setSelectedOrder(null)}
          title={`Order Details - #${selectedOrder.order_number || selectedOrder.id}`}
          maxWidth="lg"
        >
          <div className="space-y-5 py-2">
            
            {/* Top Product Preview Banner */}
            <div className="flex items-center gap-4 bg-warm-bg p-4 rounded-2xl border border-warm-border">
              <img
                src={selectedOrder.productImage}
                alt={selectedOrder.productName}
                className="w-16 h-16 rounded-xl object-cover border border-warm-border shrink-0 shadow-sm"
              />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-extrabold text-brand-600 uppercase tracking-wider block">
                  FABRICATED PRODUCT ITEM
                </span>
                <Link
                  to={`/products/${selectedOrder.productId}`}
                  target="_blank"
                  className="text-base font-black text-charcoal-900 hover:text-brand-600 flex items-center gap-1.5 line-clamp-1"
                >
                  <span>{selectedOrder.productName}</span>
                  <ExternalLink className="w-4 h-4 text-brand-600 shrink-0" />
                </Link>
                <p className="text-xs text-charcoal-500 font-bold mt-0.5">Quantity: {selectedOrder.quantity || 1} Unit(s)</p>
              </div>
            </div>

            {/* Customer Contact Card */}
            <div className="bg-white p-4 rounded-2xl border border-warm-border grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-charcoal-500 uppercase block">Customer Details</span>
                <div className="flex items-center gap-2 font-black text-charcoal-900 text-sm">
                  <User className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>{selectedOrder.customerName}</span>
                </div>
                <div className="flex items-center gap-2 font-bold text-charcoal-700">
                  <Phone className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                  <a href={`tel:${selectedOrder.customerPhone}`} className="hover:text-brand-600 font-mono">
                    {selectedOrder.customerPhone}
                  </a>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-charcoal-500 uppercase block">Delivery Location</span>
                <div className="flex items-start gap-2 font-bold text-charcoal-900">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{selectedOrder.customerAddress}</span>
                </div>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="p-4 rounded-2xl bg-warm-bg border border-warm-border grid grid-cols-3 gap-3 text-center">
              <div>
                <span className="text-[10px] font-extrabold text-charcoal-500 uppercase block">Total Price</span>
                <span className="text-sm font-black text-charcoal-900 font-mono">₹{(selectedOrder.total_amount || 0).toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-charcoal-500 uppercase block">Paid Advance</span>
                <span className="text-sm font-black text-emerald-700 font-mono">
                  ₹{Math.max(0, (selectedOrder.total_amount || 0) - (selectedOrder.remaining_amount || 0)).toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-charcoal-500 uppercase block">Balance Due</span>
                <span className="text-sm font-black text-amber-700 font-mono">₹{(selectedOrder.remaining_amount || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Status Change Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-charcoal-700">Update Order Status</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(['accepted', 'order_confirmed', 'processing', 'ready', 'delivered'] as OrderStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleUpdateStatus(selectedOrder.id, st)}
                    className={`py-2 px-3 rounded-xl text-xs font-extrabold border transition-all ${
                      selectedOrder.status === st
                        ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                        : 'bg-white text-charcoal-700 border-warm-border hover:bg-warm-hover'
                    }`}
                  >
                    {st.replace('_', ' ').toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-2 flex items-center gap-2 border-t border-warm-border flex-wrap">
              <Button
                onClick={() => handlePrintA4Invoice(selectedOrder)}
                variant="secondary"
                size="sm"
                icon={<Printer className="w-4 h-4 text-brand-600" />}
              >
                Print A4 Invoice
              </Button>

              <Button
                onClick={() => setShowCashModal(true)}
                variant="secondary"
                size="sm"
                icon={<DollarSign className="w-4 h-4 text-emerald-600" />}
              >
                Record Cash Payment
              </Button>

              <button
                onClick={() => {
                  setOrderToDelete(selectedOrder);
                }}
                className="ml-auto px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-extrabold border border-red-200 transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Order</span>
              </button>
            </div>

          </div>
        </Modal>
      )}

      {/* DELETE ORDER CONFIRMATION MODAL */}
      {orderToDelete && (
        <Modal
          isOpen={Boolean(orderToDelete)}
          onClose={() => setOrderToDelete(null)}
          title="Confirm Delete Order"
          maxWidth="sm"
        >
          <div className="space-y-4 py-2 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto border border-red-200">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-charcoal-900">
                Delete Order #{orderToDelete.order_number || orderToDelete.id}?
              </h3>
              <p className="text-xs text-charcoal-500 font-medium">
                Are you sure you want to permanently delete this order for {orderToDelete.customerName}?
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                onClick={() => handleDeleteOrder(orderToDelete.id)}
                variant="primary"
                className="bg-red-600 hover:bg-red-700 flex-1"
                icon={<Trash2 className="w-4 h-4" />}
              >
                Delete Order
              </Button>

              <Button
                onClick={() => setOrderToDelete(null)}
                variant="secondary"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* CASH PAYMENT MODAL */}
      {showCashModal && selectedOrder && (
        <Modal isOpen={showCashModal} onClose={() => setShowCashModal(false)} title="Record Cash Payment" maxWidth="sm">
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-bold text-charcoal-700 mb-1">Cash Received Amount (₹)</label>
              <input
                type="number"
                value={cashAmount}
                onChange={(e) => setCashAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2 text-sm font-extrabold border border-warm-border rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal-700 mb-1">Workshop Payment Notes</label>
              <input
                type="text"
                value={cashNotes}
                onChange={(e) => setCashNotes(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-warm-border rounded-xl"
              />
            </div>

            <Button onClick={handleRecordCashPayment} variant="primary" fullWidth icon={<CheckCircle2 className="w-4 h-4" />} size="lg">
              Save Cash Payment to DB
            </Button>
          </div>
        </Modal>
      )}

      {/* A4 INVOICE PREVIEW MODAL POPUP */}
      <InvoicePreviewModal
        isOpen={Boolean(previewInvoiceOrder)}
        onClose={() => setPreviewInvoiceOrder(null)}
        order={previewInvoiceOrder}
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
