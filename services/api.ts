// This is testing phase fix 101 , we can un comment it later 

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

export const API_ORIGIN = process.env.EXPO_PUBLIC_API_URL || 'https://zup-backend-dhkw.onrender.com';
export const BASE_URL = `${API_ORIGIN}/api`;

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};
// this is going to be changed 
/*
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);
*/
// new api interceptor chnage :
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // 2. Prevent sending stale/invalid Authorization headers on public routes
      delete config.headers.Authorization;
    }
    return config;
  },
  (error) => Promise.reject(error),
);


// changing interceptor response logic :
/*
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 429 && !originalRequest._retry429) {
      originalRequest._retry429 = true;
      const delay = 1000 * Math.pow(2, (originalRequest._retryCount || 0));
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
      if (originalRequest._retryCount > 3) return Promise.reject(error);
      await new Promise((r) => setTimeout(r, delay));
      return api(originalRequest);
    }

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = useAuthStore.getState().refreshToken;
    if (!refreshToken) {
      isRefreshing = false;
      useAuthStore.getState().logout();
      router.replace('/onboarding');
      return Promise.reject(error);
    }

    try {
      const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = data.data;

      useAuthStore.getState().setToken(newAccessToken);
      useAuthStore.getState().setRefreshToken(newRefreshToken);

      processQueue(null, newAccessToken);

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      useAuthStore.getState().logout();
      router.replace('/onboarding');
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);*/

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // Safety guard if error.config is undefined (e.g., network error before config exists)
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // 1. FIX: 429 Retry Logic using count instead of a boolean lock
    if (error.response?.status === 429) {
      originalRequest._retry429Count = originalRequest._retry429Count || 0;

      if (originalRequest._retry429Count < 3) {
        originalRequest._retry429Count += 1;
        // Exponential backoff: 1s, 2s, 4s delay
        const delay = 1000 * Math.pow(2, originalRequest._retry429Count - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return api(originalRequest);
      }
    }

    // 2. FIX: Exclude public auth endpoints from triggering 401 token refresh logic
    const requestUrl = originalRequest.url || '';
    const isPublicAuthRoute =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/send-otp') ||
      requestUrl.includes('/auth/verify-otp') ||
      requestUrl.includes('/auth/refresh');

    if (error.response?.status !== 401 || originalRequest._retry || isPublicAuthRoute) {
      return Promise.reject(error);
    }

    // 3. Handle concurrent requests during token refresh
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = useAuthStore.getState().refreshToken;
    if (!refreshToken) {
      isRefreshing = false;
      useAuthStore.getState().logout();
      router.replace('/onboarding');
      return Promise.reject(error);
    }

    try {
      const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = data.data;

      useAuthStore.getState().setToken(newAccessToken);
      useAuthStore.getState().setRefreshToken(newRefreshToken);

      processQueue(null, newAccessToken);

      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      useAuthStore.getState().logout();
      router.replace('/onboarding');
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);


