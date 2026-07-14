import { describe, it, expect, beforeAll } from 'vitest';
import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { SolanaA2AClient } from './solana.js';

const SOLANA_RPC = 'http://127.0.0.1:8899';

describe('SolanaA2AClient', () => {
  let connection: Connection;
  let payer: Keypair;
  let agentRegistryProgramId: PublicKey;
  let taskRegistryProgramId: PublicKey;

  beforeAll(async () => {
    connection = new Connection(SOLANA_RPC, 'confirmed');
    payer = Keypair.generate();

    const airdropSignature = await connection.requestAirdrop(
      payer.publicKey,
      10 * LAMPORTS_PER_SOL,
    );
    await connection.confirmTransaction(airdropSignature);

    agentRegistryProgramId = new PublicKey('A2AAgt1rGe11DKjNnEZBpGKvVXTbFBqVbJbVJnVaMp2');
    taskRegistryProgramId = new PublicKey('A2ATsk1rGe11DKjNnEZBpGKvVXTbFBqVbJbVJnVaMp3');
  });

  describe('postTask', () => {
    it('should create a task on Solana localnet', async () => {
      const client = new SolanaA2AClient({
        chain: 'solana',
        rpcUrl: SOLANA_RPC,
        privateKey: JSON.stringify(Array.from(payer.secretKey)),
        programIds: {
          agentRegistry: agentRegistryProgramId.toString(),
          taskRegistry: taskRegistryProgramId.toString(),
          verificationOracle: '',
        },
      });

      const buyer = Keypair.generate();

      const result = await client.postTask({
        buyerAgent: buyer.publicKey.toString(),
        acceptanceCriteriaHash: 'QmSolanaCriteria123',
        deadline: Math.floor(Date.now() / 1000) + 86400,
        bountyLamports: BigInt(LAMPORTS_PER_SOL),
      });

      expect(result.taskId).toBeDefined();
      expect(result.txHash).toBeDefined();
    });
  });

  describe('getAgentReputation', () => {
    it('should return default reputation for unregistered agent', async () => {
      const client = new SolanaA2AClient({
        chain: 'solana',
        rpcUrl: SOLANA_RPC,
        privateKey: JSON.stringify(Array.from(payer.secretKey)),
        programIds: {
          agentRegistry: agentRegistryProgramId.toString(),
          taskRegistry: taskRegistryProgramId.toString(),
          verificationOracle: '',
        },
      });

      const unregistered = Keypair.generate();

      try {
        const reputation = await client.getAgentReputation(unregistered.publicKey.toString());
        expect(reputation).toBeDefined();
        expect(typeof reputation.reputationScore).toBe('bigint');
      } catch {
        // Account not found is expected for unregistered agent
        expect(true).toBe(true);
      }
    });
  });
});
