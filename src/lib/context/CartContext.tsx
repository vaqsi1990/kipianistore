'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { CartItem } from '@/lib/types';
import { useSession } from 'next-auth/react';

interface Cart {
  id: string;
  items: CartItem[];
  itemsPrice: string;
  totalPrice: string;
  shippingPrice: string;
  taxPrice: string;
}

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  cartItemCount: number;
  updateCart: (newCart: Cart | null) => void;
  refreshCart: (force?: boolean) => Promise<void>;
  addToCartOptimistic: (item: CartItem) => void;
  removeFromCartOptimistic: (productId: string, size: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const { data: session, status } = useSession();

  const loadCart = useCallback(async () => {
    // Prevent multiple simultaneous requests and cache for 5 seconds
    const now = Date.now();
    if (isLoading || (now - lastFetch < 5000)) return;
    
    try {
      setIsLoading(true);
      setLastFetch(now);
      
      const response = await fetch('/api/cart/get');
      
      if (!response.ok) {
        throw new Error('Failed to load cart');
      }
      
      const { cart: cartData } = await response.json();
      
      if (cartData) {
        setCart({
          id: cartData.id,
          items: cartData.items,
          itemsPrice: cartData.itemsPrice,
          totalPrice: cartData.totalPrice,
          shippingPrice: cartData.shippingPrice,
          taxPrice: cartData.taxPrice,
        });
      } else {
        setCart(null);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      setCart(null);
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  }, [isLoading, lastFetch]);

  const updateCart = useCallback((newCart: Cart | null) => {
    setCart(newCart);
  }, []);

  const refreshCart = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && (isLoading || (now - lastFetch < 5000))) {
    
      return;
    }
    
 
    try {
      setIsLoading(true);
      setLastFetch(now);
      
      const response = await fetch('/api/cart/get');
     
      
      if (!response.ok) {
        throw new Error('Failed to load cart');
      }
      
      const { cart: cartData } = await response.json();
    
      
      if (cartData) {
        setCart({
          id: cartData.id,
          items: cartData.items,
          itemsPrice: cartData.itemsPrice,
          totalPrice: cartData.totalPrice,
          shippingPrice: cartData.shippingPrice,
          taxPrice: cartData.taxPrice,
        });
      } else {
        setCart(null);
      }
    } catch (error) {
      console.error('Error refreshing cart:', error);
      setCart(null);
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  }, [isLoading, lastFetch]);

  const addToCartOptimistic = useCallback((item: CartItem) => {
    if (!cart) {
      // If no cart exists, create a new one with the item
      const newCart: Cart = {
        id: 'temp',
        items: [item],
        itemsPrice: item.price,
        totalPrice: item.price,
        shippingPrice: '0',
        taxPrice: '0',
      };
      setCart(newCart);
    } else {
      // Check if item already exists
      const existingItemIndex = cart.items.findIndex(
        existingItem => existingItem.productId === item.productId && existingItem.size === item.size
      );

      let updatedItems: CartItem[];
      if (existingItemIndex >= 0) {
        // Update existing item quantity
        updatedItems = [...cart.items];
        updatedItems[existingItemIndex].qty += item.qty;
      } else {
        // Add new item
        updatedItems = [...cart.items, item];
      }

      // Calculate new totals (simplified calculation)
      const itemsPrice = updatedItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.qty), 0);
      const taxPrice = itemsPrice * 0.18; // 18% tax
      const shippingPrice = itemsPrice > 100 ? 0 : 10; // Free shipping over 100
      const totalPrice = itemsPrice + taxPrice + shippingPrice;

      setCart({
        ...cart,
        items: updatedItems,
        itemsPrice: itemsPrice.toString(),
        totalPrice: totalPrice.toString(),
        shippingPrice: shippingPrice.toString(),
        taxPrice: taxPrice.toString(),
      });
    }
  }, [cart]);

  const removeFromCartOptimistic = useCallback((productId: string, size: string) => {
    if (!cart) return;

    const updatedItems = cart.items.filter(
      item => !(item.productId === productId && item.size === size)
    );

    if (updatedItems.length === 0) {
      setCart(null);
      return;
    }

    // Calculate new totals
    const itemsPrice = updatedItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.qty), 0);
    const taxPrice = itemsPrice * 0.18;
    const shippingPrice = itemsPrice > 100 ? 0 : 10;
    const totalPrice = itemsPrice + taxPrice + shippingPrice;

    setCart({
      ...cart,
      items: updatedItems,
      itemsPrice: itemsPrice.toString(),
      totalPrice: totalPrice.toString(),
      shippingPrice: shippingPrice.toString(),
      taxPrice: taxPrice.toString(),
    });
  }, [cart]);

  const clearCart = useCallback(() => {
    setCart(null);
  }, []);

  const cartItemCount = useMemo(() => 
    cart?.items?.reduce((total, item) => total + item.qty, 0) || 0, 
    [cart?.items]
  );

  useEffect(() => {
 
    // Load cart for both authenticated and unauthenticated users
    // The cart system works with session cart ID for unauthenticated users
    if (status === 'authenticated' || status === 'unauthenticated') {

      // Call loadCart directly to avoid circular dependency
      const fetchCart = async () => {
        const now = Date.now();
        if (isLoading || (now - lastFetch < 5000)) {
       
          return;
        }
        

        try {
          setIsLoading(true);
          setLastFetch(now);
          
          const response = await fetch('/api/cart/get');
    
          
          if (!response.ok) {
            throw new Error('Failed to load cart');
          }
          
          const { cart: cartData } = await response.json();
     
          
          if (cartData) {
            setCart({
              id: cartData.id,
              items: cartData.items,
              itemsPrice: cartData.itemsPrice,
              totalPrice: cartData.totalPrice,
              shippingPrice: cartData.shippingPrice,
              taxPrice: cartData.taxPrice,
            });
          } else {
            setCart(null);
          }
        } catch (error) {
          console.error('Error loading cart:', error);
          setCart(null);
        } finally {
          setIsLoading(false);
          setLoading(false);
        }
      };
      
      fetchCart();
    }
  }, [status, isLoading, lastFetch]);

  const value: CartContextType = useMemo(() => ({
    cart,
    loading,
    cartItemCount,
    updateCart,
    refreshCart,
    addToCartOptimistic,
    removeFromCartOptimistic,
    clearCart,
  }), [cart, loading, cartItemCount]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}; 