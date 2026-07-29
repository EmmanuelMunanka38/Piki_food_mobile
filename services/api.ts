import { router } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

export const API_ORIGIN = process.env.EXPO_PUBLIC_API_URL || 'https://zup-backend-dhkw.onrender.com';
export const BASE_URL = `${API_ORIGIN}/api`;

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

class ApiError extends Error {
  status: number;
  body: any;
  constructor(status: number, body: any) {
    super(`API Error ${status}`);
    this.status = status;
    this.body = body;
  }
}

async function refreshTokenFlow(): Promise<string> {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });
  }

  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) {
    useAuthStore.getState().logout();
    router.replace('/onboarding');
    throw new Error('No refresh token');
  }

  isRefreshing = true;
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) throw new Error('Refresh failed');
    const json = await res.json();
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = json.data;

    useAuthStore.getState().setToken(newAccessToken);
    useAuthStore.getState().setRefreshToken(newRefreshToken);

    processQueue(null, newAccessToken);
    return newAccessToken;
  } catch (refreshError) {
    processQueue(refreshError, null);
    useAuthStore.getState().logout();
    router.replace('/onboarding');
    throw refreshError;
  } finally {
    isRefreshing = false;
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: any,
  retryCount = 0,
): Promise<{ data: T }> {
  const url = `${BASE_URL}${path}`;
  const token = useAuthStore.getState().token;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 429 && retryCount < 3) {
      const delay = 1000 * Math.pow(2, retryCount);
      await new Promise((r) => setTimeout(r, delay));
      return request<T>(method, path, body, retryCount + 1);
    }

    const isPublicAuthRoute =
      path.includes('/auth/login') ||
      path.includes('/auth/send-otp') ||
      path.includes('/auth/verify-otp') ||
      path.includes('/auth/refresh');

    if (response.status === 401 && !isPublicAuthRoute) {
      const newToken = await refreshTokenFlow();
      headers['Authorization'] = `Bearer ${newToken}`;
      const retryRes = await fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!retryRes.ok) {
        throw new ApiError(retryRes.status, await retryRes.json().catch(() => ({})));
      }
      const json = await retryRes.json();
      return { data: json };
    }

    if (!response.ok) {
      throw new ApiError(response.status, await response.json().catch(() => ({})));
    }

    const json = await response.json();
    return { data: json };
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export const api = {
  get<T>(path: string) {
    return request<T>('GET', path);
  },
  post<T>(path: string, body?: any) {
    return request<T>('POST', path, body);
  },
  put<T>(path: string, body?: any) {
    return request<T>('PUT', path, body);
  },
  delete<T>(path: string) {
    return request<T>('DELETE', path);
  },
};
