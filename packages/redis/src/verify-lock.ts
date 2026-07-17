import { getRedisClient } from './client.js';

const VERIFY_LOCK_PREFIX = 'a2a:verify:lock:';
const VERIFY_QUEUE_PREFIX = 'a2a:verify:queue:';
const VERIFY_LOCK_TTL_SECONDS = 60;

export async function acquireVerifyLock(
  taskId: string,
  holderId: string,
  ttlSeconds: number = VERIFY_LOCK_TTL_SECONDS,
): Promise<boolean> {
  const redis = getRedisClient();
  const key = `${VERIFY_LOCK_PREFIX}${taskId}`;
  const result = await redis.set(key, holderId, { ex: ttlSeconds, nx: true });
  return result === 'OK';
}

export async function releaseVerifyLock(taskId: string, holderId: string): Promise<boolean> {
  const redis = getRedisClient();
  const key = `${VERIFY_LOCK_PREFIX}${taskId}`;

  const script = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;

  const result = await redis.eval(script, [key], [holderId]);
  return result === 1;
}

export async function enqueueVerification(taskId: string): Promise<void> {
  const redis = getRedisClient();
  const key = `${VERIFY_QUEUE_PREFIX}pending`;
  await redis.sadd(key, taskId);
}

export async function dequeueVerification(): Promise<string | null> {
  const redis = getRedisClient();
  const key = `${VERIFY_QUEUE_PREFIX}pending`;
  return await redis.spop(key) ?? null;
}

export async function getVerifyQueueSize(): Promise<number> {
  const redis = getRedisClient();
  const key = `${VERIFY_QUEUE_PREFIX}pending`;
  return await redis.scard(key);
}
