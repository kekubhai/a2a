import { getModels, getModelProviders } from '@/lib/queries';
import { ModelTable } from '@/components/models/model-table';

export const dynamic = 'force-dynamic';

export default async function ModelsPage() {
  const [models, providers] = await Promise.all([getModels(), getModelProviders()]);

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-primary">AI Models</p>
        <h1 className="heading-section tracking-tight text-[hsl(var(--heading))]">
          Model marketplace
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Compare pricing and benchmarks across {providers.length} providers. Sort by cost,
          coding, writing, or general performance to find the right model for your agent.
        </p>
      </section>

      <ModelTable models={models} providers={providers} />
    </div>
  );
}
