import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Search, DollarSign, CreditCard, Calendar, Filter, ExternalLink, Download, Clock } from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { supabase } from '../../lib/supabase';

export const AdminPaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [filterMode, setFilterMode] = useState<string>('all');

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

      const { data: profilesData } = await supabase.from('profiles').select('*');
      const profileMap = new Map((profilesData || []).map((prof: any) => [prof.id, prof]));

      let combinedPayments: any[] = [];
      const seenOrderIds = new Set<string>();

      // 1. Add records from payments table
      (dbPayments || []).forEach((p: any) => {
        const ord: any = orderMap.get(p.order_id) || {};
        const prof: any = profileMap.get(p.user_id || ord?.user_id) || {};
        if (p.order_id) seenOrderIds.add(p.order_id);

        combinedPayments.push({
          ...p,
          orderNumber: p.order_number || ord?.order_number || p.order_id,
          customerName: ord?.customer_name || p.customerName || prof?.full_name || 'Customer',
          customerPhone: ord?.customer_phone || p.customerPhone || prof?.phone || '',
          productName: ord?.product_name || ord?.specifications || 'Lathe Item',
          paymentMode: p.payment_mode || 'Online / Advance',
          status: (p.status === 'completed' || p.status === 'paid') ? 'paid' : 'unpaid',
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

      // 2. Also incorporate active orders with pending/unpaid amounts if not yet in payments table
      allOrders.forEach((ord: any) => {
        if (!seenOrderIds.has(ord.id)) {
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
              productName: ord.product_name || ord.specifications || 'Lathe Item',
              amount: isPaid ? (ord.total_amount || 0) : (ord.payment_request_amount || ord.remaining_amount || ord.total_amount || 0),
              paymentMode: isPaid ? 'Full Payment' : 'Advance Payment Due',
              transaction_id: `ORD-${ord.order_number || ord.id}`,
              status: isPaid ? 'paid' : 'unpaid',
              created_at: ord.created_at || new Date().toISOString(),
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

  const filteredPayments = payments.filter((p) => {
    // 1. Status Filter
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;

    // 2. Payment mode filter
    if (filterMode !== 'all') {
      const mode = (p.paymentMode || '').toLowerCase();
      if (filterMode === 'upi' && !mode.includes('upi') && !mode.includes('online')) return false;
      if (filterMode === 'cash' && !mode.includes('cash')) return false;
      if (filterMode === 'bank' && !mode.includes('bank') && !mode.includes('neft')) return false;
    }

    // 3. Search query filter
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

  const totalCollected = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalPending = payments.filter(p => p.status === 'unpaid').reduce((sum, p) => sum + (p.amount || 0), 0);

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
          <h1 className="text-2xl font-black text-charcoal-900">Payment Audit Ledger</h1>
          <p className="text-xs text-charcoal-500 font-semibold mt-0.5">
            Real-time tracking for online advance receipts, cash counter sales, and pending dues
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPaymentsCSV}
            className="bg-white hover:bg-warm-hover text-charcoal-800 font-bold px-3.5 py-2 rounded-2xl border border-warm-border text-xs shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4 text-brand-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-warm-border shadow-card flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-charcoal-400 uppercase tracking-wider block">Total Transactions</span>
            <span className="text-2xl font-black text-charcoal-900 font-mono">{payments.length}</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold border border-brand-200">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-emerald-50/80 p-5 rounded-3xl border border-emerald-200 shadow-card flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block">Total Paid Collections</span>
            <span className="text-2xl font-black text-emerald-900 font-mono">₹{totalCollected.toLocaleString('en-IN')}</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md">
            ₹
          </div>
        </div>

        <div className="bg-rose-50/80 p-5 rounded-3xl border border-rose-200 shadow-card flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-rose-800 uppercase tracking-wider block">Pending / Unpaid Dues</span>
            <span className="text-2xl font-black text-rose-900 font-mono">₹{totalPending.toLocaleString('en-IN')}</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-bold shadow-md">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 bg-warm-bg p-1 rounded-2xl border border-warm-border w-full sm:w-auto">
          {[
            { id: 'all', label: `All (${payments.length})` },
            { id: 'paid', label: `Paid (${payments.filter(p => p.status === 'paid').length})` },
            { id: 'unpaid', label: `Unpaid / Due (${payments.filter(p => p.status === 'unpaid').length})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                statusFilter === tab.id
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-charcoal-600 hover:text-charcoal-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-brand-600 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order #, customer..."
            className="w-full pl-10 pr-4 py-2 text-xs font-bold border border-warm-border rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
          />
        </div>
      </div>

      {/* Payments History Ledger Table */}
      <div className="bg-white rounded-3xl border border-warm-border shadow-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs font-bold text-charcoal-500 animate-pulse">
            Syncing payment audit ledger from Supabase DB...
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
                  <th className="py-3.5 px-4 text-right">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-warm-muted font-medium">
                {filteredPayments.map((pay, idx) => (
                  <tr key={pay.id || idx} className="hover:bg-warm-hover/50 transition-colors">
                    <td className="py-4 px-4 font-black text-charcoal-500 text-xs">#{idx + 1}</td>
                    <td className="py-4 px-4 font-mono font-bold text-charcoal-800 whitespace-nowrap">{pay.formattedDate}</td>
                    
                    {/* Order # */}
                    <td className="py-4 px-4">
                      <Link to={`/admin/orders/${pay.order_id}`} className="font-mono font-extrabold text-brand-600 hover:underline flex items-center gap-1">
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
                      <span className="font-bold text-charcoal-900 block">{pay.paymentMode}</span>
                      <span className="text-[10px] text-charcoal-400 font-mono truncate block">
                        Ref: {pay.transaction_id || pay.id}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="py-4 px-4 font-mono">
                      {pay.status === 'paid' ? (
                        <span className="text-sm font-black text-emerald-700">
                          +₹{(pay.amount || 0).toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-sm font-black text-rose-700">
                          ₹{(pay.amount || 0).toLocaleString('en-IN')}
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4 text-right">
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
