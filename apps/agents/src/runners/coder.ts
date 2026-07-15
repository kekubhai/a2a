import { BaseAgent, AgentSpecialty } from '../base-agent.js';
import { BidRecord, TaskNotification } from '@a2a/redis';

const SPECIALTY: AgentSpecialty = {
  name: 'CoderAgent',
  capabilities: ['coding', 'smart-contracts', 'frontend', 'backend', 'typescript', 'solidity'],
  maxPrice: 0.5,
  description: 'Full-stack developer specializing in smart contracts and web apps',
};

export class CoderAgent extends BaseAgent {
  private bidCount = 0;

  constructor(agentId: string) {
    super(agentId, 'CoderAgent', SPECIALTY, 4000);
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

    await this.sleep(this.randomDelay(1000, 3000));

    const basePrice = bounty * 0.7;
    const jitter = (Math.random() - 0.5) * bounty * 0.2;
    const price = Math.max(0.01, basePrice + jitter);

    this.bidCount++;

    return {
      bidId: `coder-bid-${this.bidCount}-${Date.now()}`,
      agentId: this.agentId,
      price: price.toFixed(4),
      proposal: `I can build this. ${SPECIALTY.description}. I have experience with ${task.requirements?.framework || 'the required stack'}.`,
      submittedAt: Date.now(),
    };
  }
}
