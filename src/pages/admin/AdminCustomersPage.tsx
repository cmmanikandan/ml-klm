import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Phone, 
  MapPin, 
  Mail, 
  MessageSquare, 
  Calendar, 
  UserCheck, 
  Eye, 
  Plus, 
  X,
  CheckCircle2,
  Settings,
  Download,
  Upload,
  RefreshCw,
  PhoneCall,
  Trash2,
  UserPlus,
  FileSpreadsheet
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Profile } from '../../types';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';

export const AdminCustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected Customer Inspection Modal
  const [selectedCustomer, setSelectedCustomer] = useState<Profile | null>(null);

  // Add/Edit Customer Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [cityArea, setCityArea] = useState('');
  const [notes, setNotes] = useState('');

  // Settings Gear Modal (Import / Export)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);

  // Delete Confirmation Modal State
  const [deletingCustomerId, setDeletingCustomerId] = useState<string | null>(null);

  // Success Toast Card State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchCustomers = async () => {
    setLoading(true);
    let dbCustomers: Profile[] = [];
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && !error && data.length > 0) {
        dbCustomers = data;
      }
    } catch (e) {
      console.warn('Customer profiles DB fetch fallback');
    }

    // Local storage customer contacts
    const localContacts: Profile[] = JSON.parse(localStorage.getItem('ml_customer_contacts') || '[]');

    // Default Demo Contacts if empty
    const defaultContacts: Profile[] = [
      {
        id: 'cust_01',
        full_name: 'Karthik Kumar',
        email: 'karthik.klm@gmail.com',
        phone: '+91 98421 54321',
        address: 'K. Keeranur Road, Kallimandhayam',
        city_area: 'Kallimandhayam, Dindigul',
        language: 'ta',
        role: 'customer',
        is_profile_completed: true,
        created_at: '2026-08-10T10:30:00Z'
      },
      {
        id: 'cust_02',
        full_name: 'Muruganathan S',
        email: 'murugan.lathe@yahoo.com',
        phone: '+91 94432 87654',
        address: 'Main Bazaar Street',
        city_area: 'Palani, Dindigul',
        language: 'ta',
        role: 'customer',
        is_profile_completed: true,
        created_at: '2026-08-12T14:15:00Z'
      },
      {
        id: 'cust_03',
        full_name: 'Senthil Velan',
        email: 'senthil.steelworks@gmail.com',
        phone: '+91 96592 11223',
        address: 'Near Government School',
        city_area: 'Oddanchatram, Dindigul',
        language: 'ta',
        role: 'customer',
        is_profile_completed: true,
        created_at: '2026-08-14T09:00:00Z'
      }
    ];

    // Also extract customers who placed orders or enquiries in DB
    let orderCustomers: Profile[] = [];
    try {
      const { data: dbOrders } = await supabase.from('orders').select('*');
      if (dbOrders && dbOrders.length > 0) {
        orderCustomers = dbOrders
          .filter((o: any) => o.customerName || o.customer_name || o.phone)
          .map((o: any) => ({
            id: `cust_ord_${o.user_id || o.id}`,
            full_name: o.customerName || o.customer_name || o.user_name || 'Customer',
            phone: o.customerPhone || o.customer_phone || o.phone || '',
            email: o.customerEmail || o.email || `${(o.customerName || 'customer').toLowerCase().replace(/\s+/g, '')}@gmail.com`,
            city_area: o.delivery_location || o.city_area || 'Kallimandhayam, Dindigul',
            address: o.customerAddress || o.address || o.delivery_location || 'Kallimandhayam',
            language: 'ta',
            role: 'customer',
            is_profile_completed: true,
            created_at: o.created_at || new Date().toISOString()
          }));
      }
    } catch (e) {
      console.warn('Orders customer extract fallback');
    }

    let combined = [...dbCustomers, ...localContacts, ...orderCustomers];
    if (combined.length === 0) {
      combined = defaultContacts;
    }

    // Deduplicate by Name or Phone
    const seen = new Set();
    combined = combined.filter((c) => {
      const key = (c.phone || c.full_name || c.id || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    setCustomers(combined);
    setLoading(false);
  };

  const handleOpenAddModal = () => {
    setFullName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setCityArea('');
    setNotes('');
    setIsAddModalOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    const newCustomer: Profile = {
      id: `cust_${Date.now()}`,
      full_name: fullName.trim(),
      email: email.trim() || `${fullName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      phone: phone.trim() || '+91 96592 00000',
      address: address.trim(),
      city_area: cityArea.trim() || 'Kallimandhayam, Dindigul',
      language: 'ta',
      role: 'customer',
      is_profile_completed: true,
      created_at: new Date().toISOString()
    };

    // Save to LocalStorage for POS sync
    const localContacts: Profile[] = JSON.parse(localStorage.getItem('ml_customer_contacts') || '[]');
    localStorage.setItem('ml_customer_contacts', JSON.stringify([newCustomer, ...localContacts]));

    // Try saving to Supabase DB
    try {
      await supabase.from('profiles').upsert(newCustomer);
    } catch (err) {
      console.warn('Supabase profile insert fallback');
    }

    setCustomers([newCustomer, ...customers]);
    setIsAddModalOpen(false);
    showToast(`Contact "${fullName}" added successfully! Available in POS.`);
  };

  const handleDeleteContact = async () => {
    if (!deletingCustomerId) return;
    const targetId = deletingCustomerId;

    // Remove from LocalStorage
    const localContacts: Profile[] = JSON.parse(localStorage.getItem('ml_customer_contacts') || '[]');
    const updatedLocal = localContacts.filter((c) => c.id !== targetId);
    localStorage.setItem('ml_customer_contacts', JSON.stringify(updatedLocal));

    // Remove from state
    setCustomers((prev) => prev.filter((c) => c.id !== targetId));
    setDeletingCustomerId(null);

    try {
      await supabase.from('profiles').delete().eq('id', targetId);
    } catch (e) {
      console.warn('DB delete profile fallback');
    }

    showToast('Customer contact deleted.');
  };

  // EXPORT CONTACTS CSV
  const handleExportCSV = () => {
    if (customers.length === 0) return;

    const headers = ['Full Name', 'Phone', 'Email', 'City Area', 'Address', 'Role', 'Created At'];
    const rows = customers.map((c) => [
      `"${c.full_name || ''}"`,
      `"${c.phone || ''}"`,
      `"${c.email || ''}"`,
      `"${c.city_area || ''}"`,
      `"${(c.address || '').replace(/"/g, '""')}"`,
      `"${c.role || 'customer'}"`,
      `"${c.created_at || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `manikandan_lathe_contacts_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Customer contacts exported to CSV successfully!');
  };

  // IMPORT CONTACTS CSV
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
        
        if (lines.length <= 1) {
          showToast('CSV file is empty or invalid.');
          setImporting(false);
          return;
        }

        const importedContacts: Profile[] = [];
        // Skip header line
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map((c) => c.replace(/^"|"$/g, '').trim());
          if (cols.length >= 2 && cols[0]) {
            importedContacts.push({
              id: `cust_csv_${Date.now()}_${i}`,
              full_name: cols[0],
              phone: cols[1] || '+91 96592 00000',
              email: cols[2] || `${cols[0].toLowerCase().replace(/\s+/g, '')}@gmail.com`,
              city_area: cols[3] || 'Kallimandhayam, Dindigul',
              address: cols[4] || cols[3] || '',
              language: 'ta',
              role: 'customer',
              is_profile_completed: true,
              created_at: new Date().toISOString()
            });
          }
        }

        if (importedContacts.length > 0) {
          const localContacts: Profile[] = JSON.parse(localStorage.getItem('ml_customer_contacts') || '[]');
          const combined = [...importedContacts, ...localContacts];
          localStorage.setItem('ml_customer_contacts', JSON.stringify(combined));

          try {
            await supabase.from('profiles').upsert(importedContacts);
          } catch (e) {
            console.warn('Bulk DB upsert fallback', e);
          }

          fetchCustomers();
          showToast(`Successfully imported ${importedContacts.length} contacts! Available in POS.`);
          setIsSettingsModalOpen(false);
        } else {
          showToast('No valid contact records found in CSV.');
        }
      } catch (err) {
        showToast('Error parsing CSV file.');
      } finally {
        setImporting(false);
      }
    };

    reader.readAsText(file);
  };

  const filteredCustomers = customers.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = (c.full_name || '').toLowerCase();
    const em = (c.email || '').toLowerCase();
    const ph = (c.phone || '').toLowerCase();
    const loc = (c.city_area || '').toLowerCase();
    return name.includes(q) || em.includes(q) || ph.includes(q) || loc.includes(q);
  });

  return (
    <div className="space-y-6 relative pb-12">
      
      {/* Toast Notification Card */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-bounce-subtle border border-emerald-400">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-xs font-extrabold">{toastMessage}</span>
        </div>
      )}

      {/* Header Bar & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-warm-border shadow-card">
        <div>
          <h1 className="text-2xl font-black text-charcoal-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-600" />
            <span>Customer Contacts Phonebook</span>
          </h1>
          <p className="text-xs text-charcoal-500 font-semibold mt-0.5">
            Mobile contact directory with 1-tap Call & WhatsApp. Auto-synced with POS Order Creation.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Settings Gear Icon for CSV Import/Export */}
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="p-3 bg-warm-bg hover:bg-brand-50 text-charcoal-700 hover:text-brand-600 rounded-2xl border border-warm-border shadow-sm transition-all flex items-center justify-center"
            title="Contacts Settings (Import / Export CSV)"
          >
            <Settings className="w-5 h-5" />
          </button>

          <Button onClick={handleOpenAddModal} variant="primary" icon={<UserPlus className="w-4 h-4" />}>
            + Add Contact
          </Button>
        </div>
      </div>

      {/* Search Bar & Quick Stats */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-brand-600 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone (+91...), area or city..."
            className="w-full pl-10 pr-4 py-2.5 text-xs font-bold border border-warm-border rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="bg-brand-50 text-brand-700 text-xs font-black px-3.5 py-2 rounded-2xl border border-brand-200">
            {filteredCustomers.length} Total Contacts
          </span>
        </div>
      </div>

      {/* Customer Mobile Phonebook Contacts Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-3xl p-6 border border-warm-border animate-pulse h-44" />
          ))}
        </div>
      ) : filteredCustomers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((cust) => {
            const cleanPhone = (cust.phone || '').replace(/[^0-9]/g, '');
            return (
              <div
                key={cust.id}
                className="bg-white rounded-3xl p-5 border border-warm-border shadow-card flex flex-col justify-between space-y-4 hover:shadow-warm transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-warm-muted pb-3">
                    <div className="flex items-center gap-3">
                      {cust.avatar_url || (cust as any).photoURL ? (
                        <img
                          src={cust.avatar_url || (cust as any).photoURL}
                          alt={cust.full_name || 'Customer'}
                          className="w-12 h-12 rounded-2xl object-cover border-2 border-brand-300 shadow-sm shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-amber-600 text-white font-black text-base flex items-center justify-center shadow-sm shrink-0">
                          {(cust.full_name || 'C').charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className="space-y-0.5">
                        <h3 className="text-sm font-black text-charcoal-900 group-hover:text-brand-600 transition-colors">
                          {cust.full_name || 'Customer'}
                        </h3>
                        <span className="text-[10px] font-mono font-bold text-charcoal-500 block">
                          {cust.phone || 'No Phone Registered'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setDeletingCustomerId(cust.id)}
                      className="p-1.5 text-charcoal-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
                      title="Delete Contact"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    {cust.city_area && (
                      <div className="flex items-center gap-2 text-charcoal-700 font-semibold bg-warm-bg px-3 py-1.5 rounded-xl border border-warm-border">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="line-clamp-1 truncate">{cust.city_area}</span>
                      </div>
                    )}

                    {cust.address && cust.address !== cust.city_area && (
                      <p className="text-[11px] text-charcoal-500 font-medium pl-1 line-clamp-1">
                        📍 {cust.address}
                      </p>
                    )}
                  </div>
                </div>

                {/* Phone Call & WhatsApp Mobile Phonebook Action Bar */}
                <div className="flex items-center gap-2 pt-3 border-t border-warm-muted">
                  {cust.phone && (
                    <>
                      <a
                        href={`tel:${cust.phone}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white py-2 px-3 rounded-xl text-xs font-black transition-colors shadow-sm"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Call</span>
                      </a>

                      <a
                        href={`https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-3 rounded-xl text-xs font-black transition-colors shadow-sm"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    </>
                  )}

                  <button
                    onClick={() => setSelectedCustomer(cust)}
                    className="p-2 bg-warm-bg hover:bg-warm-hover text-charcoal-700 border border-warm-border rounded-xl transition-colors shrink-0"
                    title="View Full Profile Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-warm-border shadow-card space-y-3">
          <Users className="w-12 h-12 text-brand-600 mx-auto opacity-60" />
          <h3 className="text-base font-black text-charcoal-900">No Customer Contacts Found</h3>
          <p className="text-xs text-charcoal-500 font-medium">Click "+ Add Contact" or import contacts via CSV Settings (⚙️).</p>
        </div>
      )}

      {/* ⚙️ CONTACTS SETTINGS MODAL (IMPORT / EXPORT CSV) */}
      <Modal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        title="Customer Contacts Settings (Import / Export CSV)"
      >
        <div className="space-y-5">
          <p className="text-xs text-charcoal-600 font-medium leading-relaxed">
            Manage your customer database. Export contacts to CSV or bulk import new contacts from phonebooks & spreadsheets.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Export CSV Button */}
            <div className="bg-warm-bg p-5 rounded-2xl border border-warm-border space-y-3 flex flex-col justify-between">
              <div className="space-y-1">
                <FileSpreadsheet className="w-7 h-7 text-emerald-600" />
                <h4 className="text-xs font-black text-charcoal-900">Export Contacts to CSV</h4>
                <p className="text-[11px] text-charcoal-500 font-medium leading-snug">
                  Download all {customers.length} customer names, phone numbers, and addresses as a CSV spreadsheet.
                </p>
              </div>

              <Button onClick={handleExportCSV} variant="outline" className="w-full border-emerald-300 text-emerald-800 hover:bg-emerald-50">
                <Download className="w-4 h-4 mr-2" />
                Download CSV
              </Button>
            </div>

            {/* Import CSV File Dropzone */}
            <div className="bg-warm-bg p-5 rounded-2xl border border-warm-border space-y-3 flex flex-col justify-between">
              <div className="space-y-1">
                <Upload className="w-7 h-7 text-brand-600" />
                <h4 className="text-xs font-black text-charcoal-900">Import Contacts CSV</h4>
                <p className="text-[11px] text-charcoal-500 font-medium leading-snug">
                  Upload a CSV file (Name, Phone, Email, City). Imported contacts sync automatically with POS.
                </p>
              </div>

              <label className="w-full inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white py-2.5 px-4 rounded-xl text-xs font-black cursor-pointer transition-colors shadow-sm">
                <Upload className="w-4 h-4" />
                <span>{importing ? 'Importing CSV...' : 'Select CSV File'}</span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={importing}
                />
              </label>
            </div>
          </div>

          <div className="pt-3 border-t border-warm-muted flex justify-between items-center">
            <Button
              onClick={fetchCustomers}
              variant="outline"
              icon={<RefreshCw className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Sync DB Contacts
            </Button>

            <Button onClick={() => setIsSettingsModalOpen(false)} variant="secondary" className="text-xs">
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* ADD NEW CUSTOMER CONTACT MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Customer Contact"
      >
        <form onSubmit={handleSaveCustomer} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-charcoal-700 mb-1">
              Customer Full Name *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Ramesh Kumar"
              className="w-full px-3.5 py-2.5 text-xs font-bold border border-warm-border rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-charcoal-700 mb-1">
                Mobile Phone Number *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98421 00000"
                className="w-full px-3.5 py-2.5 text-xs font-bold border border-warm-border rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-charcoal-700 mb-1">
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ramesh@gmail.com"
                className="w-full px-3.5 py-2.5 text-xs font-bold border border-warm-border rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-charcoal-700 mb-1">
                City / Area / Town *
              </label>
              <input
                type="text"
                required
                value={cityArea}
                onChange={(e) => setCityArea(e.target.value)}
                placeholder="e.g. Kallimandhayam, Dindigul"
                className="w-full px-3.5 py-2.5 text-xs font-bold border border-warm-border rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-charcoal-700 mb-1">
                Full Street Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Near Bus Stand, Keeranur Road"
                className="w-full px-3.5 py-2.5 text-xs font-bold border border-warm-border rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-warm-muted flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Contact to POS Directory
            </Button>
          </div>
        </form>
      </Modal>

      {/* INSPECT CUSTOMER DETAIL MODAL */}
      {selectedCustomer && (
        <Modal
          isOpen={Boolean(selectedCustomer)}
          onClose={() => setSelectedCustomer(null)}
          title={`Contact Details: ${selectedCustomer.full_name}`}
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3 bg-warm-bg p-4 rounded-2xl border border-warm-border">
              <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white font-black text-lg flex items-center justify-center shrink-0">
                {(selectedCustomer.full_name || 'C').charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-sm font-black text-charcoal-900">{selectedCustomer.full_name}</h3>
                <p className="text-xs text-brand-600 font-bold">{selectedCustomer.phone || 'No Phone'}</p>
                <p className="text-[11px] text-charcoal-500 font-medium">{selectedCustomer.email}</p>
              </div>
            </div>

            <div className="space-y-2 bg-white p-4 rounded-2xl border border-warm-border">
              <div className="flex justify-between py-1 border-b border-warm-muted">
                <span className="font-bold text-charcoal-500">City / Area:</span>
                <span className="font-extrabold text-charcoal-900">{selectedCustomer.city_area || 'Kallimandhayam'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-warm-muted">
                <span className="font-bold text-charcoal-500">Full Address:</span>
                <span className="font-extrabold text-charcoal-900">{selectedCustomer.address || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-warm-muted">
                <span className="font-bold text-charcoal-500">Language Preference:</span>
                <span className="font-extrabold text-amber-700">{selectedCustomer.language === 'ta' ? 'Tamil (தமிழ்)' : 'English'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="font-bold text-charcoal-500">Registered On:</span>
                <span className="font-extrabold text-charcoal-900">{selectedCustomer.created_at ? new Date(selectedCustomer.created_at).toLocaleDateString('en-IN') : 'Recently'}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              {selectedCustomer.phone && (
                <a
                  href={`tel:${selectedCustomer.phone}`}
                  className="bg-brand-600 text-white font-black px-4 py-2 rounded-xl inline-flex items-center gap-1.5"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Call Now</span>
                </a>
              )}
              <Button onClick={() => setSelectedCustomer(null)} variant="secondary">
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={Boolean(deletingCustomerId)}
        onClose={() => setDeletingCustomerId(null)}
        onConfirm={handleDeleteContact}
        title="Delete Customer Contact?"
        message="Are you sure you want to delete this customer contact from your phonebook directory?"
        confirmText="Yes, Delete Contact"
        isDanger={true}
      />

    </div>
  );
};
