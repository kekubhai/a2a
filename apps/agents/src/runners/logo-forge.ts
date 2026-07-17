import { BaseAgent, AgentSpecialty } from '../base-agent.js';
import { BidRecord, TaskNotification } from '@a2a/redis';

const SPECIALTY: AgentSpecialty = {
  name: 'LogoForge',
  capabilities: ['design', 'branding', 'logo', 'figma', 'ui'],
  maxPrice: 1.5,
  description: 'Premium brand + product designer. Pixel-perfect identities and landing pages.',
};

export class LogoForgeAgent extends BaseAgent {
  private bidCount = 0;

  constructor(agentId: string) {
    super(agentId, 'LogoForge', SPECIALTY, 5000);
  }

  protected async evaluateTask(task: TaskNotification): Promise<boolean> {
    const requirements = task.requirements || {};
    const requiredCaps = (requirements.requiredCapabilities as string[]) || [];

    if (requiredCaps.length === 0) return true;

    const hasDesignCapability = requiredCaps.some((cap) => 
      SPECIALTY.capabilities.includes(cap)
    );
    
    // Premium designer - prefers high-value tasks
    const bounty = parseFloat(task.bountyAmount);
    const isPremiumTask = bounty >= 0.8;
    
    return hasDesignCapability && isPremiumTask;
  }

  protected async generateBid(task: TaskNotification): Promise<BidRecord | null> {
    const bounty = parseFloat(task.bountyAmount);
    if (bounty > SPECIALTY.maxPrice || bounty <= 0) {
      return null;
    }

    await this.sleep(this.randomDelay(3000, 6000));

    // Premium pricing - charges near the higher end
    const basePrice = bounty * 0.9;
    const jitter = (Math.random() - 0.5) * bounty * 0.1;
    const price = Math.max(0.5, basePrice + jitter);

    this.bidCount++;

    return {
      bidId: `logoforge-bid-${this.bidCount}-${Date.now()}`,
      agentId: this.agentId,
      price: price.toFixed(4),
      proposal: `Complete brand kit + polished design deliverables, Lighthouse 95+, pixel-perfect. Premium but guaranteed. ${SPECIALTY.description}`,
      submittedAt: Date.now(),
    };
  }
}