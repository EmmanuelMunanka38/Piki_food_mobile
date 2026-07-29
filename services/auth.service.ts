import { api } from './api';

export const authService = {
  async sendOtp(email: string, phone: string, role?: string): Promise<void> {
    await api.post('/auth/send-otp', { email, phone, role });
  },

  async verifyOTP(
    email: string,
    code: string,
    name?: string,
    role?: string,
  ): Promise<{ user: any; accessToken: string; refreshToken: string }> {
    const body: any = { email, code };
    if (name) body.name = name;
    if (role) body.role = role;
    const res = await api.post<any>('/auth/verify-otp', body);
    return {
      user: res.data.data.user,
      accessToken: res.data.data.accessToken,
      refreshToken: res.data.data.refreshToken,
    };
  },

  async refreshToken(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    const res = await api.post<any>('/auth/refresh', { refreshToken: token });
    return res.data.data;
  },

  async getProfile(): Promise<any> {
    const res = await api.get<any>('/auth/profile');
    return res.data.data;
  },

  async updateProfile(data: { name?: string; email?: string; avatar?: string }): Promise<any> {
    const res = await api.put<any>('/auth/profile', data);
    return res.data;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch {
      // non-critical — clear local state regardless
    }
  },
};
