import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Calendar, ChevronRight } from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Order, Enquiry } from '../types';
import { supabase } from '../lib/supabase';

export const OrdersPage: React.FC = () => {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isTamil = language === 'ta';

  const [activeTab, setActiveTab] = useState<'orders' | 'enquiries'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrdersAndEnquiries();
  }, [user?.id]);

  const loadOrdersAndEnquiries = async () => {
    setLoading(true);
    const localEnquiries: Enquiry[] = JSON.parse(localStorage.getItem('ml_enquiries') || '[]');

    if (!user?.id) {
      setOrders([]);
      setEnquiries(localEnquiries);
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch live orders for logged in user from Supabase DB
      const { data: dbOrders, error: orderErr } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (dbOrders) setOrders(dbOrders);

      // 2. Fetch live enquiries for logged in user from Supabase DB
      const { data: dbEnquiries, error: enqErr } = await supabase
        .from('enquiries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (dbEnquiries && dbEnquiries.length > 0) {
        setEnquiries(dbEnquiries);
      } else {
        const filteredLocal = localEnquiries.filter((e) => !e.user_id || e.user_id === user.id);
        setEnquiries(filteredLocal);
      }
    } catch (e) {
      console.warn('Live Supabase DB fetch fallback:', e);
      setEnquiries(localEnquiries);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-bg pb-24 md:pb-12 pt-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Page Title & Tabs */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-charcoal-900">{t('orders_title')}</h1>

          <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-warm-border shadow-sm">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                activeTab === 'orders' ? 'bg-brand-600 text-white shadow-sm' : 'text-charcoal-600 hover:bg-warm-hover'
              }`}
            >
              {t('active_orders')} ({orders.length})
            </button>

            <button
              onClick={() => setActiveTab('enquiries')}
              className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                activeTab === 'enquiries' ? 'bg-brand-600 text-white shadow-sm' : 'text-charcoal-600 hover:bg-warm-hover'
              }`}
            >
              {t('enquiries_tab')} ({enquiries.length})
            </button>
          </div>
        </div>

        {/* LIVE ORDERS PANEL LIST */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {loading ? (
              <div className="bg-white p-8 text-center rounded-3xl border border-warm-border">
                <p className="text-xs text-charcoal-500 font-bold animate-pulse">Syncing orders with Supabase DB...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white p-8 text-center rounded-3xl border border-warm-border space-y-3">
                <Package className="w-12 h-12 text-brand-500 mx-auto" />
                <h3 className="text-lg font-bold">No orders yet</h3>
                <p className="text-xs text-charcoal-500">Send an enquiry on any product to start an order!</p>
                <Link to="/products" className="inline-block pt-2">
                  <Button variant="primary">{t('nav_products')}</Button>
                </Link>
              </div>
            ) : (
              orders.map((order) => {
                const prodTitle = order.product
                  ? isTamil
                    ? order.product.name_ta
                    : order.product.name_en
                  : 'Fabrication Item';

                return (
                  <div
                    key={order.id}
                    onClick={() => navigate(`/orders/${order.id}`)}
                    className="group bg-white rounded-3xl border border-warm-border/80 shadow-card hover:shadow-warm-lg transition-all duration-300 p-5 sm:p-6 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    {/* Left: Product Thumbnail & Order Info */}
                    <div className="flex items-center gap-4">
                      {order.product?.primary_image ? (
                        <img
                          src={order.product.primary_image}
                          alt={prodTitle}
                          className="w-16 h-16 rounded-2xl object-cover border border-warm-border shrink-0 group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-xl shrink-0">
                          <Package className="w-7 h-7" />
                        </div>
                      )}

                      <div className="space-y-1">
                        <span className="text-[11px] font-mono font-extrabold text-brand-600 uppercase block">
                          #{order.order_number}
                        </span>
                        <h3 className="text-base font-extrabold text-charcoal-900 group-hover:text-brand-600 transition-colors leading-snug">
                          {prodTitle}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-charcoal-500 font-medium">
                          <span>Qty: <strong>{order.quantity}</strong></span>
                          {order.expected_delivery_date && (
                            <span className="flex items-center gap-1 text-brand-700 font-bold">
                              <Calendar className="w-3 h-3 text-brand-600" />
                              <span>{order.expected_delivery_date}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Badge & Action */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-warm-muted">
                      <Badge variant={order.status}>
                        {(order.status || 'pending').toUpperCase().replace('_', ' ')}
                      </Badge>

                      <div className="flex items-center gap-1 text-xs font-extrabold text-brand-600 group-hover:translate-x-1 transition-transform">
                        <span>{isTamil ? 'விவரங்களை பார்' : 'Order Details'}</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ENQUIRIES TAB */}
        {activeTab === 'enquiries' && (
          <div className="space-y-4">
            {enquiries.length === 0 ? (
              <div className="bg-white p-8 text-center rounded-3xl border border-warm-border">
                <p className="text-xs text-charcoal-500 font-bold">No submitted enquiries yet.</p>
              </div>
            ) : (
              enquiries.map((enq) => (
                <div key={enq.id} className="bg-white p-5 rounded-3xl border border-warm-border shadow-card space-y-3">
                  <div className="flex items-center justify-between border-b border-warm-muted pb-3">
                    <div>
                      <span className="text-[11px] font-mono font-extrabold text-brand-600 block">
                        #{enq.enquiry_number}
                      </span>
                      <h4 className="text-sm font-bold text-charcoal-900 mt-0.5">
                        {enq.product ? (isTamil ? enq.product.name_ta : enq.product.name_en) : 'Fabrication Enquiry'}
                      </h4>
                    </div>

                    <Badge variant={enq.status}>
                      {(enq.status || 'pending').toUpperCase().replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-charcoal-700">
                    <div>
                      <span className="text-charcoal-400 block font-semibold">Qty:</span>
                      <span className="font-extrabold">{enq.quantity}</span>
                    </div>
                    <div>
                      <span className="text-charcoal-400 block font-semibold">Location:</span>
                      <span className="font-extrabold">{enq.delivery_location || 'Kallimandhayam'}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
};
