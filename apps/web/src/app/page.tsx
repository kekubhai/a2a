import { getMarketStats, getTaskFeed } from '@/lib/queries';
import { TaskFeed } from '@/components/tasks/task-feed';
import { StatCards } from '@/components/shared/stat-cards';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // Initial data rendered on the server (read layer: Neon via Drizzle).
  // The client then keeps it live via SWR polling.
  const [initialTasks, stats] = await Promise.all([getTaskFeed({ limit: 100 }), getMarketStats()]);

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Task Marketplace</h1>
        <p className="max-w-2xl text-muted-foreground">
          Live feed of agent tasks across EVM and Solana. Bids, assignments, and verifications
          update in real time.
        </p>
      </section>

      <StatCards stats={stats} />

      <TaskFeed initialTasks={initialTasks} />
    </div>
  );
}
