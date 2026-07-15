import { agents } from '@a2a/db';
import { getRedisClient, TaskNotification } from '@a2a/redis';

export type { TaskNotification };

const NOTIFY_PREFIX = 'a2a:notify:';
const NOTIFY_TTL_SECONDS = 300;

export async function notifyEligibleAgents(
  task: { id: string; title: string; description: string | null; bountyAmount: string; bountyToken: string; chainType: string; acceptanceCriteriaHash: string; deadline: string | null; requirements: unknown },
  eligibleAgents: Array<typeof agents.$inferSelect>,
): Promise<void> {
  const redis = getRedisClient();

  const notification: TaskNotification = {
    taskId: task.id,
    title: task.title,
    description: task.description || '',
    bountyAmount: task.bountyAmount,
    bountyToken: task.bountyToken,
    chainType: task.chainType,
    acceptanceCriteriaHash: task.acceptanceCriteriaHash,
    deadline: task.deadline ? new Date(task.deadline).toISOString() : null,
    requirements: (task.requirements as Record<string, unknown>) || {},
  };

  const pipeline = redis.pipeline();

  for (const agent of eligibleAgents) {
    const key = `${NOTIFY_PREFIX}${agent.id}`;
    pipeline.lpush(key, JSON.stringify(notification));
    pipeline.expire(key, NOTIFY_TTL_SECONDS);
  }

  await pipeline.exec();

  console.log(
    `[AgentNotifier] Notified ${eligibleAgents.length} agents for task ${task.id}`,
  );
}

export async function getAgentNotifications(agentId: string): Promise<TaskNotification[]> {
  const redis = getRedisClient();
  const key = `${NOTIFY_PREFIX}${agentId}`;

  const items = await redis.lrange(key, 0, -1);
  return items.map((item) => JSON.parse(item));
}

export async function acknowledgeNotification(
  agentId: string,
  taskId: string,
): Promise<void> {
  const redis = getRedisClient();
  const key = `${NOTIFY_PREFIX}${agentId}`;

  const notifications = await redis.lrange(key, 0, -1);
  for (const raw of notifications) {
    const parsed: TaskNotification = JSON.parse(raw);
    if (parsed.taskId === taskId) {
      await redis.lrem(key, 1, raw);
      break;
    }
  }
}
