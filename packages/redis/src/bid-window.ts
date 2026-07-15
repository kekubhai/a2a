import { getRedisClient } from './client.js';

const BID_WINDOW_PREFIX = 'a2a:bid:window:';
const BID_SET_PREFIX = 'a2a:bid:set:';
const BID_WINDOW_DEFAULT_TTL = 120;

export interface BidRecord {
  bidId: string;
  agentId: string;
  price: string;
  proposal: string;
  submittedAt: number;
}

export interface TaskNotification {
  taskId: string;
  title: string;
  description: string;
  bountyAmount: string;
  bountyToken: string;
  chainType: string;
  acceptanceCriteriaHash: string;
  deadline: string | null;
  requirements: Record<string, unknown>;
}

export async function openBidWindow(
  taskId: string,
  ttlSeconds: number = BID_WINDOW_DEFAULT_TTL,
): Promise<void> {
  const redis = getRedisClient();
  const windowKey = `${BID_WINDOW_PREFIX}${taskId}`;
  const bidSetKey = `${BID_SET_PREFIX}${taskId}`;

  await redis.set(windowKey, 'open', 'EX', ttlSeconds);
  await redis.del(bidSetKey);
}

export async function closeBidWindow(taskId: string): Promise<void> {
  const redis = getRedisClient();
  const windowKey = `${BID_WINDOW_PREFIX}${taskId}`;
  await redis.set(windowKey, 'closed');
}

export async function isBidWindowOpen(taskId: string): Promise<boolean> {
  const redis = getRedisClient();
  const windowKey = `${BID_WINDOW_PREFIX}${taskId}`;
  const status = await redis.get(windowKey);
  return status === 'open';
}

export async function getBidWindowTTL(taskId: string): Promise<number> {
  const redis = getRedisClient();
  const windowKey = `${BID_WINDOW_PREFIX}${taskId}`;
  const ttl = await redis.ttl(windowKey);
  return Math.max(0, ttl);
}

export async function submitBidToWindow(
  taskId: string,
  bid: BidRecord,
): Promise<{ accepted: boolean; position?: number }> {
  const redis = getRedisClient();
  const windowKey = `${BID_WINDOW_PREFIX}${taskId}`;
  const bidSetKey = `${BID_SET_PREFIX}${taskId}`;

  const status = await redis.get(windowKey);
  if (status !== 'open') {
    return { accepted: false };
  }

  const existing = await redis.hget(bidSetKey, bid.agentId);
  if (existing) {
    return { accepted: false };
  }

  await redis.hset(bidSetKey, bid.agentId, JSON.stringify(bid));

  const count = await redis.hlen(bidSetKey);
  return { accepted: true, position: count };
}

export async function collectBids(taskId: string): Promise<BidRecord[]> {
  const redis = getRedisClient();
  const bidSetKey = `${BID_SET_PREFIX}${taskId}`;

  const all = await redis.hgetall(bidSetKey);
  const bids: BidRecord[] = [];

  for (const [, value] of Object.entries(all)) {
    bids.push(JSON.parse(value));
  }

  return bids.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
}

export async function clearBids(taskId: string): Promise<void> {
  const redis = getRedisClient();
  const windowKey = `${BID_WINDOW_PREFIX}${taskId}`;
  const bidSetKey = `${BID_SET_PREFIX}${taskId}`;
  await redis.del(windowKey, bidSetKey);
}
