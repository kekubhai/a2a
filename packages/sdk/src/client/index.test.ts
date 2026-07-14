import { describe, it, expect } from 'vitest';
import { A2AClientFactory, ChainAbstractedClient } from './index.js';

describe('A2AClientFactory', () => {
  it('should create EVM client', () => {
    const client = A2AClientFactory.create({
      chain: 'evm',
      rpcUrl: 'http://127.0.0.1:8545',
      programIds: {
        agentRegistry: '0x0000000000000000000000000000000000000000',
        taskRegistry: '0x0000000000000000000000000000000000000000',
        verificationOracle: '0x0000000000000000000000000000000000000000',
      },
    });

    expect(client).toBeDefined();
    expect(typeof client.postTask).toBe('function');
    expect(typeof client.submitBid).toBe('function');
    expect(typeof client.releaseEscrow).toBe('function');
    expect(typeof client.getAgentReputation).toBe('function');
  });

  it('should create Solana client', () => {
    const client = A2AClientFactory.create({
      chain: 'solana',
      rpcUrl: 'http://127.0.0.1:8899',
      programIds: {
        agentRegistry: 'A2AAgt1rGe11DKjNnEZBpGKvVXTbFBqVbJbVJnVaMp2',
        taskRegistry: 'A2ATsk1rGe11DKjNnEZBpGKvVXTbFBqVbJbVJnVaMp3',
        verificationOracle: '',
      },
    });

    expect(client).toBeDefined();
    expect(typeof client.postTask).toBe('function');
    expect(typeof client.submitBid).toBe('function');
    expect(typeof client.releaseEscrow).toBe('function');
    expect(typeof client.getAgentReputation).toBe('function');
  });

  it('should throw for unsupported chain', () => {
    expect(() =>
      A2AClientFactory.create({
        chain: 'unsupported' as never,
        rpcUrl: 'http://localhost',
      }),
    ).toThrow('Unsupported chain: unsupported');
  });
});

describe('ChainAbstractedClient', () => {
  it('should route calls to correct chain client', () => {
    const client = new ChainAbstractedClient([
      {
        chain: 'evm',
        rpcUrl: 'http://127.0.0.1:8545',
        programIds: {
          agentRegistry: '0x0000000000000000000000000000000000000000',
          taskRegistry: '0x0000000000000000000000000000000000000000',
          verificationOracle: '0x0000000000000000000000000000000000000000',
        },
      },
    ]);

    expect(client).toBeDefined();
    expect(typeof client.postTask).toBe('function');
    expect(typeof client.submitBid).toBe('function');
    expect(typeof client.releaseEscrow).toBe('function');
    expect(typeof client.getAgentReputation).toBe('function');
  });

  it('should throw when chain client not configured', async () => {
    const client = new ChainAbstractedClient([]);

    await expect(
      client.getAgentReputation('0x123', 'evm'),
    ).rejects.toThrow('No client configured for chain: evm');
  });
});
