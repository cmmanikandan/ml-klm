import { supabase } from './supabase';
import { Product } from '../types';

const LOCAL_PRODUCTS_KEY = 'ml_custom_products';
const DELETED_IDS_KEY = 'ml_deleted_product_ids';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Fetch all active products directly from Supabase DB (with Offline Cache Fallback)
export const fetchActiveProducts = async (): Promise<Product[]> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase DB product fetch error (attempting offline cache):', error.message);
      const cached = localStorage.getItem('ml_cached_products');
      return cached ? JSON.parse(cached) : [];
    }

    // Hydrate primary_image from images array if missing
    const formatted = (data || []).map((p: any) => ({
      ...p,
      primary_image: p.primary_image || (p.images && p.images.length > 0 ? p.images[0] : ''),
      images: p.images && p.images.length > 0 ? p.images : (p.primary_image ? [p.primary_image] : [])
    }));

    // Cache products for offline access
    if (formatted.length > 0) {
      try {
        localStorage.setItem('ml_cached_products', JSON.stringify(formatted));
      } catch (e) {}
    }

    return formatted;
  } catch (e) {
    console.warn('Supabase DB fetch products exception (falling back to offline cache):', e);
    const cached = localStorage.getItem('ml_cached_products');
    return cached ? JSON.parse(cached) : [];
  }
};

// Fetch single product by ID
export const fetchProductById = async (id: string): Promise<Product | null> => {
  const all = await fetchActiveProducts();
  return all.find((p) => p.id === id) || null;
};

// Save (Insert / Update) a Product to both Supabase DB and Local Store
export const saveProductToStore = async (product: Product): Promise<boolean> => {
  // Ensure product has a valid UUID format
  const validProductId = UUID_REGEX.test(product.id) ? product.id : crypto.randomUUID();
  const normalizedProduct: Product = { ...product, id: validProductId };

  // 1. Save to Local Storage immediately
  const localStr = localStorage.getItem(LOCAL_PRODUCTS_KEY);
  const localProducts: Product[] = localStr ? JSON.parse(localStr) : [];
  
  const existingIdx = localProducts.findIndex((p) => p.id === validProductId);
  if (existingIdx >= 0) {
    localProducts[existingIdx] = normalizedProduct;
  } else {
    localProducts.unshift(normalizedProduct);
  }

  localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(localProducts));

  // Remove from deleted list if it was previously marked deleted
  const deletedStr = localStorage.getItem(DELETED_IDS_KEY);
  if (deletedStr) {
    const deletedIds: string[] = JSON.parse(deletedStr);
    const updatedDeleted = deletedIds.filter((dId) => dId !== validProductId);
    localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(updatedDeleted));
  }

  // 2. Format clean Payload strictly for Supabase PostgreSQL schema
  const dbPayload: any = {
    id: validProductId,
    name_en: normalizedProduct.name_en,
    name_ta: normalizedProduct.name_ta || normalizedProduct.name_en,
    description_en: normalizedProduct.description_en || '',
    description_ta: normalizedProduct.description_ta || '',
    materials: normalizedProduct.materials || '',
    available_sizes: normalizedProduct.available_sizes || '',
    specifications: normalizedProduct.specifications || {},
    is_best_selling: Boolean(normalizedProduct.is_best_selling),
    is_new: Boolean(normalizedProduct.is_new),
    is_featured: normalizedProduct.is_featured !== false,
    is_popular: Boolean(normalizedProduct.is_popular),
    is_custom_fabrication: normalizedProduct.is_custom_fabrication !== false,
    is_in_stock: normalizedProduct.is_in_stock !== false,
    is_active: normalizedProduct.is_active !== false,
    admin_price: normalizedProduct.admin_price || 0,
    pricing_type: normalizedProduct.pricing_type || 'weight',
    price_per_kg: normalizedProduct.price_per_kg || 160,
    price_per_sqft: normalizedProduct.price_per_sqft || 150,
    // Store Cloudinary image URLs in DB so all devices see the same images
    primary_image: normalizedProduct.primary_image || (normalizedProduct.images?.[0]) || '',
    images: normalizedProduct.images || [],
    updated_at: new Date().toISOString()
  };

  // Only include category_id if it is a valid UUID (DB FK constraint)
  if (normalizedProduct.category_id && UUID_REGEX.test(normalizedProduct.category_id)) {
    dbPayload.category_id = normalizedProduct.category_id;
  }

  // 3. Persist to Supabase Database — DB is the source of truth for all devices
  try {
    const { error } = await supabase.from('products').upsert(dbPayload, { onConflict: 'id' });
    if (error) {
      console.warn('Supabase product upsert error:', error.message);
      // If FK constraint on category_id fails, retry without it
      if (error.message.includes('foreign key') || error.message.includes('category')) {
        delete dbPayload.category_id;
        const { error: retryError } = await supabase.from('products').upsert(dbPayload, { onConflict: 'id' });
        if (retryError) {
          console.error('Supabase product upsert retry error:', retryError.message);
        }
      }
    }
  } catch (e) {
    console.warn('Supabase product upsert exception — saved to local only:', e);
  }

  return true;
};

// Delete a Product from both Supabase DB and Local Store
export const deleteProductFromStore = async (id: string): Promise<boolean> => {
  // 1. Mark ID in Local Storage deleted list
  const deletedStr = localStorage.getItem(DELETED_IDS_KEY);
  const deletedIds: string[] = deletedStr ? JSON.parse(deletedStr) : [];
  if (!deletedIds.includes(id)) {
    deletedIds.push(id);
    localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(deletedIds));
  }

  // 2. Remove from custom local products list
  const localStr = localStorage.getItem(LOCAL_PRODUCTS_KEY);
  if (localStr) {
    const localProducts: Product[] = JSON.parse(localStr);
    const filtered = localProducts.filter((p) => p.id !== id);
    localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(filtered));
  }

  // 3. Execute delete query on Supabase DB if UUID is valid
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (isUuid) {
      await supabase.from('products').delete().eq('id', id);
    }
  } catch (e) {
    console.warn('Supabase DB product delete warning:', e);
  }

  return true;
};

// Clear all demo products completely
export const clearAllDemoProductsFromStore = async (): Promise<boolean> => {
  const demoIds = [
    '10000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000003',
    '40000000-0000-0000-0000-000000000004',
    '50000000-0000-0000-0000-000000000005'
  ];

  const deletedStr = localStorage.getItem(DELETED_IDS_KEY);
  const deletedIds: string[] = deletedStr ? JSON.parse(deletedStr) : [];
  
  demoIds.forEach((id) => {
    if (!deletedIds.includes(id)) deletedIds.push(id);
  });
  localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(deletedIds));

  try {
    for (const id of demoIds) {
      await supabase.from('products').delete().eq('id', id);
    }
  } catch (e) {
    // ignore
  }

  return true;
};
