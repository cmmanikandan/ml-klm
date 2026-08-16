import React, { useState, useEffect } from 'react';
import { Save, Store, Phone, MapPin, QrCode, Edit3, CheckCircle2, X } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { DEFAULT_SHOP_INFO, supabase } from '../../lib/supabase';

export const AdminSettingsPage: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [shopName, setShopName] = useState(DEFAULT_SHOP_INFO.name);
  const [subName, setSubName] = useState(DEFAULT_SHOP_INFO.sub_name);
  const [phone, setPhone] = useState(DEFAULT_SHOP_INFO.phone);
  const [whatsapp, setWhatsapp] = useState(DEFAULT_SHOP_INFO.whatsapp);
  const [address, setAddress] = useState(DEFAULT_SHOP_INFO.address);
  const [upiId, setUpiId] = useState(DEFAULT_SHOP_INFO.upi_id);
  const [operatingHours, setOperatingHours] = useState('Mon - Sat: 8:30 AM - 8:30 PM (Sunday Holiday)');
  const [gstin, setGstin] = useState('33ABCDE1234F1Z5');
  const [ownerSignature, setOwnerSignature] = useState('C. MANIKANDAN (Proprietor)');
  const [mapUrl, setMapUrl] = useState('https://maps.google.com/?q=Kallimandhayam');
  const [defaultRatePerKg, setDefaultRatePerKg] = useState<number>(160);
  const [defaultRatePerSqft, setDefaultRatePerSqft] = useState<number>(150);
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // 1. Try fetching from Supabase DB admin_settings table
      const { data } = await supabase.from('admin_settings').select('value').eq('key', 'shop_info').maybeSingle();
      const local = JSON.parse(localStorage.getItem('ml_shop_settings') || '{}');
      const val = data?.value || local;

      if (val && Object.keys(val).length > 0) {
        if (val.name) setShopName(val.name);
        if (val.sub_name) setSubName(val.sub_name);
        if (val.phone) setPhone(val.phone);
        if (val.whatsapp) setWhatsapp(val.whatsapp);
        if (val.address) setAddress(val.address);
        if (val.upi_id) setUpiId(val.upi_id);
        if (val.operatingHours || val.working_hours_en) setOperatingHours(val.operatingHours || val.working_hours_en);
        if (val.gstin) setGstin(val.gstin);
        if (val.ownerSignature || val.owner_signature) setOwnerSignature(val.ownerSignature || val.owner_signature);
        if (val.mapUrl || val.google_maps_url) setMapUrl(val.mapUrl || val.google_maps_url);
        if (val.default_rate_per_kg) setDefaultRatePerKg(Number(val.default_rate_per_kg));
        if (val.default_rate_per_sqft) setDefaultRatePerSqft(Number(val.default_rate_per_sqft));
      }
    } catch (err) {
      console.warn('Failed to load shop settings from Supabase DB', err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const updatedInfo = {
      name: shopName,
      sub_name: subName,
      phone,
      whatsapp,
      address,
      upi_id: upiId,
      operatingHours,
      gstin,
      ownerSignature,
      mapUrl,
      default_rate_per_kg: defaultRatePerKg,
      default_rate_per_sqft: defaultRatePerSqft,
      updated_at: new Date().toISOString()
    };

    try {
      // Save to Supabase DB admin_settings table
      await supabase.from('admin_settings').upsert({
        key: 'shop_info',
        value: updatedInfo
      });
    } catch (err) {
      console.warn('Supabase DB settings upsert error:', err);
    }

    // Backup to localStorage
    localStorage.setItem('ml_shop_settings', JSON.stringify(updatedInfo));
    setLoading(false);
    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Header with Edit Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-charcoal-900">Shop Settings & Profile</h1>
          <p className="text-xs text-charcoal-500 font-semibold mt-0.5">
            Manage workshop contact details, GSTIN, operating hours, and online payment configuration
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
              <span className="text-[10px] font-extrabold text-charcoal-400 uppercase tracking-widest block">Operating Hours</span>
              <span className="text-xs font-extrabold text-charcoal-900">{operatingHours}</span>
            </div>

            <div className="p-4 bg-warm-bg/50 rounded-2xl border border-warm-border space-y-1">
              <span className="text-[10px] font-extrabold text-charcoal-400 uppercase tracking-widest block">Workshop Address</span>
              <span className="text-xs font-bold text-charcoal-800">{address}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-1">
                <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-widest block">Shop UPI ID for QR Payments</span>
                <span className="text-sm font-black font-mono text-brand-600">{upiId}</span>
              </div>

              <div className="p-4 bg-warm-bg/50 rounded-2xl border border-warm-border space-y-1">
                <span className="text-[10px] font-extrabold text-charcoal-400 uppercase tracking-widest block">Owner Signature Line</span>
                <span className="text-xs font-extrabold text-charcoal-900">{ownerSignature}</span>
              </div>
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
              <label className="block text-xs font-bold text-charcoal-700 mb-1">Operating Hours</label>
              <input
                type="text"
                value={operatingHours}
                onChange={(e) => setOperatingHours(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm font-bold border border-warm-border rounded-xl bg-white focus:ring-2 focus:ring-brand-500"
              />
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <div>
                <label className="block text-xs font-bold text-charcoal-700 mb-1">Owner Signature Name</label>
                <input
                  type="text"
                  value={ownerSignature}
                  onChange={(e) => setOwnerSignature(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm font-bold border border-warm-border rounded-xl bg-white focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
              <span className="text-xs font-extrabold text-amber-900 uppercase tracking-wider block">
                Shop Default Pricing Rates (Fallback for Custom Fabrication)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-charcoal-700 mb-1">Default Rate Per KG (₹/kg)</label>
                  <input
                    type="number"
                    value={defaultRatePerKg}
                    onChange={(e) => setDefaultRatePerKg(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 text-sm font-black border border-warm-border rounded-xl bg-white focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-charcoal-700 mb-1">Default Rate Per SqFt (₹/sqft)</label>
                  <input
                    type="number"
                    value={defaultRatePerSqft}
                    onChange={(e) => setDefaultRatePerSqft(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 text-sm font-black border border-warm-border rounded-xl bg-white focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
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
