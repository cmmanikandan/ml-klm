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
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('ml_recently_viewed');
    return saved ? JSON.parse(saved) : ['p2222222-2222-2222-2222-222222222222', 'p1111111-1111-1111-1111-111111111111'];
  });

  const trackProductView = (productId: string) => {
    setRecentlyViewedIds((prev) => {
      const filtered = prev.filter((id) => id !== productId);
      const updated = [productId, ...filtered].slice(0, 10);
      localStorage.setItem('ml_recently_viewed', JSON.stringify(updated));
      return updated;
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
