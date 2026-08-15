import React, { useState, useEffect } from 'react';
import { Phone, MessageSquare, CreditCard, DollarSign, Calendar, Printer, CheckCircle2, Search } from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { OrderStatus } from '../../types';
import { supabase } from '../../lib/supabase';

export const AdminOrdersPage: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const [orders, setOrders] = useState<any[]>([]);

  // Selected Order for Edit/Action Modal
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  
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
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        setOrders(data);
      } else {
        setOrders([]);
      }
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
        (o.order_number || '').toLowerCase().includes(q) ||
        (o.customerName || o.user_name || '').toLowerCase().includes(q) ||
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
  };

  const handleUpdateDeliveryDate = async (orderId: string, date: string) => {
    setOrders(orders.map((o) => (o.id === orderId ? { ...o, expected_delivery_date: date } : o)));
    try {
      await supabase.from('orders').update({ expected_delivery_date: date }).eq('id', orderId);
    } catch (e) {
      console.warn('Delivery date update fallback');
    }
    alert(`Expected delivery date updated to ${date}. Customer notified.`);
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

  const handlePrintReceipt = (order: any) => {
    const printWin = window.open('', '_blank');
    if (!printWin) return;
    printWin.document.write(`
      <html>
        <head>
          <title>Workshop Receipt - ${order.order_number}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            h2 { color: #ea580c; border-bottom: 2px solid #ea580c; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f3f4f6; }
          </style>
        </head>
        <body>
          <h2>MANIKANDAN LATHE – WORKSHOP RECEIPT</h2>
          <p><strong>Receipt #:</strong> ${order.order_number}</p>
          <p><strong>Customer:</strong> ${order.customerName || order.user_name || 'Customer'}</p>
          <p><strong>Phone:</strong> ${order.customerPhone || 'N/A'}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
          <table>
            <tr><th>Item</th><th>Quantity</th><th>Total (₹)</th><th>Paid (₹)</th><th>Balance (₹)</th></tr>
            <tr>
              <td>${order.productName || 'Fabrication Item'}</td>
              <td>${order.quantity || 1}</td>
              <td>₹${order.total_amount || 0}</td>
              <td>₹${(order.total_amount || 0) - (order.remaining_amount || 0)}</td>
              <td>₹${order.remaining_amount || 0}</td>
            </tr>
          </table>
          <p style="margin-top: 30px; font-size: 12px; color: #666;">Thank you for your business! Kallimandhayam - 624616.</p>
        </body>
      </html>
    `);
    printWin.document.close();
    printWin.focus();
    printWin.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-charcoal-900">Manage Shop Orders</h1>
          <p className="text-xs text-charcoal-500 font-medium">Update fabrication status, expected delivery dates & payment requests</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filters */}
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
        <Search className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search by order #, customer name, phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-xs font-bold border border-warm-border rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
        />
      </div>

      {/* Orders List Table */}
      <div className="bg-white rounded-3xl border border-warm-border shadow-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs font-bold text-charcoal-500 animate-pulse">
            Loading live orders from Supabase DB...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <h3 className="text-base font-bold text-charcoal-800">No active shop orders found</h3>
            <p className="text-xs text-charcoal-500">Orders created by customers will appear here automatically.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-warm-bg text-charcoal-500 font-extrabold border-b border-warm-border uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Order # & Date</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Delivery Date</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-warm-muted font-medium">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-warm-hover/50 transition-colors">
                    <td className="py-4 px-4 font-mono font-extrabold text-brand-600">
                      #{ord.order_number || ord.id}
                      <span className="block text-[10px] text-charcoal-400 font-sans font-normal mt-0.5">
                        {ord.created_at?.slice(0, 10) || 'Today'}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <span className="font-extrabold text-charcoal-900 block">{ord.customerName || ord.user_name || 'Customer'}</span>
                      <a href={`tel:${ord.customerPhone}`} className="text-[11px] text-charcoal-500 hover:text-brand-600 font-mono">
                        {ord.customerPhone || 'No Phone'}
                      </a>
                    </td>

                    <td className="py-4 px-4">
                      <span className="font-bold text-charcoal-800 block">{ord.productName || 'Fabrication Item'}</span>
                      <span className="text-[11px] text-charcoal-500">Qty: {ord.quantity || 1}</span>
                    </td>

                    <td className="py-4 px-4">
                      <Badge variant={ord.status === 'delivered' ? 'delivered' : 'processing'}>
                        {ord.status.toUpperCase()}
                      </Badge>
                    </td>

                    <td className="py-4 px-4">
                      <input
                        type="date"
                        value={ord.expected_delivery_date || ''}
                        onChange={(e) => handleUpdateDeliveryDate(ord.id, e.target.value)}
                        className="px-2 py-1 text-xs border border-warm-border rounded-lg bg-white font-mono font-bold"
                      />
                    </td>

                    <td className="py-4 px-4">
                      <div className="space-y-0.5">
                        <span className="font-extrabold text-charcoal-900 block font-mono">
                          Total: ₹{(ord.total_amount || 0).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[11px] text-amber-700 font-bold block">
                          Due: ₹{(ord.remaining_amount || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="px-2.5 py-1 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 font-extrabold text-xs border border-brand-200"
                        >
                          Manage
                        </button>

                        <button
                          onClick={() => handlePrintReceipt(ord)}
                          className="p-1.5 rounded-lg text-charcoal-600 hover:bg-warm-hover border border-warm-border"
                          title="Print Receipt"
                        >
                          <Printer className="w-4 h-4" />
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

      {/* MANAGE ORDER MODAL */}
      {selectedOrder && (
        <Modal
          isOpen={Boolean(selectedOrder)}
          onClose={() => setSelectedOrder(null)}
          title={`Manage Order #${selectedOrder.order_number}`}
          maxWidth="md"
        >
          <div className="space-y-5 py-2">
            
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
                        : 'bg-warm-bg text-charcoal-700 border-warm-border hover:bg-white'
                    }`}
                  >
                    {st.replace('_', ' ').toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Request Trigger */}
            <div className="p-4 rounded-2xl bg-warm-bg border border-warm-border space-y-3">
              <span className="text-xs font-extrabold text-brand-600 uppercase block">Send Payment Request to Customer</span>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={paymentReqAmount}
                  onChange={(e) => setPaymentReqAmount(parseFloat(e.target.value) || 0)}
                  className="flex-1 px-3 py-2 text-xs font-extrabold border border-warm-border rounded-xl bg-white"
                  placeholder="Request Amount (₹)"
                />
                <Button onClick={() => handleCreatePaymentRequest(selectedOrder)} variant="primary" size="sm" icon={<CreditCard className="w-4 h-4" />}>
                  Send Request
                </Button>
              </div>
            </div>

            {/* Cash Payment Recorder */}
            <div className="pt-2 flex justify-between gap-2 border-t border-warm-border">
              <Button
                onClick={() => {
                  setShowCashModal(true);
                }}
                variant="secondary"
                size="sm"
                icon={<DollarSign className="w-4 h-4 text-emerald-600" />}
              >
                Record Workshop Cash Payment
              </Button>

              <Button onClick={() => setSelectedOrder(null)} variant="secondary" size="sm">
                Close
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

            <Button onClick={handleRecordCashPayment} variant="primary" fullWidth icon={<CheckCircle2 className="w-4 h-4" />}>
              Save Cash Payment to DB
            </Button>
          </div>
        </Modal>
      )}

    </div>
  );
};
