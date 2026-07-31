import { QueryClient } from '@tanstack/react-query';

const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);
const MAX_RETRIES = 2;
const BASE_DELAY = 1000;
const MAX_DELAY = 30000;

function getRetryDelay(failureCount: number, error: unknown) {
  const status = (error as { status?: number })?.status;
  if (status === 429) {
    const retryAfter = (error as { body?: { retryAfter?: number | string } })?.body?.retryAfter;
    const seconds = retryAfter ? Number(retryAfter) : 0;
    if (Number.isFinite(seconds) && seconds > 0) {
      return Math.min(seconds * 1000, MAX_DELAY);
    }
  }
  return Math.min(BASE_DELAY * 2 ** failureCount, MAX_DELAY);
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: (failureCount, error) => {
        if (failureCount >= MAX_RETRIES) return false;
        return isRetryableError(error);
      },
      retryDelay: getRetryDelay,
      retryOnMount: true,
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

export function isRetryableError(error: unknown) {
  const status = (error as { status?: number })?.status;
  return status === undefined || RETRYABLE_STATUS.has(status);
}