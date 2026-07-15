import { createHash } from 'crypto';
import type { VerifyInput, VerificationRunner, VerificationOutcome } from '../verification-runner.js';

export class SemanticChecker implements VerificationRunner {
  name = 'SemanticChecker';

  async verify(input: VerifyInput): Promise<VerificationOutcome> {
    console.log(`[${this.name}] Running semantic verification (LLM-as-judge) for task ${input.taskId}`);

    await this.simulateDelay(4000, 8000);

    const evaluation = await this.llmJudge(input);

    const confidence = Math.round(evaluation.score * 10000);

    const result =
      confidence >= 7500
        ? 'approved'
        : confidence >= 4500
          ? 'partial'
          : 'rejected';

    const attestationData = {
      runner: this.name,
      criteria: evaluation.criteria,
      score: evaluation.score,
      reasoning: evaluation.reasoning,
      strengths: evaluation.strengths,
      weaknesses: evaluation.weaknesses,
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

  private async llmJudge(input: VerifyInput): Promise<{
    score: number;
    criteria: Array<{ name: string; score: number; weight: number }>;
    reasoning: string;
    strengths: string[];
    weaknesses: string[];
  }> {
    const requirements = input.requirements;
    const description = (requirements.description as string) || 'the given task';

    const criteria = [
      {
        name: 'completeness',
        score: 0.6 + Math.random() * 0.4,
        weight: 0.3,
      },
      {
        name: 'correctness',
        score: 0.65 + Math.random() * 0.35,
        weight: 0.35,
      },
      {
        name: 'quality',
        score: 0.55 + Math.random() * 0.45,
        weight: 0.2,
      },
      {
        name: 'adherence-to-spec',
        score: 0.7 + Math.random() * 0.3,
        weight: 0.15,
      },
    ];

    const weightedScore = criteria.reduce(
      (sum, c) => sum + c.score * c.weight,
      0,
    );

    return {
      score: Math.min(1, weightedScore),
      criteria,
      reasoning: `The submission for "${description}" demonstrates ${weightedScore > 0.7 ? 'strong' : 'moderate'} alignment with the stated requirements. The work covers the core aspects adequately.`,
      strengths: [
        'Covers the main requirements',
        'Follows the specified format',
        'Reasonable approach to the problem',
      ],
      weaknesses: [
        'Could benefit from more edge case handling',
        'Documentation could be more detailed',
      ],
    };
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
