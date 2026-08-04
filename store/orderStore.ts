import { create } from 'zustand';
import { Order, TrackedOrder } from '@/types';
import { ordersService } from '@/services/orders.service';

interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  trackedOrder: TrackedOrder | null;
  isLoading: boolean;

  loadOrders: () => Promise<void>;
  loadCurrentOrder: (id: string) => Promise<void>;
  loadTrackedOrder: (id: string) => Promise<void>;
  cancelOrder: (id: string) => Promise<void>;
  deleteOrders: (ids: string[]) => Promise<void>;
  setCurrentOrder: (order: Order | null) => void;
  clearTrackedOrder: () => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  orders: [],
  currentOrder: null,
  trackedOrder: null,
  isLoading: false,

  loadOrders: async () => {
    set({ isLoading: true });
    try {
      const orders = await ordersService.getHistory();
      set({ orders, isLoading: false });
    } catch (error) {
      console.error('Failed to load orders:', error);
      set({ isLoading: false });
    }
  },

  loadCurrentOrder: async (id) => {
    set({ isLoading: true });
    try {
      const order = await ordersService.getById(id);
      set({ currentOrder: order, isLoading: false });
    } catch (error) {
      console.error('Failed to load order:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  loadTrackedOrder: async (id) => {
    try {
      const tracked = await ordersService.trackOrder(id);
      set({ trackedOrder: tracked });
    } catch (error) {
      console.error('Failed to track order:', error);
    }
  },

  cancelOrder: async (id) => {
    await ordersService.cancelOrder(id);
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === id ? { ...o, status: 'cancelled' as const } : o
      ),
      currentOrder:
        state.currentOrder?.id === id
          ? { ...state.currentOrder, status: 'cancelled' as const }
          : state.currentOrder,
    }));
  },

  deleteOrders: async (ids: string[]) => {
    await Promise.all(ids.map((id) => ordersService.deleteOrder(id)));
    set((state) => ({
      orders: state.orders.filter((o) => !ids.includes(o.id)),
      currentOrder: state.currentOrder && ids.includes(state.currentOrder.id) ? null : state.currentOrder,
    }));
  },

  setCurrentOrder: (order) => set({ currentOrder: order }),

  clearTrackedOrder: () => set({ trackedOrder: null }),
}));
