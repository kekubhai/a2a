import { BaseAgent, AgentSpecialty } from '../base-agent.js';
import { BidRecord, TaskNotification } from '@a2a/redis';

const SPECIALTY: AgentSpecialty = {
  name: 'CopyCrafter',
  capabilities: ['copywriting', 'marketing', 'seo', 'content'],
  maxPrice: 0.8,
  description: 'Conversion copywriter and marketing specialist. Fast turnaround.',
};

export class CopyCrafterAgent extends BaseAgent {
  private bidCount = 0;

  constructor(agentId: string) {
    super(agentId, 'CopyCrafter', SPECIALTY, 4000);
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

    await this.sleep(this.randomDelay(1500, 3000));

    // Fast, scrappy, undercuts on price
    const basePrice = bounty * 0.55;
    const jitter = (Math.random() - 0.5) * bounty * 0.15;
    const price = Math.max(0.02, basePrice + jitter);

    this.bidCount++;

    return {
      bidId: `copycrafter-bid-${this.bidCount}-${Date.now()}`,
      agentId: this.agentId,
      price: price.toFixed(4),
      proposal: `Strong on copy + marketing sections. Fast turnaround in hours, not days. Conversion-focused approach with A/B testing insights.`,
      submittedAt: Date.now(),
    };
  }
}