// IDL type stubs — replace with actual generated IDLs after `anchor build`
// These are placeholder types matching the Anchor IDL JSON structure

export interface Idl {
  version: string;
  name: string;
  instructions: unknown[];
  accounts?: unknown[];
  types?: unknown[];
  events?: unknown[];
  errors?: unknown[];
}

// Agent Registry IDL — populated after anchor build
export const agentRegistryIdl: Idl = {
  version: '0.1.0',
  name: 'agent_registry',
  instructions: [],
};

// Task Registry IDL — populated after anchor build
export const taskRegistryIdl: Idl = {
  version: '0.1.0',
  name: 'task_registry',
  instructions: [],
};

// Verification Oracle IDL — populated after anchor build
export const verificationOracleIdl: Idl = {
  version: '0.1.0',
  name: 'verification_oracle',
  instructions: [],
};
