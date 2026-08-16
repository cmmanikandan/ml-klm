-- ====================================================================
-- MANIKANDAN LATHE — WELDING WORKS (DATABASE SCHEMA & RLS POLICIES)
-- ====================================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop ALL legacy RLS policies across all tables before column type alterations
DROP POLICY IF EXISTS "Profiles are viewable by owner or admin" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Categories viewable by everyone" ON public.categories;
DROP POLICY IF EXISTS "Categories manageable by admin" ON public.categories;
DROP POLICY IF EXISTS "Active products viewable by everyone" ON public.products;
DROP POLICY IF EXISTS "Products manageable by admin" ON public.products;
DROP POLICY IF EXISTS "Images viewable by everyone" ON public.product_images;
DROP POLICY IF EXISTS "Images manageable by admin" ON public.product_images;
DROP POLICY IF EXISTS "Wishlists viewable by owner or admin" ON public.wishlists;
DROP POLICY IF EXISTS "Wishlists insertable by owner" ON public.wishlists;
DROP POLICY IF EXISTS "Wishlists deletable by owner" ON public.wishlists;
DROP POLICY IF EXISTS "Views manageable by owner or admin" ON public.product_views;
DROP POLICY IF EXISTS "Enquiries viewable by owner or admin" ON public.enquiries;
DROP POLICY IF EXISTS "Enquiries insertable by owner" ON public.enquiries;
DROP POLICY IF EXISTS "Enquiries manageable by admin" ON public.enquiries;
DROP POLICY IF EXISTS "Orders viewable by owner or admin" ON public.orders;
DROP POLICY IF EXISTS "Orders manageable by admin" ON public.orders;
DROP POLICY IF EXISTS "Payments viewable by owner or admin" ON public.payments;
DROP POLICY IF EXISTS "Payments insertable by owner or admin" ON public.payments;
DROP POLICY IF EXISTS "Payments manageable by admin" ON public.payments;
DROP POLICY IF EXISTS "Notifications viewable by owner" ON public.notifications;
DROP POLICY IF EXISTS "Notifications updateable by owner" ON public.notifications;
DROP POLICY IF EXISTS "Feedback viewable by everyone" ON public.feedback;
DROP POLICY IF EXISTS "Feedback insertable by order owner" ON public.feedback;
DROP POLICY IF EXISTS "Settings viewable by logged in users" ON public.admin_settings;
DROP POLICY IF EXISTS "Settings manageable by admin" ON public.admin_settings;

-- Drop legacy foreign key constraints
ALTER TABLE IF EXISTS public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE IF EXISTS public.wishlists DROP CONSTRAINT IF EXISTS wishlists_user_id_fkey;
ALTER TABLE IF EXISTS public.product_views DROP CONSTRAINT IF EXISTS product_views_user_id_fkey;
ALTER TABLE IF EXISTS public.enquiries DROP CONSTRAINT IF EXISTS enquiries_user_id_fkey;
ALTER TABLE IF EXISTS public.orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
ALTER TABLE IF EXISTS public.payments DROP CONSTRAINT IF EXISTS payments_user_id_fkey;
ALTER TABLE IF EXISTS public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE IF EXISTS public.feedback DROP CONSTRAINT IF EXISTS feedback_user_id_fkey;

-- 1. PROFILES TABLE (TEXT id to support Firebase Auth Alphanumeric UIDs)
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    address TEXT,
    city_area TEXT,
    language TEXT NOT NULL DEFAULT 'ta' CHECK (language IN ('en', 'ta')),
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    avatar_url TEXT,
    is_profile_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure profiles table compatibility
ALTER TABLE public.profiles ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_profile_completed BOOLEAN DEFAULT FALSE;

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_en TEXT NOT NULL,
    name_ta TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name_en TEXT NOT NULL,
    name_ta TEXT NOT NULL,
    description_en TEXT,
    description_ta TEXT,
    materials TEXT,
    available_sizes TEXT,
    specifications JSONB DEFAULT '{}'::jsonb,
    pricing_type TEXT DEFAULT 'fixed' CHECK (pricing_type IN ('weight', 'sqft', 'fixed')),
    price_per_kg NUMERIC(10, 2) DEFAULT 160.00,
    price_per_sqft NUMERIC(10, 2) DEFAULT 150.00,
    admin_price NUMERIC(10, 2) DEFAULT 0.00,
    is_best_selling BOOLEAN DEFAULT FALSE,
    is_new BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT TRUE,
    is_popular BOOLEAN DEFAULT FALSE,
    is_custom_fabrication BOOLEAN DEFAULT TRUE,
    is_in_stock BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    internal_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure products table migration compatibility for existing databases
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS pricing_type TEXT DEFAULT 'fixed';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price_per_kg NUMERIC(10, 2) DEFAULT 160.00;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price_per_sqft NUMERIC(10, 2) DEFAULT 150.00;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT TRUE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT FALSE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_custom_fabrication BOOLEAN DEFAULT TRUE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_in_stock BOOLEAN DEFAULT TRUE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS admin_price NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS internal_notes TEXT;

-- 4. PRODUCT IMAGES TABLE
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. WISHLISTS TABLE
CREATE TABLE IF NOT EXISTS public.wishlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);
ALTER TABLE public.wishlists ALTER COLUMN user_id TYPE TEXT;

-- 6. PRODUCT VIEWS TABLE (Recently Viewed)
CREATE TABLE IF NOT EXISTS public.product_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);
ALTER TABLE public.product_views ALTER COLUMN user_id TYPE TEXT;

-- 7. ENQUIRIES TABLE
CREATE TABLE IF NOT EXISTS public.enquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enquiry_number TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    quantity INT DEFAULT 1,
    size_requirement TEXT,
    custom_notes TEXT,
    delivery_location TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.enquiries ALTER COLUMN user_id TYPE TEXT;

-- 8. ORDERS TABLE (POS Billing & Custom Fabrication Orders)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL,
    enquiry_id UUID REFERENCES public.enquiries(id) ON DELETE SET NULL,
    user_id TEXT NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    quantity INT DEFAULT 1,
    specifications TEXT,
    delivery_location TEXT DEFAULT 'Direct Workshop Counter Pickup (Kallimandhayam)',
    status TEXT NOT NULL DEFAULT 'accepted',
    fabrication_stage TEXT DEFAULT 'accepted',
    expected_delivery_date DATE,
    total_amount NUMERIC(10, 2) DEFAULT 0.00,
    advance_amount NUMERIC(10, 2) DEFAULT 0.00,
    remaining_amount NUMERIC(10, 2) DEFAULT 0.00,
    is_payment_requested BOOLEAN DEFAULT FALSE,
    payment_request_amount NUMERIC(10, 2) DEFAULT 0.00,
    payment_status TEXT DEFAULT 'pending',
    pricing_type TEXT DEFAULT 'fixed',
    weight_calculation JSONB,
    sqft_calculation JSONB,
    is_pos BOOLEAN DEFAULT FALSE,
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure orders table migration compatibility
ALTER TABLE public.orders ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS is_pos BOOLEAN DEFAULT FALSE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pricing_type TEXT DEFAULT 'fixed';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS weight_calculation JSONB;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS sqft_calculation JSONB;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS fabrication_stage TEXT DEFAULT 'accepted';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS is_payment_requested BOOLEAN DEFAULT FALSE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_request_amount NUMERIC(10, 2) DEFAULT 0.00;

-- 9. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    order_number TEXT,
    user_id TEXT,
    amount NUMERIC(10, 2) NOT NULL,
    payment_type TEXT DEFAULT 'cash',
    payment_mode TEXT,
    transaction_id TEXT,
    status TEXT NOT NULL DEFAULT 'completed',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.payments ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS order_number TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_mode TEXT;

-- 10. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    title_en TEXT NOT NULL,
    title_ta TEXT NOT NULL,
    message_en TEXT NOT NULL,
    message_ta TEXT NOT NULL,
    type TEXT DEFAULT 'order_update',
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.notifications ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- 11. FEEDBACK TABLE
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. ADMIN SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.admin_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- AUTOMATIC SEQUENCES & TRIGGERS
-- ====================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_modtime ON public.profiles;
CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS update_categories_modtime ON public.categories;
CREATE TRIGGER update_categories_modtime BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS update_products_modtime ON public.products;
CREATE TRIGGER update_products_modtime BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS update_enquiries_modtime ON public.enquiries;
CREATE TRIGGER update_enquiries_modtime BEFORE UPDATE ON public.enquiries FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS update_orders_modtime ON public.orders;
CREATE TRIGGER update_orders_modtime BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ====================================================================
-- ROW LEVEL SECURITY (ALLOW PUBLIC READ/WRITE FOR LATHE APP)
-- ====================================================================

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_views DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings DISABLE ROW LEVEL SECURITY;

-- ====================================================================
-- INITIAL SEED DATA
-- ====================================================================

-- Seed Categories
INSERT INTO public.categories (id, name_en, name_ta, slug, image_url, sort_order) VALUES
('22222222-2222-2222-2222-222222222222', 'Gates', 'கேட்டுகள்', 'gates', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80', 1),
('33333333-3333-3333-3333-333333333333', 'Grills', 'பாதுகாப்பு கிரில்கள்', 'safety-grills', 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&auto=format&fit=crop&q=80', 2),
('77777777-7777-7777-7777-777777777777', 'Kallapai', 'ஏர் கலப்பை', 'kallapai', 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&auto=format&fit=crop&q=80', 3),
('88888888-8888-8888-8888-888888888888', 'Roofing', 'கூரை ஸ்ட்ரக்சர்', 'roofing', 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=600&auto=format&fit=crop&q=80', 4),
('66666666-6666-6666-6666-666666666666', 'ARC Welding Works', 'ARC வெல்டிங் வேலைகள்', 'custom-welding', 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&auto=format&fit=crop&q=80', 5),
('11111111-1111-1111-1111-111111111111', 'Lathe Works', 'லேத் வேலைகள்', 'lathe-works', 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&auto=format&fit=crop&q=80', 6)
ON CONFLICT (slug) DO NOTHING;

-- Seed Admin Settings
INSERT INTO public.admin_settings (key, value) VALUES
('shop_info', '{
    "name": "MANIKANDAN LATHE",
    "sub_name": "Welding Works",
    "phone": "+91 96592 86268",
    "whatsapp": "919659286268",
    "email": "manikandanlatheklm@gmail.com",
    "address": "K. Keeranur Road, Kallimandhayam - 624616, Dindigul District, Tamil Nadu",
    "google_maps_url": "https://maps.app.goo.gl/s2HsgvoXYCNC9YzPA",
    "upi_id": "9659286268@upi",
    "upi_qr_url": "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=9659286268@upi&pn=MANIKANDAN%20LATHE",
    "gstin": "33ABCDE1234F1Z5",
    "owner_signature": "C. MANIKANDAN (Proprietor)",
    "founder_name": "K. Chellamuthu",
    "experience_years": "25+",
    "working_hours_en": "Mon - Sat: 8:30 AM - 8:30 PM",
    "working_hours_ta": "திங்கள் - சனி: காலை 8:30 - இரவு 8:30"
}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
