import type { ChainType } from '@a2a/shared-types';
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
} from './types.js';
import { EvmA2AClient } from './evm.js';
import { SolanaA2AClient } from './solana.js';

export class A2AClientFactory {
  static create(config: ClientConfig): A2AClient {
    switch (config.chain) {
      case 'evm':
        return new EvmA2AClient(config);
      case 'solana':
        return new SolanaA2AClient(config);
      default:
        throw new Error(`Unsupported chain: ${config.chain}`);
    }
  }
}

export class ChainAbstractedClient implements A2AClient {
  private clients: Map<ChainType, A2AClient> = new Map();

  constructor(configs: ClientConfig[]) {
    for (const config of configs) {
      this.clients.set(config.chain, A2AClientFactory.create(config));
    }
  }

  private getClient(chain: ChainType): A2AClient {
    const client = this.clients.get(chain);
    if (!client) {
      throw new Error(`No client configured for chain: ${chain}`);
    }
    return client;
  }

  async postTask(params: PostTaskParams & { chain?: ChainType }): Promise<PostTaskResult> {
    const chain = params.chain || 'evm';
    return this.getClient(chain).postTask(params);
  }

  async submitBid(params: SubmitBidParams & { chain?: ChainType }): Promise<SubmitBidResult> {
    const chain = params.chain || 'evm';
    return this.getClient(chain).submitBid(params);
  }

  async releaseEscrow(params: ReleaseEscrowParams & { chain?: ChainType }): Promise<ReleaseEscrowResult> {
    const chain = params.chain || 'evm';
    return this.getClient(chain).releaseEscrow(params);
  }

  async getAgentReputation(agentAddress: string, chain: ChainType = 'evm'): Promise<AgentReputation> {
    return this.getClient(chain).getAgentReputation(agentAddress);
  }
}

export type {
  A2AClient,
  ClientConfig,
  PostTaskParams,
  PostTaskResult,
  SubmitBidParams,
  SubmitBidResult,
  ReleaseEscrowParams,
  ReleaseEscrowResult,
  AgentReputation,
} from './types.js';
