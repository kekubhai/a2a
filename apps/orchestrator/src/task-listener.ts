import { db, tasks, agents } from '@a2a/db';
import { eq, and, isNull } from 'drizzle-orm';
import { acquireTaskLock } from '@a2a/redis';
import { notifyEligibleAgents } from './agent-notifier.js';
import { startBidCollection } from './bid-collector.js';

const TASK_HOLDER = 'orchestrator';

export function startTaskListener(pollIntervalMs: number = 5000) {
  console.log('[TaskListener] Starting poll loop');

  setInterval(async () => {
    try {
      await pollForNewTasks();
    } catch (err) {
      console.error('[TaskListener] Poll error:', err);
    }
  }, pollIntervalMs);
}

async function pollForNewTasks() {
  const now = new Date();

  const newTasks = await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.status, 'open'),
        isNull(tasks.assignedAgentId),
      ),
    );

  for (const task of newTasks) {
    if (task.deadline && new Date(task.deadline) < now) {
      console.log(`[TaskListener] Task ${task.id} past deadline, skipping`);
      continue;
    }

    const locked = await acquireTaskLock(task.id, TASK_HOLDER, 60);
    if (!locked) {
      continue;
    }

    console.log(`[TaskListener] Processing task ${task.id}`);

    try {
      const eligibleAgents = await findEligibleAgents(task);

      if (eligibleAgents.length === 0) {
        console.log(`[TaskListener] No eligible agents for task ${task.id}`);
        continue;
      }

      await notifyEligibleAgents({
        id: task.id,
        title: task.title,
        description: task.description,
        bountyAmount: task.bountyAmount,
        bountyToken: task.bountyToken,
        chainType: task.chainType,
        acceptanceCriteriaHash: task.acceptanceCriteriaHash,
        deadline: task.deadline ? task.deadline.toISOString() : null,
        requirements: task.requirements,
      }, eligibleAgents);

      const bidWindowSeconds = parseInt(process.env.BID_WINDOW_SECONDS || '120', 10);
      await startBidCollection(task.id, bidWindowSeconds);
    } catch (err) {
      console.error(`[TaskListener] Error processing task ${task.id}:`, err);
    }
  }
}

async function findEligibleAgents(task: typeof tasks.$inferSelect) {
  const allAgents = await db
    .select()
    .from(agents)
    .where(eq(agents.status, 'active'));

  return allAgents.filter((agent) => {
    if (agent.chainType !== task.chainType) return false;

    const agentCaps = (agent.capabilities as string[]) || [];
    const requirements = (task.requirements as Record<string, unknown>) || {};
    const requiredCaps = (requirements.requiredCapabilities as string[]) || [];

    if (requiredCaps.length === 0) return true;

    return requiredCaps.some((cap) => agentCaps.includes(cap));
  });
}
