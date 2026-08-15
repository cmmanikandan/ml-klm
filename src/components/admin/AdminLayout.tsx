import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation, Navigate, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MessageSquare, 
  ShoppingBag, 
  Package, 
  FolderTree, 
  Upload, 
  CreditCard, 
  Settings, 
  Menu, 
  X, 
  ChevronRight,
  ShieldAlert,
  Sparkles,
  LogOut,
  UserCheck,
  Globe
} from 'lucide-react';
import { Logo } from '../common/Logo';
import { useAuth } from '../../context/AuthContext';

export const AdminLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Protect Admin Portal: redirect non-admin users to /admin/login
  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  const adminNavItems = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { to: '/admin/enquiries', label: 'Enquiries', icon: MessageSquare, badge: 'New' },
    { to: '/admin/orders', label: 'Orders', icon: ShoppingBag, badge: '2 Active' },
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

            {/* Right: Admin Profile Avatar & Shop Owner Badge */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-black text-white">{user?.full_name || 'Shop Owner'}</span>
                <span className="text-[10px] font-bold text-brand-400">Master Admin</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-brand-600 border-2 border-brand-400 flex items-center justify-center text-white font-extrabold text-xs shadow-md">
                {(user?.full_name || 'A').charAt(0).toUpperCase()}
              </div>
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
                  const isActive = location.pathname.startsWith(item.to);

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm font-bold transition-all ${
                        isActive
                          ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>

                      {item.badge && (
                        <span className="bg-amber-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>

            {/* Mobile Drawer Footer (Back to Website & Logout in Sidenav) */}
            <div className="pt-4 border-t border-gray-800 space-y-2">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-brand-400 py-3 rounded-2xl font-bold text-xs border border-gray-700 transition-colors shadow-sm"
              >
                <Globe className="w-4 h-4 text-brand-500" />
                <span>Back to Website</span>
              </Link>

              <button
                onClick={handleAdminLogout}
                className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-3 rounded-2xl font-bold text-xs border border-red-500/20 transition-all shadow-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Admin Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Admin SaaS Body */}
      <div className="flex-1 flex max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 gap-6">
        
        {/* Desktop SaaS Sticky Sidebar Navigation */}
        <aside className="hidden lg:flex w-64 sticky top-20 h-[calc(100vh-6rem)] bg-white rounded-3xl border border-warm-border p-4 shadow-card shrink-0 flex-col justify-between overflow-y-auto">
          <div className="space-y-1">
            <div className="px-3 py-2 text-[10px] font-extrabold text-charcoal-400 uppercase tracking-widest flex items-center justify-between pb-2">
              <span>SaaS Management</span>
              <UserCheck className="w-3.5 h-3.5 text-brand-600" />
            </div>

            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.to);

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25 ring-2 ring-brand-400/40'
                      : 'text-charcoal-700 hover:bg-warm-hover hover:text-brand-600'
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

          {/* Desktop Sidebar Footer: Back to Website before Admin Logout */}
          <div className="pt-4 border-t border-warm-border space-y-2">
            <div className="bg-warm-bg p-3 rounded-2xl border border-warm-border space-y-1 mb-2">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-brand-600">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Shop Admin Active</span>
              </div>
              <p className="text-[11px] text-charcoal-500 font-medium leading-snug">
                Live Workshop Database Sync Active
              </p>
            </div>

            <Link
              to="/"
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
