import { api } from './api';
import { DeliveryRequest, ApiResponse, Coordinate } from '@/types';

interface DriverDashboardData {
  todayOrders: number;
  dailyRevenue: number;
  orderGrowth: number;
  revenueGrowth: number;
  totalOrders: number;
  totalRevenue: number;
}

export const driverService = {
  async getRequests(): Promise<DeliveryRequest[]> {
    const res = await api.get<ApiResponse<DeliveryRequest[]>>('/driver/requests');
    return res.data.data;
  },

  async acceptRequest(id: string): Promise<DeliveryRequest> {
    const res = await api.post<ApiResponse<DeliveryRequest>>(`/driver/requests/${id}/accept`);
    return res.data.data;
  },

  async getActive(): Promise<DeliveryRequest | null> {
    const res = await api.get<ApiResponse<DeliveryRequest | null>>('/driver/active');
    return res.data.data;
  },

  async getDashboard(): Promise<DriverDashboardData> {
    const res = await api.get<ApiResponse<DriverDashboardData>>('/driver/dashboard');
    return res.data.data;
  },

  async updateOrderStatus(orderId: string, status: string): Promise<void> {
    await api.put(`/orders/${orderId}/status`, { status });
  },

  async sendLocation(location: Coordinate): Promise<void> {
    try {
      await api.post('/driver/location', location);
    } catch {}
  },
};
