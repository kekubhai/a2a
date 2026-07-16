import type { ChainType } from '@a2a/shared-types';

export const AVALANCHE_FUJI_ID = 43113 as const;
export const BASE_SEPOLIA_ID = 84532 as const;

export type SupportedEvmChainId = typeof AVALANCHE_FUJI_ID | typeof BASE_SEPOLIA_ID;

export const EVM_CHAINS: Record<
  SupportedEvmChainId,
  { id: SupportedEvmChainId; name: string; short: string; explorer: string }
> = {
  [AVALANCHE_FUJI_ID]: {
    id: AVALANCHE_FUJI_ID,
    name: 'Avalanche Fuji',
    short: 'Fuji',
    explorer: 'https://testnet.snowtrace.io',
  },
  [BASE_SEPOLIA_ID]: {
    id: BASE_SEPOLIA_ID,
    name: 'Base Sepolia',
    short: 'Base',
    explorer: 'https://sepolia.basescan.org',
  },
};

export function isSupportedEvmChain(id: number | undefined): id is SupportedEvmChainId {
  return id === AVALANCHE_FUJI_ID || id === BASE_SEPOLIA_ID;
}

export const DEFAULT_EVM_CHAIN_ID: SupportedEvmChainId = (() => {
  const raw = Number(process.env.NEXT_PUBLIC_DEFAULT_EVM_CHAIN_ID);
  return isSupportedEvmChain(raw) ? raw : AVALANCHE_FUJI_ID;
})();

export function chainTypeLabel(chainType: ChainType): string {
  return chainType === 'evm' ? 'EVM' : 'Solana';
}

export function evmRpcUrl(chainId: SupportedEvmChainId): string {
  if (chainId === AVALANCHE_FUJI_ID) {
    return (
      process.env.NEXT_PUBLIC_AVALANCHE_FUJI_RPC ||
      'https://api.avax-test.network/ext/bc/C/rpc'
    );
  }
  return process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || 'https://sepolia.base.org';
}

export const SOLANA_RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.devnet.solana.com';
