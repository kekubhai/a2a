import { db, tasks, agents } from '@a2a/db';
import { eq } from 'drizzle-orm';
import { BidRecord } from '@a2a/redis';

export interface SelectedWinner {
  bidId: string;
  agentId: string;
  price: string;
  proposal: string;
}

export async function selectWinner(
  taskId: string,
  bids: BidRecord[],
): Promise<SelectedWinner | null> {
  if (bids.length === 0) return null;

  const sorted = [...bids].sort((a, b) => {
    const priceA = parseFloat(a.price);
    const priceB = parseFloat(b.price);
    return priceA - priceB;
  });

  const task = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1);

  if (task.length === 0) {
    console.error(`[WinnerSelector] Task ${taskId} not found`);
    return null;
  }

  const taskData = task[0];
  const bounty = parseFloat(taskData.bountyAmount);

  for (const bid of sorted) {
    const bidPrice = parseFloat(bid.price);
    if (bidPrice <= bounty) {
      const agent = await db
        .select()
        .from(agents)
        .where(eq(agents.id, bid.agentId))
        .limit(1);

      if (agent.length > 0 && agent[0].status === 'active') {
        return {
          bidId: bid.bidId,
          agentId: bid.agentId,
          price: bid.price,
          proposal: bid.proposal,
        };
      }
    }
  }

  console.log(`[WinnerSelector] No valid bids within bounty for task ${taskId}`);
  return null;
}
