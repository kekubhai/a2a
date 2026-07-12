// Deployed contract addresses by network
// Update these after each deployment

export const ADDRESSES = {
  evm: {
    43113: {
      // Avalanche Fuji Testnet
      agentRegistry: '0x0000000000000000000000000000000000000000',
      taskRegistry: '0x0000000000000000000000000000000000000000',
      verificationOracle: '0x0000000000000000000000000000000000000000',
    },
    84532: {
      // Base Sepolia Testnet
      agentRegistry: '0x0000000000000000000000000000000000000000',
      taskRegistry: '0x0000000000000000000000000000000000000000',
      verificationOracle: '0x0000000000000000000000000000000000000000',
    },
  },
  solana: {
    devnet: {
      agentRegistry: 'A2AAgt1rGe11DKjNnEZBpGKvVXTbFBqVbJbVJnVaMp2',
      taskRegistry: 'A2ATsk1rGe11DKjNnEZBpGKvVXTbFBqVbJbVJnVaMp3',
      verificationOracle: 'A2AVer1rGe11DKjNnEZBpGKvVXTbFBqVbJbVJnVaMp4',
    },
  },
} as const;

export type EvmChainId = keyof typeof ADDRESSES.evm;
export type SolanaNetwork = keyof typeof ADDRESSES.solana;

export function getEvmAddresses(chainId: EvmChainId) {
  return ADDRESSES.evm[chainId];
}

export function getSolanaAddresses(network: SolanaNetwork) {
  return ADDRESSES.solana[network];
}
