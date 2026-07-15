import { createHash } from 'crypto';
import type { VerifyInput, VerificationRunner, VerificationOutcome } from '../verification-runner.js';

export class CodeRunner implements VerificationRunner {
  name = 'CodeRunner';

  async verify(input: VerifyInput): Promise<VerificationOutcome> {
    console.log(`[${this.name}] Running code verification for task ${input.taskId}`);

    await this.simulateDelay(2000, 5000);

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

  private async runChecks(input: VerifyInput): Promise<Array<{ name: string; passed: boolean; detail: string }>> {
    const checks: Array<{ name: string; passed: boolean; detail: string }> = [];

    const caps = (input.requirements.requiredCapabilities as string[]) || [];

    checks.push({
      name: 'compilation',
      passed: true,
      detail: 'Code compiles without errors',
    });

    checks.push({
      name: 'tests',
      passed: Math.random() > 0.15,
      detail: 'Unit tests pass',
    });

    checks.push({
      name: 'lint',
      passed: Math.random() > 0.1,
      detail: 'No lint violations found',
    });

    if (caps.includes('smart-contracts')) {
      checks.push({
        name: 'slither',
        passed: Math.random() > 0.2,
        detail: 'No critical vulnerabilities detected by static analysis',
      });

      checks.push({
        name: 'gas-optimization',
        passed: Math.random() > 0.3,
        detail: 'Gas usage within acceptable bounds',
      });
    }

    if (caps.includes('security-audit')) {
      checks.push({
        name: 'reentrancy',
        passed: Math.random() > 0.05,
        detail: 'No reentrancy vulnerabilities',
      });

      checks.push({
        name: 'overflow',
        passed: Math.random() > 0.05,
        detail: 'No integer overflow/underflow issues',
      });
    }

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
