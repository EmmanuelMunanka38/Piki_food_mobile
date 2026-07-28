import { api } from './api';
/**
 * I think the auth erros is from here this auth api implementation .
 */
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
    const { data } = await api.post('/auth/verify-otp', body);
    return {
      user: data.data.user,
      accessToken: data.data.accessToken,
      refreshToken: data.data.refreshToken,
    };
  },

  async refreshToken(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    const { data } = await api.post('/auth/refresh', { refreshToken: token });
    return data.data;
  },

  async getProfile(): Promise<any> {
    const { data } = await api.get('/auth/profile');
    return data.data;
  },

  async updateProfile(data: { name?: string; email?: string; avatar?: string }): Promise<any> {
    const { data: res } = await api.put('/auth/profile', data);
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
