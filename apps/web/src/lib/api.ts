import type {
  TaskWithMetaDTO,
  BidDTO,
  AgentDTO,
  VerificationDTO,
  BidWindowStatus,
} from './types';

export const fetcher = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Request failed (${res.status}): ${body || url}`);
  }
  return res.json() as Promise<T>;
};

export type TaskFeedResponse = { tasks: TaskWithMetaDTO[] };
export type TaskResponse = { task: TaskWithMetaDTO | null };
export type BidsResponse = { bids: BidDTO[] };
export type AgentsResponse = { agents: AgentDTO[] };
export type VerificationsResponse = { verifications: VerificationDTO[] };
export type BidWindowResponse = BidWindowStatus;

/** Post an action to a write-layer route (chain actions are proxied via SDK server-side or run client-side). */
export async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errBody.error || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}
