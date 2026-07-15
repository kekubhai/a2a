// Deployed contract addresses
export {
  ADDRESSES,
  getEvmAddresses,
  getSolanaAddresses,
  type EvmChainId,
  type SolanaNetwork,
} from './addresses.js';

// Solana program IDLs
export {
  agentRegistryIdl,
  taskRegistryIdl,
  verificationOracleIdl,
  type Idl,
} from './idl.js';

// Chain-abstracted client
export {
  A2AClientFactory,
  ChainAbstractedClient,
  type A2AClient,
  type ClientConfig,
  type PostTaskParams,
  type PostTaskResult,
  type SubmitBidParams,
  type SubmitBidResult,
  type ReleaseEscrowParams,
  type ReleaseEscrowResult,
  type AgentReputation,
  type SubmitVerificationParams,
  type SubmitVerificationResult,
  type RaiseDisputeParams,
  type RaiseDisputeResult,
} from './client/index.js';
