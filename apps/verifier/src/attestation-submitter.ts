import { A2AClientFactory } from '@a2a/sdk';
import type { VerificationOutcome } from './verification-runner.js';
import type { SignedAttestation } from './attestation-signer.js';

export interface AttestationTxResult {
  verificationId: string;
  txHash: string;
}

const RESULT_MAP: Record<string, number> = {
  approved: 1,
  rejected: 2,
  partial: 3,
  disputed: 4,
};

export async function submitAttestation(
  task: { id: string; onChainTaskId: string | null; chainType: string },
  verifierAgent: { chainAddress: string },
  outcome: VerificationOutcome,
  signedAttestation: SignedAttestation,
): Promise<AttestationTxResult> {
  console.log(`[AttestationSubmitter] Submitting attestation on-chain for task ${task.id}`);

  const rpcUrl = getRpcUrl(task.chainType);
  const privateKey = getPrivateKey(task.chainType);
  const programIds = getProgramIds(task.chainType);

  const client = A2AClientFactory.create({
    chain: task.chainType as 'evm' | 'solana',
    rpcUrl,
    privateKey,
    programIds,
  });

  const result = await client.submitVerification({
    taskId: task.onChainTaskId || task.id,
    verifierAgent: verifierAgent.chainAddress,
    result: RESULT_MAP[outcome.result] || 0,
    confidence: BigInt(outcome.confidence),
    attestationHash: outcome.attestationHash,
    signature: signedAttestation.signature,
    signatureAlgorithm: signedAttestation.algorithm,
  });

  console.log(`[AttestationSubmitter] On-chain tx: ${result.txHash}`);

  return {
    verificationId: result.verificationId,
    txHash: result.txHash,
  };
}

function getRpcUrl(chainType: string): string {
  if (chainType === 'evm') {
    return process.env.EVM_RPC_URL || 'http://127.0.0.1:8545';
  }
  return process.env.SOLANA_RPC_URL || 'http://127.0.0.1:8899';
}

function getPrivateKey(chainType: string): string | undefined {
  if (chainType === 'evm') {
    return process.env.EVM_PRIVATE_KEY;
  }
  return process.env.SOLANA_PRIVATE_KEY;
}

function getProgramIds(chainType: string) {
  if (chainType === 'evm') {
    return {
      agentRegistry: process.env.EVM_AGENT_REGISTRY || '0x0000000000000000000000000000000000000000',
      taskRegistry: process.env.EVM_TASK_REGISTRY || '0x0000000000000000000000000000000000000000',
      verificationOracle: process.env.EVM_VERIFICATION_ORACLE || '0x0000000000000000000000000000000000000000',
    };
  }
  return {
    agentRegistry: process.env.SOLANA_AGENT_REGISTRY || '',
    taskRegistry: process.env.SOLANA_TASK_REGISTRY || '',
    verificationOracle: process.env.SOLANA_VERIFICATION_ORACLE || '',
  };
}
