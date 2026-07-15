import { db, tasks, bids } from '@a2a/db';
import { eq } from 'drizzle-orm';
import { openBidWindow, isBidWindowOpen, getBidWindowTTL, collectBids, clearBids, BidRecord } from '@a2a/redis';
import { selectWinner } from './winner-selector.js';
import { triggerEscrowLock } from './escrow-trigger.js';

export async function startBidCollection(
  taskId: string,
  windowSeconds: number,
): Promise<void> {
  console.log(`[BidCollector] Opening bid window for task ${taskId} (${windowSeconds}s)`);

  await openBidWindow(taskId, windowSeconds);

  setTimeout(async () => {
    try {
      await processBidWindow(taskId);
    } catch (err) {
      console.error(`[BidCollector] Error processing bid window for task ${taskId}:`, err);
    }
  }, windowSeconds * 1000);
}

async function processBidWindow(taskId: string): Promise<void> {
  const stillOpen = await isBidWindowOpen(taskId);
  if (!stillOpen) {
    console.log(`[BidCollector] Bid window already closed for task ${taskId}`);
    return;
  }

  await closeBidWindow(taskId);
  console.log(`[BidCollector] Bid window closed for task ${taskId}`);

  const redisBids = await collectBids(taskId);
  console.log(`[BidCollector] Collected ${redisBids.length} bids for task ${taskId}`);

  if (redisBids.length === 0) {
    console.log(`[BidCollector] No bids for task ${taskId}, resetting to open`);
    await db
      .update(tasks)
      .set({ status: 'open', updatedAt: new Date() })
      .where(eq(tasks.id, taskId));
    await clearBids(taskId);
    return;
  }

  await persistBids(taskId, redisBids);

  const winner = await selectWinner(taskId, redisBids);
  if (!winner) {
    console.log(`[BidCollector] No winner selected for task ${taskId}`);
    await db
      .update(tasks)
      .set({ status: 'open', updatedAt: new Date() })
      .where(eq(tasks.id, taskId));
    await clearBids(taskId);
    return;
  }

  console.log(
    `[BidCollector] Winner: agent ${winner.agentId} with price ${winner.price} for task ${taskId}`,
  );

  try {
    await triggerEscrowLock(taskId, winner);
    console.log(`[BidCollector] Escrow locked for task ${taskId}`);
  } catch (err) {
    console.error(`[BidCollector] Failed to lock escrow for task ${taskId}:`, err);
  }

  await clearBids(taskId);
}

async function persistBids(taskId: string, redisBids: BidRecord[]): Promise<void> {
  for (const rb of redisBids) {
    const existing = await db
      .select()
      .from(bids)
      .where(eq(bids.id, rb.bidId))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(bids).values({
        id: rb.bidId,
        taskId,
        bidderAgentId: rb.agentId,
        price: rb.price,
        proposal: rb.proposal,
        status: 'pending',
      });
    }
  }
}

async function closeBidWindow(taskId: string): Promise<void> {
  const { closeBidWindow: close } = await import('@a2a/redis');
  await close(taskId);
}

export async function getBidWindowStatus(taskId: string) {
  const open = await isBidWindowOpen(taskId);
  const ttl = await getBidWindowTTL(taskId);
  return { open, ttl };
}
