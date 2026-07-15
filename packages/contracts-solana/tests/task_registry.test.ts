import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import {
  Keypair,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { assert } from 'chai';

const TASK_REGISTRY_PROGRAM_ID = new PublicKey('A2ATsk1rGe11DKjNnEZBpGKvVXTbFBqVbJbVJnVaMp3');

function findTaskPda(
  buyer: PublicKey,
  timestamp: anchor.BN,
  programId: PublicKey,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('task'),
      buyer.toBuffer(),
      timestamp.toArrayLike(Buffer, 'le', 8),
    ],
    programId,
  );
}

function findEscrowPda(taskPda: PublicKey, programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('escrow'), taskPda.toBuffer()],
    programId,
  );
}

describe('task_registry', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = new anchor.Program(
    require('../target/idl/task_registry.json'),
    provider,
  );

  const buyer = Keypair.generate();
  const worker = Keypair.generate();

  before(async () => {
    const sig = await provider.connection.requestAirdrop(
      buyer.publicKey,
      10 * LAMPORTS_PER_SOL,
    );
    await provider.connection.confirmTransaction(sig);

    const workerSig = await provider.connection.requestAirdrop(
      worker.publicKey,
      1 * LAMPORTS_PER_SOL,
    );
    await provider.connection.confirmTransaction(workerSig);
  });

  describe('create_task', () => {
    it('should create a task with escrowed bounty', async () => {
      const timestamp = new anchor.BN(Math.floor(Date.now() / 1000));
      const [taskPda] = findTaskPda(buyer.publicKey, timestamp, TASK_REGISTRY_PROGRAM_ID);
      const [escrowPda] = findEscrowPda(taskPda, TASK_REGISTRY_PROGRAM_ID);

      const bounty = new anchor.BN(LAMPORTS_PER_SOL);
      const buyerBalanceBefore = await provider.connection.getBalance(buyer.publicKey);

      await program.methods
        .createTask(
          buyer.publicKey,
          'QmAcceptanceCriteria',
          bounty,
          new anchor.BN(Math.floor(Date.now() / 1000) + 86400),
        )
        .accounts({
          task: taskPda,
          escrow: escrowPda,
          buyer: buyer.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([buyer])
        .rpc();

      const task = await program.account.task.fetch(taskPda);
      assert.equal(task.buyerAgent.toBase58(), buyer.publicKey.toBase58());
      assert.equal(task.workerAgent.toBase58(), PublicKey.default.toBase58());
      assert.equal(task.bountyAmount.toString(), bounty.toString());
      assert.equal(task.acceptanceCriteriaHash, 'QmAcceptanceCriteria');
      assert.deepEqual(task.status, { open: {} });
      assert.ok(task.createdAt.toNumber() > 0);

      const escrowBalance = await provider.connection.getBalance(escrowPda);
      assert.equal(escrowBalance, LAMPORTS_PER_SOL);

      const buyerBalanceAfter = await provider.connection.getBalance(buyer.publicKey);
      assert.ok(buyerBalanceBefore - buyerBalanceAfter >= LAMPORTS_PER_SOL);
    });

    it('should reject zero bounty', async () => {
      const timestamp = new anchor.BN(Math.floor(Date.now() / 1000) + 1);
      const [taskPda] = findTaskPda(buyer.publicKey, timestamp, TASK_REGISTRY_PROGRAM_ID);
      const [escrowPda] = findEscrowPda(taskPda, TASK_REGISTRY_PROGRAM_ID);

      try {
        await program.methods
          .createTask(
            buyer.publicKey,
            'QmCriteria',
            new anchor.BN(0),
            new anchor.BN(0),
          )
          .accounts({
            task: taskPda,
            escrow: escrowPda,
            buyer: buyer.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([buyer])
          .rpc();
        assert.fail('Should have thrown');
      } catch (err: any) {
        assert.ok(err.toString().includes('ZeroBounty'));
      }
    });
  });

  describe('assign_task', () => {
    it('should assign a worker to an open task', async () => {
      const timestamp = new anchor.BN(Math.floor(Date.now() / 1000) + 2);
      const [taskPda] = findTaskPda(buyer.publicKey, timestamp, TASK_REGISTRY_PROGRAM_ID);
      const [escrowPda] = findEscrowPda(taskPda, TASK_REGISTRY_PROGRAM_ID);

      await program.methods
        .createTask(
          buyer.publicKey,
          'QmBidCriteria',
          new anchor.BN(LAMPORTS_PER_SOL),
          new anchor.BN(Math.floor(Date.now() / 1000) + 86400),
        )
        .accounts({
          task: taskPda,
          escrow: escrowPda,
          buyer: buyer.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([buyer])
        .rpc();

      await program.methods
        .assignTask(worker.publicKey)
        .accounts({
          task: taskPda,
          buyer: buyer.publicKey,
        })
        .signers([buyer])
        .rpc();

      const task = await program.account.task.fetch(taskPda);
      assert.equal(task.workerAgent.toBase58(), worker.publicKey.toBase58());
      assert.deepEqual(task.status, { assigned: {} });
    });

    it('should reject assigning to non-open task', async () => {
      const timestamp = new anchor.BN(Math.floor(Date.now() / 1000) + 3);
      const [taskPda] = findTaskPda(buyer.publicKey, timestamp, TASK_REGISTRY_PROGRAM_ID);
      const [escrowPda] = findEscrowPda(taskPda, TASK_REGISTRY_PROGRAM_ID);

      await program.methods
        .createTask(
          buyer.publicKey,
          'QmCriteria2',
          new anchor.BN(LAMPORTS_PER_SOL),
          new anchor.BN(Math.floor(Date.now() / 1000) + 86400),
        )
        .accounts({
          task: taskPda,
          escrow: escrowPda,
          buyer: buyer.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([buyer])
        .rpc();

      await program.methods
        .assignTask(worker.publicKey)
        .accounts({
          task: taskPda,
          buyer: buyer.publicKey,
        })
        .signers([buyer])
        .rpc();

      try {
        await program.methods
          .assignTask(Keypair.generate().publicKey)
          .accounts({
            task: taskPda,
            buyer: buyer.publicKey,
          })
          .signers([buyer])
          .rpc();
        assert.fail('Should have thrown');
      } catch (err: any) {
        assert.ok(err.toString().includes('NotOpen') || err.toString().includes('InvalidStatus'));
      }
    });
  });

  describe('submit_task', () => {
    it('should submit task completion proof', async () => {
      const timestamp = new anchor.BN(Math.floor(Date.now() / 1000) + 4);
      const [taskPda] = findTaskPda(buyer.publicKey, timestamp, TASK_REGISTRY_PROGRAM_ID);
      const [escrowPda] = findEscrowPda(taskPda, TASK_REGISTRY_PROGRAM_ID);

      await program.methods
        .createTask(
          buyer.publicKey,
          'QmSubmitCriteria',
          new anchor.BN(LAMPORTS_PER_SOL),
          new anchor.BN(Math.floor(Date.now() / 1000) + 86400),
        )
        .accounts({
          task: taskPda,
          escrow: escrowPda,
          buyer: buyer.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([buyer])
        .rpc();

      await program.methods
        .assignTask(worker.publicKey)
        .accounts({
          task: taskPda,
          buyer: buyer.publicKey,
        })
        .signers([buyer])
        .rpc();

      await program.methods
        .submitTask('QmSubmissionHash')
        .accounts({
          task: taskPda,
          worker: worker.publicKey,
        })
        .signers([worker])
        .rpc();

      const task = await program.account.task.fetch(taskPda);
      assert.equal(task.submissionHash, 'QmSubmissionHash');
      assert.deepEqual(task.status, { submitted: {} });
      assert.ok(task.submittedAt.toNumber() > 0);
    });

    it('should reject submission after deadline', async () => {
      const timestamp = new anchor.BN(Math.floor(Date.now() / 1000) + 5);
      const [taskPda] = findTaskPda(buyer.publicKey, timestamp, TASK_REGISTRY_PROGRAM_ID);
      const [escrowPda] = findEscrowPda(taskPda, TASK_REGISTRY_PROGRAM_ID);

      const pastDeadline = new anchor.BN(Math.floor(Date.now() / 1000) - 1);

      await program.methods
        .createTask(
          buyer.publicKey,
          'QmDeadlineCriteria',
          new anchor.BN(LAMPORTS_PER_SOL),
          pastDeadline,
        )
        .accounts({
          task: taskPda,
          escrow: escrowPda,
          buyer: buyer.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([buyer])
        .rpc();

      await program.methods
        .assignTask(worker.publicKey)
        .accounts({
          task: taskPda,
          buyer: buyer.publicKey,
        })
        .signers([buyer])
        .rpc();

      try {
        await program.methods
          .submitTask('QmLateSubmission')
          .accounts({
            task: taskPda,
            worker: worker.publicKey,
          })
          .signers([worker])
          .rpc();
        assert.fail('Should have thrown');
      } catch (err: any) {
        assert.ok(err.toString().includes('DeadlinePassed'));
      }
    });
  });

  describe('complete_task', () => {
    it('should release escrow to worker on completion', async () => {
      const timestamp = new anchor.BN(Math.floor(Date.now() / 1000) + 6);
      const [taskPda] = findTaskPda(buyer.publicKey, timestamp, TASK_REGISTRY_PROGRAM_ID);
      const [escrowPda] = findEscrowPda(taskPda, TASK_REGISTRY_PROGRAM_ID);

      const bounty = new anchor.BN(LAMPORTS_PER_SOL);

      await program.methods
        .createTask(
          buyer.publicKey,
          'QmCompleteCriteria',
          bounty,
          new anchor.BN(Math.floor(Date.now() / 1000) + 86400),
        )
        .accounts({
          task: taskPda,
          escrow: escrowPda,
          buyer: buyer.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([buyer])
        .rpc();

      await program.methods
        .assignTask(worker.publicKey)
        .accounts({
          task: taskPda,
          buyer: buyer.publicKey,
        })
        .signers([buyer])
        .rpc();

      await program.methods
        .submitTask('QmCompleteSubmission')
        .accounts({
          task: taskPda,
          worker: worker.publicKey,
        })
        .signers([worker])
        .rpc();

      const workerBalanceBefore = await provider.connection.getBalance(worker.publicKey);

      await program.methods
        .completeTask()
        .accounts({
          task: taskPda,
          escrow: escrowPda,
          worker: worker.publicKey,
          buyer: buyer.publicKey,
        })
        .signers([buyer])
        .rpc();

      const task = await program.account.task.fetch(taskPda);
      assert.deepEqual(task.status, { completed: {} });
      assert.equal(task.bountyAmount.toNumber(), 0);
      assert.ok(task.completedAt.toNumber() > 0);

      const workerBalanceAfter = await provider.connection.getBalance(worker.publicKey);
      assert.equal(workerBalanceAfter - workerBalanceBefore, LAMPORTS_PER_SOL);

      const escrowBalance = await provider.connection.getBalance(escrowPda);
      assert.equal(escrowBalance, 0);
    });

    it('should reject completion of non-submitted task', async () => {
      const timestamp = new anchor.BN(Math.floor(Date.now() / 1000) + 7);
      const [taskPda] = findTaskPda(buyer.publicKey, timestamp, TASK_REGISTRY_PROGRAM_ID);
      const [escrowPda] = findEscrowPda(taskPda, TASK_REGISTRY_PROGRAM_ID);

      await program.methods
        .createTask(
          buyer.publicKey,
          'QmFailCriteria',
          new anchor.BN(LAMPORTS_PER_SOL),
          new anchor.BN(Math.floor(Date.now() / 1000) + 86400),
        )
        .accounts({
          task: taskPda,
          escrow: escrowPda,
          buyer: buyer.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([buyer])
        .rpc();

      try {
        await program.methods
          .completeTask()
          .accounts({
            task: taskPda,
            escrow: escrowPda,
            worker: worker.publicKey,
            buyer: buyer.publicKey,
          })
          .signers([buyer])
          .rpc();
        assert.fail('Should have thrown');
      } catch (err: any) {
        assert.ok(err.toString().includes('InvalidStatus'));
      }
    });
  });

  describe('fail_task', () => {
    it('should refund escrow to buyer on failure', async () => {
      const timestamp = new anchor.BN(Math.floor(Date.now() / 1000) + 8);
      const [taskPda] = findTaskPda(buyer.publicKey, timestamp, TASK_REGISTRY_PROGRAM_ID);
      const [escrowPda] = findEscrowPda(taskPda, TASK_REGISTRY_PROGRAM_ID);

      const bounty = new anchor.BN(LAMPORTS_PER_SOL);
      const buyerBalanceBefore = await provider.connection.getBalance(buyer.publicKey);

      await program.methods
        .createTask(
          buyer.publicKey,
          'QmFailCriteria2',
          bounty,
          new anchor.BN(Math.floor(Date.now() / 1000) + 86400),
        )
        .accounts({
          task: taskPda,
          escrow: escrowPda,
          buyer: buyer.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([buyer])
        .rpc();

      await program.methods
        .assignTask(worker.publicKey)
        .accounts({
          task: taskPda,
          buyer: buyer.publicKey,
        })
        .signers([buyer])
        .rpc();

      await program.methods
        .submitTask('QmFailSubmission')
        .accounts({
          task: taskPda,
          worker: worker.publicKey,
        })
        .signers([worker])
        .rpc();

      await program.methods
        .failTask()
        .accounts({
          task: taskPda,
          escrow: escrowPda,
          buyer: buyer.publicKey,
        })
        .signers([buyer])
        .rpc();

      const task = await program.account.task.fetch(taskPda);
      assert.deepEqual(task.status, { failed: {} });
      assert.equal(task.bountyAmount.toNumber(), 0);

      const escrowBalance = await provider.connection.getBalance(escrowPda);
      assert.equal(escrowBalance, 0);
    });
  });

  describe('cancel_task', () => {
    it('should cancel open task and refund escrow', async () => {
      const timestamp = new anchor.BN(Math.floor(Date.now() / 1000) + 9);
      const [taskPda] = findTaskPda(buyer.publicKey, timestamp, TASK_REGISTRY_PROGRAM_ID);
      const [escrowPda] = findEscrowPda(taskPda, TASK_REGISTRY_PROGRAM_ID);

      const bounty = new anchor.BN(LAMPORTS_PER_SOL);

      await program.methods
        .createTask(
          buyer.publicKey,
          'QmCancelCriteria',
          bounty,
          new anchor.BN(Math.floor(Date.now() / 1000) + 86400),
        )
        .accounts({
          task: taskPda,
          escrow: escrowPda,
          buyer: buyer.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([buyer])
        .rpc();

      const escrowBalanceBefore = await provider.connection.getBalance(escrowPda);
      assert.equal(escrowBalanceBefore, LAMPORTS_PER_SOL);

      await program.methods
        .cancelTask()
        .accounts({
          task: taskPda,
          escrow: escrowPda,
          buyer: buyer.publicKey,
        })
        .signers([buyer])
        .rpc();

      const task = await program.account.task.fetch(taskPda);
      assert.deepEqual(task.status, { cancelled: {} });
      assert.equal(task.bountyAmount.toNumber(), 0);

      const escrowBalanceAfter = await provider.connection.getBalance(escrowPda);
      assert.equal(escrowBalanceAfter, 0);
    });

    it('should reject cancelling non-open task', async () => {
      const timestamp = new anchor.BN(Math.floor(Date.now() / 1000) + 10);
      const [taskPda] = findTaskPda(buyer.publicKey, timestamp, TASK_REGISTRY_PROGRAM_ID);
      const [escrowPda] = findEscrowPda(taskPda, TASK_REGISTRY_PROGRAM_ID);

      await program.methods
        .createTask(
          buyer.publicKey,
          'QmCancelFailCriteria',
          new anchor.BN(LAMPORTS_PER_SOL),
          new anchor.BN(Math.floor(Date.now() / 1000) + 86400),
        )
        .accounts({
          task: taskPda,
          escrow: escrowPda,
          buyer: buyer.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([buyer])
        .rpc();

      await program.methods
        .assignTask(worker.publicKey)
        .accounts({
          task: taskPda,
          buyer: buyer.publicKey,
        })
        .signers([buyer])
        .rpc();

      try {
        await program.methods
          .cancelTask()
          .accounts({
            task: taskPda,
            escrow: escrowPda,
            buyer: buyer.publicKey,
          })
          .signers([buyer])
          .rpc();
        assert.fail('Should have thrown');
      } catch (err: any) {
        assert.ok(err.toString().includes('NotOpen'));
      }
    });
  });
});
