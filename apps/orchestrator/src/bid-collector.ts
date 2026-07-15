import { openBidWindow, isBidWindowOpen, getBidWindowTTL } from '@a2a/redis';
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

  const { collectBids, closeBidWindow, clearBids } = await import('@a2a/redis');

  await closeBidWindow(taskId);
  console.log(`[BidCollector] Bid window closed for task ${taskId}`);

  const bids = await collectBids(taskId);
  console.log(`[BidCollector] Collected ${bids.length} bids for task ${taskId}`);

  if (bids.length === 0) {
    console.log(`[BidCollector] No bids for task ${taskId}, skipping`);
    await clearBids(taskId);
    return;
  }

  const winner = await selectWinner(taskId, bids);
  if (!winner) {
    console.log(`[BidCollector] No winner selected for task ${taskId}`);
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

export async function getBidWindowStatus(taskId: string) {
  const open = await isBidWindowOpen(taskId);
  const ttl = await getBidWindowTTL(taskId);
  return { open, ttl };
}
