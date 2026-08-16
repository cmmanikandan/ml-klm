import { createClient } from '@supabase/supabase-js';
import { Category, Product, Profile, Enquiry, Order, Payment, NotificationItem, FeedbackItem, ShopInfo } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qydhsvmccxbejnjunwhe.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_6z9QabcpU1oDu0emnmDcdQ_jRn3pJOg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ====================================================================
// DEFAULT INITIAL SEED DATA
// ====================================================================

export const DEFAULT_SHOP_INFO: ShopInfo = {
  name: 'MANIKANDAN LATHE',
  sub_name: 'Welding Works',
  phone: '+91 96592 86268',
  whatsapp: '919659286268',
  email: 'manikandanlatheklm@gmail.com',
  address: 'K. Keeranur Road, Kallimandhayam - 624616, Dindigul District, Tamil Nadu',
  google_maps_url: 'https://maps.app.goo.gl/s2HsgvoXYCNC9YzPA',
  upi_id: '9659286268@upi',
  upi_qr_url: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=9659286268@upi&pn=MANIKANDAN%20LATHE',
  gstin: '33ABCDE1234F1Z5',
  owner_signature: 'C. MANIKANDAN (Proprietor)',
  founder_name: 'K. Chellamuthu',
  experience_years: '25+',
  working_hours_en: 'Mon - Sat: 8:30 AM - 8:30 PM',
  working_hours_ta: 'திங்கள் - சனி: காலை 8:30 - இரவு 8:30'
};

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: '22222222-2222-2222-2222-222222222222',
    name_en: 'Gates',
    name_ta: 'கேட்டுகள்',
    slug: 'gates',
    image_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80',
    is_active: true,
    sort_order: 1
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name_en: 'Grills',
    name_ta: 'பாதுகாப்பு கிரில்கள்',
    slug: 'safety-grills',
    image_url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&auto=format&fit=crop&q=80',
    is_active: true,
    sort_order: 2
  },
  {
    id: '77777777-7777-7777-7777-777777777777',
    name_en: 'Kallapai',
    name_ta: 'ஏர் கலப்பை',
    slug: 'kallapai',
    image_url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&auto=format&fit=crop&q=80',
    is_active: true,
    sort_order: 3
  },
  {
    id: '88888888-8888-8888-8888-888888888888',
    name_en: 'Roofing',
    name_ta: 'கூரை ஸ்ட்ரக்சர்',
    slug: 'roofing',
    image_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=600&auto=format&fit=crop&q=80',
    is_active: true,
    sort_order: 4
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    name_en: 'ARC Welding Works',
    name_ta: 'ARC வெல்டிங் வேலைகள்',
    slug: 'custom-welding',
    image_url: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&auto=format&fit=crop&q=80',
    is_active: true,
    sort_order: 5
  },
  {
    id: '11111111-1111-1111-1111-111111111111',
    name_en: 'Lathe Works',
    name_ta: 'லேத் வேலைகள்',
    slug: 'lathe-works',
    image_url: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&auto=format&fit=crop&q=80',
    is_active: true,
    sort_order: 6
  }
];

// Pure empty array - strictly live products from Supabase DB
export const INITIAL_PRODUCTS: Product[] = [];

// Helper to remove price key from product payload before delivering to customer UI
export const sanitizeProductForCustomer = (product: Product): Product => {
  const { admin_price, ...customerProduct } = product;
  return customerProduct;
};
