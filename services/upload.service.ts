import { API_ORIGIN, BASE_URL } from './api';
import { useAuthStore } from '@/store/authStore';

const toAbsoluteUrl = (url: string) => {
  if (/^https?:\/\//i.test(url)) return url;
  return new URL(url, API_ORIGIN).toString();
};

export const uploadService = {
  async uploadImage(uri: string): Promise<string> {
    const formData = new FormData();
    const filename = uri.split('/').pop() || 'photo.jpg';
    const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

    formData.append('image', {
      uri,
      name: filename,
      type: mimeType,
    } as any);

    formData.append('type', 'menu');

    const token = useAuthStore.getState().token;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      headers,
      body: formData as any,
    });

    if (!response.ok) {
      throw new Error('Image upload failed');
    }

    const json = await response.json().catch(() => ({}));
    const url = json?.data?.url || json?.url || '';
    return toAbsoluteUrl(url);
  },
};
