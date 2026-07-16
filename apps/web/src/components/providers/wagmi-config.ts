import { http, createConfig } from 'wagmi';
import { avalancheFuji, baseSepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';
import { evmRpcUrl, AVALANCHE_FUJI_ID, BASE_SEPOLIA_ID } from '@/lib/chain';

export const wagmiConfig = createConfig({
  chains: [avalancheFuji, baseSepolia],
  connectors: [injected()],
  transports: {
    [avalancheFuji.id]: http(evmRpcUrl(AVALANCHE_FUJI_ID)),
    [baseSepolia.id]: http(evmRpcUrl(BASE_SEPOLIA_ID)),
  },
  ssr: true,
});

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig;
  }
}
