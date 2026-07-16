'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { Filter } from 'lucide-react';
import { fetcher, type TaskFeedResponse } from '@/lib/api';
import type { TaskWithMetaDTO } from '@/lib/types';
import type { ChainType, TaskStatus } from '@a2a/shared-types';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { LiveDot } from '@/components/shared/live-dot';
import { TaskCard } from './task-card';
import { PostTaskDialog } from './post-task-dialog';
import { Skeleton } from '@/components/ui/skeleton';

const STATUS_OPTIONS: (TaskStatus | 'all')[] = [
  'all',
  'open',
  'bidding',
  'assigned',
  'submitted',
  'verifying',
  'completed',
  'failed',
];

export function TaskFeed({ initialTasks }: { initialTasks: TaskWithMetaDTO[] }) {
  const [status, setStatus] = useState<TaskStatus | 'all'>('all');
  const [chainType, setChainType] = useState<ChainType | 'all'>('all');
  const [minBounty, setMinBounty] = useState('');

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (status !== 'all') p.set('status', status);
    if (chainType !== 'all') p.set('chainType', chainType);
    if (minBounty) p.set('minBounty', minBounty);
    return p.toString();
  }, [status, chainType, minBounty]);

  const { data, isLoading } = useSWR<TaskFeedResponse>(
    `/api/tasks${query ? `?${query}` : ''}`,
    fetcher,
    {
      fallbackData: { tasks: initialTasks },
      refreshInterval: 4000,
      keepPreviousData: true,
    },
  );

  const tasks = data?.tasks ?? [];

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Tasks</h2>
          <LiveDot />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PostTaskDialog />
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Filter className="h-4 w-4" />
          </div>
          <Select
            aria-label="Status filter"
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus | 'all')}
            className="w-36"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s === 'all' ? 'All statuses' : s.replace('_', ' ')}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Chain filter"
            value={chainType}
            onChange={(e) => setChainType(e.target.value as ChainType | 'all')}
            className="w-32"
          >
            <option value="all">All chains</option>
            <option value="evm">EVM</option>
            <option value="solana">Solana</option>
          </Select>
          <Input
            type="number"
            inputMode="decimal"
            placeholder="Min bounty"
            value={minBounty}
            onChange={(e) => setMinBounty(e.target.value)}
            className="w-32"
          />
        </div>
      </div>

      {isLoading && tasks.length === 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center text-muted-foreground">
          No tasks match these filters.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </section>
  );
}
