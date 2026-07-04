import { create } from 'zustand';
import { CartItem, Order } from '../models/order';
import { mmkvStorage } from '../storage/mmkv';

interface CartState {
  items: CartItem[];
  pendingOrders: Order[];
  targetNodeId: string | null;
  targetNodeName: string | null;
  
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  setTargetNode: (nodeId: string | null, nodeName: string | null) => void;
  
  // Optimistic Orders state
  addPendingOrder: (order: Order) => void;
  removePendingOrder: (orderId: string) => void;
  updatePendingOrderStatus: (orderId: string, status: Order['status']) => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: mmkvStorage.getObject<CartItem[]>('@cart_items') || [],
  pendingOrders: mmkvStorage.getObject<Order[]>('@pending_orders') || [],
  targetNodeId: mmkvStorage.getString('@target_node_id'),
  targetNodeName: mmkvStorage.getString('@target_node_name'),

  addItem: (product) => {
    const prev = get().items;
    const existing = prev.find((i) => i.id === product.id);
    let updated: CartItem[];
    if (existing) {
      updated = prev.map((i) =>
        i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
      );
    } else {
      updated = [...prev, { ...product, quantity: 1 }];
    }
    mmkvStorage.setObject('@cart_items', updated);
    set({ items: updated });
  },

  removeItem: (itemId) => {
    const prev = get().items;
    const existing = prev.find((i) => i.id === itemId);
    let updated: CartItem[];
    if (existing && existing.quantity > 1) {
      updated = prev.map((i) =>
        i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
      );
    } else {
      updated = prev.filter((i) => i.id !== itemId);
    }
    mmkvStorage.setObject('@cart_items', updated);
    set({ items: updated });
  },

  clearCart: () => {
    mmkvStorage.delete('@cart_items');
    set({ items: [] });
  },

  setTargetNode: (nodeId, nodeName) => {
    if (nodeId) mmkvStorage.set('@target_node_id', nodeId);
    else mmkvStorage.delete('@target_node_id');
    
    if (nodeName) mmkvStorage.set('@target_node_name', nodeName);
    else mmkvStorage.delete('@target_node_name');

    set({ targetNodeId: nodeId, targetNodeName: nodeName });
  },

  addPendingOrder: (order) => {
    const updated = [order, ...get().pendingOrders];
    mmkvStorage.setObject('@pending_orders', updated);
    set({ pendingOrders: updated });
  },

  removePendingOrder: (orderId) => {
    const updated = get().pendingOrders.filter((o) => o.id !== orderId);
    mmkvStorage.setObject('@pending_orders', updated);
    set({ pendingOrders: updated });
  },

  updatePendingOrderStatus: (orderId, status) => {
    const updated = get().pendingOrders.map((o) =>
      o.id === orderId ? { ...o, status } : o
    );
    mmkvStorage.setObject('@pending_orders', updated);
    set({ pendingOrders: updated });
  }
}));
