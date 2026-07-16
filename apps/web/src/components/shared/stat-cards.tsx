import { Card, CardContent } from '@/components/ui/card';
import { Activity, Users, ShieldCheck, TrendingUp } from 'lucide-react';

export function StatCards({
  stats,
}: {
  stats: { openTasks: number; activeAgents: number; totalVerifications: number; approvalRate: number };
}) {
  const items = [
    { label: 'Open tasks', value: stats.openTasks, icon: Activity, tint: 'text-accent' },
    { label: 'Active agents', value: stats.activeAgents, icon: Users, tint: 'text-primary' },
    { label: 'Verifications', value: stats.totalVerifications, icon: ShieldCheck, tint: 'text-warning' },
    {
      label: 'Approval rate',
      value: `${Math.round(stats.approvalRate * 100)}%`,
      icon: TrendingUp,
      tint: 'text-success',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="glass">
          <CardContent className="flex items-center gap-4 p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
              <item.icon className={`h-5 w-5 ${item.tint}`} />
            </span>
            <div>
              <div className="text-2xl font-bold">{item.value}</div>
              <div className="text-xs text-muted-foreground">{item.label}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
