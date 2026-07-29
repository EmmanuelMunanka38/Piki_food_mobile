import { api } from './api';
import { Restaurant, MenuItem, Category, ApiResponse, User } from '@/types';

export const restaurantsService = {
  async create(data: Partial<Restaurant>): Promise<Restaurant> {
    const res = await api.post<ApiResponse<Restaurant>>('/restaurants', data);
    return res.data.data;
  },

  async getAll(): Promise<Restaurant[]> {
    const res = await api.get<ApiResponse<Restaurant[]>>('/restaurants');
    return res.data.data;
  },

  async getByOwner(ownerId: string): Promise<Restaurant[]> {
    const res = await api.get<ApiResponse<Restaurant[]>>(`/restaurants?ownerId=${ownerId}`);
    return res.data.data;
  },

  async getById(id: string): Promise<Restaurant> {
    const res = await api.get<ApiResponse<any>>(`/restaurants/${id}`);
    return res.data.data;
  },

  async getMenu(restaurantId: string, includeUnavailable = false): Promise<MenuItem[]> {
    const params = includeUnavailable ? '?includeUnavailable=true' : '';
    const res = await api.get<ApiResponse<MenuItem[]>>(`/restaurants/${restaurantId}/menu${params}`);
    return res.data.data;
  },

  async getCategories(): Promise<Category[]> {
    const res = await api.get<ApiResponse<Category[]>>('/categories');
    return res.data.data;
  },

  async getFeatured(): Promise<Restaurant[]> {
    const res = await api.get<ApiResponse<Restaurant[]>>('/restaurants/featured');
    return res.data.data;
  },

  async createMenuItem(restaurantId: string, item: Partial<MenuItem>): Promise<MenuItem> {
    const res = await api.post<ApiResponse<MenuItem>>(`/restaurants/${restaurantId}/menu`, item);
    return res.data.data;
  },

  async updateMenuItem(menuId: string, updates: Partial<MenuItem>): Promise<MenuItem> {
    const res = await api.put<ApiResponse<MenuItem>>(`/restaurants/menu/${menuId}`, updates);
    return res.data.data;
  },

  async deleteMenuItem(menuId: string): Promise<void> {
    await api.delete(`/restaurants/menu/${menuId}`);
  },

  async update(id: string, data: Partial<Restaurant>): Promise<Restaurant> {
    const res = await api.put<ApiResponse<Restaurant>>(`/restaurants/${id}`, data);
    return res.data.data;
  },

  async getDrivers(): Promise<User[]> {
    const res = await api.get<ApiResponse<User[]>>('/users/drivers');
    return res.data.data;
  },
};
