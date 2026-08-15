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
  Settings, 
  Menu, 
  X, 
  ChevronRight,
  ShieldAlert,
  Sparkles,
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
  }, [location.pathname]);

  const fetchCounts = async () => {
    try {
      const { data: enqData } = await supabase.from('enquiries').select('*').eq('status', 'pending');
      if (enqData) setPendingEnquiriesCount(enqData.length);

      const { data: ordData } = await supabase.from('orders').select('*').eq('status', 'pending');
      if (ordData) setActiveOrdersCount(ordData.length);
    } catch (e) {
      const localEnq = JSON.parse(localStorage.getItem('ml_enquiries') || '[]');
      setPendingEnquiriesCount(localEnq.filter((e: any) => e.status === 'pending').length);
    }
  };

  // Protect Admin Portal: redirect non-admin users to /admin/login
  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  const adminNavItems = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { to: '/admin/enquiries', label: 'Enquiries', icon: MessageSquare, badge: pendingEnquiriesCount > 0 ? String(pendingEnquiriesCount) : null },
    { to: '/admin/orders', label: 'Orders', icon: ShoppingBag, badge: activeOrdersCount > 0 ? String(activeOrdersCount) : null },
    { to: '/admin/customers', label: 'Customers', icon: Users, badge: null },
    { to: '/admin/products', label: 'Products', icon: Package, badge: null },
    { to: '/admin/categories', label: 'Categories', icon: FolderTree, badge: null },
    { to: '/admin/import', label: 'CSV Import', icon: Upload, badge: null },
    { to: '/admin/payments', label: 'Payments History', icon: CreditCard, badge: null },
    { to: '/admin/settings', label: 'Shop Settings', icon: Settings, badge: null },
  ];

  const handleAdminLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const adminEmail = user?.email || 'manikandanlatheklm@gmail.com';
  const adminName = user?.full_name || 'MANIKANDAN LATHE Admin';

  return (
    <div className="min-h-screen bg-warm-bg flex flex-col">
      {/* Admin SaaS Top Header */}
      <header className="sticky top-0 z-40 bg-charcoal-900 text-white border-b-2 border-brand-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Left: Mobile Drawer Trigger + Brand Logo */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-gray-300 hover:text-white rounded-xl hover:bg-gray-800 transition-colors focus:outline-none"
                aria-label="Toggle Admin Menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6 text-brand-500" /> : <Menu className="w-6 h-6" />}
              </button>

              <Logo size="md" variant="dark" />
              
              <span className="hidden sm:inline-flex items-center gap-1.5 bg-brand-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Shop Admin SaaS</span>
              </span>
            </div>

            {/* Right: Real Admin Profile Email & Google DP Avatar */}
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

      {/* Mobile Overlay Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop Blur */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Menu Panel */}
          <div className="relative flex-1 max-w-xs w-full bg-charcoal-900 text-white p-5 flex flex-col justify-between shadow-2xl z-10 animate-fade-in">
            <div className="space-y-6">
              
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <Logo size="md" variant="dark" />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Items List */}
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-brand-500 uppercase tracking-widest block mb-2 px-3">
                  MANIKANDAN LATHE OPERATIONS
                </span>

                {adminNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.to;

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                        isActive
                          ? 'bg-brand-600 text-white shadow-md'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                      </div>

                      {item.badge ? (
                        <span className="bg-amber-500 text-black text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      ) : (
                        <ChevronRight className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>

            {/* Mobile Drawer Bottom Navigation Section */}
            <div className="pt-4 border-t border-gray-800 space-y-2">
              <div className="bg-gray-800/80 p-3 rounded-2xl border border-gray-700 space-y-1 mb-2">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-brand-400">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Master Admin Active</span>
                </div>
                <p className="text-[11px] text-gray-300 font-mono truncate">
                  {adminEmail}
                </p>
              </div>

              <Link
                to="/home"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-brand-600 text-white font-extrabold py-3 px-4 rounded-2xl text-xs border border-gray-700 transition-all shadow-sm"
              >
                <Globe className="w-4 h-4 text-brand-400" />
                <span>Back to Website</span>
              </Link>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleAdminLogout();
                }}
                className="w-full flex items-center justify-center gap-2 bg-red-900/40 hover:bg-red-900/70 text-red-300 font-extrabold py-3 px-4 rounded-2xl text-xs border border-red-800 transition-all shadow-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Admin Logout</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Main SaaS Layout Grid */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1 flex gap-8">
        
        {/* Desktop Sticky Sidebar Navigation */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0 justify-between bg-white rounded-3xl p-4 border border-warm-border shadow-card h-[calc(100vh-6rem)] sticky top-20">
          <div className="space-y-1">
            <div className="px-3 py-2 mb-2 border-b border-warm-muted">
              <span className="text-[10px] font-extrabold text-brand-600 uppercase tracking-widest block">
                ADMIN NAVIGATION
              </span>
            </div>

            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                      : 'text-charcoal-700 hover:bg-warm-bg hover:text-brand-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>

                  {item.badge ? (
                    <span className="bg-amber-500 text-black text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  ) : (
                    <ChevronRight className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-charcoal-300'}`} />
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* Desktop Sidebar Footer: Real Admin Email + Back to Website before Admin Logout */}
          <div className="pt-4 border-t border-warm-border space-y-2">
            <div className="bg-warm-bg p-3 rounded-2xl border border-warm-border space-y-1 mb-2">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-brand-600">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Master Admin Active</span>
              </div>
              <p className="text-[11px] text-charcoal-700 font-mono font-bold truncate">
                {adminEmail}
              </p>
            </div>

            <Link
              to="/home"
              className="w-full flex items-center justify-center gap-2 bg-warm-bg hover:bg-brand-50 text-brand-700 font-extrabold py-3 px-4 rounded-2xl text-xs border border-brand-200 transition-all shadow-sm group"
            >
              <Globe className="w-4 h-4 text-brand-600 group-hover:rotate-12 transition-transform" />
              <span>Back to Website</span>
            </Link>

            <button
              onClick={handleAdminLogout}
              className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-extrabold py-3 px-4 rounded-2xl text-xs border border-red-200 transition-all shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>Admin Logout</span>
            </button>
          </div>
        </aside>

        {/* Dynamic SaaS Admin Page Viewport */}
        <main className="flex-1 min-w-0 overflow-x-hidden">
          <Outlet />
        </main>

      </div>
    </div>
  );
};
