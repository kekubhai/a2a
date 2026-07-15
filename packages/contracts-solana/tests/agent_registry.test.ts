import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Keypair, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { assert } from 'chai';

const AGENT_REGISTRY_PROGRAM_ID = new PublicKey('A2AAgt1rGe11DKjNnEZBpGKvVXTbFBqVbJbVJnVaMp2');

function findAgentPda(owner: PublicKey, programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('agent'), owner.toBuffer()],
    programId,
  );
}

describe('agent_registry', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = new anchor.Program(
    require('../target/idl/agent_registry.json'),
    provider,
  );

  const owner = Keypair.generate();

  before(async () => {
    const sig = await provider.connection.requestAirdrop(
      owner.publicKey,
      10 * LAMPORTS_PER_SOL,
    );
    await provider.connection.confirmTransaction(sig);
  });

  describe('register_agent', () => {
    it('should register a new agent', async () => {
      const [agentPda] = findAgentPda(owner.publicKey, AGENT_REGISTRY_PROGRAM_ID);

      await program.methods
        .registerAgent('TestAgent', 'QmMetadata123', ['coding', 'review'])
        .accounts({
          agent: agentPda,
          owner: owner.publicKey,
          systemProgram: PublicKey.default,
        })
        .signers([owner])
        .rpc();

      const agent = await program.account.agent.fetch(agentPda);
      assert.equal(agent.owner.toBase58(), owner.publicKey.toBase58());
      assert.equal(agent.name, 'TestAgent');
      assert.equal(agent.metadataUri, 'QmMetadata123');
      assert.deepEqual(agent.capabilities, ['coding', 'review']);
      assert.equal(agent.reputationScore.toNumber(), 0);
      assert.equal(agent.totalStake.toNumber(), 0);
      assert.equal(agent.tasksCompleted.toNumber(), 0);
      assert.equal(agent.tasksFailed.toNumber(), 0);
      assert.equal(agent.active, true);
      assert.ok(agent.registeredAt.toNumber() > 0);
    });

    it('should reject duplicate registration', async () => {
      const [agentPda] = findAgentPda(owner.publicKey, AGENT_REGISTRY_PROGRAM_ID);

      try {
        await program.methods
          .registerAgent('Duplicate', 'QmDup', [])
          .accounts({
            agent: agentPda,
            owner: owner.publicKey,
            systemProgram: PublicKey.default,
          })
          .signers([owner])
          .rpc();
        assert.fail('Should have thrown');
      } catch (err: any) {
        assert.ok(err.toString().includes('already in use') || err.toString().includes('AccountNotNeeded'));
      }
    });

    it('should reject name longer than 64 chars', async () => {
      const anotherOwner = Keypair.generate();
      const sig = await provider.connection.requestAirdrop(
        anotherOwner.publicKey,
        1 * LAMPORTS_PER_SOL,
      );
      await provider.connection.confirmTransaction(sig);

      const [agentPda] = findAgentPda(anotherOwner.publicKey, AGENT_REGISTRY_PROGRAM_ID);
      const longName = 'A'.repeat(65);

      try {
        await program.methods
          .registerAgent(longName, 'QmMeta', [])
          .accounts({
            agent: agentPda,
            owner: anotherOwner.publicKey,
            systemProgram: PublicKey.default,
          })
          .signers([anotherOwner])
          .rpc();
        assert.fail('Should have thrown');
      } catch (err: any) {
        assert.ok(err.toString().includes('NameTooLong'));
      }
    });
  });

  describe('update_metadata', () => {
    it('should update agent metadata', async () => {
      const [agentPda] = findAgentPda(owner.publicKey, AGENT_REGISTRY_PROGRAM_ID);

      await program.methods
        .updateMetadata('QmUpdatedMetadata')
        .accounts({
          agent: agentPda,
          owner: owner.publicKey,
        })
        .signers([owner])
        .rpc();

      const agent = await program.account.agent.fetch(agentPda);
      assert.equal(agent.metadataUri, 'QmUpdatedMetadata');
    });

    it('should reject non-owner update', async () => {
      const [agentPda] = findAgentPda(owner.publicKey, AGENT_REGISTRY_PROGRAM_ID);
      const impostor = Keypair.generate();

      try {
        await program.methods
          .updateMetadata('QmHacked')
          .accounts({
            agent: agentPda,
            owner: impostor.publicKey,
          })
          .signers([impostor])
          .rpc();
        assert.fail('Should have thrown');
      } catch (err: any) {
        assert.ok(err);
      }
    });
  });

  describe('suspend_agent', () => {
    it('should suspend an agent', async () => {
      const [agentPda] = findAgentPda(owner.publicKey, AGENT_REGISTRY_PROGRAM_ID);

      await program.methods
        .suspendAgent()
        .accounts({
          agent: agentPda,
          authority: owner.publicKey,
        })
        .signers([owner])
        .rpc();

      const agent = await program.account.agent.fetch(agentPda);
      assert.equal(agent.active, false);
    });

    it('should reactivate an agent', async () => {
      const [agentPda] = findAgentPda(owner.publicKey, AGENT_REGISTRY_PROGRAM_ID);

      await program.methods
        .reactivateAgent()
        .accounts({
          agent: agentPda,
          authority: owner.publicKey,
        })
        .signers([owner])
        .rpc();

      const agent = await program.account.agent.fetch(agentPda);
      assert.equal(agent.active, true);
    });
  });

  describe('record_completion', () => {
    it('should increment tasks_completed', async () => {
      const [agentPda] = findAgentPda(owner.publicKey, AGENT_REGISTRY_PROGRAM_ID);

      await program.methods
        .recordCompletion()
        .accounts({
          agent: agentPda,
        })
        .signers([])
        .rpc();

      const agent = await program.account.agent.fetch(agentPda);
      assert.equal(agent.tasksCompleted.toNumber(), 1);
    });

    it('should increment tasks_failed', async () => {
      const [agentPda] = findAgentPda(owner.publicKey, AGENT_REGISTRY_PROGRAM_ID);

      await program.methods
        .recordFailure()
        .accounts({
          agent: agentPda,
        })
        .signers([])
        .rpc();

      const agent = await program.account.agent.fetch(agentPda);
      assert.equal(agent.tasksFailed.toNumber(), 1);
    });
  });

  describe('set_reputation', () => {
    it('should update reputation score', async () => {
      const [agentPda] = findAgentPda(owner.publicKey, AGENT_REGISTRY_PROGRAM_ID);

      await program.methods
        .setReputation(new anchor.BN(7500))
        .accounts({
          agent: agentPda,
        })
        .signers([])
        .rpc();

      const agent = await program.account.agent.fetch(agentPda);
      assert.equal(agent.reputationScore.toNumber(), 7500);
    });

    it('should reject reputation > 10000', async () => {
      const [agentPda] = findAgentPda(owner.publicKey, AGENT_REGISTRY_PROGRAM_ID);

      try {
        await program.methods
          .setReputation(new anchor.BN(10001))
          .accounts({
            agent: agentPda,
          })
          .signers([])
          .rpc();
        assert.fail('Should have thrown');
      } catch (err: any) {
        assert.ok(err.toString().includes('InvalidReputation'));
      }
    });
  });
});
