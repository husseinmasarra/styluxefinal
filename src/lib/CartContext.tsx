'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, StoreSettings } from './types';
import { DataService } from './store';
import { INITIAL_SETTINGS } from './seed';

export interface CartItem {
  product: Product;
  size: string;
  color: string;
  quantity: number;
}

interface ToastMessage {
  id: string;
  text: string;
  type?: 'success' | 'info' | 'error';
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, size: string, color: string, quantity?: number) => void;
  removeFromCart: (productId: string, size: string, color: string) => void;
  updateQuantity: (productId: string, size: string, color: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  currency: 'USD' | 'LBP' | 'EUR';
  setCurrency: (currency: 'USD' | 'LBP' | 'EUR') => void;
  settings: StoreSettings;
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  toast: ToastMessage | null;
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [currency, setCurrencyState] = useState<'USD' | 'LBP' | 'EUR'>('USD');
  const [settings, setSettings] = useState<StoreSettings>(INITIAL_SETTINGS);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Sync state on load & events
  useEffect(() => {
    const loadedSettings = DataService.getSettings();
    setSettings(loadedSettings);
    setCurrencyState(loadedSettings.activeCurrency || 'USD');

    // Cart persistent storage
    try {
      const savedCart = localStorage.getItem('styluxe_cart');
      if (savedCart) setCart(JSON.parse(savedCart));

      const savedWishlist = localStorage.getItem('styluxe_wishlist');
      if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
    } catch (e) {
      console.error(e);
    }

    const handleUpdate = () => {
      setSettings(DataService.getSettings());
    };
    window.addEventListener('styluxe_data_updated', handleUpdate);
    return () => window.removeEventListener('styluxe_data_updated', handleUpdate);
  }, []);

  const saveCartToStorage = (newCart: CartItem[]) => {
    setCart(newCart);
    try {
      localStorage.setItem('styluxe_cart', JSON.stringify(newCart));
    } catch (e) {
      console.error(e);
    }
  };

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Math.random().toString();
    setToast({ id, text, type });
    setTimeout(() => {
      setToast(prev => (prev?.id === id ? null : prev));
    }, 3500);
  };

  const addToCart = (product: Product, size: string, color: string, quantity = 1) => {
    const existingIndex = cart.findIndex(
      item => item.product.id === product.id && item.size === size && item.color === color
    );

    let updated: CartItem[];
    if (existingIndex >= 0) {
      updated = [...cart];
      updated[existingIndex].quantity += quantity;
    } else {
      updated = [...cart, { product, size, color, quantity }];
    }
    saveCartToStorage(updated);
    setIsCartOpen(true);
    showToast(`Added ${product.title} (${size}) to Shopping Bag`, 'success');
  };

  const removeFromCart = (productId: string, size: string, color: string) => {
    const updated = cart.filter(
      item => !(item.product.id === productId && item.size === size && item.color === color)
    );
    saveCartToStorage(updated);
  };

  const updateQuantity = (productId: string, size: string, color: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, size, color);
      return;
    }
    const updated = cart.map(item => {
      if (item.product.id === productId && item.size === size && item.color === color) {
        return { ...item, quantity };
      }
      return item;
    });
    saveCartToStorage(updated);
  };

  const clearCart = () => {
    saveCartToStorage([]);
  };

  const setCurrency = (curr: 'USD' | 'LBP' | 'EUR') => {
    setCurrencyState(curr);
    DataService.updateSettings({ activeCurrency: curr });
  };

  const toggleWishlist = (productId: string) => {
    let updated: string[];
    if (wishlist.includes(productId)) {
      updated = wishlist.filter(id => id !== productId);
      showToast('Removed item from Wishlist', 'info');
    } else {
      updated = [...wishlist, productId];
      showToast('Added item to Wishlist', 'success');
    }
    setWishlist(updated);
    try {
      localStorage.setItem('styluxe_wishlist', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        currency,
        setCurrency,
        settings,
        wishlist,
        toggleWishlist,
        toast,
        showToast,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
