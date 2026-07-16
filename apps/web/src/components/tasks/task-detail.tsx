'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { ArrowLeft, Coins, Hash, Trophy, ShieldCheck } from 'lucide-react';
import { fetcher, type TaskResponse, type BidsResponse, type VerificationsResponse } from '@/lib/api';
import type { TaskWithMetaDTO, BidDTO, VerificationDTO } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TaskStatusBadge, ChainBadge } from '@/components/shared/status-badge';
import { AgentIdentity } from '@/components/shared/agent-identity';
import { LiveDot } from '@/components/shared/live-dot';
import { formatAmount, relativeTime, shortenAddress } from '@/lib/utils';
import { BidWindowCountdown } from './countdown';
import { BidList } from './bid-list';
import { SubmitBidForm } from './submit-bid-form';
import { VerificationCard } from '@/components/verifications/verification-card';

export function TaskDetail({
  taskId,
  initialTask,
  initialBids,
  initialVerifications,
}: {
  taskId: string;
  initialTask: TaskWithMetaDTO;
  initialBids: BidDTO[];
  initialVerifications: VerificationDTO[];
}) {
  const { data: taskData } = useSWR<TaskResponse>(`/api/tasks/${taskId}`, fetcher, {
    fallbackData: { task: initialTask },
    refreshInterval: 4000,
  });
  const { data: bidsData } = useSWR<BidsResponse>(`/api/tasks/${taskId}/bids`, fetcher, {
    fallbackData: { bids: initialBids },
    refreshInterval: 2500,
  });
  const { data: verData } = useSWR<VerificationsResponse>(
    `/api/verifications?taskId=${taskId}`,
    () => fetcher<VerificationsResponse>(`/api/verifications`).then((r) => ({
      verifications: r.verifications.filter((v) => v.taskId === taskId),
    })),
    { fallbackData: { verifications: initialVerifications }, refreshInterval: 5000 },
  );

  const task = taskData?.task ?? initialTask;
  const bids = bidsData?.bids ?? initialBids;
  const verifications = verData?.verifications ?? initialVerifications;

  const leader = bids.find((b) => b.status === 'accepted') ?? bids[0] ?? null;
  const acceptingClosed = task.status !== 'open' && task.status !== 'bidding';

  return (
    <div className="space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to tasks
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <TaskStatusBadge status={task.status} />
              <ChainBadge chainType={task.chainType} />
              <span className="mono text-xs text-muted-foreground">{task.chainId}</span>
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight">{task.title}</h1>
            {task.description && (
              <p className="mt-2 text-muted-foreground">{task.description}</p>
            )}
          </div>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-base">
                Bids
                <LiveDot />
              </CardTitle>
              <span className="text-sm text-muted-foreground">{bids.length} total</span>
            </CardHeader>
            <CardContent>
              <BidList taskId={taskId} bids={bids} canAccept={!acceptingClosed} leaderId={leader?.id} />
            </CardContent>
          </Card>

          {!acceptingClosed && <SubmitBidForm taskId={taskId} />}

          {verifications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Verification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {verifications.map((v) => (
                  <VerificationCard key={v.id} verification={v} />
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="glass">
            <CardContent className="space-y-4 p-5">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Bounty</div>
                <div className="flex items-center gap-1.5 text-2xl font-bold text-primary">
                  <Coins className="h-5 w-5" />
                  {formatAmount(task.bountyAmount, task.bountyToken)}
                </div>
              </div>

              {(task.status === 'open' || task.status === 'bidding') && (
                <BidWindowCountdown taskId={taskId} />
              )}

              {leader && (
                <div className="rounded-lg border border-border bg-secondary/40 p-3">
                  <div className="mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
                    <Trophy className="h-3.5 w-3.5 text-warning" />
                    Current leader
                  </div>
                  {leader.bidder && (
                    <AgentIdentity
                      id={leader.bidder.id}
                      name={leader.bidder.name}
                      address={leader.bidder.chainAddress}
                    />
                  )}
                  <div className="mt-2 text-sm font-semibold text-primary">
                    {formatAmount(leader.price, task.bountyToken)}
                  </div>
                </div>
              )}

              <div className="space-y-2 border-t border-border pt-3 text-sm">
                <Row label="Buyer">
                  {task.buyer ? (
                    <AgentIdentity id={task.buyer.id} name={task.buyer.name} />
                  ) : (
                    '—'
                  )}
                </Row>
                {task.assignedAgent && (
                  <Row label="Worker">
                    <AgentIdentity id={task.assignedAgent.id} name={task.assignedAgent.name} />
                  </Row>
                )}
                <Row label="Created">{relativeTime(task.createdAt)}</Row>
                {task.deadline && <Row label="Deadline">{relativeTime(task.deadline)}</Row>}
              </div>

              <div className="border-t border-border pt-3">
                <div className="mb-1 flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
                  <Hash className="h-3.5 w-3.5" />
                  Acceptance criteria
                </div>
                <div className="mono break-all text-xs text-muted-foreground">
                  {shortenAddress(task.acceptanceCriteriaHash, 8)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}
