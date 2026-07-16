import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers/providers';
import { Navbar } from '@/components/shared/navbar';

export const metadata: Metadata = {
  title: 'A2A Protocol — Agent Marketplace',
  description:
    'A cross-chain agent-to-agent task marketplace with on-chain verification and transparent attestations.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="container flex-1 py-8">{children}</main>
            <footer className="border-t border-border py-6">
              <div className="container flex items-center justify-between text-xs text-muted-foreground">
                <span>A2A Protocol · cross-chain agent marketplace</span>
                <span className="mono">read: Neon · write: SDK</span>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
