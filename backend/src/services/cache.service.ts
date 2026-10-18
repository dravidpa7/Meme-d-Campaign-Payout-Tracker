import { getRedis } from '../config/redis';
import { logger } from '../config/logger';

const LIVE_CAMPAIGNS_KEY = 'campaigns:live';
const LIVE_CAMPAIGNS_TTL_SECONDS = 30;

/**
 * Thin Redis wrapper. Every method degrades to a no-op if Redis is missing or
 * down, so a cache outage can never break a request.
 */
async function get<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    const raw = await redis.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch (err) {
    logger.warn({ err, key }, 'cache get failed');
    return null;
  }
}

async function set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (err) {
    logger.warn({ err, key }, 'cache set failed');
  }
}

async function del(key: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.del(key);
  } catch (err) {
    logger.warn({ err, key }, 'cache delete failed');
  }
}

export const cacheService = {
  getLiveCampaigns: <T>() => get<T>(LIVE_CAMPAIGNS_KEY),
  setLiveCampaigns: (data: unknown) => set(LIVE_CAMPAIGNS_KEY, data, LIVE_CAMPAIGNS_TTL_SECONDS),
  invalidateLiveCampaigns: () => del(LIVE_CAMPAIGNS_KEY),
};
