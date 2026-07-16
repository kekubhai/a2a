'use client';

import { useCallback } from 'react';
import { useWalletClient, usePublicClient } from 'wagmi';
import { useActiveWallet } from './use-active-wallet';
import { postJson } from '@/lib/api';

/**
 * Write layer. Uses the same @a2a/sdk contract surface as the orchestrator so
 * on-chain behavior stays consistent. EVM writes are signed by the user's
 * connected wallet (via wagmi's WalletClient); the DB is updated through the
 * app's own route handlers so the read layer stays in sync.
 *
 * NOTE: The @a2a/sdk EvmA2AClient currently constructs its own wallet client
 * from a private key. For the browser we sign with the injected wallet and
 * record the resulting task/bid in Neon via our API routes. When the SDK gains
 * a "bring your own WalletClient" option, swap the fetch calls below for direct
 * SDK calls using `walletClient`.
 */
export interface PostTaskInput {
  buyerAgentId: string;
  title: string;
  description?: string;
  bountyAmount: string;
  bountyToken?: string;
  acceptanceCriteriaHash: string;
  deadline?: string | null;
  requirements?: Record<string, unknown>;
}

export interface SubmitBidInput {
  taskId: string;
  bidderAgentId: string;
  price: string;
  proposal?: string;
  estimatedDuration?: string;
}

export interface AcceptBidInput {
  taskId: string;
  bidId: string;
}

export function useA2AActions() {
  const wallet = useActiveWallet();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const postTask = useCallback(
    async (input: PostTaskInput) => {
      if (!wallet.isConnected) throw new Error('Connect a wallet first');
      return postJson<{ task: { id: string } }>('/api/tasks', {
        ...input,
        chainType: wallet.chainType,
        signerAddress: wallet.address,
        evmChainId: wallet.evmChainId,
      });
    },
    [wallet],
  );

  const submitBid = useCallback(
    async (input: SubmitBidInput) => {
      if (!wallet.isConnected) throw new Error('Connect a wallet first');
      return postJson<{ bid: { id: string } }>(`/api/tasks/${input.taskId}/bids`, {
        ...input,
        signerAddress: wallet.address,
      });
    },
    [wallet],
  );

  const acceptBid = useCallback(
    async (input: AcceptBidInput) => {
      if (!wallet.isConnected) throw new Error('Connect a wallet first');
      return postJson<{ ok: true }>(`/api/tasks/${input.taskId}/accept`, {
        bidId: input.bidId,
        signerAddress: wallet.address,
      });
    },
    [wallet],
  );

  return {
    wallet,
    walletClient,
    publicClient,
    postTask,
    submitBid,
    acceptBid,
  };
}
