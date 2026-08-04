import { api } from './api';
import { Order, TrackedOrder, CartItem, PaymentMethod, Address, ApiResponse } from '@/types';

interface PlaceOrderParams {
  restaurantId: string;
  items: CartItem[];
  paymentMethod: PaymentMethod;
  deliveryAddress: Address;
  specialInstructions?: string;
}

export const ordersService = {
  async placeOrder(params: PlaceOrderParams): Promise<Order> {
    const res = await api.post<ApiResponse<Order>>('/orders', {
      restaurantId: params.restaurantId,
      items: params.items.map((i) => ({
        menuItemId: i.menuItem.id,
        quantity: i.quantity,
        specialInstructions: i.specialInstructions,
      })),
      paymentMethod: params.paymentMethod,
      deliveryAddress: params.deliveryAddress,
      specialInstructions: params.specialInstructions,
    });
    return res.data.data;
  },

  async getHistory(): Promise<Order[]> {
    const res = await api.get<ApiResponse<Order[]>>('/orders');
    return res.data.data;
  },

  async deleteAll(): Promise<number> {
    const res = await api.delete<ApiResponse<{ deleted: number }>>('/orders');
    return res.data.data.deleted;
  },

  async deleteOrder(id: string): Promise<void> {
    await api.delete(`/orders/${id}`);
  },

  async getById(id: string): Promise<Order> {
    const res = await api.get<ApiResponse<Order>>(`/orders/${id}`);
    return res.data.data;
  },

  async trackOrder(id: string): Promise<TrackedOrder> {
    const res = await api.get<ApiResponse<TrackedOrder>>(`/orders/${id}/track`);
    return res.data.data;
  },

  async cancelOrder(id: string): Promise<void> {
    await api.post(`/orders/${id}/cancel`);
  },

  async updateOrderStatus(orderId: string, status: string): Promise<void> {
    await api.put(`/orders/${orderId}/status`, { status });
  },

  async reorder(orderId: string): Promise<Order> {
    const res = await api.post<ApiResponse<Order>>(`/orders/${orderId}/reorder`);
    return res.data.data;
  },

  async assignDriver(orderId: string, driverId: string): Promise<Order> {
    const res = await api.put<ApiResponse<Order>>(`/orders/${orderId}/assign-driver`, { driverId });
    return res.data.data;
  },
};
