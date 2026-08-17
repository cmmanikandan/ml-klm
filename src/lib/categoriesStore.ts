import { supabase, INITIAL_CATEGORIES } from './supabase';
import { Category } from '../types';

const LOCAL_CATEGORIES_KEY = 'ml_custom_categories';
const DELETED_CATEGORIES_KEY = 'ml_deleted_categories';

// Fetch all active categories directly from Supabase DB (with Offline Cache Fallback)
export const fetchActiveCategories = async (): Promise<Category[]> => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.warn('Supabase categories fetch error (attempting offline cache):', error.message);
      const cached = localStorage.getItem('ml_cached_categories');
      return cached ? JSON.parse(cached) : INITIAL_CATEGORIES;
    }

    const categories = data || [];
    if (categories.length > 0) {
      try {
        localStorage.setItem('ml_cached_categories', JSON.stringify(categories));
      } catch (e) {}
    }

    return categories;
  } catch (e) {
    console.warn('Supabase categories fetch exception (falling back to offline cache):', e);
    const cached = localStorage.getItem('ml_cached_categories');
    return cached ? JSON.parse(cached) : INITIAL_CATEGORIES;
  }
};

// Save (Insert / Update) a Category to both Supabase DB and Local Store
export const saveCategoryToStore = async (cat: Category): Promise<boolean> => {
  // Remove from deleted blacklist if re-adding
  const deletedStr = localStorage.getItem(DELETED_CATEGORIES_KEY);
  if (deletedStr) {
    const deletedList: string[] = JSON.parse(deletedStr);
    const updatedBlacklist = deletedList.filter((x) => x !== cat.id && x !== cat.slug);
    localStorage.setItem(DELETED_CATEGORIES_KEY, JSON.stringify(updatedBlacklist));
  }

  // 1. Save to Local Storage immediately
  const localStr = localStorage.getItem(LOCAL_CATEGORIES_KEY);
  const localCategories: Category[] = localStr ? JSON.parse(localStr) : [];

  const existingIdx = localCategories.findIndex((c) => c.id === cat.id || c.slug === cat.slug);
  if (existingIdx >= 0) {
    localCategories[existingIdx] = cat;
  } else {
    localCategories.push(cat);
  }

  localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(localCategories));

  // 2. Persist to Supabase Database
  try {
    const dbPayload = {
      id: cat.id,
      name_en: cat.name_en,
      name_ta: cat.name_ta,
      slug: cat.slug,
      image_url: cat.image_url || '',
      is_active: cat.is_active !== false,
      sort_order: cat.sort_order || 1
    };
    await supabase.from('categories').upsert(dbPayload);
  } catch (e) {
    console.warn('Supabase category upsert warning');
  }

  return true;
};

// Delete a Category permanently from Supabase DB, Local Store, and add to Blacklist
export const deleteCategoryFromStore = async (id: string, slug?: string): Promise<boolean> => {
  // 1. Add ID and slug to deleted blacklist so initial fallbacks never respawn it
  const deletedStr = localStorage.getItem(DELETED_CATEGORIES_KEY);
  const deletedList: string[] = deletedStr ? JSON.parse(deletedStr) : [];
  if (id && !deletedList.includes(id)) deletedList.push(id);
  if (slug && !deletedList.includes(slug)) deletedList.push(slug);
  localStorage.setItem(DELETED_CATEGORIES_KEY, JSON.stringify(deletedList));

  // 2. Remove from local custom categories store
  const localStr = localStorage.getItem(LOCAL_CATEGORIES_KEY);
  if (localStr) {
    const localCategories: Category[] = JSON.parse(localStr);
    const filtered = localCategories.filter((c) => c.id !== id && c.slug !== slug);
    localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(filtered));
  }

  // 3. Delete permanently from Supabase DB
  try {
    if (id) await supabase.from('categories').delete().eq('id', id);
    if (slug) await supabase.from('categories').delete().eq('slug', slug);
  } catch (e) {
    console.warn('Supabase category delete warning');
  }

  return true;
};
