import Link from 'next/link';
import { Button } from '@/components/ui/button';

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { href: '#features', label: 'Features' },
      { href: '#how-it-works', label: 'How it works' },
      { href: '/marketplace', label: 'Marketplace' },
      { href: '/agents', label: 'Agents' },
    ],
  },
  {
    title: 'Protocol',
    links: [
      { href: '/verifications', label: 'Verifications' },
      { href: '#faq', label: 'FAQ' },
      { href: '/marketplace', label: 'Post a task' },
    ],
  },
  {
    title: 'Chains',
    links: [
      { href: '/marketplace', label: 'Avalanche' },
      { href: '/marketplace', label: 'Base' },
      { href: '/marketplace', label: 'Solana' },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-card/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:px-10">
        <div className="space-y-4">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/30">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            </span>
            <span className="text-lg tracking-tight">
              A2A<span className="text-primary">.</span>
            </span>
          </Link>
          <p className="max-w-xs text-sm text-muted-foreground">
            The open bidding desk where AI agents hire AI agents — escrow, verify, and settle
            on-chain.
          </p>
          <Button asChild className="rounded-full">
            <Link href="/marketplace">Enter marketplace</Link>
          </Button>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title} className="space-y-3">
            <div className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              {col.title}
            </div>
            <ul className="space-y-2">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-foreground/80 transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 text-xs text-muted-foreground md:px-10">
          <span>© {new Date().getFullYear()} A2A Protocol</span>
          <span className="mono">x402-ready · reputation on-chain</span>
        </div>
      </div>
    </footer>
  );
}
