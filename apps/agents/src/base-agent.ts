import { getRedisClient, submitBidToWindow, BidRecord, TaskNotification } from '@a2a/redis';

const NOTIFY_PREFIX = 'a2a:notify:';

export interface AgentSpecialty {
  name: string;
  capabilities: string[];
  maxPrice: number;
  description: string;
}

export abstract class BaseAgent {
  protected agentId: string;
  protected name: string;
  protected specialty: AgentSpecialty;
  protected pollIntervalMs: number;
  protected running = false;

  constructor(
    agentId: string,
    name: string,
    specialty: AgentSpecialty,
    pollIntervalMs: number = 3000,
  ) {
    this.agentId = agentId;
    this.name = name;
    this.specialty = specialty;
    this.pollIntervalMs = pollIntervalMs;
  }

  async start(): Promise<void> {
    this.running = true;
    console.log(`[${this.name}] Agent started (id: ${this.agentId})`);
    console.log(`[${this.name}] Specialty: ${this.specialty.description}`);

    while (this.running) {
      try {
        await this.poll();
      } catch (err) {
        console.error(`[${this.name}] Poll error:`, err);
      }
      await this.sleep(this.pollIntervalMs);
    }
  }

  stop(): void {
    this.running = false;
    console.log(`[${this.name}] Agent stopped`);
  }

  private async poll(): Promise<void> {
    const notifications = await this.getNotifications();

    for (const notification of notifications) {
      const canHandle = await this.evaluateTask(notification);
      if (!canHandle) {
        console.log(`[${this.name}] Skipping task ${notification.taskId} (not a fit)`);
        continue;
      }

      const bid = await this.generateBid(notification);
      if (!bid) {
        console.log(`[${this.name}] Declined to bid on task ${notification.taskId}`);
        continue;
      }

      await this.submitBid(notification.taskId, bid);
      console.log(
        `[${this.name}] Bid submitted for task ${notification.taskId}: price=${bid.price}`,
      );
    }
  }

  private async getNotifications(): Promise<TaskNotification[]> {
    const redis = getRedisClient();
    const key = `${NOTIFY_PREFIX}${this.agentId}`;
    const items = await redis.lrange(key, 0, -1);
    return items.map((item) => JSON.parse(item));
  }

  protected abstract evaluateTask(task: TaskNotification): Promise<boolean>;
  protected abstract generateBid(task: TaskNotification): Promise<BidRecord | null>;

  private async submitBid(taskId: string, bid: BidRecord): Promise<void> {
    const result = await submitBidToWindow(taskId, bid);
    if (!result.accepted) {
      console.log(`[${this.name}] Bid rejected for task ${taskId}`);
    }
  }

  protected async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  protected randomDelay(minMs: number, maxMs: number): number {
    return Math.floor(Math.random() * (maxMs - minMs) + minMs);
  }
}
