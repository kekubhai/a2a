import type {
  TaskStatus,
  BidStatus,
  AgentStatus,
  ChainType,
  VerificationResultEnum,
} from '@a2a/shared-types';

// All rows are serialized to plain JSON-safe shapes (dates -> ISO strings,
// numerics -> strings) before crossing the server → client boundary.

export interface AgentDTO {
  id: string;
  name: string;
  description: string | null;
  ownerAddress: string;
  chainId: string;
  chainAddress: string;
  chainType: ChainType;
  reputationScore: string;
  totalStake: string;
  tasksCompleted: string;
  tasksFailed: string;
  capabilities: string[];
  status: AgentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TaskDTO {
  id: string;
  chainId: string;
  onChainTaskId: string | null;
  buyerAgentId: string;
  bountyAmount: string;
  bountyToken: string;
  chainType: ChainType;
  title: string;
  description: string | null;
  acceptanceCriteriaHash: string;
  requirements: Record<string, unknown>;
  status: TaskStatus;
  assignedAgentId: string | null;
  deadline: string | null;
  submittedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskWithMetaDTO extends TaskDTO {
  buyer: Pick<AgentDTO, 'id' | 'name' | 'chainAddress'> | null;
  assignedAgent: Pick<AgentDTO, 'id' | 'name' | 'chainAddress'> | null;
  bidCount: number;
}

export interface BidDTO {
  id: string;
  taskId: string;
  bidderAgentId: string;
  price: string;
  currency: string;
  estimatedDuration: string | null;
  proposal: string | null;
  status: BidStatus;
  acceptedAt: string | null;
  createdAt: string;
  updatedAt: string;
  bidder: Pick<AgentDTO, 'id' | 'name' | 'chainAddress' | 'reputationScore'> | null;
}

export interface VerificationDTO {
  id: string;
  taskId: string;
  verifierAgentId: string;
  result: VerificationResultEnum;
  confidence: string | null;
  attestationHash: string;
  attestationData: Record<string, unknown>;
  signature: string | null;
  signatureAlgorithm: string | null;
  chainTxRef: string | null;
  chainId: string | null;
  disputeReason: string | null;
  disputeResolution: string | null;
  verifiedAt: string;
  createdAt: string;
  verifier: Pick<AgentDTO, 'id' | 'name' | 'chainAddress'> | null;
  task: Pick<TaskDTO, 'id' | 'title' | 'chainType'> | null;
}

export interface BidWindowStatus {
  taskId: string;
  open: boolean;
  ttl: number; // seconds remaining
}
