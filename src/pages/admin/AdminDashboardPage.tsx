import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, 
  CreditCard, 
  Clock, 
  ShoppingBag, 
  MessageSquare, 
  Package, 
  FolderTree, 
  ArrowUpRight,
  Printer,
  Eye,
  Calculator,
  CheckCircle2,
  Receipt
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES, supabase } from '../../lib/supabase';
import { fetchActiveProducts } from '../../lib/productsStore';

export const AdminDashboardPage: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [productsCount, setProductsCount] = useState<number>(INITIAL_PRODUCTS.length);
  const [categoriesCount, setCategoriesCount] = useState<number>(INITIAL_CATEGORIES.length);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  const fetchDashboardMetrics = async () => {
    setLoading(true);
    try {
      // 1. Fetch Orders strictly from Supabase DB
      const { data: dbOrders } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      // Hydrate product and customer details
      const activeProducts = await fetchActiveProducts();
      const productMap = new Map((activeProducts || []).map(p => [p.id, p]));
      setProductsCount(activeProducts ? activeProducts.length : 0);

      const hydratedOrders = (dbOrders || []).map((ord: any) => ({
        ...ord,
        customerName: ord.customer_name || ord.customerName || 'Customer',
        customerPhone: ord.customer_phone || ord.customerPhone || '',
        productName: ord.product_name || ord.productName || ord.specifications || (ord.product_id && productMap.get(ord.product_id)?.name_en) || 'Lathe Item'
      }));

      setOrders(hydratedOrders);

      // 2. Fetch Enquiries strictly from Supabase DB
      const { data: enqData } = await supabase
        .from('enquiries')
        .select('*')
        .order('created_at', { ascending: false });

      setEnquiries(enqData || []);

      // 4. Fetch Active Categories from Supabase DB
      const { data: catData } = await supabase.from('categories').select('*').eq('is_active', true);
      setCategoriesCount(catData ? catData.length : 0);
    } catch (e) {
      console.warn('Dashboard DB load error', e);
    } finally {
      setLoading(false);
    }
  };

  // Live Metrics & POS vs Online Orders Calculations
  const isPosOrder = (o: any) => o.is_pos === true || (o.admin_notes && o.admin_notes.includes('POS')) || String(o.order_number || '').includes('POS');
  const onlineOrders = orders.filter((o) => !isPosOrder(o));
  const posOrders = orders.filter((o) => isPosOrder(o));

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const posRevenue = posOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const paidAmount = orders.reduce((sum, o) => sum + ((o.total_amount || 0) - (o.remaining_amount || 0)), 0);
  const unpaidAmount = orders.reduce((sum, o) => sum + (o.remaining_amount || 0), 0);

  // Workshop Profit & Loss Calculations (Raw Steel Cost @ ₹70/kg + Labor & Expenses @ 15%)
  const totalWeightSold = orders.reduce((sum, o) => sum + (o.weight_calculation?.total_weight_kg || 0), 0);
  const rawSteelMaterialCost = Math.round(totalWeightSold * 70) || Math.round(totalRevenue * 0.45);
  const laborAndWeldingExpenses = Math.round(totalRevenue * 0.15);
  const netWorkshopProfit = Math.max(0, totalRevenue - rawSteelMaterialCost - laborAndWeldingExpenses);

  const summaryCards = [
    { title: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: DollarSign, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    { title: 'POS Counter Revenue', value: `₹${posRevenue.toLocaleString('en-IN')}`, icon: Receipt, color: 'bg-amber-50 text-amber-600 border-amber-200' },
    { title: 'Paid Amount', value: `₹${paidAmount.toLocaleString('en-IN')}`, icon: CreditCard, color: 'bg-green-50 text-green-600 border-green-200' },
    { title: 'Unpaid Due Amount', value: `₹${unpaidAmount.toLocaleString('en-IN')}`, icon: Clock, color: 'bg-rose-50 text-rose-600 border-rose-200' },
    { title: 'POS Sales Count', value: posOrders.length, icon: Calculator, color: 'bg-brand-50 text-brand-600 border-brand-200' },
    { title: 'Online Orders', value: onlineOrders.length, icon: ShoppingBag, color: 'bg-blue-50 text-blue-600 border-blue-200' },
    { title: 'Customer Enquiries', value: enquiries.length, icon: MessageSquare, color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
    { title: 'Shop Products', value: productsCount, icon: Package, color: 'bg-purple-50 text-purple-600 border-purple-200' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-charcoal-900">Shop Overview & Analytics</h1>
          <p className="text-xs text-charcoal-500 font-semibold mt-0.5">
            Live metrics, online order tracking, and POS counter sales management
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/pos"
            className="bg-brand-600 hover:bg-brand-700 text-white font-black px-4 py-2.5 rounded-2xl text-xs shadow-md transition-all flex items-center gap-2"
          >
            <Calculator className="w-4 h-4" />
            <span>Open POS Counter</span>
          </Link>
        </div>
      </div>



      {/* Top High-Priority Notification Action Cards */}
      {(enquiries.filter(e => e.status === 'pending').length > 0 || onlineOrders.filter(o => o.status === 'pending').length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {enquiries.filter(e => e.status === 'pending').length > 0 && (
            <div className="bg-gradient-to-r from-amber-500 to-brand-600 text-white p-5 rounded-3xl shadow-lg flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-white/20 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">Action Required</span>
                </div>
                <h4 className="text-sm font-black">
                  {enquiries.filter(e => e.status === 'pending').length} New Customer Enquiries Waiting
                </h4>
                <p className="text-xs text-amber-100 font-medium">Review specifications & send custom price quotes</p>
              </div>

              <Link
                to="/admin/enquiries"
                className="bg-white text-brand-700 hover:bg-amber-50 font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-md transition-all shrink-0 whitespace-nowrap"
              >
                Review Enquiries →
              </Link>
            </div>
          )}

          {onlineOrders.filter(o => o.status === 'pending').length > 0 && (
            <div className="bg-gradient-to-r from-charcoal-800 to-charcoal-900 text-white p-5 rounded-3xl border border-charcoal-700 shadow-lg flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-brand-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">New Order Received</span>
                </div>
                <h4 className="text-sm font-black">
                  {onlineOrders.filter(o => o.status === 'pending').length} New Orders Awaiting Acceptance
                </h4>
                <p className="text-xs text-gray-300 font-medium">Accept order & confirm fabrication schedule</p>
              </div>

              <Link
                to="/admin/orders"
                className="bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-md transition-all shrink-0 whitespace-nowrap"
              >
                Accept Orders →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {summaryCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`bg-white p-4 rounded-3xl border shadow-card flex flex-col justify-between space-y-2 ${card.color}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-charcoal-600">{card.title}</span>
                <div className="p-2 rounded-xl bg-white shadow-sm shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-charcoal-900 tracking-tight">
                {card.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* RECENT 5 POS COUNTER SALES TABLE */}
      <div className="bg-white rounded-3xl border-2 border-brand-500/30 p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-brand-600" />
            <div>
              <h3 className="text-base font-black text-charcoal-900">Recent 5 POS Counter Sales</h3>
              <p className="text-[11px] font-bold text-charcoal-500">Instant shop walk-in sales & printed bills</p>
            </div>
          </div>

          <Link to="/admin/pos" className="text-xs font-extrabold text-brand-600 hover:text-brand-700 flex items-center gap-1">
            <span>Go to POS Counter</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs font-bold text-charcoal-500 animate-pulse">
            Loading POS counter sales...
          </div>
        ) : posOrders.length === 0 ? (
          <div className="p-8 text-center text-xs font-bold text-charcoal-400 space-y-2">
            <Calculator className="w-8 h-8 mx-auto text-warm-border" />
            <p>No POS sales recorded yet. Click "Open POS Counter" to complete walk-in sales.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-amber-50/70 text-amber-900 font-extrabold border-b border-amber-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Customer Name & Phone</th>
                  <th className="py-3 px-4">Product Item</th>
                  <th className="py-3 px-4">Total (₹)</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-muted font-medium">
                {posOrders.slice(0, 5).map((ord) => (
                  <tr key={ord.id} className="hover:bg-warm-hover/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-black text-brand-600">
                      {ord.order_number}
                    </td>
                    <td className="py-3 px-4 font-mono text-charcoal-600 text-[11px]">
                      {ord.created_at ? new Date(ord.created_at).toLocaleString('en-IN') : 'Recent'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-extrabold text-charcoal-900 block">{ord.customerName || 'Walk-in Customer'}</span>
                      <span className="text-[10px] font-mono text-charcoal-500">{ord.customerPhone || '-'}</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-charcoal-800">
                      {ord.productName || 'Lathe Fabrication Item'}
                    </td>
                    <td className="py-3 px-4 font-black font-mono text-charcoal-900">
                      ₹{(ord.total_amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                        {ord.payment_status?.toUpperCase() || 'PAID'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        to={`/invoice/${ord.order_number || ord.id}`}
                        target="_blank"
                        className="bg-brand-600 hover:bg-brand-700 text-white font-extrabold px-3 py-1.5 rounded-xl text-[11px] shadow-sm transition-colors inline-flex items-center gap-1"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>View Invoice</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RECENT ONLINE CUSTOMER ORDERS LIST TABLE */}
      <div className="bg-white rounded-3xl border border-warm-border p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-charcoal-900">Recent Online Customer Orders</h3>
            <p className="text-[11px] font-bold text-charcoal-500">Website orders & custom fabrication requests</p>
          </div>

          <Link to="/admin/orders" className="text-xs font-extrabold text-brand-600 hover:text-brand-700 flex items-center gap-1">
            <span>View All Orders ({onlineOrders.length})</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs font-bold text-charcoal-500 animate-pulse">
            Loading online orders from database...
          </div>
        ) : onlineOrders.length === 0 ? (
          <div className="p-8 text-center text-xs font-bold text-charcoal-500">
            No active online customer orders recorded in database yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-warm-bg text-charcoal-500 font-extrabold border-b border-warm-border uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Total (₹)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-muted font-medium">
                {onlineOrders.slice(0, 5).map((ord) => (
                  <tr key={ord.id} className="hover:bg-warm-hover/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-extrabold text-brand-600">
                      #{ord.order_number || ord.id}
                    </td>
                    <td className="py-3 px-4 font-bold text-charcoal-900">
                      {ord.customerName || ord.user_name || 'Customer'}
                    </td>
                    <td className="py-3 px-4 text-charcoal-700 font-bold">
                      {ord.productName || 'Fabrication Item'}
                    </td>
                    <td className="py-3 px-4 font-black font-mono text-charcoal-900">
                      ₹{(ord.total_amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={ord.status}>
                        {(ord.status || 'PENDING').toUpperCase().replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        to={`/admin/orders/${ord.id}`}
                        className="bg-warm-bg hover:bg-brand-100 text-brand-700 font-extrabold px-3 py-1.5 rounded-xl text-[11px] border border-brand-200 transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5 text-brand-600" />
                        <span>View Detail</span>
                      </Link>
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
