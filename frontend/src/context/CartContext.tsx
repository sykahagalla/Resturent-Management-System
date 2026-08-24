import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { CartItem, FoodItem } from '../types';

interface CartContextType {
  items: CartItem[];
  addItem: (foodItem: FoodItem, quantity?: number) => void;
  removeItem: (foodItemId: string) => void;
  updateQuantity: (foodItemId: string, quantity: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTax: () => number;
  getTotal: (discount?: number) => number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem('cart');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addItem = (foodItem: FoodItem, quantity: number = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.foodItem._id === foodItem._id);
      if (existing) {
        return prev.map((item) =>
          item.foodItem._id === foodItem._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { foodItem, quantity }];
    });
  };

  const removeItem = (foodItemId: string) => {
    setItems((prev) => prev.filter((item) => item.foodItem._id !== foodItemId));
  };

  const updateQuantity = (foodItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(foodItemId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.foodItem._id === foodItemId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem('cart');
  };

  const getSubtotal = () => items.reduce((sum, item) => sum + item.foodItem.price * item.quantity, 0);
  const getTax = () => Math.round(getSubtotal() * 0.05 * 100) / 100;
  const getTotal = (discount: number = 0) => Math.round((getSubtotal() + getTax() - discount) * 100) / 100;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, updateQuantity, clearCart,
      getSubtotal, getTax, getTotal, itemCount,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
