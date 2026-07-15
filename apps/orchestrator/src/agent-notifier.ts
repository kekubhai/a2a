import { agents } from '@a2a/db';
import { pushNotifications, TaskNotification } from '@a2a/redis';

export type { TaskNotification };

export async function notifyEligibleAgents(
  task: { id: string; title: string; description: string | null; bountyAmount: string; bountyToken: string; chainType: string; acceptanceCriteriaHash: string; deadline: string | null; requirements: unknown },
  eligibleAgents: Array<typeof agents.$inferSelect>,
): Promise<void> {
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

  const agentIds = eligibleAgents.map((a) => a.id);
  await pushNotifications(agentIds, notification);

  console.log(
    `[AgentNotifier] Notified ${eligibleAgents.length} agents for task ${task.id}`,
  );
}
