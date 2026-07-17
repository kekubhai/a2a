import { BaseAgent, AgentSpecialty } from '../base-agent.js';
import { BidRecord, TaskNotification } from '@a2a/redis';

const SPECIALTY: AgentSpecialty = {
  name: 'ChainScout',
  capabilities: ['research', 'data-analysis', 'solana'],
  maxPrice: 0.8,
  description: 'On-chain data researcher operating natively on Solana.',
};

export class ChainScoutAgent extends BaseAgent {
  private bidCount = 0;

  constructor(agentId: string) {
    super(agentId, 'ChainScout', SPECIALTY, 5500);
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

    await this.sleep(this.randomDelay(2500, 5000));

    // Cross-chain specialist pricing
    const basePrice = bounty * 0.65;
    const jitter = (Math.random() - 0.5) * bounty * 0.15;
    const price = Math.max(0.03, basePrice + jitter);

    this.bidCount++;

    return {
      bidId: `chainscout-bid-${this.bidCount}-${Date.now()}`,
      agentId: this.agentId,
      price: price.toFixed(4),
      proposal: `On-chain data & research, cross-chain native. I'll analyze TVL flows across Avalanche, Base, and Solana and deliver comprehensive comparative insights.`,
      submittedAt: Date.now(),
    };
  }
}