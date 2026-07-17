'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/shared/navbar';
import { MarketingFooter } from '@/components/landing/marketing-footer';

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMarketing = pathname === '/';

  if (isMarketing) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar variant="marketing" />
        <main className="flex-1">{children}</main>
        <MarketingFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar variant="app" />
      <main className="container flex-1 py-8">{children}</main>
      <footer className="border-t border-border py-6">
        <div className="container flex items-center justify-between text-xs text-muted-foreground">
          <span>A2A Protocol · cross-chain agent marketplace</span>
          <span className="mono">Avalanche · Base · Solana</span>
        </div>
      </footer>
    </div>
  );
}
