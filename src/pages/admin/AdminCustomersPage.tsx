import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Phone, 
  MapPin, 
  Mail, 
  Calendar, 
  Eye, 
  CheckCircle2,
  ShoppingBag,
  CreditCard,
  Globe,
  UserCheck,
  ShieldCheck
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Profile } from '../../types';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';

export const AdminCustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Profile[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected Customer Inspection Modal
  const [selectedCustomer, setSelectedCustomer] = useState<Profile | null>(null);

  useEffect(() => {
    fetchCustomersAndOrders();
  }, []);

  const fetchCustomersAndOrders = async () => {
    setLoading(true);
    let dbProfiles: Profile[] = [];
    let dbOrders: any[] = [];

    try {
      // 1. Fetch registered customer profiles from Supabase DB
      const { data: profs } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profs && profs.length > 0) {
        dbProfiles = profs;
      }

      // 2. Fetch orders to compute customer stats
      const { data: ords } = await supabase.from('orders').select('*');
      if (ords) dbOrders = ords;
    } catch (e) {
      console.warn('Customer profiles fetch error', e);
    }

    // Default registered accounts fallback if empty
    if (dbProfiles.length === 0) {
      dbProfiles = [
        {
          id: 'cust_web_01',
          full_name: 'Manikandan Prabhu',
          email: 'manikandanprabhu37@gmail.com',
          phone: '+91 9629286268',
          address: 'K. Keeranur Road, Kallimandhayam',
          city_area: 'Kallimandhayam, Dindigul',
          language: 'ta',
          role: 'customer',
          is_profile_completed: true,
          created_at: new Date().toISOString()
        },
        {
          id: 'cust_admin_01',
          full_name: 'Manikandan Admin',
          email: 'manikandanprabhu37@gmail.com',
          phone: '+91 7540006268',
          address: 'K. K Nagar Adhi Colony',
          city_area: 'Kallimandhayam, Dindigul',
          language: 'ta',
          role: 'admin',
          is_profile_completed: true,
          created_at: new Date(Date.now() - 86400000 * 5).toISOString()
        }
      ];
    }

    setOrders(dbOrders);
    setCustomers(dbProfiles);
    setLoading(false);
  };

  const getCustomerOrders = (userId?: string, phone?: string) => {
    if (!userId && !phone) return [];
    const cleanPh = (phone || '').replace(/[^0-9]/g, '');
    return orders.filter((o) => {
      if (userId && (o.user_id === userId || o.userId === userId)) return true;
      if (cleanPh && (o.customer_phone || o.customerPhone || o.phone || '').replace(/[^0-9]/g, '').includes(cleanPh)) return true;
      return false;
    });
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
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-warm-border shadow-card">
        <div>
          <h1 className="text-2xl font-black text-charcoal-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-600" />
            <span>Registered Customer Accounts</span>
          </h1>
          <p className="text-xs text-charcoal-500 font-semibold mt-0.5">
            Registered website user accounts, language preferences, locations, and total order histories
          </p>
        </div>

        <span className="bg-brand-50 text-brand-700 text-xs font-black px-4 py-2 rounded-2xl border border-brand-200 self-start sm:self-auto">
          {filteredCustomers.length} Registered Accounts
        </span>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-brand-600 absolute left-3.5 top-3.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by customer name, email, phone, or location..."
          className="w-full pl-10 pr-4 py-2.5 text-xs font-bold border border-warm-border rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
        />
      </div>

      {/* Customer Accounts Grid List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-3xl p-6 border border-warm-border animate-pulse h-48" />
          ))}
        </div>
      ) : filteredCustomers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((cust) => {
            const custOrders = getCustomerOrders(cust.id, cust.phone);
            const totalSpent = custOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
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
                        <div className="w-12 h-12 rounded-2xl border-2 border-brand-300 shadow-sm overflow-hidden shrink-0 bg-brand-50">
                          <img
                            src={cust.avatar_url || (cust as any).photoURL}
                            alt={cust.full_name || 'Customer'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-600 to-amber-600 text-white font-black text-lg flex items-center justify-center shadow-sm shrink-0 border border-brand-300">
                          {initial}
                        </div>
                      )}

                      <div className="space-y-0.5 min-w-0">
                        <h3 className="text-sm font-black text-charcoal-900 truncate group-hover:text-brand-600 transition-colors">
                          {cust.full_name || 'Customer'}
                        </h3>
                        <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wider block">
                          {cust.role === 'admin' ? 'Master Admin' : 'Website Customer'}
                        </span>
                      </div>
                    </div>

                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border shrink-0 ${
                      cust.language === 'ta' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-blue-50 text-blue-800 border-blue-200'
                    }`}>
                      {cust.language === 'ta' ? 'தமிழ்' : 'English'}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    {cust.phone && (
                      <div className="flex items-center gap-2 text-charcoal-800 font-bold">
                        <Phone className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                        <span>{cust.phone}</span>
                      </div>
                    )}

                    {cust.email && (
                      <div className="flex items-center gap-2 text-charcoal-600 font-medium truncate">
                        <Mail className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                        <span className="truncate">{cust.email}</span>
                      </div>
                    )}

                    {cust.city_area && (
                      <div className="flex items-center gap-2 text-charcoal-600 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="line-clamp-1">{cust.city_area}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Account Stats & View Details Action */}
                <div className="space-y-3 pt-3 border-t border-warm-muted">
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-warm-bg p-2 rounded-xl border border-warm-border">
                      <span className="text-[10px] font-bold text-charcoal-500 uppercase block">Orders</span>
                      <span className="text-xs font-black text-brand-700">{custOrders.length} Placed</span>
                    </div>

                    <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                      <span className="text-[10px] font-bold text-emerald-700 uppercase block">Total Spent</span>
                      <span className="text-xs font-black text-emerald-800 font-mono">₹{totalSpent.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedCustomer(cust)}
                    className="w-full inline-flex items-center justify-center gap-2 bg-warm-bg hover:bg-brand-50 text-brand-700 border border-brand-200 py-2.5 px-4 rounded-xl text-xs font-black transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Customer Account Details</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-warm-border shadow-card space-y-3">
          <Users className="w-12 h-12 text-brand-600 mx-auto opacity-60" />
          <h3 className="text-base font-black text-charcoal-900">No Customer Accounts Registered Yet</h3>
          <p className="text-xs text-charcoal-500 font-medium">User accounts created on website will appear here automatically.</p>
        </div>
      )}

      {/* INSPECT CUSTOMER ACCOUNT DETAILS MODAL */}
      {selectedCustomer && (
        <Modal
          isOpen={Boolean(selectedCustomer)}
          onClose={() => setSelectedCustomer(null)}
          title={`Customer Account Details: ${selectedCustomer.full_name}`}
        >
          {(() => {
            const custOrders = getCustomerOrders(selectedCustomer.id, selectedCustomer.phone);
            const totalSpent = custOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
            const initial = (selectedCustomer.full_name || 'C').charAt(0).toUpperCase();

            return (
              <div className="space-y-4 text-xs">
                <div className="flex items-center gap-3 bg-warm-bg p-4 rounded-2xl border border-warm-border">
                  {selectedCustomer.avatar_url || (selectedCustomer as any).photoURL ? (
                    <img
                      src={selectedCustomer.avatar_url || (selectedCustomer as any).photoURL}
                      alt={selectedCustomer.full_name}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-brand-300 shadow-sm shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-600 to-amber-600 text-white font-black text-xl flex items-center justify-center shrink-0 border border-brand-300 shadow-sm">
                      {initial}
                    </div>
                  )}

                  <div className="space-y-0.5">
                    <h3 className="text-base font-black text-charcoal-900">{selectedCustomer.full_name}</h3>
                    <p className="text-xs text-brand-600 font-bold">{selectedCustomer.phone || 'No Phone'}</p>
                    <p className="text-[11px] text-charcoal-500 font-medium">{selectedCustomer.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-3.5 rounded-2xl border border-warm-border text-center">
                    <span className="text-[10px] font-bold text-charcoal-500 block uppercase">Total Orders</span>
                    <span className="text-base font-black text-brand-600">{custOrders.length} Orders Placed</span>
                  </div>

                  <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200 text-center">
                    <span className="text-[10px] font-bold text-emerald-700 block uppercase">Total Revenue</span>
                    <span className="text-base font-black text-emerald-800 font-mono">₹{totalSpent.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="space-y-2 bg-white p-4 rounded-2xl border border-warm-border">
                  <div className="flex justify-between py-1 border-b border-warm-muted">
                    <span className="font-bold text-charcoal-500">Role:</span>
                    <span className="font-extrabold text-brand-700">{selectedCustomer.role === 'admin' ? 'Master Admin' : 'Customer Account'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-warm-muted">
                    <span className="font-bold text-charcoal-500">City / Area:</span>
                    <span className="font-extrabold text-charcoal-900">{selectedCustomer.city_area || 'Kallimandhayam'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-warm-muted">
                    <span className="font-bold text-charcoal-500">Full Address:</span>
                    <span className="font-extrabold text-charcoal-900">{selectedCustomer.address || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="font-bold text-charcoal-500">Language Preference:</span>
                    <span className="font-extrabold text-amber-800">{selectedCustomer.language === 'ta' ? 'Tamil (தமிழ்)' : 'English'}</span>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button onClick={() => setSelectedCustomer(null)} variant="secondary">
                    Close
                  </Button>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

    </div>
  );
};
