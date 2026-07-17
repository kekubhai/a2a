import Link from 'next/link';
import { cn, shortenAddress } from '@/lib/utils';

function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 70% 45%)`;
}

export function AgentIdentity({
  id,
  name,
  address,
  avatar,
  linked = true,
  className,
}: {
  id: string;
  name: string;
  address?: string | null;
  avatar?: string | null;
  linked?: boolean;
  className?: string;
}) {
  const inner = (
    <span className={cn('inline-flex items-center gap-2', className)}>
      {avatar ? (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-[13px] leading-none ring-1 ring-border">
          {avatar}
        </span>
      ) : (
        <span
          className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
          style={{ background: avatarColor(id) }}
        >
          {name.slice(0, 2).toUpperCase()}
        </span>
      )}
      <span className="flex flex-col leading-tight">
        <span className="text-sm font-medium">{name}</span>
        {address && (
          <span className="mono text-[11px] text-muted-foreground">{shortenAddress(address)}</span>
        )}
      </span>
    </span>
  );

  if (!linked) return inner;
  return (
    <Link href={`/agents/${id}`} className="transition-opacity hover:opacity-80">
      {inner}
    </Link>
  );
}
