import { api } from './api';
import { Restaurant, MenuItem, Category, ApiResponse, User, FoodItem, Promotion } from '@/types';

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

  async getPromotions(): Promise<Promotion[]> {
    const res = await api.get<ApiResponse<Promotion[]>>('/promotions');
    return res.data.data;
  },

  async searchFood(query: string): Promise<FoodItem[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const restaurants = await this.getAll();
    const items = await this.fetchFoodItems(restaurants);
    return items.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.restaurant.name.toLowerCase().includes(q) ||
        m.restaurant.cuisine.toLowerCase().includes(q)
    );
  },

  async getPopularFoods(limit = 8): Promise<FoodItem[]> {
    let restaurants: Restaurant[] = [];
    try {
      restaurants = await this.getFeatured();
    } catch {
      restaurants = [];
    }
    if (restaurants.length === 0) {
      const all = await this.getAll();
      restaurants = all.slice(0, 5);
    }
    const items = await this.fetchFoodItems(restaurants);
    return items
      .sort((a, b) => Number(Boolean(b.isPopular)) - Number(Boolean(a.isPopular)))
      .slice(0, limit);
  },

  async fetchFoodItems(restaurants: Restaurant[]): Promise<FoodItem[]> {
    const menuMap = new Map<string, MenuItem[]>();
    const queue = [...restaurants];
    const CONCURRENCY = 3;

    async function worker() {
      while (queue.length > 0) {
        const r = queue.shift()!;
        try {
          const menu = await api.get<ApiResponse<MenuItem[]>>(
            `/restaurants/${r.id}/menu?includeUnavailable=true`
          );
          menuMap.set(r.id, menu.data.data);
        } catch {
          menuMap.set(r.id, []);
        }
      }
    }

    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, restaurants.length) }, () => worker())
    );

    const items: FoodItem[] = [];
    for (const r of restaurants) {
      for (const m of menuMap.get(r.id) || []) {
        items.push({ ...m, restaurant: r });
      }
    }
    return items;
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
