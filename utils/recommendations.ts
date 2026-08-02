import { AsyncStorage } from '@/utils/storage';

const SEED_KEY_PREFIX = 'recommendation-seed:';

function keyFor(userId?: string | null): string {
  return `${SEED_KEY_PREFIX}${userId || 'guest'}`;
}

export async function getRecommendationSeed(userId?: string | null): Promise<number> {
  const key = keyFor(userId);
  const existing = await AsyncStorage.getItem(key);
  if (existing !== null) {
    const parsed = parseInt(existing, 10);
    if (!Number.isNaN(parsed)) return parsed;
  }
  const seed = Math.floor(Math.random() * 2 ** 31);
  await AsyncStorage.setItem(key, String(seed));
  return seed;
}

export async function newRecommendationSession(userId?: string | null): Promise<number> {
  const key = keyFor(userId);
  const seed = Math.floor(Math.random() * 2 ** 31);
  await AsyncStorage.setItem(key, String(seed));
  return seed;
}
