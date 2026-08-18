"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product, unitPriceForQuantity } from "./products";

export type CartItem = Product & {
  quantity: number;
};

type CartState = {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  setFlavorQuantities: (selections: { product: Product; quantity: number }[]) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, quantity = 1) => {
        const items = get().items;
        const existing = items.find((i) => i.id === product.id);

        if (existing) {
          set({
            items: items.map((i) =>
              i.id === product.id
                ? { ...i, quantity: i.quantity + quantity }
                : i
            ),
          });
        } else {
          set({ items: [...items, { ...product, quantity }] });
        }
      },

      /** Substitui o carrinho pelas seleções do kit (montagem) */
      setFlavorQuantities: (selections) => {
        const items = selections
          .filter((s) => s.quantity > 0)
          .map((s) => ({ ...s.product, quantity: s.quantity }));
        set({ items });
      },

      removeItem: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) });
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.id === id ? { ...i, quantity } : i
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((acc, i) => acc + i.quantity, 0),

      totalPrice: () => {
        const totalQty = get().totalItems();
        const unit = unitPriceForQuantity(totalQty);
        // preço progressivo baseado na quantidade total de marmitas
        return totalQty * unit;
      },
    }),
    {
      name: "vcmarmitas-cart",
    }
  )
);
