import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CreditCard, 
  Search, 
  DollarSign, 
  Calendar, 
  Filter, 
  ExternalLink, 
  Download, 
  Clock, 
  Trash2, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Wallet,
  Smartphone
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const AdminPaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Deletion confirm modal
  const [deletingPayment, setDeletingPayment] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchLivePayments();
  }, []);

  const fetchLivePayments = async () => {
    setLoading(true);
    try {
      const { data: dbPayments } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: dbOrders } = await supabase.from('orders').select('*');
      const allOrders = dbOrders || [];
      const orderMap = new Map(allOrders.map((o: any) => [o.id, o]));
      const orderByNumMap = new Map(allOrders.map((o: any) => [o.order_number, o]));

      const { data: profilesData } = await supabase.from('profiles').select('*');
      const profileMap = new Map((profilesData || []).map((prof: any) => [prof.id, prof]));

      let combinedPayments: any[] = [];
      const seenOrderIds = new Set<string>();

      // 1. Add records from payments table
      (dbPayments || []).forEach((p: any) => {
        const ord: any = orderMap.get(p.order_id) || orderByNumMap.get(p.order_number) || {};
        const prof: any = profileMap.get(p.user_id || ord?.user_id) || {};
        if (p.order_id) seenOrderIds.add(p.order_id);
        if (p.order_number) seenOrderIds.add(p.order_number);

        const isPaid = p.status === 'completed' || p.status === 'paid';
        const mode = (p.payment_mode || 'Cash Counter').toLowerCase();

        combinedPayments.push({
          ...p,
          orderNumber: p.order_number || ord?.order_number || p.order_id,
          customerName: ord?.customer_name || p.customerName || prof?.full_name || 'Customer',
          customerPhone: ord?.customer_phone || p.customerPhone || prof?.phone || '',
          productName: ord?.product_name || ord?.specifications || 'Custom Fabrication Item',
          paymentMode: p.payment_mode || (mode.includes('upi') ? 'UPI QR' : mode.includes('cash') ? 'Cash Counter' : 'Online Payment'),
          isCash: mode.includes('cash'),
          isUpi: mode.includes('upi') || mode.includes('qr') || mode.includes('online'),
          status: isPaid ? 'paid' : 'unpaid',
          rawDate: p.created_at ? new Date(p.created_at) : new Date(),
          formattedDate: p.created_at ? new Date(p.created_at).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }) : 'Recent'
        });
      });

      // 2. Also incorporate active orders with pending/unpaid amounts if not yet recorded in payments
      allOrders.forEach((ord: any) => {
        if (!seenOrderIds.has(ord.id) && !seenOrderIds.has(ord.order_number)) {
          const prof: any = profileMap.get(ord.user_id) || {};
          const isPaid = ord.payment_status === 'paid';
          const isUnpaid = ord.payment_status === 'unpaid' || ord.payment_status === 'pending' || (ord.is_payment_requested && (ord.payment_request_amount || 0) > 0);
          
          if (ord.total_amount > 0 || isUnpaid) {
            combinedPayments.push({
              id: `ord_pay_${ord.id}`,
              order_id: ord.id,
              order_number: ord.order_number || ord.id,
              orderNumber: ord.order_number || ord.id,
              customerName: ord.customer_name || prof?.full_name || 'Customer',
              customerPhone: ord.customer_phone || prof?.phone || '',
              productName: ord.product_name || ord.specifications || 'Custom Fabrication Item',
              amount: isPaid ? (ord.total_amount || 0) : (ord.payment_request_amount || ord.remaining_amount || ord.total_amount || 0),
              paymentMode: isPaid ? 'Full Payment' : 'Advance Payment Due',
              isCash: false,
              isUpi: false,
              transaction_id: `ORD-${ord.order_number || ord.id}`,
              status: isPaid ? 'paid' : 'unpaid',
              created_at: ord.created_at || new Date().toISOString(),
              rawDate: ord.created_at ? new Date(ord.created_at) : new Date(),
              formattedDate: ord.created_at ? new Date(ord.created_at).toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              }) : 'Recent'
            });
          }
        }
      });

      setPayments(combinedPayments);
    } catch (e) {
      console.warn('Payments audit fetch fallback', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePayment = async () => {
    if (!deletingPayment) return;
    setIsDeleting(true);

    try {
      // 1. Delete from Supabase DB
      if (deletingPayment.id && !deletingPayment.id.startsWith('ord_pay_')) {
        await supabase.from('payments').delete().eq('id', deletingPayment.id);
      }

      // 2. Remove from LocalStorage
      const localPayments = JSON.parse(localStorage.getItem('ml_payments') || '[]');
      const updatedLocal = localPayments.filter((p: any) => p.id !== deletingPayment.id);
      localStorage.setItem('ml_payments', JSON.stringify(updatedLocal));

      // 3. Update state
      setPayments((prev) => prev.filter((p) => p.id !== deletingPayment.id));
      setDeletingPayment(null);
    } catch (e) {
      console.error('Delete payment error', e);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered payments calculation
  const filteredPayments = payments.filter((p) => {
    // 1. Status Filter
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;

    // 2. Mode Filter
    if (modeFilter !== 'all') {
      const mode = (p.paymentMode || '').toLowerCase();
      if (modeFilter === 'cash' && !mode.includes('cash')) return false;
      if (modeFilter === 'upi' && !mode.includes('upi') && !mode.includes('qr') && !mode.includes('online')) return false;
      if (modeFilter === 'advance' && !mode.includes('advance')) return false;
    }

    // 3. Date Filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const pDate = new Date(p.rawDate);
      if (dateFilter === 'today') {
        if (pDate.toDateString() !== now.toDateString()) return false;
      } else if (dateFilter === 'week') {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (pDate < oneWeekAgo) return false;
      } else if (dateFilter === 'month') {
        if (pDate.getMonth() !== now.getMonth() || pDate.getFullYear() !== now.getFullYear()) return false;
      }
    }

    // 4. Search query filter
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.orderNumber || '').toLowerCase().includes(q) ||
      (p.customerName || '').toLowerCase().includes(q) ||
      (p.customerPhone || '').includes(q) ||
      (p.paymentMode || '').toLowerCase().includes(q) ||
      (p.transaction_id || '').toLowerCase().includes(q)
    );
  });

  // Financial Analytics Calculations
  const paidPayments = payments.filter(p => p.status === 'paid');
  const totalCollected = paidPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalCash = paidPayments.filter(p => (p.paymentMode || '').toLowerCase().includes('cash')).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalUpiOnline = totalCollected - totalCash;
  const totalPending = payments.filter(p => p.status === 'unpaid').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const handleExportPaymentsCSV = () => {
    if (filteredPayments.length === 0) return;

    const headers = ["S.No", "Date & Time", "Order Number", "Customer Name", "Customer Phone", "Payment Mode", "Transaction Ref", "Amount (₹)", "Status"];
    const rows = filteredPayments.map((p, idx) => [
      idx + 1,
      `"${p.formattedDate}"`,
      `"${p.orderNumber}"`,
      `"${p.customerName}"`,
      `"${p.customerPhone}"`,
      `"${p.paymentMode}"`,
      `"${p.transaction_id || p.id}"`,
      p.amount || 0,
      p.status.toUpperCase()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Manikandan_Lathe_Payments_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-charcoal-900">Workshop Payment Audit Ledger</h1>
          <p className="text-xs text-charcoal-500 font-semibold mt-0.5">
            Real-time cashflow analytics, counter cash reconciliation & verified payment transactions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPaymentsCSV}
            className="bg-white hover:bg-warm-hover text-charcoal-800 font-bold px-3.5 py-2 rounded-2xl border border-warm-border text-xs shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4 text-brand-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards Grid (4 Cards: Total Revenue, Cash in Counter, UPI / Online, Receivables Due) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Total Revenue Collected */}
        <div className="bg-emerald-50/90 p-5 rounded-3xl border border-emerald-200 shadow-card flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block">Total Collections</span>
            <span className="text-2xl font-black text-emerald-900 font-mono">₹{totalCollected.toLocaleString('en-IN')}</span>
            <span className="text-[10px] text-emerald-700 font-bold block">{paidPayments.length} Completed Receipts</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg shadow-md">
            ₹
          </div>
        </div>

        {/* 2. Cash in Counter */}
        <div className="bg-amber-50/90 p-5 rounded-3xl border border-amber-200 shadow-card flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider block">Cash in Counter</span>
            <span className="text-2xl font-black text-amber-900 font-mono">₹{totalCash.toLocaleString('en-IN')}</span>
            <span className="text-[10px] text-amber-700 font-bold block">Workshop Cash Drawer</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-md">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        {/* 3. UPI & Online Receipts */}
        <div className="bg-brand-50/90 p-5 rounded-3xl border border-brand-200 shadow-card flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-brand-800 uppercase tracking-wider block">UPI & Online Receipts</span>
            <span className="text-2xl font-black text-brand-900 font-mono">₹{totalUpiOnline.toLocaleString('en-IN')}</span>
            <span className="text-[10px] text-brand-700 font-bold block">UPI QR / Razorpay Direct</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-md">
            <Smartphone className="w-6 h-6" />
          </div>
        </div>

        {/* 4. Pending / Receivables Due */}
        <div className="bg-rose-50/90 p-5 rounded-3xl border border-rose-200 shadow-card flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-rose-800 uppercase tracking-wider block">Pending Receivables</span>
            <span className="text-2xl font-black text-rose-900 font-mono">₹{totalPending.toLocaleString('en-IN')}</span>
            <span className="text-[10px] text-rose-700 font-bold block">Awaiting Balance Settlement</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md">
            <Clock className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Filter Tabs, Date Range, Mode & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-warm-border shadow-card space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-warm-bg p-1 rounded-2xl border border-warm-border">
            {[
              { id: 'all', label: `All (${payments.length})` },
              { id: 'paid', label: `Paid (${payments.filter(p => p.status === 'paid').length})` },
              { id: 'unpaid', label: `Unpaid / Due (${payments.filter(p => p.status === 'unpaid').length})` }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                  statusFilter === tab.id
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'text-charcoal-600 hover:text-charcoal-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Date Range Quick Selector */}
          <div className="flex items-center gap-1.5 bg-warm-bg p-1 rounded-2xl border border-warm-border text-xs font-bold">
            {[
              { id: 'all', label: 'All Dates' },
              { id: 'today', label: 'Today' },
              { id: 'week', label: 'This Week' },
              { id: 'month', label: 'This Month' }
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => setDateFilter(d.id as any)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold transition-all ${
                  dateFilter === d.id
                    ? 'bg-white text-charcoal-900 shadow-xs border border-warm-border font-black'
                    : 'text-charcoal-500 hover:text-charcoal-900'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Mode Selector */}
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-bold border border-warm-border rounded-2xl bg-warm-bg text-charcoal-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">All Payment Modes</option>
            <option value="cash">💵 Cash Counter Only</option>
            <option value="upi">📱 UPI QR / Online Only</option>
            <option value="advance">⏳ Advance Requests Only</option>
          </select>

          {/* Search Box */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 text-brand-600 absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search order #, customer, ref..."
              className="w-full pl-10 pr-4 py-1.5 text-xs font-bold border border-warm-border rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs"
            />
          </div>

        </div>
      </div>

      {/* Payments History Ledger Table */}
      <div className="bg-white rounded-3xl border border-warm-border shadow-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs font-bold text-charcoal-500 animate-pulse">
            Loading payment audit ledger...
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <CreditCard className="w-10 h-10 text-brand-600 mx-auto" />
            <h3 className="text-base font-bold text-charcoal-800">No payment transactions found</h3>
            <p className="text-xs text-charcoal-500 font-medium">Recorded payments & advance requests will appear here automatically.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-warm-bg text-charcoal-500 font-extrabold border-b border-warm-border uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">S.No</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Order # & Item</th>
                  <th className="py-3.5 px-4">Customer Name</th>
                  <th className="py-3.5 px-4">Payment Mode & Ref</th>
                  <th className="py-3.5 px-4">Amount (₹)</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-warm-muted font-medium">
                {filteredPayments.map((pay, idx) => (
                  <tr key={pay.id || idx} className="hover:bg-warm-hover/50 transition-colors">
                    <td className="py-4 px-4 font-black text-charcoal-500 text-xs">#{idx + 1}</td>
                    <td className="py-4 px-4 font-mono font-bold text-charcoal-800 whitespace-nowrap">{pay.formattedDate}</td>
                    
                    {/* Order # */}
                    <td className="py-4 px-4">
                      <Link to={`/admin/orders/${pay.order_id || pay.orderNumber}`} className="font-mono font-extrabold text-brand-600 hover:underline flex items-center gap-1">
                        <span>#{pay.orderNumber}</span>
                        <ExternalLink className="w-3 h-3 text-brand-400 shrink-0" />
                      </Link>
                      <span className="text-[11px] font-bold text-charcoal-500 block truncate max-w-[150px]">{pay.productName}</span>
                    </td>

                    {/* Customer Name & Phone */}
                    <td className="py-4 px-4">
                      <span className="font-black text-charcoal-900 block text-xs">{pay.customerName}</span>
                      <a href={`tel:${pay.customerPhone}`} className="text-[11px] text-charcoal-500 font-mono font-bold hover:text-brand-600">
                        {pay.customerPhone || '-'}
                      </a>
                    </td>

                    {/* Payment Mode & Reference */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${pay.isCash ? 'bg-amber-500' : 'bg-brand-500'}`} />
                        <span className="font-bold text-charcoal-900 block">{pay.paymentMode}</span>
                      </div>
                      <span className="text-[10px] text-charcoal-400 font-mono truncate block mt-0.5">
                        Ref: {pay.transaction_id || pay.id}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="py-4 px-4 font-mono">
                      {pay.status === 'paid' ? (
                        <span className="text-sm font-black text-emerald-700">
                          +₹{(Number(pay.amount) || 0).toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-sm font-black text-rose-700">
                          ₹{(Number(pay.amount) || 0).toLocaleString('en-IN')}
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      {pay.status === 'paid' ? (
                        <span className="bg-emerald-100 text-emerald-900 text-[10px] font-black px-2.5 py-1 rounded-full border border-emerald-300 inline-flex items-center gap-1">
                          <span>✓</span>
                          <span>PAID</span>
                        </span>
                      ) : (
                        <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-2.5 py-1 rounded-full border border-rose-300 inline-flex items-center gap-1">
                          <span>⏳</span>
                          <span>UNPAID / DUE</span>
                        </span>
                      )}
                    </td>

                    {/* Actions: View Invoice + Delete Button */}
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* View Tax Invoice */}
                        <Link
                          to={`/admin/invoice/${pay.orderNumber || pay.order_id}`}
                          className="p-1.5 text-brand-600 hover:text-brand-800 hover:bg-brand-50 rounded-xl transition-colors"
                          title="View Official Tax Invoice"
                        >
                          <FileText className="w-4 h-4" />
                        </Link>

                        {/* Delete Payment Record */}
                        <button
                          type="button"
                          onClick={() => setDeletingPayment(pay)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors"
                          title="Delete Payment Transaction"
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

      {/* Delete Confirmation Modal */}
      {deletingPayment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-warm-border shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-charcoal-900">Delete Payment Record?</h3>
              <p className="text-xs text-charcoal-500">
                Are you sure you want to delete this payment of <strong className="text-rose-700">₹{(Number(deletingPayment.amount) || 0).toLocaleString('en-IN')}</strong> for Order #{deletingPayment.orderNumber}?
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingPayment(null)}
                className="flex-1 py-2.5 rounded-xl border border-warm-border text-xs font-bold text-charcoal-700 hover:bg-warm-hover"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeletePayment}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
