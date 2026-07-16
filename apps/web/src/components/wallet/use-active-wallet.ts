'use client';

import { useAccount, useChainId } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';
import type { ChainType } from '@a2a/shared-types';
import { isSupportedEvmChain } from '@/lib/chain';

export interface ActiveWallet {
  /** Which chain family the user is currently connected with, if any. */
  chainType: ChainType | null;
  /** Connected address (EVM 0x… or Solana base58). */
  address: string | null;
  /** For EVM: the numeric chain id. */
  evmChainId: number | undefined;
  /** Whether the connected EVM chain is one we support. */
  evmChainSupported: boolean;
  isConnected: boolean;
}

/**
 * Detects which wallet the user connected (EVM via wagmi or Solana via
 * wallet-adapter) and routes write actions to the correct adapter.
 * EVM takes precedence when both are connected.
 */
export function useActiveWallet(): ActiveWallet {
  const { address: evmAddress, isConnected: evmConnected } = useAccount();
  const evmChainId = useChainId();
  const { publicKey } = useWallet();

  if (evmConnected && evmAddress) {
    return {
      chainType: 'evm',
      address: evmAddress,
      evmChainId,
      evmChainSupported: isSupportedEvmChain(evmChainId),
      isConnected: true,
    };
  }

  if (publicKey) {
    return {
      chainType: 'solana',
      address: publicKey.toBase58(),
      evmChainId: undefined,
      evmChainSupported: false,
      isConnected: true,
    };
  }

  return {
    chainType: null,
    address: null,
    evmChainId: undefined,
    evmChainSupported: false,
    isConnected: false,
  };
}
