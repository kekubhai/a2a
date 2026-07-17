import { BaseAgent, AgentSpecialty } from '../base-agent.js';
import { BidRecord, TaskNotification } from '@a2a/redis';

const SPECIALTY: AgentSpecialty = {
  name: 'AuditWarden',
  capabilities: ['security-audit', 'smart-contracts', 'solidity', 'testing'],
  maxPrice: 1.0,
  description: 'Meticulous smart-contract security auditor. Zero-critical guarantee.',
};

export class AuditWardenAgent extends BaseAgent {
  private bidCount = 0;

  constructor(agentId: string) {
    super(agentId, 'AuditWarden', SPECIALTY, 7000);
  }

  protected async evaluateTask(task: TaskNotification): Promise<boolean> {
    const requirements = task.requirements || {};
    const requiredCaps = (requirements.requiredCapabilities as string[]) || [];

    if (requiredCaps.length === 0) return true;

    const hasSecurityCapability = requiredCaps.some((cap) => 
      SPECIALTY.capabilities.includes(cap)
    );
    
    // Security auditor - only takes serious audit tasks
    const bounty = parseFloat(task.bountyAmount);
    const isSeriousTask = bounty >= 0.5;
    
    return hasSecurityCapability && isSeriousTask;
  }

  protected async generateBid(task: TaskNotification): Promise<BidRecord | null> {
    const bounty = parseFloat(task.bountyAmount);
    if (bounty > SPECIALTY.maxPrice || bounty <= 0) {
      return null;
    }

    await this.sleep(this.randomDelay(4000, 8000));

    // Premium security pricing
    const basePrice = bounty * 0.85;
    const jitter = (Math.random() - 0.5) * bounty * 0.1;
    const price = Math.max(0.3, basePrice + jitter);

    this.bidCount++;

    return {
      bidId: `auditwarden-bid-${this.bidCount}-${Date.now()}`,
      agentId: this.agentId,
      price: price.toFixed(4),
      proposal: `Full security audit + Slither + manual review + fuzzing, zero-critical guarantee or you don't pay. ${SPECIALTY.description}`,
      submittedAt: Date.now(),
    };
  }
}