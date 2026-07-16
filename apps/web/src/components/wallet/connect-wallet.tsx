'use client';

import React, { useState } from 'react';
import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Wallet, ChevronDown, LogOut, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useActiveWallet } from './use-active-wallet';
import { shortenAddress } from '@/lib/utils';
import { EVM_CHAINS, isSupportedEvmChain, AVALANCHE_FUJI_ID, BASE_SEPOLIA_ID } from '@/lib/chain';

export function ConnectWallet() {
  const [open, setOpen] = useState(false);
  const wallet = useActiveWallet();

  const { connect, connectors } = useConnect();
  const { disconnect: disconnectEvm } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { address: evmAddress } = useAccount();

  const { disconnect: disconnectSolana } = useWallet();
  const { setVisible: openSolanaModal } = useWalletModal();

  if (wallet.isConnected) {
    return (
      <div className="flex items-center gap-2">
        {wallet.chainType === 'evm' && (
          <ChainSwitcher currentChainId={wallet.evmChainId} onSwitch={(id) => switchChain({ chainId: id })} />
        )}
        {wallet.chainType === 'solana' && (
          <Badge variant="accent" className="gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-glow" />
            Solana
          </Badge>
        )}
        <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-success" />
          <span className="mono text-sm">{shortenAddress(wallet.address, 4)}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          title="Disconnect"
          onClick={() => {
            if (wallet.chainType === 'evm') disconnectEvm();
            else disconnectSolana();
          }}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Wallet className="h-4 w-4" />
          Connect Wallet
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect a wallet</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Choose a chain family. The app detects your chain and routes actions to the right
          adapter.
        </p>

        <div className="mt-2 space-y-4">
          <div>
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              EVM · Avalanche / Base
            </div>
            <div className="space-y-2">
              {connectors.map((connector) => (
                <Button
                  key={connector.uid}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    connect({ connector });
                    setOpen(false);
                  }}
                >
                  <Wallet className="h-4 w-4" />
                  {connector.name || 'Injected Wallet'}
                </Button>
              ))}
              {connectors.length === 0 && (
                <p className="text-xs text-muted-foreground">No EVM wallet detected.</p>
              )}
            </div>
          </div>

          <div>
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Solana · Devnet
            </div>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                openSolanaModal(true);
                setOpen(false);
              }}
            >
              <Wallet className="h-4 w-4" />
              Solana Wallet (Phantom / Solflare)
            </Button>
          </div>
        </div>

        {evmAddress && (
          <p className="mt-2 text-xs text-muted-foreground">
            Connected EVM: <span className="mono">{shortenAddress(evmAddress)}</span>
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ChainSwitcher({
  currentChainId,
  onSwitch,
}: {
  currentChainId: number | undefined;
  onSwitch: (chainId: 43113 | 84532) => void;
}) {
  const [open, setOpen] = useState(false);
  const supported = isSupportedEvmChain(currentChainId);
  const current = supported ? EVM_CHAINS[currentChainId as 43113 | 84532] : null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-secondary"
      >
        {supported ? (
          <>
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
            {current?.short}
          </>
        ) : (
          <span className="flex items-center gap-1 text-warning">
            <AlertTriangle className="h-3.5 w-3.5" />
            Wrong network
          </span>
        )}
        <ChevronDown className="h-3.5 w-3.5 opacity-60" />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-md border border-border bg-popover shadow-lg animate-slide-in">
          {[AVALANCHE_FUJI_ID, BASE_SEPOLIA_ID].map((id) => (
            <button
              key={id}
              onClick={() => {
                onSwitch(id);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-secondary"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {EVM_CHAINS[id].name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
