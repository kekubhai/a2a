import { Redis } from '@upstash/redis';

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

let client: Redis | null = null;

export function getRedisClient(): Redis {
  if (!client) {
    if (!UPSTASH_URL || !UPSTASH_TOKEN) {
      throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required');
    }

    client = new Redis({
      url: UPSTASH_URL,
      token: UPSTASH_TOKEN,
    });
  }
  return client;
}

export async function closeRedis(): Promise<void> {
  client = null;
}
