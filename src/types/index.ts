export type Language = 'en' | 'ta';
export type UserRole = 'customer' | 'admin';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  address?: string;
  city_area?: string;
  language: Language;
  role: UserRole;
  avatar_url?: string;
  is_profile_completed?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  name_en: string;
  name_ta: string;
  slug: string;
  image_url?: string;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
}

export interface ProductSpecification {
  [key: string]: string;
}

export type PricingType = 'fixed' | 'weight' | 'sqft';

export interface WeightPart {
  id: string;
  name: string;
  weight_kg: number;
}

export interface ExtraCharge {
  id: string;
  description: string;
  amount: number;
}

export interface WeightCalculationData {
  parts: WeightPart[];
  rate_per_kg: number;
  total_weight_kg: number;
  weight_subtotal: number;
  sqft_area?: number;
  rate_per_sqft?: number;
  sqft_subtotal?: number;
  extra_charges: ExtraCharge[];
  extra_subtotal: number;
  grand_total: number;
  advance_amount: number;
  remaining_balance: number;
  calculated_at?: string;
}

export interface Product {
  id: string;
  category_id?: string;
  category_name?: string;
  name_en: string;
  name_ta: string;
  description_en?: string;
  description_ta?: string;
  materials?: string;
  available_sizes?: string;
  specifications?: ProductSpecification;
  is_best_selling: boolean;
  is_new: boolean;
  is_featured?: boolean;
  is_popular?: boolean;
  is_custom_fabrication?: boolean;
  is_in_stock?: boolean;
  is_active: boolean;
  admin_price?: number; // Strictly admin-only field
  pricing_type?: PricingType; // 'fixed' | 'weight' | 'sqft'
  price_per_kg?: number; // e.g. 160
  price_per_sqft?: number; // e.g. 150
  images?: string[];
  primary_image?: string;
  created_at?: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  is_primary: boolean;
  sort_order: number;
}

export type EnquiryStatus = 'pending' | 'accepted' | 'rejected' | 'converted' | 'converted_to_order';

export interface Enquiry {
  id: string;
  enquiry_number: string;
  user_id: string;
  product_id?: string;
  product?: Product;
  user?: Profile;
  quantity: number;
  size_requirement?: string;
  custom_notes?: string;
  delivery_location?: string;
  status: EnquiryStatus;
  converted_order_id?: string;
  convertedOrderId?: string;
  order_id?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at?: string;
}

export type OrderStatus = 
  | 'accepted' 
  | 'order_confirmed' 
  | 'processing' 
  | 'ready' 
  | 'out_for_delivery' 
  | 'delivered' 
  | 'cancelled';

export type PaymentStatus = 'pending' | 'partially_paid' | 'paid' | 'failed' | 'refunded';

export interface Order {
  id: string;
  order_number: string;
  enquiry_id?: string;
  user_id: string;
  product_id?: string;
  product?: Product;
  user?: Profile;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  productName?: string;
  productImage?: string;
  quantity: number;
  specifications?: string;
  delivery_location?: string;
  status: OrderStatus;
  expected_delivery_date?: string;
  total_amount?: number;
  advance_amount?: number;
  remaining_amount?: number;
  is_payment_requested: boolean;
  payment_request_amount: number;
  payment_status: PaymentStatus;
  admin_notes?: string;
  pricing_type?: PricingType;
  weight_calculation?: WeightCalculationData;
  is_pos?: boolean;
  fabrication_stage?: string;
  created_at: string;
  updated_at?: string;
}

export type PaymentType = 'razorpay' | 'qr' | 'cash';

export interface Payment {
  id: string;
  order_id: string;
  user_id: string;
  amount: number;
  payment_type: PaymentType;
  transaction_id?: string;
  status: PaymentStatus;
  notes?: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title_en: string;
  title_ta: string;
  message_en: string;
  message_ta: string;
  type: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface FeedbackItem {
  id: string;
  order_id: string;
  user_id: string;
  user_name?: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface ShopInfo {
  name: string;
  sub_name: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  google_maps_url?: string;
  upi_id: string;
  upi_qr_url: string;
  gstin?: string;
  owner_signature?: string;
  founder_name?: string;
  experience_years?: string;
  working_hours_en: string;
  working_hours_ta: string;
  default_rate_per_kg?: number;
  default_rate_per_sqft?: number;
}
