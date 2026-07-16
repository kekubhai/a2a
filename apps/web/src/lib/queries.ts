import 'server-only';
import { db, tasks, bids, agents, verifications } from '@a2a/db';
import { eq, and, desc, gte, sql, inArray } from 'drizzle-orm';
import type { ChainType, TaskStatus } from '@a2a/shared-types';
import {
  serializeAgent,
  serializeTask,
  serializeBid,
  serializeVerification,
} from './serialize';
import type {
  AgentDTO,
  TaskWithMetaDTO,
  BidDTO,
  VerificationDTO,
} from './types';

export interface TaskFeedFilters {
  status?: TaskStatus | 'all';
  chainType?: ChainType | 'all';
  minBounty?: number;
  verificationType?: string;
  limit?: number;
}

/** Task feed with buyer/assignee names + bid counts. Read directly from Neon. */
export async function getTaskFeed(filters: TaskFeedFilters = {}): Promise<TaskWithMetaDTO[]> {
  const conditions = [];
  if (filters.status && filters.status !== 'all') {
    conditions.push(eq(tasks.status, filters.status));
  }
  if (filters.chainType && filters.chainType !== 'all') {
    conditions.push(eq(tasks.chainType, filters.chainType));
  }
  if (typeof filters.minBounty === 'number' && filters.minBounty > 0) {
    conditions.push(gte(tasks.bountyAmount, String(filters.minBounty)));
  }

  const rows = await db
    .select()
    .from(tasks)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(tasks.createdAt))
    .limit(filters.limit ?? 100);

  return decorateTasks(rows, filters.verificationType);
}

async function decorateTasks(
  rows: (typeof tasks.$inferSelect)[],
  verificationType?: string,
): Promise<TaskWithMetaDTO[]> {
  if (rows.length === 0) return [];

  const agentIds = Array.from(
    new Set(
      rows.flatMap((t) => [t.buyerAgentId, t.assignedAgentId].filter(Boolean) as string[]),
    ),
  );

  const agentRows = agentIds.length
    ? await db.select().from(agents).where(inArray(agents.id, agentIds))
    : [];
  const agentMap = new Map(agentRows.map((a) => [a.id, a]));

  const taskIds = rows.map((t) => t.id);
  const bidCounts = taskIds.length
    ? await db
        .select({ taskId: bids.taskId, count: sql<number>`count(*)::int` })
        .from(bids)
        .where(inArray(bids.taskId, taskIds))
        .groupBy(bids.taskId)
    : [];
  const bidCountMap = new Map(bidCounts.map((b) => [b.taskId, Number(b.count)]));

  let result = rows.map((t) => {
    const buyer = agentMap.get(t.buyerAgentId);
    const assignee = t.assignedAgentId ? agentMap.get(t.assignedAgentId) : null;
    const base = serializeTask(t);
    return {
      ...base,
      buyer: buyer
        ? { id: buyer.id, name: buyer.name, chainAddress: buyer.chainAddress }
        : null,
      assignedAgent: assignee
        ? { id: assignee.id, name: assignee.name, chainAddress: assignee.chainAddress }
        : null,
      bidCount: bidCountMap.get(t.id) ?? 0,
    } satisfies TaskWithMetaDTO;
  });

  if (verificationType && verificationType !== 'all') {
    result = result.filter(
      (t) => (t.requirements?.verificationType as string | undefined) === verificationType,
    );
  }

  return result;
}

export async function getTaskById(id: string): Promise<TaskWithMetaDTO | null> {
  const rows = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  if (rows.length === 0) return null;
  const [decorated] = await decorateTasks(rows);
  return decorated ?? null;
}

/** Bids for a task, joined with bidder agent, ordered by price ascending (leader first). */
export async function getBidsForTask(taskId: string): Promise<BidDTO[]> {
  const rows = await db
    .select({ bid: bids, agent: agents })
    .from(bids)
    .leftJoin(agents, eq(bids.bidderAgentId, agents.id))
    .where(eq(bids.taskId, taskId))
    .orderBy(sql`${bids.price}::numeric asc`);

  return rows.map((r) => serializeBid(r.bid, r.agent));
}

export async function getAgentById(id: string): Promise<AgentDTO | null> {
  const rows = await db.select().from(agents).where(eq(agents.id, id)).limit(1);
  return rows.length ? serializeAgent(rows[0]) : null;
}

export async function getAgents(): Promise<AgentDTO[]> {
  const rows = await db.select().from(agents).orderBy(desc(agents.reputationScore));
  return rows.map(serializeAgent);
}

/** Task history for an agent (as buyer or worker). */
export async function getAgentTaskHistory(agentId: string): Promise<TaskWithMetaDTO[]> {
  const rows = await db
    .select()
    .from(tasks)
    .where(
      sql`${tasks.buyerAgentId} = ${agentId} OR ${tasks.assignedAgentId} = ${agentId}`,
    )
    .orderBy(desc(tasks.createdAt))
    .limit(50);
  return decorateTasks(rows);
}

/** Verification pass rate + counts for an agent (as the assigned worker). */
export async function getAgentVerificationStats(agentId: string): Promise<{
  total: number;
  approved: number;
  rejected: number;
  passRate: number;
}> {
  const rows = await db
    .select({ result: verifications.result })
    .from(verifications)
    .innerJoin(tasks, eq(verifications.taskId, tasks.id))
    .where(eq(tasks.assignedAgentId, agentId));

  const total = rows.length;
  const approved = rows.filter((r) => r.result === 'approved' || r.result === 'partial').length;
  const rejected = rows.filter((r) => r.result === 'rejected').length;
  const passRate = total > 0 ? approved / total : 0;
  return { total, approved, rejected, passRate };
}

/** Full verification log with verifier + task info. This is the differentiator surface. */
export async function getVerificationLog(filters: {
  result?: string;
  taskId?: string;
  limit?: number;
} = {}): Promise<VerificationDTO[]> {
  const conditions = [];
  if (filters.result && filters.result !== 'all') {
    conditions.push(
      eq(verifications.result, filters.result as 'approved' | 'rejected' | 'partial' | 'disputed'),
    );
  }
  if (filters.taskId) {
    conditions.push(eq(verifications.taskId, filters.taskId));
  }

  const rows = await db
    .select({ verification: verifications, verifier: agents, task: tasks })
    .from(verifications)
    .leftJoin(agents, eq(verifications.verifierAgentId, agents.id))
    .leftJoin(tasks, eq(verifications.taskId, tasks.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(verifications.verifiedAt))
    .limit(filters.limit ?? 100);

  return rows.map((r) => serializeVerification(r.verification, r.verifier, r.task));
}

export async function getVerificationsForTask(taskId: string): Promise<VerificationDTO[]> {
  return getVerificationLog({ taskId });
}

/** Simple marketplace stats for the dashboard header. */
export async function getMarketStats(): Promise<{
  openTasks: number;
  activeAgents: number;
  totalVerifications: number;
  approvalRate: number;
}> {
  const [taskAgg] = await db
    .select({
      open: sql<number>`count(*) filter (where ${tasks.status} in ('open','bidding'))::int`,
    })
    .from(tasks);

  const [agentAgg] = await db
    .select({
      active: sql<number>`count(*) filter (where ${agents.status} = 'active')::int`,
    })
    .from(agents);

  const [verAgg] = await db
    .select({
      total: sql<number>`count(*)::int`,
      approved: sql<number>`count(*) filter (where ${verifications.result} in ('approved','partial'))::int`,
    })
    .from(verifications);

  const total = Number(verAgg?.total ?? 0);
  const approved = Number(verAgg?.approved ?? 0);

  return {
    openTasks: Number(taskAgg?.open ?? 0),
    activeAgents: Number(agentAgg?.active ?? 0),
    totalVerifications: total,
    approvalRate: total > 0 ? approved / total : 0,
  };
}
