import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Phone, 
  MapPin, 
  Mail, 
  MessageSquare, 
  Eye, 
  Plus, 
  CheckCircle2,
  Settings,
  Download,
  Upload,
  RefreshCw,
  PhoneCall,
  Trash2,
  UserPlus,
  FileSpreadsheet,
  BookUser
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Profile } from '../../types';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';

export const AdminContactsPage: React.FC = () => {
  const [contacts, setContacts] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected Contact Inspection Modal
  const [selectedContact, setSelectedContact] = useState<Profile | null>(null);

  // Add/Edit Contact Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [cityArea, setCityArea] = useState('');

  // Settings Gear Modal (Import / Export CSV)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);

  // Delete Confirmation Modal State
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null);

  // Success Toast Card State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchContacts();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchContacts = async () => {
    setLoading(true);
    let dbProfiles: Profile[] = [];
    let dbContacts: any[] = [];

    try {
      // 1. Fetch registered customers from profiles table
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'customer')
        .order('created_at', { ascending: false });

      if (profileData) dbProfiles = profileData;
    } catch (e) {
      console.warn('Profiles DB fetch fallback');
    }

    try {
      // 2. Fetch walk-in contacts from contacts table (cross-device sync)
      const { data: contactData } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (contactData) {
        dbContacts = contactData.map((c: any) => ({
          id: c.id,
          full_name: c.name,
          email: c.email || '',
          phone: c.phone,
          address: c.address,
          city_area: c.city_area,
          language: 'ta' as const,
          role: 'customer' as const,
          is_profile_completed: true,
          created_at: c.created_at
        }));
      }
    } catch (e) {
      console.warn('Contacts DB fetch fallback — contacts table may not exist yet. Run supabase_schema.sql first.');
    }

    // 3. Local storage cache for offline
    const localContacts: Profile[] = JSON.parse(localStorage.getItem('ml_customer_contacts') || '[]');

    // Merge all — DB is source of truth, deduplicate by phone or id
    const seen = new Set<string>();
    const combined: Profile[] = [];

    for (const c of [...dbProfiles, ...dbContacts, ...localContacts]) {
      const key = (c.phone || c.id || '').replace(/[^0-9]/g, '').slice(-10);
      const nameKey = (c.full_name || '').toLowerCase().trim();
      const uniqueKey = key || nameKey || c.id;
      if (!uniqueKey || seen.has(uniqueKey)) continue;
      seen.add(uniqueKey);
      combined.push(c);
    }

    // Update localStorage cache with merged result
    localStorage.setItem('ml_customer_contacts', JSON.stringify(combined));
    setContacts(combined);
    setLoading(false);
  };

  const handleOpenAddModal = () => {
    setFullName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setCityArea('');
    setIsAddModalOpen(true);
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    const contactId = crypto.randomUUID();
    const newContact: Profile = {
      id: contactId,
      full_name: fullName.trim(),
      email: email.trim() || '',
      phone: phone.trim() || '',
      address: address.trim(),
      city_area: cityArea.trim() || 'Kallimandhayam, Dindigul',
      language: 'ta',
      role: 'customer',
      is_profile_completed: true,
      created_at: new Date().toISOString()
    };

    // Save to Supabase contacts table (cross-device source of truth)
    try {
      await supabase.from('contacts').insert({
        id: contactId,
        name: fullName.trim(),
        phone: phone.trim() || '',
        email: email.trim() || '',
        address: address.trim() || '',
        city_area: cityArea.trim() || 'Kallimandhayam, Dindigul',
        created_by: 'admin'
      });
    } catch (err) {
      // Also try saving to profiles table (for POS customer lookup)
      try {
        await supabase.from('profiles').upsert(newContact);
      } catch (profileErr) {
        console.warn('Supabase contact save fallback to localStorage only');
      }
    }

    // Update localStorage cache
    const localContacts: Profile[] = JSON.parse(localStorage.getItem('ml_customer_contacts') || '[]');
    localStorage.setItem('ml_customer_contacts', JSON.stringify([newContact, ...localContacts]));

    setContacts([newContact, ...contacts]);
    setIsAddModalOpen(false);
    showToast(`Contact "${fullName}" added successfully! Available in POS.`);
  };

  const handleDeleteContact = async () => {
    if (!deletingContactId) return;
    const targetId = deletingContactId;

    // Delete from Supabase contacts table (cross-device)
    try {
      await supabase.from('contacts').delete().eq('id', targetId);
    } catch {}

    // Also try profiles table
    try {
      await supabase.from('profiles').delete().eq('id', targetId);
    } catch {}

    // Update localStorage cache
    const localContacts: Profile[] = JSON.parse(localStorage.getItem('ml_customer_contacts') || '[]');
    const updatedLocal = localContacts.filter((c) => c.id !== targetId);
    localStorage.setItem('ml_customer_contacts', JSON.stringify(updatedLocal));

    setContacts((prev) => prev.filter((c) => c.id !== targetId));
    setDeletingContactId(null);

    try {
      await supabase.from('profiles').delete().eq('id', targetId);
    } catch (e) {
      console.warn('DB delete profile fallback');
    }

    showToast('Contact deleted.');
  };

  // EXPORT CONTACTS CSV
  const handleExportCSV = () => {
    if (contacts.length === 0) return;

    const headers = ['Full Name', 'Phone', 'Email', 'City Area', 'Address', 'Role', 'Created At'];
    const rows = contacts.map((c) => [
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

          fetchContacts();
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

  const filteredContacts = contacts.filter((c) => {
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
            <BookUser className="w-6 h-6 text-brand-600" />
            <span>Customer Contacts</span>
          </h1>
          <p className="text-xs text-charcoal-500 font-semibold mt-0.5">
            Contact directory with 1-tap Call, WhatsApp & CSV Import/Export. Synced with POS.
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
            {filteredContacts.length} Total Contacts
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
      ) : filteredContacts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map((cust) => {
            const cleanPhone = (cust.phone || '').replace(/[^0-9]/g, '');
            const initial = (cust.full_name || 'C').charAt(0).toUpperCase();
            return (
              <div
                key={cust.id}
                className="bg-white rounded-3xl p-5 border border-warm-border shadow-card flex flex-col justify-between space-y-4 hover:shadow-warm transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-warm-muted pb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {cust.avatar_url || (cust as any).photoURL ? (
                        <img
                          src={cust.avatar_url || (cust as any).photoURL}
                          alt={cust.full_name || 'Customer'}
                          className="w-12 h-12 rounded-2xl object-cover border-2 border-brand-300 shadow-sm shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-amber-600 text-white font-black text-lg flex items-center justify-center shadow-sm shrink-0">
                          {initial}
                        </div>
                      )}

                      <div className="space-y-0.5 min-w-0">
                        <h3 className="text-sm font-black text-charcoal-900 truncate group-hover:text-brand-600 transition-colors">
                          {cust.full_name || 'Customer'}
                        </h3>
                        <span className="text-[11px] font-mono font-bold text-charcoal-500 block truncate">
                          {cust.phone || 'No Phone Registered'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setDeletingContactId(cust.id)}
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
                    onClick={() => setSelectedContact(cust)}
                    className="p-2 bg-warm-bg hover:bg-warm-hover text-charcoal-700 border border-warm-border rounded-xl transition-colors shrink-0"
                    title="View Contact Details"
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
          <BookUser className="w-12 h-12 text-brand-600 mx-auto opacity-60" />
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
                  Download all {contacts.length} customer names, phone numbers, and addresses as a CSV spreadsheet.
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
              onClick={fetchContacts}
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

      {/* ADD NEW CONTACT MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Customer Contact"
      >
        <form onSubmit={handleSaveContact} className="space-y-4">
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

      {/* INSPECT CONTACT DETAIL MODAL */}
      {selectedContact && (
        <Modal
          isOpen={Boolean(selectedContact)}
          onClose={() => setSelectedContact(null)}
          title={`Contact Details: ${selectedContact.full_name}`}
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3 bg-warm-bg p-4 rounded-2xl border border-warm-border">
              <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white font-black text-lg flex items-center justify-center shrink-0">
                {(selectedContact.full_name || 'C').charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-sm font-black text-charcoal-900">{selectedContact.full_name}</h3>
                <p className="text-xs text-brand-600 font-bold">{selectedContact.phone || 'No Phone'}</p>
                <p className="text-[11px] text-charcoal-500 font-medium">{selectedContact.email}</p>
              </div>
            </div>

            <div className="space-y-2 bg-white p-4 rounded-2xl border border-warm-border">
              <div className="flex justify-between py-1 border-b border-warm-muted">
                <span className="font-bold text-charcoal-500">City / Area:</span>
                <span className="font-extrabold text-charcoal-900">{selectedContact.city_area || 'Kallimandhayam'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-warm-muted">
                <span className="font-bold text-charcoal-500">Full Address:</span>
                <span className="font-extrabold text-charcoal-900">{selectedContact.address || 'N/A'}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              {selectedContact.phone && (
                <a
                  href={`tel:${selectedContact.phone}`}
                  className="bg-brand-600 text-white font-black px-4 py-2 rounded-xl inline-flex items-center gap-1.5"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Call Now</span>
                </a>
              )}
              <Button onClick={() => setSelectedContact(null)} variant="secondary">
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={Boolean(deletingContactId)}
        onClose={() => setDeletingContactId(null)}
        onConfirm={handleDeleteContact}
        title="Delete Customer Contact?"
        message="Are you sure you want to delete this customer contact from your phonebook directory?"
        confirmText="Yes, Delete Contact"
        isDanger={true}
      />

    </div>
  );
};
