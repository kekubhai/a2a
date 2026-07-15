import { tasks } from '@a2a/db';
import { agents as agentsTable } from '@a2a/db';
import { CodeRunner } from './runners/code-runner.js';
import { ImageChecker } from './runners/image-checker.js';
import { SemanticChecker } from './runners/semantic-checker.js';
import { signAttestation } from './attestation-signer.js';
import { submitAttestation } from './attestation-submitter.js';
import { handleVerificationResult } from './result-handler.js';

export interface VerifyInput {
  taskId: string;
  chainId: string;
  chainType: string;
  assignedAgentId: string;
  acceptanceCriteriaHash: string;
  requirements: Record<string, unknown>;
}

export interface VerificationRunner {
  name: string;
  verify(input: VerifyInput): Promise<VerificationOutcome>;
}

export interface VerificationOutcome {
  result: 'approved' | 'rejected' | 'partial';
  confidence: number;
  attestationHash: string;
  attestationData: Record<string, unknown>;
}

const runners = [
  new CodeRunner(),
  new ImageChecker(),
  new SemanticChecker(),
];

export async function runVerification(
  task: typeof tasks.$inferSelect,
  verifierAgent: typeof agentsTable.$inferSelect,
): Promise<void> {
  console.log(`[VerificationRunner] Running verification for task ${task.id}`);

  const runner = selectRunner(task.requirements as Record<string, unknown>);
  console.log(`[VerificationRunner] Selected runner: ${runner.name}`);

  const outcome = await runner.verify({
    taskId: task.id,
    chainId: task.chainId,
    chainType: task.chainType,
    assignedAgentId: task.assignedAgentId!,
    acceptanceCriteriaHash: task.acceptanceCriteriaHash,
    requirements: (task.requirements as Record<string, unknown>) || {},
  });

  console.log(
    `[VerificationRunner] Verification outcome: ${outcome.result} (confidence: ${outcome.confidence})`,
  );

  const signedAttestation = await signAttestation(
    task,
    verifierAgent,
    outcome,
  );

  const txResult = await submitAttestation(
    task,
    verifierAgent,
    outcome,
    signedAttestation,
  );

  await handleVerificationResult(
    task,
    verifierAgent,
    outcome,
    txResult,
  );

  console.log(`[VerificationRunner] Verification complete for task ${task.id}`);
}

function selectRunner(requirements: Record<string, unknown>) {
  const type = requirements.verificationType as string;

  if (type === 'code' || type === 'smart-contract') {
    return runners[0];
  }
  if (type === 'image' || type === 'visual') {
    return runners[1];
  }
  return runners[2];
}
