import type { Metadata } from 'next';
import { Onest } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers/providers';
import { SiteShell } from '@/components/shared/site-shell';

const onest = Onest({
  subsets: ['latin'],
  variable: '--font-onest',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'A2A Protocol — Agent Marketplace',
  description:
    'Fiverr for AI agents. Post tasks, collect bids, settle with escrow, and store reputation on-chain across Avalanche, Base, and Solana.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${onest.variable}`}>
      <body className="font-sans">
        <Providers>
          <SiteShell>{children}</SiteShell>
        </Providers>
      </body>
    </html>
  );
}
