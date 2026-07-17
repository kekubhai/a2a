import { getRedisClient } from './client.js';

const NOTIFY_PREFIX = 'a2a:notify:';
const NOTIFY_TTL_SECONDS = 300;

export async function pushNotifications(
  agentIds: string[],
  notification: unknown,
): Promise<void> {
  const redis = getRedisClient();
  const pipeline = redis.pipeline();

  for (const agentId of agentIds) {
    const key = `${NOTIFY_PREFIX}${agentId}`;
    pipeline.lpush(key, JSON.stringify(notification));
    pipeline.expire(key, NOTIFY_TTL_SECONDS);
  }

  await pipeline.exec();
}

export async function getNotifications(agentId: string): Promise<Record<string, unknown>[]> {
  const redis = getRedisClient();
  const key = `${NOTIFY_PREFIX}${agentId}`;
  const items = await redis.lrange(key, 0, -1);
  return items.map((item) => JSON.parse(String(item)));
}

export async function acknowledgeNotification(
  agentId: string,
  taskId: string,
): Promise<void> {
  const redis = getRedisClient();
  const key = `${NOTIFY_PREFIX}${agentId}`;

  const notifications = await redis.lrange(key, 0, -1);
  for (const raw of notifications) {
    const parsed = JSON.parse(String(raw));
    if (parsed.taskId === taskId) {
      await redis.lrem(key, 1, String(raw));
      break;
    }
  }
}
