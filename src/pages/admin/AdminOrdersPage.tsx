import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
import { OrderStatus } from '../../types';
import { DEFAULT_SHOP_INFO, supabase } from '../../lib/supabase';
import { fetchActiveProducts } from '../../lib/productsStore';

export const AdminOrdersPage: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
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

      let combined: any[] = [];

      if (dbOrders && dbOrders.length > 0) {
        combined = dbOrders;
      } else {
        const local = JSON.parse(localStorage.getItem('ml_orders') || '[]');
        combined = local;
      }

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
    const updatedOrders = orders.filter((o) => o.id !== orderId);
    setOrders(updatedOrders);

    try {
      await supabase.from('orders').delete().eq('id', orderId);
    } catch (e) {
      console.warn('Order DB delete fallback');
    }

    const local = JSON.parse(localStorage.getItem('ml_orders') || '[]');
    const updatedLocal = local.filter((l: any) => l.id !== orderId);
    localStorage.setItem('ml_orders', JSON.stringify(updatedLocal));

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

    alert(`Payment request of ₹${paymentReqAmount} sent to customer!`);
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

    alert(`Cash payment of ₹${cashAmount} recorded successfully!`);
    setShowCashModal(false);
    setSelectedOrder(null);
  };

  // Standard A4 Paper Format Invoice Generator & Auto Print
  const handlePrintA4Invoice = (order: any) => {
    const printWin = window.open('', '_blank');
    if (!printWin) return;

    const total = order.total_amount || 0;
    const remaining = order.remaining_amount || 0;
    const advancePaid = Math.max(0, total - remaining);

    const isFullyPaid = remaining === 0;
    const isPartiallyPaid = advancePaid > 0 && remaining > 0;
    const statusStampText = isFullyPaid ? 'PAID IN FULL' : isPartiallyPaid ? 'PARTIALLY PAID' : 'PAYMENT PENDING';
    const statusStampColor = isFullyPaid ? '#059669' : isPartiallyPaid ? '#d97706' : '#dc2626';
    const statusStampBorder = isFullyPaid ? '#10b981' : isPartiallyPaid ? '#f59e0b' : '#ef4444';

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8"/>
          <title>Invoice - ${order.order_number || order.id}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm;
            }
            @media print {
              body { margin: 0; padding: 0; background: #fff; }
              .no-print { display: none !important; }
            }
            * { box-sizing: border-box; }
            body {
              font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
              color: #1e293b;
              line-height: 1.5;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
              background: #fff;
            }
            .no-print-bar {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              padding: 12px 18px;
              border-radius: 12px;
              margin-bottom: 25px;
              display: flex;
              align-items: center;
              justify-content: space-between;
            }
            .print-btn {
              background: #ea580c;
              color: white;
              border: none;
              padding: 10px 22px;
              font-size: 13px;
              font-weight: 800;
              border-radius: 10px;
              cursor: pointer;
              box-shadow: 0 4px 12px rgba(234, 88, 12, 0.3);
            }

            .header-banner {
              border-bottom: 3px solid #ea580c;
              padding-bottom: 16px;
              margin-bottom: 24px;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            .brand-name {
              font-size: 24px;
              font-weight: 900;
              color: #0f172a;
              letter-spacing: -0.5px;
            }
            .brand-name span { color: #ea580c; }
            .brand-tagline {
              font-size: 11px;
              font-weight: 800;
              color: #ea580c;
              letter-spacing: 2px;
              text-transform: uppercase;
              margin-top: 2px;
            }
            .shop-address {
              font-size: 11px;
              color: #64748b;
              margin-top: 6px;
              line-height: 1.4;
            }

            .invoice-badge {
              text-align: right;
            }
            .invoice-title {
              font-size: 22px;
              font-weight: 900;
              color: #0f172a;
              letter-spacing: -0.5px;
            }
            .invoice-no {
              font-size: 14px;
              font-weight: 800;
              color: #ea580c;
              font-family: monospace;
              margin-top: 2px;
            }

            .details-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              background: #f8fafc;
              padding: 16px 20px;
              border-radius: 14px;
              border: 1px solid #e2e8f0;
              margin-bottom: 24px;
            }
            .section-label {
              font-size: 10px;
              font-weight: 800;
              color: #94a3b8;
              text-transform: uppercase;
              letter-spacing: 0.8px;
              margin-bottom: 4px;
            }
            .customer-name {
              font-size: 14px;
              font-weight: 800;
              color: #0f172a;
            }
            .customer-info {
              font-size: 11px;
              color: #475569;
              font-weight: 600;
            }

            .stamp-box {
              display: inline-block;
              padding: 4px 12px;
              border: 2px solid ${statusStampBorder};
              color: ${statusStampColor};
              font-weight: 900;
              font-size: 11px;
              letter-spacing: 1px;
              border-radius: 6px;
              text-transform: uppercase;
              margin-top: 6px;
            }

            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 24px;
            }
            .items-table th {
              background: #0f172a;
              color: #ffffff;
              font-size: 11px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              padding: 10px 14px;
              text-align: left;
            }
            .items-table td {
              padding: 14px;
              border-bottom: 1px solid #e2e8f0;
              font-size: 12px;
            }
            .item-title { font-weight: 800; color: #0f172a; font-size: 13px; }
            .item-sub { font-size: 11px; color: #64748b; margin-top: 2px; }

            .totals-container {
              display: flex;
              justify-content: flex-end;
              margin-bottom: 30px;
            }
            .totals-table {
              width: 320px;
              border-collapse: collapse;
            }
            .totals-table td {
              padding: 6px 12px;
              font-size: 12px;
            }
            .totals-table .total-row td {
              font-size: 16px;
              font-weight: 900;
              color: #ea580c;
              border-top: 2px solid #ea580c;
              border-bottom: 2px solid #ea580c;
              padding: 10px 12px;
            }

            .footer-sign {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              margin-top: 50px;
              padding-top: 20px;
              border-top: 1px solid #e2e8f0;
            }
            .sign-title {
              font-size: 11px;
              font-weight: 800;
              color: #0f172a;
            }
            .sign-line {
              width: 180px;
              border-top: 1px solid #94a3b8;
              margin-top: 40px;
              text-align: center;
              font-size: 10px;
              color: #64748b;
              padding-top: 4px;
            }

            .watermark-footer {
              text-align: center;
              font-size: 10px;
              color: #94a3b8;
              margin-top: 30px;
            }
          </style>
        </head>
        <body>
          <div className="no-print-bar no-print">
            <span style="font-size: 12px; font-weight: bold; color: #334155;">MANIKANDAN LATHE — Official A4 Printable Invoice</span>
            <button onclick="window.print()" className="print-btn">🖨️ Click to Print A4 Invoice</button>
          </div>

          <div className="header-banner">
            <div>
              <div className="brand-name">MANIKANDAN <span>LATHE</span></div>
              <div className="brand-tagline">WELDING WORKS & FABRICATION SHOP</div>
              <div className="shop-address">
                Kallimandhayam - 624616, Dindigul District, Tamil Nadu<br/>
                <strong>Phone:</strong> +91 96592 86268 | <strong>Email:</strong> manikandanlatheklm@gmail.com
              </div>
            </div>

            <div className="invoice-badge">
              <div className="invoice-title">TAX INVOICE</div>
              <div className="invoice-no">#${order.order_number || order.id}</div>
              <div className="stamp-box">${statusStampText}</div>
            </div>
          </div>

          <div className="details-grid">
            <div>
              <div className="section-label">Billed To (Customer):</div>
              <div className="customer-name">${order.customerName || 'Customer'}</div>
              <div className="customer-info">Phone: ${order.customerPhone || 'N/A'}</div>
              <div className="customer-info">Location: ${order.customerAddress || 'Kallimandhayam'}</div>
            </div>

            <div style="text-align: right;">
              <div className="section-label">Invoice Details:</div>
              <div className="customer-info"><strong>Invoice Date:</strong> ${order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}</div>
              <div className="customer-info"><strong>Expected Delivery:</strong> ${order.expected_delivery_date || 'Within 7 Days'}</div>
              <div className="customer-info"><strong>Fabrication Shop:</strong> Kallimandhayam Workshop</div>
            </div>
          </div>

          <table className="items-table">
            <thead>
              <tr>
                <th style="width: 55%;">Fabrication Item Description</th>
                <th style="text-align: center; width: 15%;">Qty</th>
                <th style="text-align: right; width: 30%;">Total Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div className="item-title">${order.productName || 'Custom Lathe Fabricated Item'}</div>
                  <div className="item-sub">Heavy duty steel fabrication engineered with precision grade lathe machining.</div>
                </td>
                <td style="text-align: center; font-weight: 800;">${order.quantity || 1}</td>
                <td style="text-align: right; font-weight: 900; font-family: monospace;">₹${total.toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>

          <div className="totals-container">
            <table className="totals-table">
              <tr>
                <td>Total Quoted Amount:</td>
                <td style="text-align: right; font-weight: 800;">₹${total.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td>Advance Received:</td>
                <td style="text-align: right; font-weight: 800; color: #059669;">- ₹${advancePaid.toLocaleString('en-IN')}</td>
              </tr>
              <tr className="total-row">
                <td>Balance Due:</td>
                <td style="text-align: right; font-family: monospace;">₹${remaining.toLocaleString('en-IN')}</td>
              </tr>
            </table>
          </div>

          <div className="footer-sign">
            <div>
              <div className="sign-title">Terms & Conditions:</div>
              <div style="font-size: 10px; color: #64748b; margin-top: 4px; max-width: 380px;">
                • All fabricated items undergo quality testing before delivery.<br/>
                • Remaining balance due upon delivery or workshop pickup.
              </div>
            </div>

            <div className="sign-line">
              Authorized Signatory<br/>
              <strong>MANIKANDAN LATHE WORKS</strong>
            </div>
          </div>

          <div className="watermark-footer">
            Computer Generated Tax Invoice • Kallimandhayam - 624616, Dindigul District • Thank you for your business!
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            };
          </script>
        </body>
      </html>
    `);

    printWin.document.close();
    printWin.focus();
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
          {['all', 'accepted', 'order_confirmed', 'processing', 'ready', 'delivered'].map((statusKey) => (
            <button
              key={statusKey}
              onClick={() => setFilterStatus(statusKey)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold capitalize transition-all ${
                filterStatus === statusKey
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white border border-warm-border text-charcoal-700 hover:bg-warm-hover'
              }`}
            >
              {statusKey.replace('_', ' ')}
            </button>
          ))}
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
                      <span className="block text-[10px] text-charcoal-400 font-sans font-semibold mt-0.5">
                        {ord.created_at ? new Date(ord.created_at).toLocaleDateString() : 'Today'}
                      </span>
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
                      <Badge variant={ord.status === 'delivered' ? 'delivered' : 'processing'}>
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

    </div>
  );
};
