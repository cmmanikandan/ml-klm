import { createClient } from '@supabase/supabase-js';
import { Category, Product, Profile, Enquiry, Order, Payment, NotificationItem, FeedbackItem, ShopInfo } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qydhsvmccxbejnjunwhe.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_6z9QabcpU1oDu0emnmDcdQ_jRn3pJOg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ====================================================================
// DEFAULT INITIAL SEED DATA (PERSISTENT MEMORY / MOCK FALLBACK PROVIDER)
// ====================================================================

export const DEFAULT_SHOP_INFO: ShopInfo = {
  name: 'MANIKANDAN LATHE',
  sub_name: 'Welding Works',
  phone: '+91 96592 86268',
  whatsapp: '919659286268',
  email: 'manikandanlatheklm@gmail.com',
  address: 'K. Keeranur Road, Kallimandhayam - 624616, Dindigul District, Tamil Nadu',
  google_maps_url: 'https://maps.app.goo.gl/WP632nSNc73yiBsE7',
  upi_id: '9659286268@upi',
  upi_qr_url: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=9659286268@upi&pn=MANIKANDAN%20LATHE',
  working_hours_en: 'Mon - Sat: 8:00 AM - 8:00 PM',
  working_hours_ta: 'திங்கள் - சனி: காலை 8:00 - இரவு 8:00'
};

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name_en: 'Steel Chairs',
    name_ta: 'ஸ்டீல் நாற்காலிகள்',
    slug: 'steel-chairs',
    image_url: 'https://images.unsplash.com/photo-1580481072645-022f9a6d1270?w=600&auto=format&fit=crop&q=80',
    is_active: true,
    sort_order: 1
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name_en: 'Gates',
    name_ta: 'கேட்டுகள்',
    slug: 'gates',
    image_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80',
    is_active: true,
    sort_order: 2
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name_en: 'Safety Grills',
    name_ta: 'பாதுகாப்பு கிரில்கள்',
    slug: 'safety-grills',
    image_url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&auto=format&fit=crop&q=80',
    is_active: true,
    sort_order: 3
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    name_en: 'Tables & Desks',
    name_ta: 'மேஜைகள்',
    slug: 'tables',
    image_url: 'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?w=600&auto=format&fit=crop&q=80',
    is_active: true,
    sort_order: 4
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    name_en: 'Windows & Frames',
    name_ta: 'ஜன்னல்கள்',
    slug: 'windows',
    image_url: 'https://images.unsplash.com/photo-1509644851169-2acc08aa25b5?w=600&auto=format&fit=crop&q=80',
    is_active: true,
    sort_order: 5
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    name_en: 'Custom Welding',
    name_ta: 'கஸ்டம் வெல்டிங்',
    slug: 'custom-welding',
    image_url: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&auto=format&fit=crop&q=80',
    is_active: true,
    sort_order: 6
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    category_id: '11111111-1111-1111-1111-111111111111',
    category_name: 'Steel Chairs',
    name_en: 'Heavy Duty Stainless Steel Chair',
    name_ta: 'ஹெவி டியூட்டி ஸ்டெயின்லெஸ் ஸ்டீல் நாற்காலி',
    description_en: 'Premium grade 304 stainless steel chair engineered with arc welding for extreme durability and long service life. Ergonomic back support suitable for home, offices, and commercial shops.',
    description_ta: 'உயர்தர 304 ஸ்டெயின்லெஸ் ஸ்டீல் நாற்காலி. ஆர்க் வெல்டிங் மூலம் அதிக உறுதியுடன் தயாரிப்பது.',
    materials: '304 Stainless Steel Pipe, Heavy Gauge Steel Sheet',
    available_sizes: 'Standard (3.5ft x 1.8ft), High-back (4ft x 1.8ft)',
    specifications: {
      'Gauge': '16 Gauge SS',
      'Finish': 'Mirror Polish',
      'Load Capacity': '180 kg',
      'Warranty': '5 Years Structural Warranty'
    },
    is_best_selling: true,
    is_new: false,
    is_active: true,
    admin_price: 2800.00,
    images: [
      'https://images.unsplash.com/photo-1580481072645-022f9a6d1270?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1503602642458-232111445657?w=800&auto=format&fit=crop&q=80'
    ],
    primary_image: 'https://images.unsplash.com/photo-1580481072645-022f9a6d1270?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: '20000000-0000-0000-0000-000000000002',
    category_id: '22222222-2222-2222-2222-222222222222',
    category_name: 'Gates',
    name_en: 'Modern Industrial Main Gate',
    name_ta: 'நவீன தொழில்துறை பிரதான கேட்',
    description_en: 'Customized wrought iron main entrance gate with anti-rust primer and matte black powder coating. Precision laser cut panels and heavy ball-bearing hinges.',
    description_ta: 'துருப்பிடிக்காத பவுடர் கோட்டிங் பூச்சுடன் கூடிய நவீன பிரதான கேட். லேசர் கட் பேனல்கள் மற்றும் உறுதியான ஹிஞ்சுகள் கொண்டது.',
    materials: 'Wrought Iron, Mild Steel Square Pipe, CNC Sheet',
    available_sizes: '10ft x 6ft, 12ft x 7ft, Custom Dimensions Available',
    specifications: {
      'Coating': 'Anti-Rust Primer + Matte Black Powder Coating',
      'Lock Type': 'Heavy Duty Padlock Slot',
      'Hinges': '3-inch Ball Bearing Hinges'
    },
    is_best_selling: true,
    is_new: true,
    is_active: true,
    admin_price: 34000.00,
    images: [
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=800&auto=format&fit=crop&q=80'
    ],
    primary_image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: '30000000-0000-0000-0000-000000000003',
    category_id: '33333333-3333-3333-3333-333333333333',
    category_name: 'Safety Grills',
    name_en: 'Window Safety Grill - Diamond Pattern',
    name_ta: 'டைமண்ட் டிசைன் விண்டோ சேஃப்டி கிரில்',
    description_en: 'Robust mild steel window grill offering maximum protection with stylish diamond geometry. Weather-resistant coat.',
    description_ta: 'அதிகபட்ச பாதுகாப்பு தரும் வைரம் வடிவ மயில் கண்கள் கொண்ட ஜன்னல் கிரில். மழை மற்றும் வெயிலைத் தாங்கும் பூச்சு.',
    materials: 'MS Bright Rods 12mm, Square Frame 1.5 inch',
    available_sizes: '4ft x 3ft, 5ft x 4ft, Custom Size',
    specifications: {
      'Rod Gauge': '12mm Solid Rod',
      'Spacing': '4 inches',
      'Paint': 'Dual Coat Enamel Paint'
    },
    is_best_selling: false,
    is_new: true,
    is_active: true,
    admin_price: 3200.00,
    images: [
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&auto=format&fit=crop&q=80'
    ],
    primary_image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: '40000000-0000-0000-0000-000000000004',
    category_id: '44444444-4444-4444-4444-444444444444',
    category_name: 'Tables & Desks',
    name_en: 'Industrial Steel Welding Table',
    name_ta: 'தொழில்துறை ஸ்டீல் வெல்டிங் மேஜை',
    description_en: 'Heavy structural channel and angle frame welded table for workshops, hotel kitchens, and heavy repair shops.',
    description_ta: 'பட்டறைகள், ஹோட்டல்கள் மற்றும் பழுதுபார்க்கும் இடங்களுக்கு ஏற்ற கனரக இரும்பு மேஜை.',
    materials: 'Heavy MS Angle 50x50mm, 6mm Top Plate',
    available_sizes: '6ft x 3ft, Height 3ft',
    specifications: {
      'Top Thickness': '6mm Plate',
      'Leg Base': 'Rubber Leveling Feet',
      'Under Shelf': 'Expanded Metal Mesh'
    },
    is_best_selling: true,
    is_new: false,
    is_active: true,
    admin_price: 14500.00,
    images: [
      'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?w=800&auto=format&fit=crop&q=80'
    ],
    primary_image: 'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: '50000000-0000-0000-0000-000000000005',
    category_id: '55555555-5555-5555-5555-555555555555',
    category_name: 'Windows & Frames',
    name_en: 'Arch Balcony Safety Bar Grill',
    name_ta: 'பால்கனி வளைவு பாதுகாப்பு கிரில்',
    description_en: 'Elegantly curved balcony enclosure grill combining safety with architectural appeal.',
    description_ta: 'பாதுகாப்புடன் கூடிய நேர்த்தியான வளைந்த பால்கனி கிரில்.',
    materials: 'MS Pipe 1.25 inch, Solid Square Bars',
    available_sizes: 'Custom Balcony Length',
    specifications: {
      'Height': '4ft',
      'Coating': 'Zing-Rich Primer + Asian Gloss Enamel'
    },
    is_best_selling: false,
    is_new: false,
    is_active: true,
    admin_price: 8900.00,
    images: [
      'https://images.unsplash.com/photo-1509644851169-2acc08aa25b5?w=800&auto=format&fit=crop&q=80'
    ],
    primary_image: 'https://images.unsplash.com/photo-1509644851169-2acc08aa25b5?w=800&auto=format&fit=crop&q=80'
  }
];

// Helper to remove price key from product payload before delivering to customer UI
export const sanitizeProductForCustomer = (product: Product): Product => {
  const { admin_price, ...customerProduct } = product;
  return customerProduct;
};
