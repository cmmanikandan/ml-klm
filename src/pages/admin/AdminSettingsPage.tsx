import React, { useState } from 'react';
import { Save, Store, Phone, MapPin, QrCode, Edit3, CheckCircle2, X } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { DEFAULT_SHOP_INFO } from '../../lib/supabase';

export const AdminSettingsPage: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);

  const [shopName, setShopName] = useState(DEFAULT_SHOP_INFO.name);
  const [subName, setSubName] = useState(DEFAULT_SHOP_INFO.sub_name);
  const [phone, setPhone] = useState(DEFAULT_SHOP_INFO.phone);
  const [whatsapp, setWhatsapp] = useState(DEFAULT_SHOP_INFO.whatsapp);
  const [address, setAddress] = useState(DEFAULT_SHOP_INFO.address);
  const [upiId, setUpiId] = useState(DEFAULT_SHOP_INFO.upi_id);
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setIsEditing(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }, 400);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Header with Edit Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-charcoal-900">Shop Settings & Profile</h1>
          <p className="text-xs text-charcoal-500 font-semibold mt-0.5">
            Manage workshop contact details, address, and online payment configuration
          </p>
        </div>

        {!isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="bg-brand-600 hover:bg-brand-700 text-white font-extrabold px-4 py-2.5 rounded-2xl text-xs shadow-md transition-colors flex items-center justify-center gap-2 shrink-0"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Settings</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="bg-warm-bg hover:bg-warm-hover text-charcoal-700 font-extrabold px-4 py-2.5 rounded-2xl text-xs border border-warm-border transition-colors flex items-center justify-center gap-2 shrink-0"
          >
            <X className="w-4 h-4" />
            <span>Cancel Edit</span>
          </button>
        )}
      </div>

      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-extrabold animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Shop profile and contact settings updated successfully!</span>
        </div>
      )}

      {/* Main Form / Display Container */}
      <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 border border-warm-border shadow-card space-y-6">
        
        {/* READ ONLY DISPLAY MODE */}
        {!isEditing ? (
          <div className="space-y-6">
            
            <div className="p-4 bg-warm-bg/70 rounded-2xl border border-warm-border flex items-start gap-4">
              <div className="p-3 bg-brand-600 text-white rounded-2xl shrink-0">
                <Store className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-charcoal-900">{shopName}</h3>
                <p className="text-xs text-brand-600 font-bold tracking-wider uppercase">{subName}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-warm-bg/50 rounded-2xl border border-warm-border space-y-1">
                <span className="text-[10px] font-extrabold text-charcoal-400 uppercase tracking-widest block">Phone Number</span>
                <span className="text-sm font-extrabold font-mono text-charcoal-900">{phone}</span>
              </div>

              <div className="p-4 bg-warm-bg/50 rounded-2xl border border-warm-border space-y-1">
                <span className="text-[10px] font-extrabold text-charcoal-400 uppercase tracking-widest block">WhatsApp Contact</span>
                <span className="text-sm font-extrabold font-mono text-emerald-600">+{whatsapp}</span>
              </div>
            </div>

            <div className="p-4 bg-warm-bg/50 rounded-2xl border border-warm-border space-y-1">
              <span className="text-[10px] font-extrabold text-charcoal-400 uppercase tracking-widest block">Workshop Address</span>
              <span className="text-xs font-bold text-charcoal-800">{address}</span>
            </div>

            <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-1">
              <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-widest block">Shop UPI ID for QR Payments</span>
              <span className="text-sm font-black font-mono text-brand-600">{upiId}</span>
            </div>

          </div>
        ) : (
          /* EDITABLE INPUTS MODE */
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-charcoal-700 mb-1">Brand Name *</label>
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm font-bold border border-warm-border rounded-xl bg-white focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-700 mb-1">Sub Name / Tagline *</label>
                <input
                  type="text"
                  required
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm font-bold border border-warm-border rounded-xl bg-white focus:ring-2 focus:ring-brand-500"
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
                  className="w-full px-3.5 py-2.5 text-sm font-bold border border-warm-border rounded-xl bg-white focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-700 mb-1">WhatsApp Number *</label>
                <input
                  type="text"
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm font-bold border border-warm-border rounded-xl bg-white focus:ring-2 focus:ring-brand-500"
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
                className="w-full px-3.5 py-2.5 text-sm font-bold border border-warm-border rounded-xl bg-white focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal-700 mb-1">Shop UPI ID for QR Payments *</label>
              <input
                type="text"
                required
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm font-bold border border-warm-border rounded-xl bg-white focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="pt-3 flex gap-3">
              <Button type="button" onClick={() => setIsEditing(false)} variant="secondary" className="flex-1">
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={loading} className="flex-1" icon={<Save className="w-4 h-4" />}>
                Save Changes
              </Button>
            </div>
          </div>
        )}

      </form>

    </div>
  );
};
