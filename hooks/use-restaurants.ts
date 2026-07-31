import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { restaurantsService } from '@/services/restaurants.service';
import { Restaurant, MenuItem } from '@/types';

export const restaurantKeys = {
  all: ['restaurants'] as const,
  lists: () => [...restaurantKeys.all, 'list'] as const,
  list: () => [...restaurantKeys.lists(), 'all'] as const,
  byOwner: (ownerId: string) => [...restaurantKeys.lists(), { ownerId }] as const,
  featured: () => [...restaurantKeys.all, 'featured'] as const,
  details: () => [...restaurantKeys.all, 'detail'] as const,
  detail: (id: string) => [...restaurantKeys.details(), id] as const,
  menus: () => [...restaurantKeys.all, 'menu'] as const,
  menu: (id: string) => [...restaurantKeys.menus(), id] as const,
};

export const categoryKeys = {
  all: ['categories'] as const,
  list: () => [...categoryKeys.all, 'list'] as const,
};

export function useRestaurants() {
  return useQuery({
    queryKey: restaurantKeys.list(),
    queryFn: restaurantsService.getAll,
  });
}

export function useRestaurant(id: string) {
  return useQuery({
    queryKey: restaurantKeys.detail(id),
    queryFn: () => restaurantsService.getById(id),
    enabled: Boolean(id),
  });
}

export function useRestaurantMenu(restaurantId: string) {
  return useQuery({
    queryKey: restaurantKeys.menu(restaurantId),
    queryFn: () => restaurantsService.getMenu(restaurantId, true),
    enabled: Boolean(restaurantId),
  });
}

export function useFeaturedRestaurants() {
  return useQuery({
    queryKey: restaurantKeys.featured(),
    queryFn: restaurantsService.getFeatured,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: restaurantsService.getCategories,
  });
}

const MENU_FETCH_DELAY = 400;

export function useRestaurantMenus(restaurants: Restaurant[]) {
  const queryClient = useQueryClient();
  const processedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const missing = restaurants.filter(
      (r) => !r.menu?.length && !processedRef.current.has(r.id)
    );
    if (missing.length === 0) return;

    let cancelled = false;

    const run = async () => {
      for (const restaurant of missing) {
        if (cancelled) return;
        processedRef.current.add(restaurant.id);
        try {
          const menu = await restaurantsService.getMenu(restaurant.id, true);
          if (cancelled) return;
          queryClient.setQueryData<MenuItem[]>(restaurantKeys.menu(restaurant.id), menu);
          queryClient.setQueryData<Restaurant[]>(restaurantKeys.list(), (old) =>
            old?.map((r) => (r.id === restaurant.id && !r.menu?.length ? { ...r, menu } : r)) ?? old
          );
        } catch (error) {
          console.warn(`Failed to load menu for ${restaurant.id}:`, error);
        }
        await new Promise((resolve) => setTimeout(resolve, MENU_FETCH_DELAY));
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [restaurants, queryClient]);

  useEffect(() => {
    return () => processedRef.current.clear();
  }, []);
}

export function getErrorMessage(error: unknown, fallback: string) {
  if (!error) return null;
  const bodyMessage = (error as { body?: { message?: string } })?.body?.message;
  if (bodyMessage) return bodyMessage;
  const message = (error as { message?: string })?.message;
  if (message && message !== 'Error') return message;
  return fallback;
}
