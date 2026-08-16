import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface RecentlyViewedContextType {
  recentlyViewedIds: string[];
  trackProductView: (productId: string) => void;
}

const RecentlyViewedContext = createContext<RecentlyViewedContextType | undefined>(undefined);

export const RecentlyViewedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>([]);

  useEffect(() => {
    if (user?.id) {
      fetchRecentlyViewed(user.id);
    } else {
      setRecentlyViewedIds([]);
    }
  }, [user?.id]);

  const fetchRecentlyViewed = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('product_views')
        .select('product_id')
        .eq('user_id', userId)
        .order('viewed_at', { ascending: false })
        .limit(10);

      if (data) {
        const ids = data.map((item) => String(item.product_id)).filter(Boolean);
        setRecentlyViewedIds(ids);
      }
    } catch (e) {
      console.warn('Recently viewed fetch error');
    }
  };

  const trackProductView = (productId: string) => {
    if (!productId) return;
    setRecentlyViewedIds((prev) => {
      const filtered = prev.filter((id) => id !== productId);
      return [productId, ...filtered].slice(0, 10);
    });

    if (user?.id) {
      try {
        supabase
          .from('product_views')
          .upsert({ user_id: user.id, product_id: productId, viewed_at: new Date().toISOString() })
          .then(() => {});
      } catch (e) {
        // Silent fallback
      }
    }
  };

  return (
    <RecentlyViewedContext.Provider value={{ recentlyViewedIds, trackProductView }}>
      {children}
    </RecentlyViewedContext.Provider>
  );
};

export const useRecentlyViewed = () => {
  const context = useContext(RecentlyViewedContext);
  if (!context) {
    throw new Error('useRecentlyViewed must be used within a RecentlyViewedProvider');
  }
  return context;
};
