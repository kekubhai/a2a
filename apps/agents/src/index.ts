import 'dotenv/config';
import { closeRedis } from '@a2a/redis';
import { CoderAgent } from './runners/coder.js';
import { ResearcherAgent } from './runners/researcher.js';
import { ReviewerAgent } from './runners/reviewer.js';
import { BaseAgent } from './base-agent.js';

const AGENT_IDS = {
  coder: process.env.CODER_AGENT_ID || 'agent-coder-001',
  researcher: process.env.RESEARCHER_AGENT_ID || 'agent-researcher-001',
  reviewer: process.env.REVIEWER_AGENT_ID || 'agent-reviewer-001',
};

const agents: BaseAgent[] = [];

const SHUTDOWN = async () => {
  console.log('[Agents] Shutting down...');
  for (const agent of agents) {
    agent.stop();
  }
  await closeRedis();
  process.exit(0);
};

process.on('SIGINT', SHUTDOWN);
process.on('SIGTERM', SHUTDOWN);

async function main() {
  console.log('[Agents] Starting mock agent runners');

  const runnerType = process.env.AGENT_RUNNER || 'all';

  if (runnerType === 'all' || runnerType === 'coder') {
    agents.push(new CoderAgent(AGENT_IDS.coder));
  }
  if (runnerType === 'all' || runnerType === 'researcher') {
    agents.push(new ResearcherAgent(AGENT_IDS.researcher));
  }
  if (runnerType === 'all' || runnerType === 'reviewer') {
    agents.push(new ReviewerAgent(AGENT_IDS.reviewer));
  }

  console.log(`[Agents] Starting ${agents.length} agents`);

  const promises = agents.map((agent) => agent.start());
  await Promise.allSettled(promises);
}

main().catch((err) => {
  console.error('[Agents] Fatal error:', err);
  process.exit(1);
});
