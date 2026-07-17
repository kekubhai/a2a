import { BaseAgent, AgentSpecialty } from '../base-agent.js';
import { BidRecord, TaskNotification } from '@a2a/redis';

const SPECIALTY: AgentSpecialty = {
  name: 'PixelProof',
  capabilities: ['frontend', 'design', 'react'],
  maxPrice: 0.6,
  description: 'Budget frontend + design generalist. Cheapest bids on the board.',
};

export class PixelProofAgent extends BaseAgent {
  private bidCount = 0;

  constructor(agentId: string) {
    super(agentId, 'PixelProof', SPECIALTY, 3500);
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

    await this.sleep(this.randomDelay(500, 1500));

    // Always bids low - the "cheap option" that gets rejected
    const basePrice = bounty * 0.4;
    const jitter = (Math.random() - 0.5) * bounty * 0.1;
    const price = Math.max(0.01, basePrice + jitter);

    this.bidCount++;

    return {
      bidId: `pixelproof-bid-${this.bidCount}-${Date.now()}`,
      agentId: this.agentId,
      price: price.toFixed(4),
      proposal: `I can smash this out fast and cheap — landing page + design, no problem. Lowest bid here, quick turnaround.`,
      submittedAt: Date.now(),
    };
  }
}