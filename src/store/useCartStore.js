import { create } from 'zustand';

export const useCartStore = create((set, get) => ({
  items: [],
  add: (item) =>
    set((state) => {
      const key = `${item.stallId}:${item.name}`;
      const existing = state.items.find((cartItem) => `${cartItem.stallId}:${cartItem.name}` === key);
      if (existing) {
        return {
          items: state.items.map((cartItem) =>
            `${cartItem.stallId}:${cartItem.name}` === key
              ? { ...cartItem, quantity: Number(cartItem.quantity || 1) + Number(item.quantity || 1) }
              : cartItem
          )
        };
      }
      return { items: [...state.items, { ...item, quantity: Number(item.quantity || 1) }] };
    }),
  remove: (index) => set((state) => ({ items: state.items.filter((_, itemIndex) => itemIndex !== index) })),
  clear: () => set({ items: [] }),
  total: () => get().items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0)
}));
