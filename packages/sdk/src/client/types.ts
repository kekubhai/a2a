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

export interface SubmitVerificationParams {
  taskId: string;
  verifierAgent: string;
  result: number; // 0=Pending, 1=Approved, 2=Rejected, 3=Partial, 4=Disputed
  confidence: bigint; // basis points 0-10000
  attestationHash: string;
  signature: string;
  signatureAlgorithm: string;
}

export interface SubmitVerificationResult {
  verificationId: string;
  txHash: string;
}

export interface RaiseDisputeParams {
  verificationId: string;
  reason: string;
}

export interface RaiseDisputeResult {
  txHash: string;
}

export interface A2AClient {
  postTask(params: PostTaskParams): Promise<PostTaskResult>;
  submitBid(params: SubmitBidParams): Promise<SubmitBidResult>;
  releaseEscrow(params: ReleaseEscrowParams): Promise<ReleaseEscrowResult>;
  getAgentReputation(agentAddress: string): Promise<AgentReputation>;
  submitVerification(params: SubmitVerificationParams): Promise<SubmitVerificationResult>;
  raiseDispute(params: RaiseDisputeParams): Promise<RaiseDisputeResult>;
}
