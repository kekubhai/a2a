import { db, tasks, agents } from '@a2a/db';
import { eq, and } from 'drizzle-orm';
import { acquireVerifyLock, releaseVerifyLock } from '@a2a/redis';
import { runVerification } from './verification-runner.js';

const VERIFY_HOLDER = 'verifier';

export function startVerifyListener(pollIntervalMs: number = 5000) {
  console.log('[VerifyListener] Starting poll loop');

  setInterval(async () => {
    try {
      await pollForSubmittedTasks();
    } catch (err) {
      console.error('[VerifyListener] Poll error:', err);
    }
  }, pollIntervalMs);
}

async function pollForSubmittedTasks() {
  const submittedTasks = await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.status, 'submitted'),
      ),
    );

  for (const task of submittedTasks) {
    const locked = await acquireVerifyLock(task.id, VERIFY_HOLDER, 120);
    if (!locked) {
      continue;
    }

    console.log(`[VerifyListener] Processing verification for task ${task.id}`);

    try {
      if (!task.assignedAgentId) {
        console.log(`[VerifyListener] Task ${task.id} has no assigned agent, skipping`);
        continue;
      }

      await db
        .update(tasks)
        .set({ status: 'verifying', updatedAt: new Date() })
        .where(eq(tasks.id, task.id));

      const verifierAgents = await findVerifierAgents(task.chainType);
      if (verifierAgents.length === 0) {
        console.log(`[VerifyListener] No verifier agents for task ${task.id}`);
        await db
          .update(tasks)
          .set({ status: 'submitted', updatedAt: new Date() })
          .where(eq(tasks.id, task.id));
        continue;
      }

      await runVerification(task, verifierAgents[0]);
    } catch (err) {
      console.error(`[VerifyListener] Error verifying task ${task.id}:`, err);
      await db
        .update(tasks)
        .set({ status: 'submitted', updatedAt: new Date() })
        .where(eq(tasks.id, task.id));
    } finally {
      await releaseVerifyLock(task.id, VERIFY_HOLDER);
    }
  }
}

async function findVerifierAgents(chainType: string) {
  const allAgents = await db
    .select()
    .from(agents)
    .where(eq(agents.status, 'active'));

  return allAgents.filter((agent) => {
    if (agent.chainType !== chainType) return false;
    const caps = (agent.capabilities as string[]) || [];
    return caps.includes('verification') || caps.includes('attestation');
  });
}
