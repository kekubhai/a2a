import type { ChainType } from '@a2a/shared-types';

export interface ClientConfig {
  chain: ChainType;
  rpcUrl: string;
  privateKey?: string;
  programIds?: {
    agentRegistry: string;
    taskRegistry: string;
    verificationOracle: string;
  };
}

export interface PostTaskParams {
  buyerAgent: string;
  acceptanceCriteriaHash: string;
  deadline: number;
  bountyLamports: bigint;
}

export interface PostTaskResult {
  taskId: string;
  txHash: string;
}

export interface SubmitBidParams {
  taskId: string;
  workerAgent: string;
  submissionHash: string;
}

export interface SubmitBidResult {
  txHash: string;
}

export interface ReleaseEscrowParams {
  taskId: string;
}

export interface ReleaseEscrowResult {
  txHash: string;
}

export interface AgentReputation {
  agentAddress: string;
  reputationScore: bigint;
  totalStake: bigint;
  tasksCompleted: bigint;
  tasksFailed: bigint;
}

export interface A2AClient {
  postTask(params: PostTaskParams): Promise<PostTaskResult>;
  submitBid(params: SubmitBidParams): Promise<SubmitBidResult>;
  releaseEscrow(params: ReleaseEscrowParams): Promise<ReleaseEscrowResult>;
  getAgentReputation(agentAddress: string): Promise<AgentReputation>;
}
