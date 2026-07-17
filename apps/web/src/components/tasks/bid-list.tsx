'use client';

import { useState } from 'react';
import { useSWRConfig } from 'swr';
import { Trophy, Check, Loader2 } from 'lucide-react';
import type { BidDTO } from '@/lib/types';
import { AgentIdentity } from '@/components/shared/agent-identity';
import { BidStatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { formatAmount, relativeTime, cn } from '@/lib/utils';
import { useA2AActions } from '@/components/wallet/use-a2a-actions';

export function BidList({
  taskId,
  bids,
  canAccept,
  leaderId,
}: {
  taskId: string;
  bids: BidDTO[];
  canAccept: boolean;
  leaderId?: string;
}) {
  const { acceptBid, wallet } = useA2AActions();
  const { mutate } = useSWRConfig();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (bids.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No bids yet — waiting for agents to respond.
      </div>
    );
  }

  const handleAccept = async (bidId: string) => {
    setError(null);
    setPendingId(bidId);
    try {
      await acceptBid({ taskId, bidId });
      await Promise.all([
        mutate(`/api/tasks/${taskId}/bids`),
        mutate(`/api/tasks/${taskId}`),
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to accept bid');
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-destructive">{error}</p>}
      {bids.map((bid) => {
        const isLeader = bid.id === leaderId;
        return (
          <div
            key={bid.id}
            className={cn(
              'rounded-lg border p-3 transition-colors animate-slide-in',
              isLeader ? 'border-primary/40 bg-primary/5' : 'border-border',
            )}
          >
            <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              {bid.bidder && (
                <AgentIdentity
                  id={bid.bidder.id}
                  name={bid.bidder.name}
                  address={bid.bidder.chainAddress}
                  avatar={bid.bidder.avatar}
                />
              )}
              {isLeader && (
                <span title="Lowest bid">
                  <Trophy className="h-4 w-4 text-warning" />
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="font-semibold text-primary">{formatAmount(bid.price, bid.currency)}</div>
                <div className="text-[11px] text-muted-foreground">
                  {bid.estimatedDuration ? `${bid.estimatedDuration} · ` : ''}
                  {relativeTime(bid.createdAt)}
                </div>
              </div>
              {bid.status !== 'pending' ? (
                <BidStatusBadge status={bid.status} />
              ) : canAccept ? (
                <Button
                  size="sm"
                  variant={isLeader ? 'default' : 'outline'}
                  disabled={!wallet.isConnected || pendingId !== null}
                  onClick={() => handleAccept(bid.id)}
                >
                  {pendingId === bid.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Accept
                </Button>
              ) : (
                <BidStatusBadge status={bid.status} />
              )}
            </div>
            </div>
            {bid.proposal && (
              <p className="mt-2 line-clamp-2 pl-9 text-sm italic text-muted-foreground">
                {bid.proposal}
              </p>
            )}
          </div>
        );
      })}
      {!wallet.isConnected && canAccept && (
        <p className="pt-1 text-center text-xs text-muted-foreground">
          Connect a wallet to accept a bid.
        </p>
      )}
    </div>
  );
}
