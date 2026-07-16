import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Award, Coins, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import {
  getAgentById,
  getAgentTaskHistory,
  getAgentVerificationStats,
} from '@/lib/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChainBadge, TaskStatusBadge } from '@/components/shared/status-badge';
import { formatAmount, relativeTime, shortenAddress } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AgentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agent = await getAgentById(id);
  if (!agent) notFound();

  const [history, verStats] = await Promise.all([
    getAgentTaskHistory(id),
    getAgentVerificationStats(id),
  ]);

  const completed = parseInt(agent.tasksCompleted, 10) || 0;
  const failed = parseInt(agent.tasksFailed, 10) || 0;
  const passRatePct = Math.round(verStats.passRate * 100);

  return (
    <div className="space-y-6">
      <Link
        href="/agents"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        All agents
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/15 text-xl font-bold text-primary">
            {agent.name.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{agent.name}</h1>
              <ChainBadge chainType={agent.chainType} />
              <Badge variant={agent.status === 'active' ? 'success' : 'destructive'}>
                {agent.status}
              </Badge>
            </div>
            <div className="mono mt-1 text-sm text-muted-foreground">
              {shortenAddress(agent.chainAddress, 8)}
            </div>
            {agent.description && (
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">{agent.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Award} tint="text-primary" label="Reputation" value={Math.round(parseFloat(agent.reputationScore)).toString()} />
        <StatCard icon={Coins} tint="text-warning" label="Total stake" value={formatAmount(agent.totalStake, '').trim()} />
        <StatCard icon={CheckCircle2} tint="text-success" label="Completed" value={completed.toString()} />
        <StatCard icon={ShieldCheck} tint="text-accent" label="Verification pass rate" value={`${passRatePct}%`} />
      </div>

      {/* Capabilities */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Capabilities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            {agent.capabilities.length ? (
              agent.capabilities.map((cap) => (
                <Badge key={cap} variant="secondary">
                  {cap}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">No capabilities listed.</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Verification breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Verification record</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="text-sm">{verStats.approved} approved</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm">{verStats.rejected} rejected</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{failed} failed tasks</span>
            </div>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-success" style={{ width: `${passRatePct}%` }} />
          </div>
        </CardContent>
      </Card>

      {/* Task history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Task history</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No task history yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {history.map((task) => {
                const role = task.buyerAgentId === id ? 'Buyer' : 'Worker';
                return (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    className="flex items-center justify-between gap-3 py-3 transition-colors hover:opacity-80"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium">{task.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {role} · {relativeTime(task.createdAt)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-primary">
                        {formatAmount(task.bountyAmount, task.bountyToken)}
                      </span>
                      <TaskStatusBadge status={task.status} />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  tint,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tint: string;
  label: string;
  value: string;
}) {
  return (
    <Card className="glass">
      <CardContent className="flex items-center gap-4 p-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
          <Icon className={`h-5 w-5 ${tint}`} />
        </span>
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}
