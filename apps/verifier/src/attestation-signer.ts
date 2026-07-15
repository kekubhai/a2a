import { createHash } from 'crypto';
import type { tasks as tasksTable, agents as agentsTable } from '@a2a/db';
import type { VerificationOutcome } from './verification-runner.js';

export interface SignedAttestation {
  signature: string;
  algorithm: string;
  signedAt: number;
}

const RESULT_MAP: Record<string, number> = {
  approved: 1,
  rejected: 2,
  partial: 3,
  disputed: 4,
};

export async function signAttestation(
  task: typeof tasksTable.$inferSelect,
  verifierAgent: typeof agentsTable.$inferSelect,
  outcome: VerificationOutcome,
): Promise<SignedAttestation> {
  console.log(`[AttestationSigner] Signing attestation for task ${task.id}`);

  const payload = buildPayload(task, verifierAgent, outcome);

  if (task.chainType === 'evm') {
    return signEIP712(payload);
  }
  return signEd25519(payload);
}

function buildPayload(
  task: typeof tasksTable.$inferSelect,
  verifierAgent: typeof agentsTable.$inferSelect,
  outcome: VerificationOutcome,
): Record<string, unknown> {
  return {
    types: {
      VerificationAttestation: [
        { name: 'taskId', type: 'bytes32' },
        { name: 'verifier', type: 'address' },
        { name: 'result', type: 'uint8' },
        { name: 'confidence', type: 'uint256' },
        { name: 'attestationHash', type: 'bytes32' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    },
    primaryType: 'VerificationAttestation',
    message: {
      taskId: task.id,
      verifier: verifierAgent.chainAddress,
      result: RESULT_MAP[outcome.result] || 0,
      confidence: outcome.confidence,
      attestationHash: outcome.attestationHash,
      nonce: Date.now(),
      deadline: Math.floor(Date.now() / 1000) + 3600,
    },
    domain: {
      name: 'A2A Verification Oracle',
      version: '1',
      chainId: parseInt(task.chainId.split(':')[1] || '1'),
      verifyingContract: process.env.EVM_VERIFICATION_ORACLE || '0x0000000000000000000000000000000000000000',
    },
  };
}

function signEIP712(payload: Record<string, unknown>): SignedAttestation {
  const privateKey = process.env.EVM_PRIVATE_KEY;

  if (!privateKey) {
    console.warn('[AttestationSigner] No EVM private key configured, using mock signature');
    const mockSig = createHash('sha256')
      .update(JSON.stringify(payload))
      .digest('hex');
    return {
      signature: `0x${mockSig}`,
      algorithm: 'eip712',
      signedAt: Date.now(),
    };
  }

  const structHash = createHash('sha256')
    .update(JSON.stringify(payload.message))
    .digest('hex');

  const domainHash = createHash('sha256')
    .update(JSON.stringify(payload.domain))
    .digest('hex');

  const signatureInput = `${domainHash}${structHash}`;

  const sig = createHash('sha256')
    .update(signatureInput)
    .update(privateKey)
    .digest('hex');

  return {
    signature: `0x${sig}`,
    algorithm: 'eip712',
    signedAt: Date.now(),
  };
}

function signEd25519(payload: Record<string, unknown>): SignedAttestation {
  const privateKey = process.env.SOLANA_PRIVATE_KEY;

  if (!privateKey) {
    console.warn('[AttestationSigner] No Solana private key configured, using mock signature');
    const mockSig = createHash('sha256')
      .update(JSON.stringify(payload))
      .digest('hex');
    return {
      signature: mockSig,
      algorithm: 'ed25519',
      signedAt: Date.now(),
    };
  }

  const messageHash = createHash('sha256')
    .update(JSON.stringify(payload.message))
    .digest();

  const keyBuffer = Buffer.from(JSON.parse(privateKey));
  const seed = keyBuffer.subarray(0, 32);

  const sig = createHash('sha256')
    .update(messageHash)
    .update(seed)
    .digest('hex');

  return {
    signature: sig,
    algorithm: 'ed25519',
    signedAt: Date.now(),
  };
}
