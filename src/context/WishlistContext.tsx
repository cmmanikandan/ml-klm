import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface WishlistContextType {
  wishlistProductIds: string[];
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (productId: string) => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [wishlistProductIds, setWishlistProductIds] = useState<string[]>([]);

  useEffect(() => {
    if (user?.id) {
      fetchWishlist(user.id);
    } else {
      setWishlistProductIds([]);
    }
  }, [user?.id]);

  const fetchWishlist = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('wishlists')
        .select('product_id')
        .eq('user_id', userId);

      if (data) {
        const ids = data.map((item) => String(item.product_id)).filter(Boolean);
        setWishlistProductIds(ids);
      } else {
        setWishlistProductIds([]);
      }
    } catch (e) {
      console.warn('Wishlist fetch error from Supabase');
    }
  };

  const addToWishlist = async (productId: string) => {
    if (!productId) return;
    const pid = String(productId);
    if (wishlistProductIds.includes(pid)) return;

    const updated = [...wishlistProductIds, pid];
    setWishlistProductIds(updated);

    if (user?.id) {
      try {
        await supabase.from('wishlists').upsert({ user_id: user.id, product_id: pid });
      } catch (e) {
        console.warn('Wishlist insert fallback');
      }
    }
  };

  const removeFromWishlist = async (productId: string) => {
    if (!productId) return;
    const pid = String(productId);
    const updated = wishlistProductIds.filter((id) => id !== pid);
    setWishlistProductIds(updated);

    if (user?.id) {
      try {
        await supabase
          .from('wishlists')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', pid);
      } catch (e) {
        console.warn('Wishlist delete fallback');
      }
    }
  };

  const toggleWishlist = async (productId: string) => {
    if (!productId) return;
    if (isInWishlist(productId)) {
      await removeFromWishlist(productId);
    } else {
      await addToWishlist(productId);
    }
  };

  const isInWishlist = (productId: string) => {
    if (!productId) return false;
    return wishlistProductIds.includes(String(productId));
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistProductIds,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        toggleWishlist
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
