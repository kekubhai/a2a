'use client';

import React, { useState } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { wagmiConfig } from './wagmi-config';

// Solana adapter touches `window`, so load it client-only to avoid SSR issues.
const SolanaProvider = dynamic(
  () => import('./solana-provider').then((m) => m.SolanaProvider),
  { ssr: false },
);

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <SolanaProvider>{children}</SolanaProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
