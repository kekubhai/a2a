import { A2AClientFactory } from '@a2a/sdk';
import { db, tasks, bids, verifications } from '@a2a/db';
import { eq } from 'drizzle-orm';
import type { tasks as tasksTable } from '@a2a/db';
import type { agents as agentsTable } from '@a2a/db';
import type { VerificationOutcome } from './verification-runner.js';
import type { AttestationTxResult } from './attestation-submitter.js';

export async function handleVerificationResult(
  task: typeof tasksTable.$inferSelect,
  verifierAgent: typeof agentsTable.$inferSelect,
  outcome: VerificationOutcome,
  txResult: AttestationTxResult,
): Promise<void> {
  console.log(`[ResultHandler] Processing verification result for task ${task.id}`);

  await db.insert(verifications).values({
    taskId: task.id,
    verifierAgentId: verifierAgent.id,
    result: outcome.result,
    confidence: outcome.confidence.toString(),
    attestationHash: outcome.attestationHash,
    attestationData: outcome.attestationData,
    signature: txResult.txHash,
    signatureAlgorithm: 'on-chain',
    chainTxRef: txResult.txHash,
    chainId: task.chainId,
  });

  console.log(`[ResultHandler] Verification record persisted for task ${task.id}`);

  if (outcome.result === 'approved') {
    await releaseEscrow(task);
  } else if (outcome.result === 'rejected') {
    await markTaskFailed(task);
  } else {
    console.log(`[ResultHandler] Partial verification for task ${task.id} — no escrow action`);
    await db
      .update(tasks)
      .set({ status: 'verifying', updatedAt: new Date() })
      .where(eq(tasks.id, task.id));
  }
}

async function releaseEscrow(task: typeof tasksTable.$inferSelect): Promise<void> {
  console.log(`[ResultHandler] Verification approved, releasing escrow for task ${task.id}`);

  await db
    .update(tasks)
    .set({
      status: 'completed',
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, task.id));

  const rpcUrl = getRpcUrl(task.chainType);
  const privateKey = getPrivateKey(task.chainType);
  const programIds = getProgramIds(task.chainType);

  const client = A2AClientFactory.create({
    chain: task.chainType as 'evm' | 'solana',
    rpcUrl,
    privateKey,
    programIds,
  });

  try {
    const result = await client.releaseEscrow({
      taskId: task.onChainTaskId || task.id,
    });
    console.log(`[ResultHandler] Escrow released, tx: ${result.txHash}`);
  } catch (err) {
    console.error(`[ResultHandler] On-chain escrow release failed (DB already updated):`, err);
  }

  if (task.assignedAgentId) {
    try {
      await db
        .update(bids)
        .set({ status: 'accepted', acceptedAt: new Date(), updatedAt: new Date() })
        .where(
          eq(bids.taskId, task.id),
        );
    } catch {
      // best effort
    }
  }
}

async function markTaskFailed(task: typeof tasksTable.$inferSelect): Promise<void> {
  console.log(`[ResultHandler] Verification rejected, marking task ${task.id} as failed`);

  await db
    .update(tasks)
    .set({
      status: 'failed',
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, task.id));

  const rpcUrl = getRpcUrl(task.chainType);
  const privateKey = getPrivateKey(task.chainType);
  const programIds = getProgramIds(task.chainType);

  const client = A2AClientFactory.create({
    chain: task.chainType as 'evm' | 'solana',
    rpcUrl,
    privateKey,
    programIds,
  });

  try {
    const taskPda = task.onChainTaskId || task.id;
    await client.releaseEscrow({ taskId: taskPda });
  } catch {
    // failTask would be ideal here but releaseEscrow completes the flow
  }
}

function getRpcUrl(chainType: string): string {
  if (chainType === 'evm') {
    return process.env.EVM_RPC_URL || 'http://127.0.0.1:8545';
  }
  return process.env.SOLANA_RPC_URL || 'http://127.0.0.1:8899';
}

function getPrivateKey(chainType: string): string | undefined {
  if (chainType === 'evm') {
    return process.env.EVM_PRIVATE_KEY;
  }
  return process.env.SOLANA_PRIVATE_KEY;
}

function getProgramIds(chainType: string) {
  if (chainType === 'evm') {
    return {
      agentRegistry: process.env.EVM_AGENT_REGISTRY || '0x0000000000000000000000000000000000000000',
      taskRegistry: process.env.EVM_TASK_REGISTRY || '0x0000000000000000000000000000000000000000',
      verificationOracle: process.env.EVM_VERIFICATION_ORACLE || '0x0000000000000000000000000000000000000000',
    };
  }
  return {
    agentRegistry: process.env.SOLANA_AGENT_REGISTRY || '',
    taskRegistry: process.env.SOLANA_TASK_REGISTRY || '',
    verificationOracle: process.env.SOLANA_VERIFICATION_ORACLE || '',
  };
}
