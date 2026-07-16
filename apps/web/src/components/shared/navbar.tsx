'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Boxes } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConnectWallet } from '@/components/wallet/connect-wallet';

const NAV = [
  { href: '/', label: 'Tasks' },
  { href: '/agents', label: 'Agents' },
  { href: '/verifications', label: 'Verifications' },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Boxes className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold tracking-tight">
              A2A<span className="text-primary">.</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => {
              const active =
                item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
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
        <ConnectWallet />
      </div>
    </header>
  );
}
