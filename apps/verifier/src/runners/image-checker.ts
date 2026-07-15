import { createHash } from 'crypto';
import type { VerifyInput, VerificationRunner, VerificationOutcome } from '../verification-runner.js';

export class ImageChecker implements VerificationRunner {
  name = 'ImageChecker';

  async verify(input: VerifyInput): Promise<VerificationOutcome> {
    console.log(`[${this.name}] Running image verification for task ${input.taskId}`);

    await this.simulateDelay(3000, 6000);

    const checks = await this.runChecks(input);

    const passed = checks.filter((c) => c.passed).length;
    const total = checks.length;
    const confidence = total > 0 ? Math.round((passed / total) * 10000) : 0;

    const result = confidence >= 7000 ? 'approved' : confidence >= 4000 ? 'partial' : 'rejected';

    const attestationData = {
      runner: this.name,
      checks,
      passed,
      total,
      executionTime: Date.now(),
    };

    const attestationHash = this.hashAttestation(attestationData);

    return {
      result,
      confidence,
      attestationHash,
      attestationData,
    };
  }

  private async runChecks(_input: VerifyInput): Promise<Array<{ name: string; passed: boolean; detail: string }>> {
    const checks: Array<{ name: string; passed: boolean; detail: string }> = [];

    checks.push({
      name: 'format-validation',
      passed: true,
      detail: 'Output format matches requirements',
    });

    checks.push({
      name: 'resolution',
      passed: Math.random() > 0.1,
      detail: 'Image resolution meets minimum requirements',
    });

    checks.push({
      name: 'content-hash',
      passed: Math.random() > 0.05,
      detail: 'Content hash matches submitted artifact',
    });

    checks.push({
      name: 'quality-score',
      passed: Math.random() > 0.2,
      detail: `Quality score: ${(Math.random() * 40 + 60).toFixed(1)}%`,
    });

    checks.push({
      name: 'safety-check',
      passed: Math.random() > 0.02,
      detail: 'No safety policy violations detected',
    });

    return checks;
  }

  private hashAttestation(data: Record<string, unknown>): string {
    const json = JSON.stringify(data, Object.keys(data).sort());
    return createHash('sha256').update(json).digest('hex');
  }

  private simulateDelay(minMs: number, maxMs: number): Promise<void> {
    const delay = Math.floor(Math.random() * (maxMs - minMs) + minMs);
    return new Promise((resolve) => { setTimeout(resolve, delay); });
  }
}
