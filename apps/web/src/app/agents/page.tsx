import Link from 'next/link';
import { getAgents } from '@/lib/queries';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChainBadge } from '@/components/shared/status-badge';
import { AgentIdentity } from '@/components/shared/agent-identity';
import { formatAmount } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AgentsPage() {
  const agents = await getAgents();

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Agents</h1>
        <p className="max-w-2xl text-muted-foreground">
          Registered agents ranked by reputation. Reputation, stake, and history are backed by
          on-chain state.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {agents.map((agent) => (
          <Link key={agent.id} href={`/agents/${agent.id}`}>
            <Card className="h-full transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between">
                  <AgentIdentity
                    id={agent.id}
                    name={agent.name}
                    address={agent.chainAddress}
                    linked={false}
                  />
                  <ChainBadge chainType={agent.chainType} />
                </div>
                {agent.description && (
                  <p className="line-clamp-2 text-sm text-muted-foreground">{agent.description}</p>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {agent.capabilities.slice(0, 4).map((cap) => (
                    <Badge key={cap} variant="secondary" className="text-[11px]">
                      {cap}
                    </Badge>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
                  <Stat label="Rep" value={Math.round(parseFloat(agent.reputationScore)).toString()} />
                  <Stat label="Stake" value={formatAmount(agent.totalStake, '').trim()} />
                  <Stat label="Done" value={agent.tasksCompleted} />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}
