import { supabase, INITIAL_CATEGORIES } from './supabase';
import { Category } from '../types';

const LOCAL_CATEGORIES_KEY = 'ml_custom_categories';

// Fetch all active categories (Supabase DB merged with Local Storage and Initial Fallbacks)
export const fetchActiveCategories = async (): Promise<Category[]> => {
  let dbCategories: Category[] = [];
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (data && !error && data.length > 0) {
      dbCategories = data;
    }
  } catch (e) {
    console.warn('Supabase categories fetch fallback to local store');
  }

  // Read local custom added categories
  const localStr = localStorage.getItem(LOCAL_CATEGORIES_KEY);
  const localCategories: Category[] = localStr ? JSON.parse(localStr) : [];

  // Merge map by category ID or slug
  const map = new Map<string, Category>();
  INITIAL_CATEGORIES.forEach((c) => map.set(c.slug, c));
  dbCategories.forEach((c) => map.set(c.slug, c));
  localCategories.forEach((c) => map.set(c.slug, c));

  return Array.from(map.values()).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
};

// Save (Insert / Update) a Category to both Supabase DB and Local Store
export const saveCategoryToStore = async (cat: Category): Promise<boolean> => {
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

// Delete a Category from both Supabase DB and Local Store
export const deleteCategoryFromStore = async (id: string, slug?: string): Promise<boolean> => {
  const localStr = localStorage.getItem(LOCAL_CATEGORIES_KEY);
  if (localStr) {
    const localCategories: Category[] = JSON.parse(localStr);
    const filtered = localCategories.filter((c) => c.id !== id && c.slug !== slug);
    localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(filtered));
  }

  try {
    await supabase.from('categories').delete().eq('id', id);
  } catch (e) {
    console.warn('Supabase category delete warning');
  }

  return true;
};
