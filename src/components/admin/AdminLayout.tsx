import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation, Navigate, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MessageSquare, 
  ShoppingBag, 
  Package, 
  FolderTree, 
  Upload, 
  CreditCard, 
  Users,
  BookUser,
  Settings, 
  Menu, 
  X, 
  ChevronRight,
  ShieldAlert,
  Sparkles,
  Calculator,
  LogOut,
  Globe
} from 'lucide-react';
import { Logo } from '../common/Logo';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export const AdminLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingEnquiriesCount, setPendingEnquiriesCount] = useState<number>(0);
  const [activeOrdersCount, setActiveOrdersCount] = useState<number>(0);

  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchCounts();

    // ── SUPABASE REALTIME LIVE SYNC ──────────────────────────────────
    // Badge counts update instantly when orders/enquiries change on any device
    const channel = supabase
      .channel('admin-layout-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchCounts();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'enquiries' }, () => {
        fetchCounts();
      })
      .subscribe();

    const pollInterval = setInterval(fetchCounts, 15000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [location.pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const fetchCounts = async () => {
    try {
      const deletedIds: string[] = JSON.parse(localStorage.getItem('ml_deleted_ids') || '[]');
      const deletedSet = new Set(deletedIds);

      // 1. Pending Enquiries Count (Strictly status === 'pending' || 'new')
      const { data: enqData } = await supabase.from('enquiries').select('id, enquiry_number, status');
      const localEnq: any[] = JSON.parse(localStorage.getItem('ml_enquiries') || '[]');
      const rawEnquiries = (enqData && enqData.length > 0) ? enqData : localEnq;

      const pendingEnquiries = rawEnquiries.filter((e: any) => {
        const idStr = String(e.id || '');
        const numStr = String(e.enquiry_number || e.number || '');
        const st = (e.status || 'pending').toLowerCase();
        if (deletedSet.has(idStr) || deletedSet.has(numStr) || st === 'deleted') return false;
        return st === 'pending' || st === 'new';
      });

      setPendingEnquiriesCount(pendingEnquiries.length);

      // 2. Active Orders Count (matching AdminOrdersPage exact logic)
      const { data: dbOrders } = await supabase.from('orders').select('*');
      const localOrders: any[] = JSON.parse(localStorage.getItem('ml_orders') || '[]');
      let combined = [...(dbOrders || []), ...localOrders];

      const { data: dbEnqs } = await supabase.from('enquiries').select('*');
      const allEnqs = [...(dbEnqs || []), ...localEnq];

      for (const enq of allEnqs) {
        const enqIdStr = String(enq.id || '');
        const enqNumStr = String(enq.enquiry_number || '');
        if (deletedSet.has(enqIdStr) || deletedSet.has(enqNumStr) || enq.status === 'deleted') continue;

        const normSt = String(enq.status || '').toLowerCase();
        if (normSt === 'accepted' || normSt === 'converted') {
          const enqId = enq.id;
          const matchExisting = combined.find(
            (o) => o.enquiry_id === enqId || o.id === enqId || o.order_number === enqId || (enq.converted_order_id && (o.id === enq.converted_order_id || o.order_number === enq.converted_order_id))
          );
          if (!matchExisting) {
            combined.push({ id: enq.converted_order_id || enq.enquiry_number || enq.id, order_number: enq.enquiry_number || enq.id, status: 'accepted' });
          }
        }
      }

      // Filter deleted & POS
      combined = combined.filter((o: any) => {
        const idStr = String(o.id || '');
        const numStr = String(o.order_number || '');
        const enqStr = String(o.enquiry_id || '');
        if (deletedSet.has(idStr) || deletedSet.has(numStr) || deletedSet.has(enqStr)) return false;
        if (idStr.includes('ord-101') || idStr.includes('ord-102') || idStr.includes('1785163424023') || idStr.includes('POS')) return false;
        if (o.is_pos === true || (o.admin_notes && o.admin_notes.includes('POS'))) return false;
        return true;
      });

      const seen = new Set();
      combined = combined.filter((o: any) => {
        const key = o.id || o.order_number;
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setActiveOrdersCount(combined.length);
    } catch (e) {
      console.warn('Sidebar count fetch fallback', e);
    }
  };

  // Protect Admin Portal: redirect non-admin users to login
  if (!isAdmin) {
    return <Navigate to="/login" replace />;
  }

  const adminNavItems = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { to: '/admin/pos', label: 'POS Counter', icon: Calculator, badge: 'POS' },
    { to: '/admin/enquiries', label: 'Enquiries', icon: MessageSquare, badge: pendingEnquiriesCount > 0 ? String(pendingEnquiriesCount) : null },
    { to: '/admin/orders', label: 'Orders', icon: ShoppingBag, badge: activeOrdersCount > 0 ? String(activeOrdersCount) : null },
    { to: '/admin/customers', label: 'Customers', icon: Users, badge: null },
    { to: '/admin/contacts', label: 'Contacts Directory', icon: BookUser, badge: null },
    { to: '/admin/products', label: 'Products', icon: Package, badge: null },
    { to: '/admin/categories', label: 'Categories', icon: FolderTree, badge: null },
    { to: '/admin/import', label: 'CSV Import', icon: Upload, badge: null },
    { to: '/admin/payments', label: 'Payments History', icon: CreditCard, badge: null },
    { to: '/admin/settings', label: 'Shop Settings', icon: Settings, badge: null },
  ];

  const handleAdminLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const adminEmail = user?.email || 'manikandanlatheklm@gmail.com';
  const adminName = user?.full_name || 'MANIKANDAN LATHE Admin';

  const renderSidebarContent = (onItemClick?: () => void) => (
    <div className="flex flex-col h-full bg-slate-900 text-white p-5 justify-between select-none">
      <div className="space-y-6 flex-1 overflow-y-auto pr-1">
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <Logo size="md" variant="dark" />
          {onItemClick && (
            <button
              onClick={onItemClick}
              className="lg:hidden p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Section Title & Navigation List */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-black text-brand-500 uppercase tracking-widest block mb-3 px-3">
            MANIKANDAN LATHE OPERATIONS
          </span>

          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onItemClick}
                className={`flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-extrabold transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge ? (
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm ${
                    item.to === '/admin/orders'
                      ? 'bg-brand-500 text-white animate-pulse-subtle'
                      : 'bg-amber-400 text-slate-950'
                  }`}>
                    {item.badge}
                  </span>
                ) : (
                  <ChevronRight className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-600'}`} />
                )}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="pt-4 border-t border-slate-800 space-y-2.5 shrink-0 mt-4">
        <div className="bg-slate-800/90 p-3.5 rounded-2xl border border-slate-700/80 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-brand-400">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Master Admin Active</span>
          </div>
          <p className="text-[11px] text-slate-300 font-mono font-bold truncate">
            {adminEmail}
          </p>
        </div>

        <Link
          to="/home"
          onClick={onItemClick}
          className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-extrabold py-3 px-4 rounded-2xl text-xs border border-slate-700 transition-colors shadow-sm"
        >
          <Globe className="w-4 h-4 text-brand-400" />
          <span>Back to Website</span>
        </Link>

        <button
          onClick={() => {
            if (onItemClick) onItemClick();
            handleAdminLogout();
          }}
          className="w-full flex items-center justify-center gap-2 bg-red-950/50 hover:bg-red-900/80 text-red-300 font-extrabold py-3 px-4 rounded-2xl text-xs border border-red-800/80 transition-colors shadow-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>Admin Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-warm-bg flex">
      {/* 1. DESKTOP PERMANENT FIXED LEFT SIDEBAR (Width: 280px) */}
      <aside className="hidden lg:block fixed left-0 top-0 bottom-0 w-[280px] h-[100dvh] bg-slate-900 z-40 shadow-2xl border-r border-slate-800">
        {renderSidebarContent()}
      </aside>

      {/* 2. MOBILE DRAWER SIDEBAR (Slide-in Left Drawer) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop Blur */}
          <div
            className="fixed inset-0 bg-black/65 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Mobile Drawer Panel */}
          <div className="relative w-[80vw] max-w-[340px] h-[100dvh] bg-slate-900 z-50 shadow-2xl animate-fade-in">
            {renderSidebarContent(() => setMobileMenuOpen(false))}
          </div>
        </div>
      )}

      {/* 3. MAIN CONTENT CONTAINER (Margin Left 280px on Desktop) */}
      <div className="flex-1 lg:ml-[280px] min-h-screen flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-charcoal-900 text-white border-b-2 border-brand-600 shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden p-2 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors focus:outline-none"
                  aria-label="Toggle Admin Menu"
                >
                  {mobileMenuOpen ? <X className="w-6 h-6 text-brand-500" /> : <Menu className="w-6 h-6" />}
                </button>

                <div className="lg:hidden">
                  <Logo size="md" variant="dark" />
                </div>
                
                <span className="hidden sm:inline-flex items-center gap-1.5 bg-brand-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Shop Admin SaaS</span>
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-black text-white">{adminName}</span>
                  <span className="text-[10px] font-bold text-brand-400 font-mono">{adminEmail}</span>
                </div>
                {user?.avatar_url || (user as any)?.photoURL ? (
                  <img
                    src={user?.avatar_url || (user as any)?.photoURL}
                    alt={adminName}
                    className="w-9 h-9 rounded-full object-cover border-2 border-brand-400 shadow-md"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-brand-600 border-2 border-brand-400 flex items-center justify-center text-white font-extrabold text-xs shadow-md">
                    {adminName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

            </div>
          </div>
        </header>

        {/* Dynamic Viewport for Admin Pages */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
