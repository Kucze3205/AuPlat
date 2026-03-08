import { Auction } from '@/services/api';
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { getCookie, setCookie } from '@/hooks/cookie-store';

const CART_COOKIE_KEY = 'auction_cart_v1';

export interface CartItem {
  id: string;
  title: string;
  currentPrice: number;
  imageUrl?: string;
}

type CartContextValue = {
  items: CartItem[];
  addToCart: (auction: Auction) => void;
  removeFromCart: (auctionId: string) => void;
  clearCart: () => void;
  isInCart: (auctionId: string) => boolean;
  itemCount: number;
};

const CartContext = createContext<CartContextValue | null>(null);

function parseCartCookie(raw: string | null): CartItem[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (item): item is CartItem =>
          !!item &&
          typeof item === 'object' &&
          typeof (item as CartItem).id === 'string' &&
          typeof (item as CartItem).title === 'string' &&
          typeof (item as CartItem).currentPrice === 'number',
      )
      .slice(0, 30);
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const initialItems = parseCartCookie(getCookie(CART_COOKIE_KEY));
    setItems(initialItems);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    setCookie(CART_COOKIE_KEY, JSON.stringify(items));
  }, [hydrated, items]);

  const value = useMemo<CartContextValue>(() => {
    const addToCart = (auction: Auction) => {
      const nextItem: CartItem = {
        id: auction.id,
        title: auction.title,
        currentPrice: auction.currentPrice,
        imageUrl: auction.imageUrl,
      };

      setItems((prev) => {
        const index = prev.findIndex((item) => item.id === auction.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = nextItem;
          return updated;
        }

        return [...prev, nextItem].slice(-30);
      });
    };

    const removeFromCart = (auctionId: string) => {
      setItems((prev) => prev.filter((item) => item.id !== auctionId));
    };

    const clearCart = () => {
      setItems([]);
    };

    const isInCart = (auctionId: string) => items.some((item) => item.id === auctionId);

    return {
      items,
      addToCart,
      removeFromCart,
      clearCart,
      isInCart,
      itemCount: items.length,
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used inside CartProvider.');
  }
  return context;
}
