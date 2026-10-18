import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

let client: Redis | null = null;

/** Redis is optional: without REDIS_URL the cache layer is a no-op. */
export function initRedis(): Redis | null {
  if (!env.REDIS_URL || client) return client;

  client = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 1, enableOfflineQueue: false });
  client.on('error', (err) => logger.warn({ err: err.message }, 'Redis error'));
  client.on('ready', () => logger.info('Redis connected'));
  return client;
}

export function getRedis(): Redis | null {
  return client;
}

export async function closeRedis(): Promise<void> {
  if (client) {
    await client.quit().catch(() => undefined);
    client = null;
  }
}
