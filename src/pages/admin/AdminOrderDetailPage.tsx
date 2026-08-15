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
import { OrderStatus } from '../../types';
import { DEFAULT_SHOP_INFO, supabase } from '../../lib/supabase';
import { fetchActiveProducts } from '../../lib/productsStore';

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
          .eq('order_id', orderId)
          .order('created_at', { ascending: false });

        if (dbPayments && dbPayments.length > 0) {
          setPaymentsHistory(dbPayments);
        } else {
          setPaymentsHistory([]);
        }
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

    setPaymentsHistory([newPaymentObj, ...paymentsHistory]);

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

  // Standard A4 Paper Format Invoice Generator & Auto Print
  const handlePrintA4Invoice = () => {
    if (!order) return;
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
          <title>Tax Invoice - ${order.order_number || order.id}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            @media print {
              body { margin: 0; padding: 0; background: #fff; }
              .no-print { display: none !important; }
            }
            * { box-sizing: border-box; }
            body {
              font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
              color: #0f172a;
              line-height: 1.4;
              padding: 15px;
              max-width: 800px;
              margin: 0 auto;
              background: #fff;
            }
            .page-border {
              border: 2px solid #0f172a;
              padding: 20px;
              position: relative;
              min-height: 980px;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
            }
            .no-print-bar {
              background: #f8fafc;
              border: 1px solid #cbd5e1;
              padding: 10px 16px;
              border-radius: 10px;
              margin-bottom: 15px;
              display: flex;
              align-items: center;
              justify-content: space-between;
            }
            .print-btn {
              background: #ea580c;
              color: white;
              border: none;
              padding: 8px 18px;
              font-size: 12px;
              font-weight: 800;
              border-radius: 8px;
              cursor: pointer;
            }
            .header-box {
              border-bottom: 2px solid #ea580c;
              padding-bottom: 12px;
              margin-bottom: 16px;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            .brand-title {
              font-size: 26px;
              font-weight: 900;
              color: #0f172a;
              letter-spacing: -0.5px;
            }
            .brand-title span { color: #ea580c; }
            .brand-subtitle {
              font-size: 10px;
              font-weight: 800;
              color: #ea580c;
              letter-spacing: 2px;
              text-transform: uppercase;
              margin-top: 1px;
            }
            .shop-address {
              font-size: 11px;
              color: #475569;
              margin-top: 4px;
            }
            .invoice-head-right { text-align: right; }
            .doc-title { font-size: 20px; font-weight: 900; color: #0f172a; }
            .doc-no { font-size: 13px; font-weight: 800; color: #ea580c; font-family: monospace; }
            .stamp-badge {
              display: inline-block;
              padding: 3px 10px;
              border: 2px solid ${statusStampBorder};
              color: ${statusStampColor};
              font-weight: 900;
              font-size: 10px;
              letter-spacing: 1px;
              border-radius: 4px;
              text-transform: uppercase;
              margin-top: 4px;
            }
            .from-to-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 16px;
              margin-bottom: 18px;
            }
            .address-card {
              border: 1px solid #cbd5e1;
              border-radius: 8px;
              padding: 12px 14px;
              background: #f8fafc;
            }
            .card-heading {
              font-size: 10px;
              font-weight: 900;
              color: #ea580c;
              text-transform: uppercase;
              letter-spacing: 0.8px;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 4px;
              margin-bottom: 6px;
            }
            .party-name { font-size: 13px; font-weight: 900; color: #0f172a; }
            .party-info { font-size: 11px; color: #334155; font-weight: 600; }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 18px;
            }
            .items-table th {
              background: #0f172a;
              color: #ffffff;
              font-size: 10px;
              font-weight: 800;
              text-transform: uppercase;
              padding: 8px 10px;
              text-align: left;
              border: 1px solid #0f172a;
            }
            .items-table td {
              padding: 10px;
              border: 1px solid #cbd5e1;
              font-size: 11px;
            }
            .item-name { font-weight: 800; color: #0f172a; font-size: 12px; }
            .item-desc { font-size: 10px; color: #64748b; margin-top: 2px; }
            .summary-flex {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 20px;
            }
            .amount-in-words {
              font-size: 11px;
              font-weight: 700;
              color: #334155;
              max-width: 360px;
              background: #f1f5f9;
              padding: 8px 12px;
              border-radius: 6px;
              border-left: 3px solid #ea580c;
            }
            .totals-table { width: 280px; border-collapse: collapse; }
            .totals-table td { padding: 5px 10px; font-size: 11px; border-bottom: 1px solid #e2e8f0; }
            .totals-table .total-row td {
              font-size: 14px;
              font-weight: 900;
              color: #ea580c;
              border-top: 2px solid #ea580c;
              border-bottom: 2px solid #ea580c;
              padding: 8px 10px;
            }
            .footer-signature-section {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              padding-top: 15px;
              border-top: 1px solid #cbd5e1;
              margin-top: 30px;
            }
            .customer-sign-box { text-align: center; width: 180px; }
            .owner-sign-box { text-align: center; width: 220px; }
            .sign-line {
              border-top: 1px solid #64748b;
              margin-top: 45px;
              padding-top: 4px;
              font-size: 10px;
              font-weight: 800;
              color: #0f172a;
            }
            .shop-seal { font-size: 9px; color: #64748b; font-weight: 700; }
          </style>
        </head>
        <body>
          <div className="no-print-bar no-print">
            <span style="font-size: 12px; font-weight: bold;">MANIKANDAN LATHE — Official Printable Tax Bill</span>
            <button onclick="window.print()" className="print-btn">🖨️ Print Invoice Now</button>
          </div>

          <div className="page-border">
            <div>
              <div className="header-box">
                <div>
                  <div className="brand-title">MANIKANDAN <span>LATHE</span></div>
                  <div className="brand-subtitle">— WELDING WORKS & FABRICATION SHOP —</div>
                  <div className="shop-address">
                    Kallimandhayam - 624616, Dindigul District, Tamil Nadu<br/>
                    <strong>Phone:</strong> +91 96592 86268 | <strong>Email:</strong> manikandanlatheklm@gmail.com
                  </div>
                </div>

                <div className="invoice-head-right">
                  <div className="doc-title">TAX INVOICE / BILL</div>
                  <div className="doc-no">#${order.order_number || order.id}</div>
                  <div className="stamp-badge">${statusStampText}</div>
                </div>
              </div>

              <div className="from-to-grid">
                <div className="address-card">
                  <div className="card-heading">FROM (SUPPLIER / WORKSHOP):</div>
                  <div className="party-name">MANIKANDAN LATHE WORKS</div>
                  <div className="party-info">Kallimandhayam - 624616</div>
                  <div className="party-info">Dindigul District, Tamil Nadu</div>
                  <div className="party-info">Phone: +91 96592 86268</div>
                </div>

                <div className="address-card">
                  <div className="card-heading">TO (BILLED CUSTOMER):</div>
                  <div className="party-name">${order.customerName || 'Customer'}</div>
                  <div className="party-info">Phone: ${order.customerPhone || 'N/A'}</div>
                  <div className="party-info">Location: ${order.customerAddress || 'Kallimandhayam'}</div>
                  <div className="party-info">Date: ${order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}</div>
                </div>
              </div>

              <table className="items-table">
                <thead>
                  <tr>
                    <th style="width: 8%; text-align: center;">S.No</th>
                    <th style="width: 52%;">Product / Fabrication Description</th>
                    <th style="width: 12%; text-align: center;">Qty</th>
                    <th style="width: 14%; text-align: right;">Rate (₹)</th>
                    <th style="width: 14%; text-align: right;">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="text-align: center; font-weight: 800;">1</td>
                    <td>
                      <div className="item-name">${order.productName || 'Custom Lathe Fabricated Item'}</div>
                      <div className="item-desc">Precision heavy duty steel lathe work & welding fabrication.</div>
                    </td>
                    <td style="text-align: center; font-weight: 800;">${order.quantity || 1}</td>
                    <td style="text-align: right; font-weight: 800; font-family: monospace;">₹${total.toLocaleString('en-IN')}</td>
                    <td style="text-align: right; font-weight: 900; font-family: monospace;">₹${total.toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>

              <div className="summary-flex">
                <div className="amount-in-words">
                  <strong>Payment Status:</strong> ${statusStampText}<br/>
                  Thank you for choosing Manikandan Lathe Works!
                </div>

                <table className="totals-table">
                  <tr>
                    <td>Subtotal Amount:</td>
                    <td style="text-align: right; font-weight: 800;">₹${total.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td>Advance / Paid:</td>
                    <td style="text-align: right; font-weight: 800; color: #059669;">- ₹${advancePaid.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr className="total-row">
                    <td>Balance Due:</td>
                    <td style="text-align: right; font-family: monospace;">₹${remaining.toLocaleString('en-IN')}</td>
                  </tr>
                </table>
              </div>
            </div>

            <div>
              <div className="footer-signature-section">
                <div className="customer-sign-box">
                  <div className="sign-line">Customer Signature</div>
                </div>

                <div className="owner-sign-box">
                  <div className="sign-line">
                    Shop Owner Signature<br/>
                    <span className="shop-seal">MANIKANDAN LATHE WORKS</span>
                  </div>
                </div>
              </div>

              <div style="text-align: center; font-size: 9px; color: #94a3b8; margin-top: 15px;">
                Computer Generated Tax Invoice • Kallimandhayam - 624616, Dindigul District, Tamil Nadu
              </div>
            </div>
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
              <Badge variant={order.status === 'delivered' ? 'delivered' : 'processing'}>
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
            <Button
              onClick={() => {
                setCustomPayAmount(remainingBalance);
                setShowGeneratedQr(false);
                setShowPaymentModal(true);
              }}
              variant="secondary"
              className="bg-brand-50 border-brand-200 text-brand-700 hover:bg-brand-100"
              icon={<DollarSign className="w-4 h-4 text-brand-600" />}
            >
              Collect / Record Payment (Due: ₹{remainingBalance.toLocaleString('en-IN')})
            </Button>
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
            <h3 className="text-sm font-black text-charcoal-900 uppercase tracking-wider">Update Fabrication Status</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(['accepted', 'order_confirmed', 'processing', 'ready', 'delivered'] as OrderStatus[]).map((st) => (
                <button
                  key={st}
                  onClick={() => handleUpdateStatus(st)}
                  className={`py-2.5 px-3 rounded-2xl text-xs font-extrabold border transition-all ${
                    order.status === st
                      ? 'bg-brand-600 text-white border-brand-600 shadow-md'
                      : 'bg-warm-bg text-charcoal-700 border-warm-border hover:bg-warm-hover'
                  }`}
                >
                  {st.replace('_', ' ').toUpperCase()}
                </button>
              ))}
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

            {paymentsHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-warm-bg text-charcoal-500 font-extrabold border-b border-warm-border uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">S.No</th>
                      <th className="py-2.5 px-3">Date & Time</th>
                      <th className="py-2.5 px-3">Payment Mode</th>
                      <th className="py-2.5 px-3">Amount Received</th>
                      <th className="py-2.5 px-3">Notes</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warm-muted font-medium">
                    {paymentsHistory.map((pay, idx) => (
                      <tr key={pay.id || idx}>
                        <td className="py-3 px-3 font-extrabold text-charcoal-500">#{idx + 1}</td>
                        <td className="py-3 px-3 font-mono font-bold text-charcoal-700">
                          {pay.created_at ? new Date(pay.created_at).toLocaleString('en-IN') : 'Recent'}
                        </td>
                        <td className="py-3 px-3 font-bold text-charcoal-900">{pay.payment_mode || 'Online Payment'}</td>
                        <td className="py-3 px-3 font-black text-emerald-700 font-mono">+₹{(pay.amount || 0).toLocaleString('en-IN')}</td>
                        <td className="py-3 px-3 text-charcoal-500 text-[11px]">{pay.notes || '-'}</td>
                        <td className="py-3 px-3"><Badge variant="paid">COMPLETED</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-xs font-bold text-charcoal-500 bg-warm-bg rounded-2xl border border-warm-border">
                No payment transactions recorded for this order yet.
              </div>
            )}
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
              <div className="p-3.5 bg-brand-50/60 rounded-2xl border border-brand-200 flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-extrabold text-brand-900">Send Payment Request to Customer Portal</h4>
                  <p className="text-[10px] text-brand-700 font-medium">Customer will see ₹{customPayAmount.toLocaleString('en-IN')} due in their app</p>
                </div>
                <Button
                  onClick={handleSetCustomerRequestMoney}
                  variant="primary"
                  size="sm"
                  icon={<Send className="w-3.5 h-3.5" />}
                >
                  Set Request Money
                </Button>
              </div>

              {/* Option 2: Generate & Show Dynamic UPI QR Code for ₹X */}
              <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-extrabold text-emerald-900">Show Dynamic Amount UPI QR Code (₹{customPayAmount.toLocaleString('en-IN')})</h4>
                    <p className="text-[10px] text-emerald-700 font-medium">Customer scans QR to pay exact amount directly to shop</p>
                  </div>
                  <Button
                    onClick={() => setShowGeneratedQr(!showGeneratedQr)}
                    variant="secondary"
                    size="sm"
                    className="bg-emerald-600 text-white hover:bg-emerald-700 border-none"
                    icon={<QrCode className="w-3.5 h-3.5" />}
                  >
                    {showGeneratedQr ? 'Hide QR' : 'Show UPI QR'}
                  </Button>
                </div>

                {/* Render Dynamic QR Code */}
                {showGeneratedQr && (
                  <div className="bg-white p-4 rounded-2xl border-2 border-emerald-400 text-center space-y-3 shadow-md animate-fadeIn">
                    <img
                      src={dynamicQrCodeImg}
                      alt={`UPI QR Code for ₹${customPayAmount}`}
                      className="w-48 h-48 mx-auto object-contain"
                    />
                    <div className="text-xs font-bold text-charcoal-700">
                      Amount Encoded: <span className="text-emerald-700 font-black font-mono">₹{customPayAmount.toLocaleString('en-IN')}</span><br/>
                      <span className="text-[10px] text-charcoal-400 font-mono">UPI ID: {DEFAULT_SHOP_INFO.upi_id}</span>
                    </div>

                    <Button
                      onClick={() => handleRecordPayment('UPI QR Code')}
                      variant="primary"
                      className="bg-emerald-600 hover:bg-emerald-700"
                      fullWidth
                      icon={<CheckCircle2 className="w-4 h-4" />}
                    >
                      Mark as Paid via UPI (₹{customPayAmount.toLocaleString('en-IN')})
                    </Button>
                  </div>
                )}
              </div>

              {/* Option 3: Workshop Cash Counter */}
              <div className="p-3.5 bg-warm-bg rounded-2xl border border-warm-border space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-charcoal-900">Collect Cash at Workshop Counter</h4>
                  <Button
                    onClick={() => handleRecordPayment('Workshop Cash Counter')}
                    variant="secondary"
                    size="sm"
                    icon={<DollarSign className="w-3.5 h-3.5 text-emerald-600" />}
                  >
                    Mark as Paid (Cash)
                  </Button>
                </div>
                <input
                  type="text"
                  value={customPayNotes}
                  onChange={(e) => setCustomPayNotes(e.target.value)}
                  placeholder="Optional payment notes (e.g. Cash received at Kallimandhayam counter)"
                  className="w-full px-3 py-1.5 text-xs border border-warm-border rounded-xl bg-white"
                />
              </div>

            </div>

          </div>
        </Modal>
      )}

    </div>
  );
};
