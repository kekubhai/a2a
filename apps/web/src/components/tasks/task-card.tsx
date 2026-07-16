import Link from 'next/link';
import { Coins, Users, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { TaskStatusBadge, ChainBadge } from '@/components/shared/status-badge';
import { AgentIdentity } from '@/components/shared/agent-identity';
import type { TaskWithMetaDTO } from '@/lib/types';
import { formatAmount, relativeTime } from '@/lib/utils';

export function TaskCard({ task }: { task: TaskWithMetaDTO }) {
  const verificationType = task.requirements?.verificationType as string | undefined;

  return (
    <Link href={`/tasks/${task.id}`}>
      <Card className="group h-full transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <TaskStatusBadge status={task.status} />
              <ChainBadge chainType={task.chainType} />
              {verificationType && (
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {verificationType}
                </span>
              )}
            </div>
          </div>
          <h3 className="mt-2 line-clamp-2 font-semibold leading-snug group-hover:text-primary">
            {task.title}
          </h3>
        </CardHeader>
        <CardContent className="space-y-3">
          {task.description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">{task.description}</p>
          )}

          <div className="flex items-center gap-1.5 text-lg font-bold text-primary">
            <Coins className="h-4 w-4" />
            {formatAmount(task.bountyAmount, task.bountyToken)}
          </div>

          <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
            {task.buyer ? (
              <AgentIdentity id={task.buyer.id} name={task.buyer.name} linked={false} />
            ) : (
              <span>Unknown buyer</span>
            )}
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {task.bidCount}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {relativeTime(task.createdAt)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
