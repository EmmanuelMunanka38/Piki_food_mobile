import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AsyncStorage } from '@/utils/storage';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  setRefreshToken: (token: string) => void;
  socialError: string | null;
  setSocialError: (message: string | null) => void;
  sendOtp: (email: string, phone: string, role?: string) => Promise<void>;
  verifyOTP: (email: string, code: string, name?: string, role?: string) => Promise<void>;
  socialLogin: (idToken: string) => Promise<void>;
  updateProfile: (data: { name?: string; email?: string; avatar?: string }) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isLoading: false,
      socialError: null,

      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setRefreshToken: (refreshToken) => set({ refreshToken }),
      setSocialError: (message) => set({ socialError: message }),

      updateProfile: async (data: { name?: string; email?: string; avatar?: string }) => {
        try {
          const { authService } = await import('@/services/auth.service');
          const updated = await authService.updateProfile(data);
          set({ user: { ...get().user, ...updated } as any });
        } catch (err: any) {
          const message = err?.response?.data?.message || 'Failed to update profile';
          throw new Error(message);
        }
      },
      sendOtp: async (email: string, phone: string, role?: string) => {
        set({ isLoading: true });
        try {
          const { authService } = await import('@/services/auth.service');
          await authService.sendOtp(email, phone, role);
          set({ isLoading: false });
        } catch (err: any) {
          set({ isLoading: false });
          const message =
            err?.response?.data?.message ||
            err?.response?.data?.errors?.[0]?.message ||
            'Failed to send OTP';
          throw new Error(message);
        }
      },

      verifyOTP: async (email: string, code: string, name?: string, role?: string) => {
        set({ isLoading: true });
        try {
          const { authService } = await import('@/services/auth.service');
          const { user, accessToken, refreshToken } = await authService.verifyOTP(email, code, name, role);
          set({ user, token: accessToken, refreshToken, isLoading: false });
          const { useCartStore } = await import('@/store/cartStore');
          useCartStore.getState().loadCart();
          const { newRecommendationSession } = await import('@/utils/recommendations');
          await newRecommendationSession(user.id);
        } catch (err: any) {
          set({ isLoading: false });
          const message =
            err?.response?.data?.message ||
            err?.response?.data?.errors?.[0]?.message ||
            'Verification failed';
          throw new Error(message);
        }
      },

      socialLogin: async (idToken: string) => {
        set({ isLoading: true, socialError: null });
        try {
          const { authService } = await import('@/services/auth.service');
          const { user, accessToken, refreshToken } = await authService.socialLogin(idToken);
          set({ user, token: accessToken, refreshToken, isLoading: false, socialError: null });
          const { useCartStore } = await import('@/store/cartStore');
          useCartStore.getState().loadCart();
          const { newRecommendationSession } = await import('@/utils/recommendations');
          await newRecommendationSession(user.id);
        } catch (err: any) {
          set({ isLoading: false });
          const message =
            err?.body?.message ||
            err?.response?.data?.message ||
            err?.response?.data?.errors?.[0]?.message ||
            'Social login failed';
          throw new Error(message);
        }
      },

      logout: async () => {
        try {
          const { authService } = await import('@/services/auth.service');
          await authService.logout();
        } catch {
          // non-critical
        }
        set({ user: null, token: null, refreshToken: null });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
      }),
    },
  ),
);
