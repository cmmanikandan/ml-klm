import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Phone, MessageSquare, CheckCircle2, XCircle, ArrowRight, Search, Eye } from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { INITIAL_PRODUCTS, DEFAULT_SHOP_INFO, supabase } from '../../lib/supabase';
import { getNextOrderId } from '../../lib/idGenerator';

export const AdminEnquiriesPage: React.FC = () => {
  const [filter, setFilter] = useState<'pending' | 'all' | 'accepted' | 'rejected' | 'converted'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [enquiries, setEnquiries] = useState<any[]>([]);

  // Selected Enquiry for Quote Modal
  const [selectedEnquiry, setSelectedEnquiry] = useState<any | null>(null);
  const [quotePrice, setQuotePrice] = useState<number>(15000);
  const [advanceRequired, setAdvanceRequired] = useState<number>(5000);
  const [estimatedDays, setEstimatedDays] = useState<number>(7);

  useEffect(() => {
    fetchLiveEnquiries();
  }, []);

  const fetchLiveEnquiries = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('enquiries').select('*').order('created_at', { ascending: false });
      if (data && data.length > 0) {
        setEnquiries(data);
      } else {
        const local = JSON.parse(localStorage.getItem('ml_enquiries') || '[]');
        setEnquiries(local);
      }
    } catch (e) {
      console.warn('Live enquiries DB fetch fallback');
      const local = JSON.parse(localStorage.getItem('ml_enquiries') || '[]');
      setEnquiries(local);
    } finally {
      setLoading(false);
    }
  };

  const filteredEnquiries = enquiries.filter((enq) => {
    if (filter !== 'all' && enq.status !== filter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        (enq.enquiry_number || enq.number || '').toLowerCase().includes(q) ||
        (enq.customerName || enq.delivery_location || '').toLowerCase().includes(q) ||
        (enq.customerPhone || '').includes(q)
      );
    }
    return true;
  });

  const handleUpdateStatus = async (id: string, status: string) => {
    setEnquiries(enquiries.map((e) => (e.id === id ? { ...e, status } : e)));
    try {
      await supabase.from('enquiries').update({ status }).eq('id', id);
    } catch (e) {
      console.warn('Enquiry status update fallback');
    }
  };

  const handleConvertToOrder = async () => {
    if (!selectedEnquiry) return;

    const deliveryDate = new Date(Date.now() + estimatedDays * 86400000).toISOString().slice(0, 10);
    const newOrderNumber = await getNextOrderId();

    const newOrderRecord = {
      order_number: newOrderNumber,
      user_id: selectedEnquiry.user_id || 'demo-user-123',
      product_id: selectedEnquiry.product_id || INITIAL_PRODUCTS[0].id,
      quantity: selectedEnquiry.quantity || 1,
      status: 'order_confirmed',
      expected_delivery_date: deliveryDate,
      total_amount: quotePrice,
      advance_amount: advanceRequired,
      remaining_amount: quotePrice - advanceRequired,
      is_payment_requested: true,
      payment_request_amount: advanceRequired,
      payment_status: 'pending',
      created_at: new Date().toISOString()
    };

    try {
      await supabase.from('orders').insert(newOrderRecord);
      await supabase.from('enquiries').update({ status: 'converted' }).eq('id', selectedEnquiry.id);
    } catch (e) {
      console.warn('Order conversion DB insert fallback');
    }

    setEnquiries(enquiries.map((e) => (e.id === selectedEnquiry.id ? { ...e, status: 'converted' } : e)));
    alert(`Enquiry #${selectedEnquiry.enquiry_number || selectedEnquiry.number} converted into Order #${newOrderNumber}! Customer notified.`);
    setSelectedEnquiry(null);
  };

  const handleOpenWhatsAppQuote = (enq: any) => {
    const rawPhone = (enq.customerPhone || enq.phone || enq.customer_phone || '').replace(/[^0-9]/g, '');
    const targetCustomerPhone = rawPhone ? (rawPhone.startsWith('91') ? rawPhone : `91${rawPhone}`) : DEFAULT_SHOP_INFO.whatsapp;

    const text = encodeURIComponent(
      `*MANIKANDAN LATHE WORKS - OFFICIAL QUOTE*\n` +
      `--------------------------------------\n` +
      `📌 *Enquiry ID:* ${enq.enquiry_number || enq.number || enq.id}\n` +
      `👤 *Customer Name:* ${enq.customerName || enq.customer_name || 'Customer'}\n` +
      `🛠️ *Fabrication Item:* ${enq.productName || enq.product_name || 'Custom Lathe Item'}\n` +
      `💰 *Quoted Price:* ₹${quotePrice.toLocaleString('en-IN')}\n` +
      `💳 *Advance Amount Required:* ₹${advanceRequired.toLocaleString('en-IN')}\n` +
      `⏱️ *Estimated Fabrication:* ${estimatedDays} Days\n` +
      `--------------------------------------\n` +
      `Please reply to confirm your quote and start fabrication!`
    );
    window.open(`https://wa.me/${targetCustomerPhone}?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-charcoal-900">Customer Fabrication Enquiries</h1>
          <p className="text-xs text-charcoal-500 font-medium">Review customer specifications, send price quotes & convert to shop orders</p>
        </div>

        <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-warm-border shadow-sm">
          {(['pending', 'all', 'accepted', 'rejected', 'converted'] as const).map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold capitalize transition-all ${
                filter === key ? 'bg-brand-600 text-white shadow-sm' : 'text-charcoal-600 hover:bg-warm-hover'
              }`}
            >
              {key === 'pending' ? 'New Enquiries' : key === 'all' ? 'All Enquiries' : key}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search by enquiry #, customer name, location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-xs font-bold border border-warm-border rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
        />
      </div>

      {/* Enquiries Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full bg-white p-8 text-center rounded-3xl border border-warm-border text-xs font-bold text-charcoal-500 animate-pulse">
            Syncing live customer enquiries with Supabase DB...
          </div>
        ) : filteredEnquiries.length === 0 ? (
          <div className="col-span-full bg-white p-12 text-center rounded-3xl border border-warm-border space-y-2">
            <h3 className="text-base font-bold text-charcoal-800">No customer enquiries found</h3>
            <p className="text-xs text-charcoal-500">Submitted product enquiries will appear here automatically.</p>
          </div>
        ) : (
          filteredEnquiries.map((enq) => (
            <div
              key={enq.id}
              className="bg-white rounded-3xl p-5 border border-warm-border shadow-card space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-warm-muted pb-3">
                  <div>
                    <span className="text-[11px] font-mono font-extrabold text-brand-600 block">
                      #{enq.enquiry_number || enq.number}
                    </span>
                    <h3 className="text-sm font-extrabold text-charcoal-900 mt-0.5">
                      {enq.productName || 'Fabrication Item'}
                    </h3>
                  </div>

                  <Badge variant={enq.status === 'accepted' ? 'accepted' : enq.status === 'converted' ? 'confirmed' : 'pending'}>
                    {enq.status.toUpperCase()}
                  </Badge>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs text-charcoal-700">
                  <div>
                    <span className="text-charcoal-400 block text-[10px] uppercase font-bold">Quantity</span>
                    <span className="font-extrabold">{enq.quantity || 1} Unit(s)</span>
                  </div>

                  <div>
                    <span className="text-charcoal-400 block text-[10px] uppercase font-bold">Location</span>
                    <span className="font-bold">{enq.delivery_location || enq.location || 'Kallimandhayam'}</span>
                  </div>
                </div>

                {enq.custom_notes && (
                  <div className="p-3 rounded-xl bg-warm-bg text-xs font-medium text-charcoal-700 border border-warm-border">
                    <span className="font-bold block text-[10px] text-charcoal-500 uppercase mb-0.5">Customer Notes:</span>
                    {enq.custom_notes}
                  </div>
                )}

              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-warm-border flex items-center justify-between gap-2">
                {enq.status === 'pending' ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleUpdateStatus(enq.id, 'accepted')}
                      className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200"
                      title="Accept Enquiry"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(enq.id, 'rejected')}
                      className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                      title="Reject Enquiry"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="text-[11px] font-extrabold text-charcoal-400">
                    Status: {enq.status.toUpperCase()}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Link
                    to={`/admin/enquiries/${enq.id}`}
                    className="inline-flex items-center justify-center gap-1 bg-warm-bg hover:bg-brand-50 text-brand-700 font-extrabold py-2 px-3 rounded-xl text-xs border border-brand-200 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Details</span>
                  </Link>

                  <Button
                    onClick={() => setSelectedEnquiry(enq)}
                    variant="primary"
                    size="sm"
                    icon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    Quote & Convert
                  </Button>
                </div>
              </div>

            </div>
          ))
        )}
      </div>

      {/* CONVERT ENQUIRY TO ORDER MODAL */}
      {selectedEnquiry && (
        <Modal
          isOpen={Boolean(selectedEnquiry)}
          onClose={() => setSelectedEnquiry(null)}
          title={`Prepare Quote for Enquiry #${selectedEnquiry.enquiry_number || selectedEnquiry.number}`}
          maxWidth="md"
        >
          <div className="space-y-4 py-2">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-charcoal-700 mb-1">Total Quoted Price (₹) *</label>
                <input
                  type="number"
                  required
                  value={quotePrice}
                  onChange={(e) => setQuotePrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 text-sm font-extrabold border border-warm-border rounded-xl bg-white focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-700 mb-1">Advance Amount Required (₹) *</label>
                <input
                  type="number"
                  required
                  value={advanceRequired}
                  onChange={(e) => setAdvanceRequired(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 text-sm font-extrabold border border-warm-border rounded-xl bg-white focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal-700 mb-1">Estimated Fabrication Time (Days) *</label>
              <input
                type="number"
                value={estimatedDays}
                onChange={(e) => setEstimatedDays(parseInt(e.target.value) || 1)}
                className="w-full px-3.5 py-2 text-xs font-bold border border-warm-border rounded-xl bg-white"
              />
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => handleOpenWhatsAppQuote(selectedEnquiry)}
                variant="secondary"
                icon={<MessageSquare className="w-4 h-4 text-emerald-600" />}
                className="flex-1"
              >
                Send Quote via WhatsApp
              </Button>

              <Button
                onClick={handleConvertToOrder}
                variant="primary"
                icon={<CheckCircle2 className="w-4 h-4" />}
                className="flex-1"
              >
                Convert to Active Order
              </Button>
            </div>

          </div>
        </Modal>
      )}

    </div>
  );
};
