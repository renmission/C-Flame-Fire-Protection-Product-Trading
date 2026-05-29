"use client";

import { create } from "zustand";

export interface CartItem {
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface OrderCartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "subtotal">) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
}

export const useOrderCartStore = create<OrderCartState>((set, get) => ({
  items: [],

  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.productId === item.productId);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === item.productId
              ? {
                  ...i,
                  quantity: i.quantity + item.quantity,
                  subtotal: (i.quantity + item.quantity) * i.unitPrice,
                }
              : i
          ),
        };
      }
      return {
        items: [
          ...state.items,
          { ...item, subtotal: item.quantity * item.unitPrice },
        ],
      };
    }),

  removeItem: (productId) =>
    set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),

  updateQuantity: (productId, quantity) => {
    const qty = Math.max(1, quantity);
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId ? { ...i, quantity: qty, subtotal: qty * i.unitPrice } : i
      ),
    }));
  },

  clearCart: () => set({ items: [] }),

  total: () => get().items.reduce((sum, i) => sum + i.subtotal, 0),
}));
