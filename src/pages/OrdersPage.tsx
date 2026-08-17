import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Calendar, ChevronRight, ShoppingBag, RotateCcw } from 'lucide-react';
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
  const [reloading, setReloading] = useState(false);
  const initializedRef = useRef(false);

  const handleManualReload = async () => {
    setReloading(true);
    await loadOrdersAndEnquiries();
    setTimeout(() => setReloading(false), 600);
  };

  useEffect(() => {
    loadOrdersAndEnquiries();

    // ── SUPABASE REALTIME LIVE SYNC ──────────────────────────────────
    // When admin deletes/updates on another device, this customer page
    // auto-refreshes without any manual reload needed.
    const channel = supabase
      .channel('customer-orders-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        loadOrdersAndEnquiries();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'enquiries' }, () => {
        loadOrdersAndEnquiries();
      })
      .subscribe();

    const pollInterval = setInterval(loadOrdersAndEnquiries, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [user?.id]);

  const loadOrdersAndEnquiries = async () => {
    // Only show full loading spinner on first load; background polls are silent
    if (!initializedRef.current) {
      setLoading(true);
    }

    try {
      // 1. Fetch all products for name and image hydration
      const { data: allProducts } = await supabase.from('products').select('*');
      const productMap = new Map((allProducts || []).map((p: any) => [p.id, p]));

      const getProductName = (productId: string, fallback?: string): string => {
        const prod = productMap.get(productId);
        if (prod) return isTamil ? (prod.name_ta || prod.name_en) : prod.name_en;
        return fallback || 'Custom Fabrication Item';
      };

      const getProductImage = (productId: string, fallbackName?: string): string | null => {
        let prod = productMap.get(productId);
        if (!prod && fallbackName) {
          const lowerName = fallbackName.toLowerCase();
          for (const [_, p] of productMap.entries()) {
            if (p.name_en?.toLowerCase() === lowerName || lowerName.includes(p.name_en?.toLowerCase())) {
              prod = p;
              break;
            }
          }
        }
        return prod?.primary_image || (prod?.images && prod.images[0]) || null;
      };

      if (!user?.id) {
        setOrders([]);
        setEnquiries([]);
        setLoading(false);
        return;
      }

      // 2. Fetch enquiries for this authenticated customer strictly from Supabase
      const { data: dbEnquiries } = await supabase
        .from('enquiries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const matchingEnquiries = dbEnquiries || [];

      // 3. Fetch orders for this authenticated customer strictly from Supabase
      const { data: dbOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const matchingOrders = dbOrders || [];

      // Hydrate product names and images into orders
      const hydratedOrders = matchingOrders.map((o: any) => ({
        ...o,
        productName: o.product_name || o.productName || getProductName(o.product_id, 'Custom Fabrication Item'),
        productImage: o.product_image || o.productImage || getProductImage(o.product_id, o.product_name) || '',
      }));

      setOrders(hydratedOrders);

      // Hydrate and sync enquiries with cross-checked live orders
      const hydratedEnquiries = matchingEnquiries.map((e: any) => {
        const pName = (e.product_name || e.productName || '').trim().toLowerCase();
        const cName = (e.customer_name || e.customerName || '').trim().toLowerCase();
        const cPhone = String(e.customer_phone || e.phone || '').replace(/\D/g, '').slice(-10);

        // Find linked order in matchingOrders
        const matchedOrder = matchingOrders.find((o: any) => {
          if (e.converted_order_id && (o.id === e.converted_order_id || o.order_number === e.converted_order_id)) return true;
          if (e.id && (o.enquiry_id === e.id || o.id === e.id)) return true;
          if (e.enquiry_number && (o.enquiry_id === e.enquiry_number || o.order_number === e.enquiry_number)) return true;
          
          const ordPName = (o.product_name || o.productName || '').trim().toLowerCase();
          const ordCName = (o.customer_name || o.customerName || '').trim().toLowerCase();
          const ordPhone = String(o.customer_phone || o.customerPhone || '').replace(/\D/g, '').slice(-10);

          if (ordPName && pName && (ordPName === pName || ordPName.includes(pName) || pName.includes(ordPName))) {
            if (e.user_id && o.user_id && e.user_id === o.user_id) return true;
            if (cPhone && ordPhone && cPhone === ordPhone) return true;
            if (cName && ordCName && cName === ordCName) return true;
            if (matchingOrders.length === 1 && matchingEnquiries.length === 1) return true;
          }
          return false;
        });

        const isAcceptedOrConverted = 
          e.status === 'converted' || 
          e.status === 'accepted' || 
          e.status === 'converted_to_order' || 
          Boolean(e.converted_order_id) || 
          Boolean(matchedOrder);

        const finalOrderNum = matchedOrder?.order_number || e.converted_order_id || 'MNK-ORD-1';

        // Auto-heal DB status if enquiry was pending in DB
        if (isAcceptedOrConverted && e.status === 'pending') {
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(e.id);
          if (isUuid) {
            supabase.from('enquiries').update({ status: 'converted', converted_order_id: finalOrderNum }).eq('id', e.id);
          }
          if (e.enquiry_number) {
            supabase.from('enquiries').update({ status: 'converted', converted_order_id: finalOrderNum }).eq('enquiry_number', e.enquiry_number);
          }
        }

        return {
          ...e,
          status: isAcceptedOrConverted ? 'accepted' : (e.status || 'pending'),
          is_converted: isAcceptedOrConverted,
          converted_order_id: isAcceptedOrConverted ? finalOrderNum : '',
          productName: e.product_name || e.productName || getProductName(e.product_id, 'Fabrication Enquiry'),
        };
      });

      // Filter out repair requests — they belong in /repair page, not here
      const isRepairEnquiry = (e: any) => {
        const pName = String(e.product_name || '').toLowerCase();
        const num = String(e.enquiry_number || '').toLowerCase();
        return (
          pName.includes('[repair service]') ||
          pName.includes('repair') ||
          pName.includes('machining') ||
          pName.includes('பழுது') ||
          num.includes('rep')
        );
      };

      const nonRepairEnquiries = hydratedEnquiries.filter((e: any) => !isRepairEnquiry(e));
      setEnquiries(nonRepairEnquiries);
    } catch (e) {
      console.warn('OrdersPage live Supabase DB fetch error:', e);
      setOrders([]);
      setEnquiries([]);
    } finally {
      initializedRef.current = true;
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-bg pb-24 md:pb-12 pt-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Page Title & Tabs */}
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-black text-charcoal-900">{t('orders_title')}</h1>

          <div className="flex items-center gap-2">
            <button
              onClick={handleManualReload}
              disabled={reloading || loading}
              className="p-2 rounded-full bg-white border border-warm-border shadow-sm hover:bg-warm-bg transition-colors"
              title="Reload"
            >
              <RotateCcw className={`w-3.5 h-3.5 text-brand-600 ${reloading ? 'animate-spin' : ''}`} />
            </button>

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
        </div>

        {/* LIVE ORDERS PANEL LIST */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {loading ? (
              <div className="bg-white p-8 text-center rounded-3xl border border-warm-border space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-3 border-brand-500 border-t-transparent mx-auto" />
                <p className="text-xs text-charcoal-700 font-bold">
                  {isTamil ? 'ஆர்டர்கள் ஏற்றப்படுகின்றன...' : 'Loading your orders...'}
                </p>
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
                const prodTitle = (order as any).productName ||
                  (order.product ? (isTamil ? order.product.name_ta : order.product.name_en) : null) ||
                  'Custom Fabrication Item';
                const prodImage = (order as any).productImage || order.product?.primary_image || null;
                const totalAmt = order.total_amount || 0;

                return (
                  <div
                    key={order.id}
                    onClick={() => navigate(`/orders/${order.order_number || order.id}`)}
                    className="group bg-white rounded-3xl border border-warm-border/80 shadow-card hover:shadow-warm-lg transition-all duration-300 p-5 sm:p-6 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    {/* Left: Product Thumbnail & Order Info */}
                    <div className="flex items-center gap-4">
                      {prodImage ? (
                        <img
                          src={prodImage}
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
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-charcoal-500 font-medium">
                          <span>Qty: <strong>{order.quantity}</strong></span>
                          {totalAmt > 0 && (
                            <span className="font-mono font-black text-charcoal-900">
                              Total: ₹{totalAmt.toLocaleString('en-IN')}
                            </span>
                          )}
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
              enquiries.map((enq) => {
                const isAccepted = (enq as any).is_converted || enq.status === 'converted' || enq.status === 'accepted' || Boolean(enq.converted_order_id);
                const orderNum = enq.converted_order_id || 'MNK-ORD-1';

                return (
                  <div key={enq.id} className="bg-white p-5 rounded-3xl border border-warm-border shadow-card space-y-3">
                    <div className="flex items-center justify-between border-b border-warm-muted pb-3">
                      <div>
                        <span className="text-[11px] font-mono font-extrabold text-brand-600 block">
                          #{enq.enquiry_number}
                        </span>
                        <h4 className="text-sm font-bold text-charcoal-900 mt-0.5">
                          {(enq as any).productName || (enq.product ? (isTamil ? enq.product.name_ta : enq.product.name_en) : 'Fabrication Enquiry')}
                        </h4>
                      </div>

                      <Badge variant={isAccepted ? 'accepted' : enq.status}>
                        {isAccepted ? (isTamil ? 'ஏற்றுக்கொள்ளப்பட்டது' : 'ACCEPTED') : (enq.status || 'pending').toUpperCase().replace('_', ' ')}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-charcoal-700">
                      <div>
                        <span className="text-charcoal-400 block font-semibold">Qty:</span>
                        <span className="font-extrabold">{enq.quantity || 1} Unit(s)</span>
                      </div>
                      <div>
                        <span className="text-charcoal-400 block font-semibold">Location:</span>
                        <span className="font-extrabold">{enq.delivery_location || 'Kallimandhayam'}</span>
                      </div>
                    </div>

                    {isAccepted && (
                      <div className="pt-2 border-t border-warm-border/60">
                        <Link
                          to={`/orders/${orderNum}`}
                          className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-black text-emerald-800 hover:text-emerald-900 bg-emerald-100/90 hover:bg-emerald-200 py-2.5 px-4 rounded-2xl border border-emerald-300 shadow-sm transition-all"
                        >
                          <ShoppingBag className="w-4 h-4 text-emerald-700" />
                          <span>{isTamil ? `உறுதிசெய்யப்பட்ட ஆர்டர் #${orderNum} ஐக் காண்க` : `View Accepted Order (#${orderNum}) →`}</span>
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

      </div>
    </div>
  );
};
