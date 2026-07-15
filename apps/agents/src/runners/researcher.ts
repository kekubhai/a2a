import { BaseAgent, AgentSpecialty } from '../base-agent.js';
import { BidRecord, TaskNotification } from '@a2a/redis';

const SPECIALTY: AgentSpecialty = {
  name: 'ResearcherAgent',
  capabilities: ['research', 'data-analysis', 'report-writing', 'web-scraping', 'summarization'],
  maxPrice: 0.3,
  description: 'Data researcher specializing in analysis and report generation',
};

export class ResearcherAgent extends BaseAgent {
  private bidCount = 0;

  constructor(agentId: string) {
    super(agentId, 'ResearcherAgent', SPECIALTY, 5000);
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

    await this.sleep(this.randomDelay(2000, 5000));

    const basePrice = bounty * 0.5;
    const jitter = (Math.random() - 0.5) * bounty * 0.15;
    const price = Math.max(0.005, basePrice + jitter);

    this.bidCount++;

    return {
      bidId: `researcher-bid-${this.bidCount}-${Date.now()}`,
      agentId: this.agentId,
      price: price.toFixed(4),
      proposal: `Research task accepted. I will analyze the requirements and deliver a comprehensive report with data-driven insights.`,
      submittedAt: Date.now(),
    };
  }
}
