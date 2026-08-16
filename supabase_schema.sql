-- ====================================================================
-- MANIKANDAN LATHE — WELDING WORKS
-- COMPLETE DATABASE SCHEMA v2.0 — 100% CROSS-DEVICE SYNC
-- Run this entire file in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ====================================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================================================
-- DROP ALL LEGACY POLICIES FIRST (safe idempotent)
-- ====================================================================

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

-- ====================================================================
-- 1. PROFILES TABLE
-- Stores all registered customer and admin user profiles.
-- user_id is Firebase UID (text, not UUID)
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY,                          -- Firebase UID (text)
    full_name TEXT NOT NULL DEFAULT 'Customer',
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

-- Ensure compatibility for existing DB
ALTER TABLE public.profiles ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_profile_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city_area TEXT;

-- ====================================================================
-- 2. CATEGORIES TABLE
-- All product categories — synced across all devices.
-- ====================================================================

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

ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- ====================================================================
-- 3. PRODUCTS TABLE
-- All shop products — images stored in Cloudinary (URLs stored here).
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name_en TEXT NOT NULL,
    name_ta TEXT NOT NULL,
    description_en TEXT DEFAULT '',
    description_ta TEXT DEFAULT '',
    materials TEXT DEFAULT '',
    available_sizes TEXT DEFAULT '',
    specifications JSONB DEFAULT '{}'::jsonb,
    pricing_type TEXT DEFAULT 'weight' CHECK (pricing_type IN ('weight', 'sqft', 'fixed')),
    price_per_kg NUMERIC(10, 2) DEFAULT 160.00,
    price_per_sqft NUMERIC(10, 2) DEFAULT 150.00,
    admin_price NUMERIC(10, 2) DEFAULT 0.00,        -- Admin-only internal price
    primary_image TEXT DEFAULT '',                   -- Main display image URL (Cloudinary)
    images JSONB DEFAULT '[]'::jsonb,               -- All product image URLs array (Cloudinary)
    is_best_selling BOOLEAN DEFAULT FALSE,
    is_new BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT TRUE,
    is_popular BOOLEAN DEFAULT FALSE,
    is_custom_fabrication BOOLEAN DEFAULT TRUE,
    is_in_stock BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    internal_notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration: add all missing columns for existing databases
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS pricing_type TEXT DEFAULT 'weight';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price_per_kg NUMERIC(10, 2) DEFAULT 160.00;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price_per_sqft NUMERIC(10, 2) DEFAULT 150.00;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS admin_price NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS primary_image TEXT DEFAULT '';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT TRUE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT FALSE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_custom_fabrication BOOLEAN DEFAULT TRUE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_in_stock BOOLEAN DEFAULT TRUE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS internal_notes TEXT DEFAULT '';

-- ====================================================================
-- 4. PRODUCT IMAGES TABLE (per-image records linked to products)
-- Cloudinary URLs stored here. Complements the JSONB images[] on products.
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,                        -- Cloudinary secure_url
    resource_type TEXT DEFAULT 'image',             -- 'image' | 'pdf' | 'video'
    is_primary BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.product_images ADD COLUMN IF NOT EXISTS resource_type TEXT DEFAULT 'image';

-- ====================================================================
-- 5. WISHLISTS TABLE
-- Per-user wishlisted products. Synced across all devices via Supabase.
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.wishlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,                          -- Firebase UID
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

ALTER TABLE public.wishlists ALTER COLUMN user_id TYPE TEXT;

-- ====================================================================
-- 6. RECENTLY VIEWED TABLE (product_views)
-- Per-user cross-device viewed products.
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.product_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

ALTER TABLE public.product_views ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.product_views ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ DEFAULT NOW();

-- ====================================================================
-- 7. ENQUIRIES TABLE
-- Customer enquiries submitted via website.
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.enquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enquiry_number TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,                          -- Firebase UID or 'guest_xxx'
    customer_name TEXT DEFAULT '',
    customer_phone TEXT DEFAULT '',
    delivery_location TEXT DEFAULT 'Kallimandhayam',
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT DEFAULT '',                   -- Denormalized product name
    quantity INT DEFAULT 1,
    size_requirement TEXT DEFAULT '',
    custom_notes TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'converted', 'converted_to_order')),
    rejection_reason TEXT DEFAULT '',
    quote_price NUMERIC(10, 2) DEFAULT 0.00,
    converted_order_id TEXT DEFAULT '',             -- ID of converted order
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.enquiries ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.enquiries ADD COLUMN IF NOT EXISTS customer_name TEXT DEFAULT '';
ALTER TABLE public.enquiries ADD COLUMN IF NOT EXISTS customer_phone TEXT DEFAULT '';
ALTER TABLE public.enquiries ADD COLUMN IF NOT EXISTS product_name TEXT DEFAULT '';
ALTER TABLE public.enquiries ADD COLUMN IF NOT EXISTS quote_price NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE public.enquiries ADD COLUMN IF NOT EXISTS converted_order_id TEXT DEFAULT '';

-- ====================================================================
-- 8. ORDERS TABLE
-- POS Billing & Online Custom Fabrication Orders.
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL,
    enquiry_id UUID REFERENCES public.enquiries(id) ON DELETE SET NULL,
    user_id TEXT NOT NULL,

    -- Denormalized customer info
    customer_name TEXT DEFAULT '',
    customer_phone TEXT DEFAULT '',
    customer_address TEXT DEFAULT 'Kallimandhayam',

    -- Product info
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT DEFAULT '',
    product_image TEXT DEFAULT '',

    -- Order details
    quantity INT DEFAULT 1,
    specifications TEXT DEFAULT '',
    delivery_location TEXT DEFAULT 'Direct Workshop Counter Pickup (Kallimandhayam)',

    -- Status & Timeline
    status TEXT NOT NULL DEFAULT 'accepted' CHECK (status IN ('accepted','order_confirmed','processing','ready','out_for_delivery','delivered','cancelled')),
    fabrication_stage TEXT DEFAULT 'accepted',
    expected_delivery_date DATE,

    -- Pricing
    total_amount NUMERIC(10, 2) DEFAULT 0.00,
    advance_amount NUMERIC(10, 2) DEFAULT 0.00,
    remaining_amount NUMERIC(10, 2) DEFAULT 0.00,
    pricing_type TEXT DEFAULT 'fixed' CHECK (pricing_type IN ('weight', 'sqft', 'fixed')),

    -- Weight / SqFt Calculator Data (full JSONB snapshot)
    weight_calculation JSONB,
    sqft_calculation JSONB,

    -- Payment
    is_payment_requested BOOLEAN DEFAULT FALSE,
    payment_request_amount NUMERIC(10, 2) DEFAULT 0.00,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending','partially_paid','paid','failed','refunded','unpaid')),

    -- Admin
    admin_notes TEXT DEFAULT '',
    is_pos BOOLEAN DEFAULT FALSE,                   -- TRUE = POS counter sale

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration: add all missing columns for existing databases
ALTER TABLE public.orders ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name TEXT DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone TEXT DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_address TEXT DEFAULT 'Kallimandhayam';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS product_name TEXT DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS product_image TEXT DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS is_pos BOOLEAN DEFAULT FALSE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pricing_type TEXT DEFAULT 'fixed';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS weight_calculation JSONB;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS sqft_calculation JSONB;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS fabrication_stage TEXT DEFAULT 'accepted';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS is_payment_requested BOOLEAN DEFAULT FALSE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_request_amount NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS specifications TEXT DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS admin_notes TEXT DEFAULT '';

-- ====================================================================
-- 9. PAYMENTS TABLE
-- Every payment transaction recorded by admin or online.
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    order_number TEXT DEFAULT '',                   -- Denormalized for display
    user_id TEXT DEFAULT '',
    amount NUMERIC(10, 2) NOT NULL,
    payment_type TEXT DEFAULT 'cash' CHECK (payment_type IN ('cash', 'upi', 'razorpay', 'qr', 'bank_transfer', 'cheque')),
    payment_mode TEXT DEFAULT '',                   -- e.g. "Workshop Cash Counter", "UPI QR Code"
    transaction_id TEXT DEFAULT '',                 -- UPI/Razorpay transaction reference
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'failed', 'refunded')),
    notes TEXT DEFAULT '',
    recorded_by TEXT DEFAULT 'admin',               -- 'admin' | user_id
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.payments ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS order_number TEXT DEFAULT '';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_mode TEXT DEFAULT '';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS transaction_id TEXT DEFAULT '';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS recorded_by TEXT DEFAULT 'admin';

-- ====================================================================
-- 10. NOTIFICATIONS TABLE
-- In-app notifications. Stored in DB for cross-device sync.
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    title_en TEXT NOT NULL DEFAULT '',
    title_ta TEXT NOT NULL DEFAULT '',
    message_en TEXT NOT NULL DEFAULT '',
    message_ta TEXT NOT NULL DEFAULT '',
    type TEXT DEFAULT 'order_update' CHECK (type IN ('order_update','payment','welcome','feature','system','enquiry')),
    link TEXT DEFAULT '',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS link TEXT DEFAULT '';

-- ====================================================================
-- 11. FEEDBACK TABLE
-- Customer ratings and reviews for completed orders.
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    user_name TEXT DEFAULT '',                      -- Denormalized for display
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS user_name TEXT DEFAULT '';

-- ====================================================================
-- 12. CONTACTS / WALK-IN CUSTOMERS TABLE
-- Stores walk-in customer profiles (without Firebase auth).
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    address TEXT DEFAULT '',
    city_area TEXT DEFAULT '',
    email TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    total_orders INT DEFAULT 0,
    total_spent NUMERIC(10, 2) DEFAULT 0.00,
    created_by TEXT DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 13. ADMIN SETTINGS TABLE
-- Shop info, UPI ID, working hours — stored in DB.
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.admin_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 14. ORDER ID SEQUENCE TABLE
-- Ensures globally unique, sequential order numbers (MNK-ORD-1001 etc.)
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.order_id_sequence (
    id TEXT PRIMARY KEY DEFAULT 'global',
    last_order_number INT DEFAULT 1000,
    last_enquiry_number INT DEFAULT 5000,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initialize sequence if not exists
INSERT INTO public.order_id_sequence (id, last_order_number, last_enquiry_number)
VALUES ('global', 1000, 5000)
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- REALTIME — Enable for all tables that need cross-device live sync
-- Safe with exception handling if already in publication
-- ====================================================================

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.enquiries;
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.contacts;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- ====================================================================
-- TRIGGERS — Auto-update updated_at on every table
-- ====================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_modtime ON public.profiles;
CREATE TRIGGER update_profiles_modtime
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS update_categories_modtime ON public.categories;
CREATE TRIGGER update_categories_modtime
    BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS update_products_modtime ON public.products;
CREATE TRIGGER update_products_modtime
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS update_enquiries_modtime ON public.enquiries;
CREATE TRIGGER update_enquiries_modtime
    BEFORE UPDATE ON public.enquiries
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS update_orders_modtime ON public.orders;
CREATE TRIGGER update_orders_modtime
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS update_contacts_modtime ON public.contacts;
CREATE TRIGGER update_contacts_modtime
    BEFORE UPDATE ON public.contacts
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS update_admin_settings_modtime ON public.admin_settings;
CREATE TRIGGER update_admin_settings_modtime
    BEFORE UPDATE ON public.admin_settings
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ====================================================================
-- AUTO-UPDATE ORDERS.remaining_amount WHEN PAYMENT INSERTED
-- When admin records a payment, automatically update remaining_amount & payment_status
-- ====================================================================

CREATE OR REPLACE FUNCTION update_order_balance_on_payment()
RETURNS TRIGGER AS $$
DECLARE
    v_order RECORD;
    v_total_paid NUMERIC;
BEGIN
    IF NEW.status != 'completed' THEN
        RETURN NEW;
    END IF;

    SELECT * INTO v_order FROM public.orders WHERE id = NEW.order_id;
    IF NOT FOUND THEN
        RETURN NEW;
    END IF;

    SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
    FROM public.payments
    WHERE order_id = NEW.order_id AND status = 'completed';

    UPDATE public.orders SET
        remaining_amount = GREATEST(0, total_amount - v_total_paid),
        payment_status = CASE
            WHEN v_total_paid >= total_amount THEN 'paid'
            WHEN v_total_paid > 0 THEN 'partially_paid'
            ELSE 'pending'
        END,
        updated_at = NOW()
    WHERE id = NEW.order_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_order_balance ON public.payments;
CREATE TRIGGER trigger_update_order_balance
    AFTER INSERT OR UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION update_order_balance_on_payment();

-- ====================================================================
-- ROW LEVEL SECURITY — DISABLED (Public anon key access for all tables)
-- All authentication is handled by Firebase Auth & frontend guards
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
ALTER TABLE public.contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_id_sequence DISABLE ROW LEVEL SECURITY;

-- ====================================================================
-- INDEXES — For fast queries on high-traffic columns
-- ====================================================================

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_enquiries_user ON public.enquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_enquiries_status ON public.enquiries(status);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_enquiry ON public.orders(enquiry_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_wishlists_user ON public.wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_product_views_user ON public.product_views(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_order ON public.feedback(order_id);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON public.contacts(phone);

-- ====================================================================
-- INITIAL SEED DATA
-- ====================================================================

-- Seed Categories
INSERT INTO public.categories (id, name_en, name_ta, slug, image_url, sort_order) VALUES
('22222222-2222-2222-2222-222222222222', 'Gates', 'கேட்டுகள்', 'gates',
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80', 1),
('33333333-3333-3333-3333-333333333333', 'Grills', 'பாதுகாப்பு கிரில்கள்', 'safety-grills',
    'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&auto=format&fit=crop&q=80', 2),
('77777777-7777-7777-7777-777777777777', 'Kallapai', 'ஏர் கலப்பை', 'kallapai',
    'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&auto=format&fit=crop&q=80', 3),
('88888888-8888-8888-8888-888888888888', 'Roofing', 'கூரை ஸ்ட்ரக்சர்', 'roofing',
    'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=600&auto=format&fit=crop&q=80', 4),
('66666666-6666-6666-6666-666666666666', 'ARC Welding Works', 'ARC வெல்டிங் வேலைகள்', 'custom-welding',
    'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&auto=format&fit=crop&q=80', 5),
('11111111-1111-1111-1111-111111111111', 'Lathe Works', 'லேத் வேலைகள்', 'lathe-works',
    'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&auto=format&fit=crop&q=80', 6)
ON CONFLICT (slug) DO UPDATE SET
    name_en = EXCLUDED.name_en,
    name_ta = EXCLUDED.name_ta,
    image_url = EXCLUDED.image_url,
    sort_order = EXCLUDED.sort_order;

-- Seed Admin Settings (shop_info)
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
    "working_hours_ta": "திங்கள் - சனி: காலை 8:30 - இரவு 8:30",
    "default_rate_per_kg": 160,
    "default_rate_per_sqft": 150
}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- ====================================================================
-- HELPER: CLEAR ALL TEST DATA & START FROM FRESH
-- To wipe all test orders/payments and start fresh, run this query:
-- ====================================================================
-- TRUNCATE TABLE public.payments CASCADE;
-- TRUNCATE TABLE public.feedback CASCADE;
-- TRUNCATE TABLE public.orders CASCADE;
-- TRUNCATE TABLE public.enquiries CASCADE;
-- TRUNCATE TABLE public.notifications CASCADE;
-- UPDATE public.order_id_sequence SET last_order_number = 1000, last_enquiry_number = 5000, updated_at = NOW() WHERE id = 'global';

-- ====================================================================
-- VERIFY: List all tables created
-- ====================================================================

SELECT
    tablename,
    pg_size_pretty(pg_total_relation_size(quote_ident(tablename))) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
