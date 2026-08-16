import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';
import { RecentlyViewedProvider } from './context/RecentlyViewedContext';

import { Navbar } from './components/layout/Navbar';
import { MobileNav } from './components/layout/MobileNav';
import { Footer } from './components/layout/Footer';
import { FloatingWhatsApp } from './components/common/FloatingWhatsApp';
import { PublicHeader } from './components/layout/PublicHeader';
import { SplashScreen } from './components/common/SplashScreen';

// Customer Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { HomePage } from './pages/HomePage';
import { ProductsPage } from './pages/ProductsPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { SearchPage } from './pages/SearchPage';
import { WishlistPage } from './pages/WishlistPage';
import { OrdersPage } from './pages/OrdersPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { ProfilePage } from './pages/ProfilePage';
import { ProfileDetailsPage } from './pages/ProfileDetailsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { HelpPage } from './pages/HelpPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { InvoicePage } from './pages/InvoicePage';

// Admin Components & Pages
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminEnquiriesPage } from './pages/admin/AdminEnquiriesPage';
import { AdminEnquiryDetailPage } from './pages/admin/AdminEnquiryDetailPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminOrderDetailPage } from './pages/admin/AdminOrderDetailPage';
import { AdminCustomersPage } from './pages/admin/AdminCustomersPage';
import { AdminContactsPage } from './pages/admin/AdminContactsPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminProductEditPage } from './pages/admin/AdminProductEditPage';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage';
import { AdminImportPage } from './pages/admin/AdminImportPage';
import { AdminPaymentsPage } from './pages/admin/AdminPaymentsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminPOSPage } from './pages/admin/AdminPOSPage';

// Layout wrapper to handle Navbar/MobileNav/PublicHeader visibility
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { user, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading || showSplash) {
    return <SplashScreen />;
  }

  const isAdmin = location.pathname.startsWith('/admin');
  const isInvoicePage = location.pathname.startsWith('/invoice/');
  const isAuthPage = location.pathname === '/login' || location.pathname === '/onboarding';
  
  // Public static pages (Landing, About, Contact)
  const isPublicPage =
    location.pathname === '/' ||
    location.pathname === '/about' ||
    location.pathname === '/contact';

  // Guest browsing products without logging in
  const isGuestProductBrowse = !user && location.pathname.startsWith('/products');

  // Product detail page handles its own bottom sticky enquiry bar
  const isProductDetailPage = location.pathname.startsWith('/products/') && location.pathname !== '/products';

  if (isInvoicePage) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Public Header with Home, Products, About, Contact links for visitors */}
      {!isAdmin && (isPublicPage || isGuestProductBrowse) && <PublicHeader />}
      
      {/* Customer App Navbar for customer portal pages */}
      {!isAdmin && !isAuthPage && !isPublicPage && !isGuestProductBrowse && <Navbar />}

      <main className="flex-1">{children}</main>



      {/* MobileNav bottom bar for customer portal pages */}
      {!isAdmin && !isAuthPage && !isPublicPage && !isGuestProductBrowse && !isProductDetailPage && <MobileNav />}

      {/* Footer ONLY on public static pages (/, /about, /contact) */}
      {!isAdmin && isPublicPage && <Footer />}
    </div>
  );
};

// Route Guard for Profile Onboarding
const OnboardingGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { needsOnboarding } = useAuth();
  if (needsOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
};

// Landing Route Guard: Auto-redirect returning logged-in users to /home or /admin/dashboard
const LandingGuard: React.FC = () => {
  const { user, isAdmin } = useAuth();

  if (user) {
    if (isAdmin) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/home" replace />;
  }

  return <LandingPage />;
};

// Auto-Scroll to Top on Route / Product Click Navigation
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
};

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <WishlistProvider>
          <RecentlyViewedProvider>
            <BrowserRouter>
              <ScrollToTop />
              <AppLayout>
                <Routes>
                  {/* Public & Customer Routes */}
                  <Route path="/" element={<LandingGuard />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/onboarding" element={<OnboardingPage />} />

                  <Route
                    path="/home"
                    element={
                      <OnboardingGuard>
                        <HomePage />
                      </OnboardingGuard>
                    }
                  />

                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/products/:id" element={<ProductDetailPage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/wishlist" element={<WishlistPage />} />
                  <Route path="/orders" element={<OrdersPage />} />
                  <Route path="/orders/:id" element={<OrderDetailPage />} />
                  <Route path="/invoice/:id" element={<InvoicePage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/profile/details" element={<ProfileDetailsPage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/help" element={<HelpPage />} />

                  {/* Separate Admin Routes */}
                  <Route path="/admin/login" element={<AdminLoginPage />} />
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<Navigate to="/admin/dashboard" replace />} />
                    <Route path="dashboard" element={<AdminDashboardPage />} />
                    <Route path="enquiries" element={<AdminEnquiriesPage />} />
                    <Route path="enquiries/:id" element={<AdminEnquiryDetailPage />} />
                    <Route path="orders" element={<AdminOrdersPage />} />
                    <Route path="orders/:id" element={<AdminOrderDetailPage />} />
                    <Route path="customers" element={<AdminCustomersPage />} />
                    <Route path="contacts" element={<AdminContactsPage />} />
                    <Route path="products" element={<AdminProductsPage />} />
                    <Route path="products/new" element={<AdminProductEditPage />} />
                    <Route path="products/edit/:id" element={<AdminProductEditPage />} />
                    <Route path="categories" element={<AdminCategoriesPage />} />
                    <Route path="import" element={<AdminImportPage />} />
                    <Route path="payments" element={<AdminPaymentsPage />} />
                    <Route path="settings" element={<AdminSettingsPage />} />
                    <Route path="pos" element={<AdminPOSPage />} />
                  </Route>

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AppLayout>
            </BrowserRouter>
          </RecentlyViewedProvider>
        </WishlistProvider>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;
