import type { agents, tasks, bids, verifications } from '@a2a/db';
import type { AgentDTO, TaskDTO, BidDTO, VerificationDTO } from './types';
import type { AgentStatus, ChainType, TaskStatus, BidStatus, VerificationResultEnum } from '@a2a/shared-types';

type AgentRow = typeof agents.$inferSelect;
type TaskRow = typeof tasks.$inferSelect;
type BidRow = typeof bids.$inferSelect;
type VerificationRow = typeof verifications.$inferSelect;

const iso = (d: Date | null | undefined): string | null => (d ? new Date(d).toISOString() : null);

export function serializeAgent(a: AgentRow): AgentDTO {
  const meta = (a.metadata as Record<string, unknown>) ?? {};
  return {
    id: a.id,
    name: a.name,
    description: a.description,
    ownerAddress: a.ownerAddress,
    chainId: a.chainId,
    chainAddress: a.chainAddress,
    chainType: a.chainType as ChainType,
    reputationScore: String(a.reputationScore),
    totalStake: String(a.totalStake),
    tasksCompleted: String(a.tasksCompleted),
    tasksFailed: String(a.tasksFailed),
    capabilities: (a.capabilities as string[]) ?? [],
    status: a.status as AgentStatus,
    avatar: (meta.avatar as string) ?? null,
    tagline: (meta.tagline as string) ?? null,
    createdAt: iso(a.createdAt)!,
    updatedAt: iso(a.updatedAt)!,
  };
}

export function serializeTask(t: TaskRow): TaskDTO {
  return {
    id: t.id,
    chainId: t.chainId,
    onChainTaskId: t.onChainTaskId,
    buyerAgentId: t.buyerAgentId,
    bountyAmount: String(t.bountyAmount),
    bountyToken: t.bountyToken,
    chainType: t.chainType as ChainType,
    title: t.title,
    description: t.description,
    acceptanceCriteriaHash: t.acceptanceCriteriaHash,
    requirements: (t.requirements as Record<string, unknown>) ?? {},
    status: t.status as TaskStatus,
    assignedAgentId: t.assignedAgentId,
    deadline: iso(t.deadline),
    submittedAt: iso(t.submittedAt),
    completedAt: iso(t.completedAt),
    createdAt: iso(t.createdAt)!,
    updatedAt: iso(t.updatedAt)!,
  };
}

export function serializeBid(b: BidRow, bidder?: AgentRow | null): BidDTO {
  return {
    id: b.id,
    taskId: b.taskId,
    bidderAgentId: b.bidderAgentId,
    price: String(b.price),
    currency: b.currency,
    estimatedDuration: b.estimatedDuration,
    proposal: b.proposal,
    status: b.status as BidStatus,
    acceptedAt: iso(b.acceptedAt),
    createdAt: iso(b.createdAt)!,
    updatedAt: iso(b.updatedAt)!,
    bidder: bidder
      ? {
          id: bidder.id,
          name: bidder.name,
          chainAddress: bidder.chainAddress,
          reputationScore: String(bidder.reputationScore),
          avatar: ((bidder.metadata as Record<string, unknown>)?.avatar as string) ?? null,
        }
      : null,
  };
}

export function serializeVerification(
  v: VerificationRow,
  verifier?: AgentRow | null,
  task?: TaskRow | null,
): VerificationDTO {
  return {
    id: v.id,
    taskId: v.taskId,
    verifierAgentId: v.verifierAgentId,
    result: v.result as VerificationResultEnum,
    confidence: v.confidence,
    attestationHash: v.attestationHash,
    attestationData: (v.attestationData as Record<string, unknown>) ?? {},
    signature: v.signature,
    signatureAlgorithm: v.signatureAlgorithm,
    chainTxRef: v.chainTxRef,
    chainId: v.chainId,
    disputeReason: v.disputeReason,
    disputeResolution: v.disputeResolution,
    verifiedAt: iso(v.verifiedAt)!,
    createdAt: iso(v.createdAt)!,
    verifier: verifier
      ? {
          id: verifier.id,
          name: verifier.name,
          chainAddress: verifier.chainAddress,
          avatar: ((verifier.metadata as Record<string, unknown>)?.avatar as string) ?? null,
        }
      : null,
    task: task ? { id: task.id, title: task.title, chainType: task.chainType as ChainType } : null,
  };
}
