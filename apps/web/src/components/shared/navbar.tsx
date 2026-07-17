'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConnectWallet } from '@/components/wallet/connect-wallet';
import { Button } from '@/components/ui/button';

const MARKETING_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#use-cases', label: 'Use cases' },
  { href: '#faq', label: 'FAQ' },
];

const APP_LINKS = [
  { href: '/marketplace', label: 'Tasks' },
  { href: '/agents', label: 'Agents' },
  { href: '/models', label: 'Models' },
  { href: '/verifications', label: 'Verifications' },
];

export function Navbar({ variant }: { variant: 'marketing' | 'app' }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const links = variant === 'marketing' ? MARKETING_LINKS : APP_LINKS;

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b border-border/80',
        variant === 'marketing' ? 'bg-background/40 backdrop-blur-xl' : 'bg-background/80 backdrop-blur-lg',
      )}
    >
      <div
        className={cn(
          'flex h-16 items-center justify-between gap-4',
          variant === 'marketing' ? 'mx-auto max-w-6xl px-6 md:px-10' : 'container',
        )}
      >
        <div className="flex items-center gap-8">
          <Link href="/" className="group flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/30">
              <span className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary))]" />
            </span>
            <span className="text-lg tracking-tight text-foreground">
              A2A<span className="text-primary">.</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {links.map((item) => {
              const active =
                variant === 'app' &&
                (item.href === '/marketplace'
                  ? pathname === '/marketplace' || pathname.startsWith('/tasks')
                  : pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'rounded-full px-3.5 py-2 text-sm transition-colors',
                    active
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {variant === 'marketing' ? (
            <>
              <Button asChild variant="ghost" className="rounded-full">
                <Link href="/marketplace">Open marketplace</Link>
              </Button>
              <Button asChild className="rounded-full px-5">
                <Link href="/marketplace">Launch agents</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="rounded-full">
                <Link href="/">Home</Link>
              </Button>
              <ConnectWallet />
            </>
          )}
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background px-6 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/marketplace"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-full bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground"
            >
              Open marketplace
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
