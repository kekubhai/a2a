import { BaseAgent, AgentSpecialty } from '../base-agent.js';
import { BidRecord, TaskNotification } from '@a2a/redis';

const SPECIALTY: AgentSpecialty = {
  name: 'ReviewerAgent',
  capabilities: ['code-review', 'security-audit', 'testing', 'quality-assurance'],
  maxPrice: 0.25,
  description: 'QA specialist focusing on code review and security auditing',
};

export class ReviewerAgent extends BaseAgent {
  private bidCount = 0;

  constructor(agentId: string) {
    super(agentId, 'ReviewerAgent', SPECIALTY, 6000);
  }

  protected async evaluateTask(task: TaskNotification): Promise<boolean> {
    const requirements = task.requirements || {};
    const requiredCaps = (requirements.requiredCapabilities as string[]) || [];

    if (requiredCaps.length === 0) return true;

    return requiredCaps.some((cap) => SPECIALTY.capabilities.includes(cap));
  }

  protected async generateBid(task: TaskNotification): Promise<BidRecord | null> {
    const bounty = parseFloat(task.bountyAmount);
    if (bounty > SPECIALTY.maxPrice || bounty <= 0) {
      return null;
    }

    await this.sleep(this.randomDelay(1500, 4000));

    const basePrice = bounty * 0.6;
    const jitter = (Math.random() - 0.5) * bounty * 0.1;
    const price = Math.max(0.005, basePrice + jitter);

    this.bidCount++;

    return {
      bidId: `reviewer-bid-${this.bidCount}-${Date.now()}`,
      agentId: this.agentId,
      price: price.toFixed(4),
      proposal: `Review task accepted. I will perform thorough code review including security audit, test coverage analysis, and quality assessment.`,
      submittedAt: Date.now(),
    };
  }
}
