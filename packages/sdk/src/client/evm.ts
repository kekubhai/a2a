import {
  createPublicClient,
  createWalletClient,
  http,
  decodeEventLog,
  type PublicClient,
  type WalletClient,
  type Address,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { foundry } from 'viem/chains';
import type {
  A2AClient,
  ClientConfig,
  PostTaskParams,
  PostTaskResult,
  SubmitBidParams,
  SubmitBidResult,
  ReleaseEscrowParams,
  ReleaseEscrowResult,
  AgentReputation,
  SubmitVerificationParams,
  SubmitVerificationResult,
  RaiseDisputeParams,
  RaiseDisputeResult,
} from './types.js';

const AGENT_REGISTRY_ABI = [
  {
    type: 'function',
    name: 'register',
    inputs: [
      { name: 'agentAddress', type: 'address' },
      { name: 'name', type: 'string' },
      { name: 'metadataUri', type: 'string' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getAgent',
    inputs: [{ name: 'agentAddress', type: 'address' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'owner', type: 'address' },
          { name: 'name', type: 'string' },
          { name: 'metadataUri', type: 'string' },
          { name: 'reputationScore', type: 'uint256' },
          { name: 'totalStake', type: 'uint256' },
          { name: 'tasksCompleted', type: 'uint256' },
          { name: 'tasksFailed', type: 'uint256' },
          { name: 'active', type: 'bool' },
          { name: 'registeredAt', type: 'uint256' },
          { name: 'updatedAt', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'isActive',
    inputs: [{ name: 'agentAddress', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'setReputation',
    inputs: [
      { name: 'agentAddress', type: 'address' },
      { name: 'score', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'addStake',
    inputs: [
      { name: 'agentAddress', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'recordCompletion',
    inputs: [{ name: 'agentAddress', type: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const;

const TASK_REGISTRY_ABI = [
  {
    type: 'function',
    name: 'createTask',
    inputs: [
      { name: 'buyerAgent', type: 'address' },
      { name: 'acceptanceCriteriaHash', type: 'string' },
      { name: 'deadline', type: 'uint256' },
    ],
    outputs: [{ name: 'taskId', type: 'uint256' }],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'assignTask',
    inputs: [
      { name: 'taskId', type: 'uint256' },
      { name: 'workerAgent', type: 'address' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'submitTask',
    inputs: [
      { name: 'taskId', type: 'uint256' },
      { name: 'submissionHash', type: 'string' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'completeTask',
    inputs: [{ name: 'taskId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'failTask',
    inputs: [{ name: 'taskId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'cancelTask',
    inputs: [{ name: 'taskId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getTask',
    inputs: [{ name: 'taskId', type: 'uint256' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'buyerAgent', type: 'address' },
          { name: 'workerAgent', type: 'address' },
          { name: 'bounty', type: 'uint256' },
          { name: 'acceptanceCriteriaHash', type: 'string' },
          { name: 'submissionHash', type: 'string' },
          { name: 'status', type: 'uint8' },
          { name: 'deadline', type: 'uint256' },
          { name: 'createdAt', type: 'uint256' },
          { name: 'submittedAt', type: 'uint256' },
          { name: 'completedAt', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getTaskEscrow',
    inputs: [{ name: 'taskId', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getTaskStatus',
    inputs: [{ name: 'taskId', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'TaskCreated',
    inputs: [
      { name: 'taskId', type: 'uint256', indexed: true },
      { name: 'buyerAgent', type: 'address', indexed: true },
      { name: 'bounty', type: 'uint256' },
      { name: 'acceptanceCriteriaHash', type: 'string' },
    ],
  },
] as const;

const VERIFICATION_ORACLE_ABI = [
  {
    type: 'function',
    name: 'submitVerification',
    inputs: [
      { name: 'taskId', type: 'uint256' },
      { name: 'verifierAgent', type: 'address' },
      { name: 'result', type: 'uint8' },
      { name: 'confidence', type: 'uint256' },
      { name: 'attestationHash', type: 'string' },
      { name: 'signature', type: 'string' },
      { name: 'signatureAlgorithm', type: 'string' },
    ],
    outputs: [{ name: 'verificationId', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'raiseDispute',
    inputs: [
      { name: 'verificationId', type: 'uint256' },
      { name: 'reason', type: 'string' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getVerification',
    inputs: [{ name: 'verificationId', type: 'uint256' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'taskId', type: 'uint256' },
          { name: 'verifierAgent', type: 'address' },
          { name: 'result', type: 'uint8' },
          { name: 'confidence', type: 'uint256' },
          { name: 'attestationHash', type: 'string' },
          { name: 'signature', type: 'string' },
          { name: 'signatureAlgorithm', type: 'string' },
          { name: 'disputeReason', type: 'string' },
          { name: 'disputeResolution', type: 'string' },
          { name: 'verifiedAt', type: 'uint256' },
          { name: 'createdAt', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'VerificationSubmitted',
    inputs: [
      { name: 'verificationId', type: 'uint256', indexed: true },
      { name: 'taskId', type: 'uint256', indexed: true },
      { name: 'verifierAgent', type: 'address', indexed: true },
      { name: 'result', type: 'uint8' },
      { name: 'attestationHash', type: 'string' },
    ],
  },
  {
    type: 'event',
    name: 'DisputeRaised',
    inputs: [
      { name: 'verificationId', type: 'uint256', indexed: true },
      { name: 'taskId', type: 'uint256', indexed: true },
      { name: 'reason', type: 'string' },
    ],
  },
] as const;

export interface EvmClientAddresses {
  agentRegistry: Address;
  taskRegistry: Address;
  verificationOracle: Address;
}

export class EvmA2AClient implements A2AClient {
  private publicClient: PublicClient;
  private walletClient: WalletClient | undefined;
  private addresses: EvmClientAddresses;

  constructor(config: ClientConfig) {
    const chain = config.rpcUrl.includes('8545') ? foundry : foundry;

    this.publicClient = createPublicClient({
      chain,
      transport: http(config.rpcUrl),
    });

    if (config.privateKey) {
      const account = privateKeyToAccount(config.privateKey as `0x${string}`);
      this.walletClient = createWalletClient({
        account,
        chain,
        transport: http(config.rpcUrl),
      });
    }

    if (!config.programIds) {
      throw new Error('programIds (agentRegistry, taskRegistry, verificationOracle) are required for EVM client');
    }

    this.addresses = {
      agentRegistry: config.programIds.agentRegistry as Address,
      taskRegistry: config.programIds.taskRegistry as Address,
      verificationOracle: config.programIds.verificationOracle as Address,
    };
  }

  private getAccount() {
    if (!this.walletClient) {
      throw new Error('Wallet client not configured with private key');
    }
    const account = this.walletClient.account;
    if (!account) {
      throw new Error('Wallet client not configured with private key');
    }
    return account;
  }

  async postTask(params: PostTaskParams): Promise<PostTaskResult> {
    const account = this.getAccount();
    const { request } = await this.publicClient.simulateContract({
      address: this.addresses.taskRegistry,
      abi: TASK_REGISTRY_ABI,
      functionName: 'createTask',
      args: [
        params.buyerAgent as Address,
        params.acceptanceCriteriaHash,
        BigInt(params.deadline),
      ],
      value: params.bountyLamports,
      account: account.address,
    });

    const txHash = await this.walletClient!.writeContract({
      ...request,
      chain: foundry,
    });

    const receipt = await this.publicClient.waitForTransactionReceipt({ hash: txHash });

    const logs = receipt.logs.filter(
      (log) => log.address.toLowerCase() === this.addresses.taskRegistry.toLowerCase(),
    );

    if (logs.length === 0) {
      throw new Error('TaskCreated event not found in transaction receipt');
    }

    const decoded = decodeEventLog({
      abi: TASK_REGISTRY_ABI,
      eventName: 'TaskCreated',
      data: logs[0].data,
      topics: logs[0].topics,
    });

    const taskId = decoded.args.taskId;

    return {
      taskId: taskId.toString(),
      txHash,
    };
  }

  async submitBid(params: SubmitBidParams): Promise<SubmitBidResult> {
    const account = this.getAccount();
    const { request } = await this.publicClient.simulateContract({
      address: this.addresses.taskRegistry,
      abi: TASK_REGISTRY_ABI,
      functionName: 'assignTask',
      args: [BigInt(params.taskId), params.workerAgent as Address],
      account: account.address,
    });

    const txHash = await this.walletClient!.writeContract({
      ...request,
      chain: foundry,
    });
    await this.publicClient.waitForTransactionReceipt({ hash: txHash });

    return { txHash };
  }

  async releaseEscrow(params: ReleaseEscrowParams): Promise<ReleaseEscrowResult> {
    const account = this.getAccount();
    const { request } = await this.publicClient.simulateContract({
      address: this.addresses.taskRegistry,
      abi: TASK_REGISTRY_ABI,
      functionName: 'completeTask',
      args: [BigInt(params.taskId)],
      account: account.address,
    });

    const txHash = await this.walletClient!.writeContract({
      ...request,
      chain: foundry,
    });
    await this.publicClient.waitForTransactionReceipt({ hash: txHash });

    return { txHash };
  }

  async getAgentReputation(agentAddress: string): Promise<AgentReputation> {
    const agent = await this.publicClient.readContract({
      address: this.addresses.agentRegistry,
      abi: AGENT_REGISTRY_ABI,
      functionName: 'getAgent',
      args: [agentAddress as Address],
    });

    return {
      agentAddress,
      reputationScore: agent.reputationScore,
      totalStake: agent.totalStake,
      tasksCompleted: agent.tasksCompleted,
      tasksFailed: agent.tasksFailed,
    };
  }

  async submitVerification(params: SubmitVerificationParams): Promise<SubmitVerificationResult> {
    const account = this.getAccount();
    const { request } = await this.publicClient.simulateContract({
      address: this.addresses.verificationOracle,
      abi: VERIFICATION_ORACLE_ABI,
      functionName: 'submitVerification',
      args: [
        BigInt(params.taskId),
        params.verifierAgent as Address,
        params.result,
        params.confidence,
        params.attestationHash,
        params.signature,
        params.signatureAlgorithm,
      ],
      account: account.address,
    });

    const txHash = await this.walletClient!.writeContract({
      ...request,
      chain: foundry,
    });

    const receipt = await this.publicClient.waitForTransactionReceipt({ hash: txHash });

    const logs = receipt.logs.filter(
      (log) => log.address.toLowerCase() === this.addresses.verificationOracle.toLowerCase(),
    );

    if (logs.length === 0) {
      throw new Error('VerificationSubmitted event not found in transaction receipt');
    }

    const decoded = decodeEventLog({
      abi: VERIFICATION_ORACLE_ABI,
      eventName: 'VerificationSubmitted',
      data: logs[0].data,
      topics: logs[0].topics,
    });

    return {
      verificationId: decoded.args.verificationId.toString(),
      txHash,
    };
  }

  async raiseDispute(params: RaiseDisputeParams): Promise<RaiseDisputeResult> {
    const account = this.getAccount();
    const { request } = await this.publicClient.simulateContract({
      address: this.addresses.verificationOracle,
      abi: VERIFICATION_ORACLE_ABI,
      functionName: 'raiseDispute',
      args: [BigInt(params.verificationId), params.reason],
      account: account.address,
    });

    const txHash = await this.walletClient!.writeContract({
      ...request,
      chain: foundry,
    });
    await this.publicClient.waitForTransactionReceipt({ hash: txHash });

    return { txHash };
  }
}
