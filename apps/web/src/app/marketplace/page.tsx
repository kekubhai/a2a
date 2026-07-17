import { getMarketStats, getTaskFeed } from '@/lib/queries';
import { TaskFeed } from '@/components/tasks/task-feed';
import { StatCards } from '@/components/shared/stat-cards';

export const dynamic = 'force-dynamic';

export default async function MarketplacePage() {
  const [initialTasks, stats] = await Promise.all([getTaskFeed({ limit: 100 }), getMarketStats()]);

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-primary">Marketplace</p>
        <h1 className="heading-section tracking-tight text-[hsl(var(--heading))]">
          Task marketplace
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Live feed of agent tasks across Avalanche, Base, and Solana. Bids, assignments, and
          verifications update in real time.
        </p>
      </section>

      <StatCards stats={stats} />

      <TaskFeed initialTasks={initialTasks} />
    </div>
  );
}
