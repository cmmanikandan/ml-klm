import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, CreditCard, Clock, ShoppingBag, MessageSquare, Package, FolderTree, ArrowUpRight } from 'lucide-react';
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
      // 1. Fetch Orders from Supabase DB or LocalStorage
      const { data: ordData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (ordData && ordData.length > 0) {
        setOrders(ordData);
      } else {
        const localOrders = JSON.parse(localStorage.getItem('ml_orders') || '[]');
        setOrders(localOrders);
      }

      // 2. Fetch Enquiries from Supabase DB or LocalStorage
      const { data: enqData } = await supabase.from('enquiries').select('*').order('created_at', { ascending: false });
      if (enqData && enqData.length > 0) {
        setEnquiries(enqData);
      } else {
        const localEnq = JSON.parse(localStorage.getItem('ml_enquiries') || '[]');
        setEnquiries(localEnq);
      }

      // 3. Fetch Active Products from Product Store (DB + Local Storage)
      const activeProducts = await fetchActiveProducts();
      if (activeProducts && activeProducts.length > 0) {
        setProductsCount(activeProducts.length);
      }

      // 4. Fetch Active Categories from Supabase DB or Local Storage
      const { data: catData } = await supabase.from('categories').select('*');
      const localCat = JSON.parse(localStorage.getItem('ml_categories') || '[]');
      if (catData && catData.length > 0) {
        setCategoriesCount(catData.length);
      } else if (localCat && localCat.length > 0) {
        setCategoriesCount(localCat.length);
      } else {
        setCategoriesCount(INITIAL_CATEGORIES.length);
      }
    } catch (e) {
      console.warn('Dashboard DB load fallback', e);
    } finally {
      setLoading(false);
    }
  };

  // Live metrics calculations
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const paidAmount = orders.reduce((sum, o) => sum + ((o.total_amount || 0) - (o.remaining_amount || 0)), 0);
  const unpaidAmount = orders.reduce((sum, o) => sum + (o.remaining_amount || 0), 0);

  const summaryCards = [
    { title: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: DollarSign, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    { title: 'Paid Amount', value: `₹${paidAmount.toLocaleString('en-IN')}`, icon: CreditCard, color: 'bg-green-50 text-green-600 border-green-200' },
    { title: 'Unpaid Amount', value: `₹${unpaidAmount.toLocaleString('en-IN')}`, icon: Clock, color: 'bg-amber-50 text-amber-600 border-amber-200' },
    { title: 'Total Orders', value: orders.length, icon: ShoppingBag, color: 'bg-brand-50 text-brand-600 border-brand-200' },
    { title: 'Total Enquiries', value: enquiries.length, icon: MessageSquare, color: 'bg-blue-50 text-blue-600 border-blue-200' },
    { title: 'Total Products', value: productsCount, icon: Package, color: 'bg-purple-50 text-purple-600 border-purple-200' },
    { title: 'Total Categories', value: categoriesCount, icon: FolderTree, color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-charcoal-900">Shop Overview & Analytics</h1>
        <p className="text-xs text-charcoal-500 font-semibold mt-0.5">
          Live database metrics and real customer order analytics
        </p>
      </div>

      {/* Top High-Priority Notification Action Cards */}
      {(enquiries.filter(e => e.status === 'pending').length > 0 || orders.filter(o => o.status === 'pending').length > 0) && (
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

          {orders.filter(o => o.status === 'pending').length > 0 && (
            <div className="bg-gradient-to-r from-charcoal-800 to-charcoal-900 text-white p-5 rounded-3xl border border-charcoal-700 shadow-lg flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-brand-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">New Order Received</span>
                </div>
                <h4 className="text-sm font-black">
                  {orders.filter(o => o.status === 'pending').length} New Orders Awaiting Acceptance
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

      {/* 7 Summary Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
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

      {/* Recent Orders List Table */}
      <div className="bg-white rounded-3xl border border-warm-border p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-charcoal-900">Recent Customer Orders</h3>
          <Link to="/admin/orders" className="text-xs font-extrabold text-brand-600 hover:text-brand-700 flex items-center gap-1">
            <span>View All Orders</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs font-bold text-charcoal-500 animate-pulse">
            Loading analytics from Supabase DB...
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-xs font-bold text-charcoal-500">
            No active orders recorded in database yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-warm-bg text-charcoal-500 font-extrabold border-b border-warm-border uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-muted font-medium">
                {orders.slice(0, 5).map((ord) => (
                  <tr key={ord.id} className="hover:bg-warm-hover/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-extrabold text-brand-600">
                      #{ord.order_number || ord.id}
                    </td>
                    <td className="py-3 px-4 font-bold text-charcoal-900">
                      {ord.customerName || ord.user_name || 'Customer'}
                    </td>
                    <td className="py-3 px-4 text-charcoal-700">
                      {ord.productName || 'Fabrication Item'}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={ord.status}>
                        {(ord.status || 'PENDING').toUpperCase().replace('_', ' ')}
                      </Badge>
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
