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

-- 1. PROFILES TABLE (TEXT id to support Firebase Auth Alphanumeric UIDs like 9QFtBzZ3Z8f2f8QH4bxgkn4sXVq1)
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    address TEXT,
    city_area TEXT,
    language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'ta')),
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    avatar_url TEXT,
    is_profile_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure profiles table compatibility for Firebase Auth string UIDs
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
    is_best_selling BOOLEAN DEFAULT FALSE,
    is_new BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT TRUE,
    is_popular BOOLEAN DEFAULT FALSE,
    is_custom_fabrication BOOLEAN DEFAULT TRUE,
    is_in_stock BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    admin_price NUMERIC(10, 2) DEFAULT 0.00,
    internal_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure products table migration compatibility for existing databases
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

-- 8. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL,
    enquiry_id UUID REFERENCES public.enquiries(id) ON DELETE SET NULL,
    user_id TEXT NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    quantity INT DEFAULT 1,
    specifications TEXT,
    delivery_location TEXT,
    status TEXT NOT NULL DEFAULT 'accepted',
    expected_delivery_date DATE,
    total_amount NUMERIC(10, 2) DEFAULT 0.00,
    advance_amount NUMERIC(10, 2) DEFAULT 0.00,
    remaining_amount NUMERIC(10, 2) DEFAULT 0.00,
    is_payment_requested BOOLEAN DEFAULT FALSE,
    payment_request_amount NUMERIC(10, 2) DEFAULT 0.00,
    payment_status TEXT DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.orders ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS is_payment_requested BOOLEAN DEFAULT FALSE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_request_amount NUMERIC(10, 2) DEFAULT 0.00;

-- 9. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    payment_type TEXT NOT NULL,
    transaction_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.payments ALTER COLUMN user_id TYPE TEXT;

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

-- 11. FEEDBACK TABLE
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.feedback ALTER COLUMN user_id TYPE TEXT;

-- 12. ADMIN SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.admin_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- AUTOMATIC SEQUENCES & TRIGGERS
-- ====================================================================

-- Function to set updated_at
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
-- ROW LEVEL SECURITY (ALLOW PUBLIC READ/WRITE FOR FIREBASE AUTH APP)
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
-- INITIAL SEED DATA (STRICT RFC 4122 VALID HEXADECIMAL UUIDS FOR PRODUCTS)
-- ====================================================================

-- Seed Categories
INSERT INTO public.categories (id, name_en, name_ta, slug, image_url, sort_order) VALUES
('11111111-1111-1111-1111-111111111111', 'Steel Chairs', 'ஸ்டீல் நாற்காலிகள்', 'steel-chairs', 'https://images.unsplash.com/photo-1580481072645-022f9a6d1270?w=600&auto=format&fit=crop&q=80', 1),
('22222222-2222-2222-2222-222222222222', 'Gates', 'கேட்டுகள்', 'gates', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80', 2),
('33333333-3333-3333-3333-333333333333', 'Safety Grills', 'பாதுகாப்பு கிரில்கள்', 'safety-grills', 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&auto=format&fit=crop&q=80', 3),
('44444444-4444-4444-4444-444444444444', 'Tables & Desks', 'மேஜைகள்', 'tables', 'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?w=600&auto=format&fit=crop&q=80', 4),
('55555555-5555-5555-5555-555555555555', 'Windows & Frames', 'ஜன்னல்கள்', 'windows', 'https://images.unsplash.com/photo-1509644851169-2acc08aa25b5?w=600&auto=format&fit=crop&q=80', 5),
('66666666-6666-6666-6666-666666666666', 'Custom Welding', 'கஸ்டம் வெல்டிங்', 'custom-welding', 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&auto=format&fit=crop&q=80', 6)
ON CONFLICT (slug) DO NOTHING;

-- Seed Sample Products
INSERT INTO public.products (id, category_id, name_en, name_ta, description_en, description_ta, materials, available_sizes, specifications, is_best_selling, is_new, is_featured, is_popular, is_custom_fabrication, is_in_stock, is_active, admin_price) VALUES
(
    '10000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'Heavy Duty Stainless Steel Chair',
    'ஹெவி டியூட்டி ஸ்டெயின்லெஸ் ஸ்டீல் நாற்காலி',
    'Premium grade 304 stainless steel chair engineered with arc welding for extreme durability and long service life. Ergonomic back support suitable for home, offices, and shops.',
    'உயர்தர 304 ஸ்டெயின்லெஸ் ஸ்டீல் நாற்காலி. ஆர்க் வெல்டிங் மூலம் அதிக உறுதியுடன் தயாரிக்கப்பட்டது. வீடு, அலுவலகம் மற்றும் கடைகளுக்கு மிகவும் ஏற்றது.',
    '304 Stainless Steel Pipe, Heavy Gauge Steel Sheet',
    'Standard (3.5ft x 1.8ft), High-back (4ft x 1.8ft)',
    '{"Gauge": "16 Gauge SS", "Finish": "Mirror Polish", "Load Capacity": "180 kg", "Warranty": "5 Years Structural Warranty"}'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    2800.00
),
(
    '20000000-0000-0000-0000-000000000002',
    '22222222-2222-2222-2222-222222222222',
    'Modern Industrial Main Gate',
    'நவீன தொழில்துறை பிரதான கேட்',
    'Customized wrought iron main entrance gate with powder coating. Anti-rust treatment with precision laser cut panels and heavy hinges.',
    'துருப்பிடிக்காத பவுடர் கோட்டிங் பூச்சுடன் கூடிய நவீன பிரதான கேட். லேசர் கட் பேனல்கள் மற்றும் உறுதியான ஹிஞ்சுகள் கொண்டது.',
    'Wrought Iron, Mild Steel Square Pipe, CNC Sheet',
    '10ft x 6ft, 12ft x 7ft, Custom Dimensions Available',
    '{"Coating": "Anti-Rust Primer + Matte Black Powder Coating", "Lock Type": "Heavy Duty Padlock Slot", "Hinges": "3-inch Ball Bearing Hinges"}'::jsonb,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    34000.00
),
(
    '30000000-0000-0000-0000-000000000003',
    '33333333-3333-3333-3333-333333333333',
    'Window Safety Grill - Diamond Pattern',
    'டைமண்ட் டிசைன் விண்டோ சேஃப்டி கிரில்',
    'Robust mild steel window grill offering maximum home protection with stylish diamond geometry. Weather-resistant finish.',
    'அதிகபட்ச பாதுகாப்பு தரும் வைரம் வடிவ மயில் கண்கள் கொண்ட ஜன்னல் கிரில். மழை மற்றும் வெயிலைத் தாங்கும் பூச்சு.',
    'MS Bright Rods 12mm, Square Frame 1.5 inch',
    '4ft x 3ft, 5ft x 4ft, Custom Size',
    '{"Rod Gauge": "12mm Solid Rod", "Spacing": "4 inches", "Paint": "Dual Coat Enamel Paint"}'::jsonb,
    FALSE,
    TRUE,
    TRUE,
    FALSE,
    TRUE,
    TRUE,
    TRUE,
    3200.00
),
(
    '40000000-0000-0000-0000-000000000004',
    '44444444-4444-4444-4444-444444444444',
    'Industrial Steel Welding Table',
    'தொழில்துறை ஸ்டீல் வெல்டிங் மேஜை',
    'Heavy structural channel and angle frame welded table for workshops, hotel kitchens, and heavy repair shops.',
    'பட்டறைகள், ஹோட்டல்கள் மற்றும் பழுதுபார்க்கும் இடங்களுக்கு ஏற்ற கனரக இரும்பு மேஜை.',
    'Heavy MS Angle 50x50mm, 6mm Top Plate',
    '6ft x 3ft, Height 3ft',
    '{"Top Thickness": "6mm Plate", "Leg Base": "Rubber Leveling Feet", "Under Shelf": "Expanded Metal Mesh"}'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    14500.00
),
(
    '50000000-0000-0000-0000-000000000005',
    '55555555-5555-5555-5555-555555555555',
    'Arch Balcony Safety Bar Grill',
    'பால்கனி வளைவு பாதுகாப்பு கிரில்',
    'Elegantly curved balcony enclosure grill combining safety with architectural appeal.',
    'பாதுகாப்புடன் கூடிய நேர்த்தியான வளைந்த பால்கனி கிரில்.',
    'MS Pipe 1.25 inch, Solid Square Bars',
    'Custom Balcony Length',
    '{"Height": "4ft", "Coating": "Zing-Rich Primer + Asian Gloss Enamel"}'::jsonb,
    FALSE,
    FALSE,
    TRUE,
    FALSE,
    TRUE,
    TRUE,
    TRUE,
    8900.00
)
ON CONFLICT (id) DO NOTHING;

-- Seed Product Images
INSERT INTO public.product_images (product_id, image_url, is_primary, sort_order) VALUES
('10000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1580481072645-022f9a6d1270?w=800&auto=format&fit=crop&q=80', TRUE, 1),
('10000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1503602642458-232111445657?w=800&auto=format&fit=crop&q=80', FALSE, 2),
('20000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80', TRUE, 1),
('20000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=800&auto=format&fit=crop&q=80', FALSE, 2),
('30000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&auto=format&fit=crop&q=80', TRUE, 1),
('40000000-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?w=800&auto=format&fit=crop&q=80', TRUE, 1),
('50000000-0000-0000-0000-000000000005', 'https://images.unsplash.com/photo-1509644851169-2acc08aa25b5?w=800&auto=format&fit=crop&q=80', TRUE, 1)
ON CONFLICT (id) DO NOTHING;

-- Seed Admin Settings
INSERT INTO public.admin_settings (key, value) VALUES
('shop_info', '{
    "name": "MANIKANDAN LATHE",
    "sub_name": "Welding Works",
    "phone": "+91 96592 86268",
    "whatsapp": "919659286268",
    "email": "manikandanlatheklm@gmail.com",
    "address": "K. Keeranur Road, Kallimandhayam - 624616, Dindigul District, Tamil Nadu",
    "google_maps_url": "https://maps.app.goo.gl/WP632nSNc73yiBsE7",
    "upi_id": "9659286268@upi",
    "upi_qr_url": "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=9659286268@upi&pn=MANIKANDAN%20LATHE",
    "working_hours_en": "Mon - Sat: 8:00 AM - 8:00 PM",
    "working_hours_ta": "திங்கள் - சனி: காலை 8:00 - இரவு 8:00"
}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Seed Master Admin Profile (Using Firebase Auth UID string 9QFtBzZ3Z8f2f8QH4bxgkn4sXVq1)
INSERT INTO public.profiles (id, full_name, email, role, is_profile_completed) VALUES
('9QFtBzZ3Z8f2f8QH4bxgkn4sXVq1', 'Manikandan Admin', 'manikandanlatheklm@gmail.com', 'admin', TRUE)
ON CONFLICT (id) DO UPDATE SET role = 'admin', is_profile_completed = TRUE;
