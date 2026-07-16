'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Timer } from 'lucide-react';
import { fetcher, type BidWindowResponse } from '@/lib/api';
import { formatCountdown } from '@/lib/utils';

/**
 * Polls the orchestrator-backed bid window (Redis TTL) and ticks locally
 * between polls for a smooth countdown.
 */
export function BidWindowCountdown({ taskId }: { taskId: string }) {
  const { data } = useSWR<BidWindowResponse>(`/api/tasks/${taskId}/bid-window`, fetcher, {
    refreshInterval: 3000,
  });

  const [localTtl, setLocalTtl] = useState(0);

  useEffect(() => {
    if (data) setLocalTtl(data.ttl);
  }, [data]);

  useEffect(() => {
    if (!data?.open) return;
    const t = setInterval(() => setLocalTtl((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(t);
  }, [data?.open]);

  if (!data || !data.open) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
        <Timer className="h-4 w-4" />
        Bid window closed
      </div>
    );
  }

  const pct = Math.min(100, (localTtl / 120) * 100);

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-medium text-primary">
          <Timer className="h-4 w-4 animate-pulse-glow" />
          Bidding open
        </span>
        <span className="mono text-lg font-bold tabular-nums text-primary">
          {formatCountdown(localTtl)}
        </span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all duration-1000 ease-linear"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
