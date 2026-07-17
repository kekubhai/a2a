import { getRedisClient } from './client.js';

const TASK_LOCK_PREFIX = 'a2a:task:lock:';
const TASK_LOCK_TTL_SECONDS = 30;

export async function acquireTaskLock(
  taskId: string,
  holderId: string,
  ttlSeconds: number = TASK_LOCK_TTL_SECONDS,
): Promise<boolean> {
  const redis = getRedisClient();
  const key = `${TASK_LOCK_PREFIX}${taskId}`;
  const result = await redis.set(key, holderId, { ex: ttlSeconds, nx: true });
  return result === 'OK';
}

export async function releaseTaskLock(taskId: string, holderId: string): Promise<boolean> {
  const redis = getRedisClient();
  const key = `${TASK_LOCK_PREFIX}${taskId}`;

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

export async function refreshTaskLock(
  taskId: string,
  holderId: string,
  ttlSeconds: number = TASK_LOCK_TTL_SECONDS,
): Promise<boolean> {
  const redis = getRedisClient();
  const key = `${TASK_LOCK_PREFIX}${taskId}`;

  const script = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("expire", KEYS[1], ARGV[2])
    else
      return 0
    end
  `;

  const result = await redis.eval(script, [key], [holderId, ttlSeconds.toString()]);
  return result === 1;
}

export async function isTaskLocked(taskId: string): Promise<boolean> {
  const redis = getRedisClient();
  const key = `${TASK_LOCK_PREFIX}${taskId}`;
  const exists = await redis.exists(key);
  return exists === 1;
}
