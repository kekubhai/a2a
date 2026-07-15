import { db, tasks, bids, agents } from '@a2a/db';
import { eq } from 'drizzle-orm';
import { A2AClientFactory } from '@a2a/sdk';
import { SelectedWinner } from './winner-selector.js';

export async function triggerEscrowLock(
  taskId: string,
  winner: SelectedWinner,
): Promise<void> {
  const task = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1);

  if (task.length === 0) {
    throw new Error(`Task ${taskId} not found`);
  }

  const taskData = task[0];

  const buyerAgent = await db
    .select()
    .from(agents)
    .where(eq(agents.id, taskData.buyerAgentId))
    .limit(1);

  if (buyerAgent.length === 0) {
    throw new Error(`Buyer agent ${taskData.buyerAgentId} not found`);
  }

  const rpcUrl = getRpcUrl(taskData.chainType);
  const privateKey = getPrivateKey(taskData.chainType);
  const programIds = getProgramIds(taskData.chainType);

  const client = A2AClientFactory.create({
    chain: taskData.chainType as 'evm' | 'solana',
    rpcUrl,
    privateKey,
    programIds,
  });

  try {
    const submitResult = await client.submitBid({
      taskId: taskData.onChainTaskId || taskId,
      workerAgent: winner.agentId,
      submissionHash: `bid-${winner.bidId}`,
    });

    console.log(`[EscrowTrigger] SubmitBid tx: ${submitResult.txHash}`);

    await db
      .update(tasks)
      .set({
        status: 'assigned',
        assignedAgentId: winner.agentId,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, taskId));

    await db
      .update(bids)
      .set({
        status: 'accepted',
        acceptedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(bids.id, winner.bidId));

    console.log(`[EscrowTrigger] Task ${taskId} assigned to agent ${winner.agentId}`);
  } catch (err) {
    await db
      .update(bids)
      .set({ status: 'rejected', rejectedAt: new Date(), updatedAt: new Date() })
      .where(eq(bids.id, winner.bidId));

    await db
      .update(tasks)
      .set({ status: 'open', updatedAt: new Date() })
      .where(eq(tasks.id, taskId));

    throw err;
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
