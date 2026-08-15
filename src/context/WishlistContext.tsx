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
  const [wishlistProductIds, setWishlistProductIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('ml_wishlist');
    return saved ? JSON.parse(saved) : ['p1111111-1111-1111-1111-111111111111'];
  });

  useEffect(() => {
    if (user?.id) {
      fetchWishlist(user.id);
    }
  }, [user?.id]);

  const fetchWishlist = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('wishlists')
        .select('product_id')
        .eq('user_id', userId);

      if (data) {
        const ids = data.map((item) => item.product_id);
        setWishlistProductIds(ids);
        localStorage.setItem('ml_wishlist', JSON.stringify(ids));
      }
    } catch (e) {
      console.warn('Wishlist fetch error from Supabase');
    }
  };

  const addToWishlist = async (productId: string) => {
    if (wishlistProductIds.includes(productId)) return;
    const updated = [...wishlistProductIds, productId];
    setWishlistProductIds(updated);
    localStorage.setItem('ml_wishlist', JSON.stringify(updated));

    if (user?.id) {
      try {
        await supabase.from('wishlists').insert({ user_id: user.id, product_id: productId });
      } catch (e) {
        console.warn('Wishlist insert fallback');
      }
    }
  };

  const removeFromWishlist = async (productId: string) => {
    const updated = wishlistProductIds.filter((id) => id !== productId);
    setWishlistProductIds(updated);
    localStorage.setItem('ml_wishlist', JSON.stringify(updated));

    if (user?.id) {
      try {
        await supabase
          .from('wishlists')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);
      } catch (e) {
        console.warn('Wishlist delete fallback');
      }
    }
  };

  const toggleWishlist = async (productId: string) => {
    if (isInWishlist(productId)) {
      await removeFromWishlist(productId);
    } else {
      await addToWishlist(productId);
    }
  };

  const isInWishlist = (productId: string) => wishlistProductIds.includes(productId);

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
