import React, { useState } from 'react';
import { Save, Store, Phone, MapPin, QrCode } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { DEFAULT_SHOP_INFO } from '../../lib/supabase';

export const AdminSettingsPage: React.FC = () => {
  const [shopName, setShopName] = useState(DEFAULT_SHOP_INFO.name);
  const [subName, setSubName] = useState(DEFAULT_SHOP_INFO.sub_name);
  const [phone, setPhone] = useState(DEFAULT_SHOP_INFO.phone);
  const [whatsapp, setWhatsapp] = useState(DEFAULT_SHOP_INFO.whatsapp);
  const [address, setAddress] = useState(DEFAULT_SHOP_INFO.address);
  const [upiId, setUpiId] = useState(DEFAULT_SHOP_INFO.upi_id);
  const [loading, setLoading] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('Shop settings updated successfully!');
    }, 500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      <div>
        <h1 className="text-2xl font-black text-charcoal-900">Shop Settings & Configuration</h1>
        <p className="text-xs text-charcoal-500 font-semibold mt-0.5">
          Configure workshop address, phone numbers, WhatsApp, and UPI QR details
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 border border-warm-border shadow-card space-y-5">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-charcoal-700 mb-1">Brand Name *</label>
            <input
              type="text"
              required
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm font-bold border border-warm-border rounded-xl bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-charcoal-700 mb-1">Sub Name / Tagline *</label>
            <input
              type="text"
              required
              value={subName}
              onChange={(e) => setSubName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm font-bold border border-warm-border rounded-xl bg-white focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-charcoal-700 mb-1">Contact Phone Number *</label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm font-bold border border-warm-border rounded-xl bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-charcoal-700 mb-1">WhatsApp Number (e.g. 919876543210) *</label>
            <input
              type="text"
              required
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm font-bold border border-warm-border rounded-xl bg-white focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-charcoal-700 mb-1">Shop Address *</label>
          <input
            type="text"
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm font-bold border border-warm-border rounded-xl bg-white focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-charcoal-700 mb-1">Shop UPI ID for QR Payments *</label>
          <input
            type="text"
            required
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm font-bold border border-warm-border rounded-xl bg-white focus:outline-none"
          />
        </div>

        <div className="pt-3">
          <Button type="submit" variant="primary" size="lg" loading={loading} fullWidth icon={<Save className="w-4 h-4" />}>
            Save Shop Settings
          </Button>
        </div>

      </form>

    </div>
  );
};
