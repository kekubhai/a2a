import 'dotenv/config';
import { closeRedis } from '@a2a/redis';
import { LogoForgeAgent } from './runners/logo-forge.js';
import { CopyCrafterAgent } from './runners/copy-crafter.js';
import { AuditWardenAgent } from './runners/audit-warden.js';
import { PixelProofAgent } from './runners/pixel-proof.js';
import { ChainScoutAgent } from './runners/chain-scout.js';
import { BaseAgent } from './base-agent.js';

const AGENT_IDS = {
  logoForge: process.env.LOGO_FORGE_AGENT_ID || 'agent-logoforge-001',
  copyCrafter: process.env.COPY_CRAFTER_AGENT_ID || 'agent-copycrafter-001',
  auditWarden: process.env.AUDIT_WARDEN_AGENT_ID || 'agent-auditwarden-001',
  pixelProof: process.env.PIXEL_PROOF_AGENT_ID || 'agent-pixelproof-001',
  chainScout: process.env.CHAIN_SCOUT_AGENT_ID || 'agent-chainscout-001',
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
  console.log('[Agents] Starting demo agent runners with personalities');

  const runnerType = process.env.AGENT_RUNNER || 'all';

  if (runnerType === 'all' || runnerType === 'logoForge') {
    agents.push(new LogoForgeAgent(AGENT_IDS.logoForge));
  }
  if (runnerType === 'all' || runnerType === 'copyCrafter') {
    agents.push(new CopyCrafterAgent(AGENT_IDS.copyCrafter));
  }
  if (runnerType === 'all' || runnerType === 'auditWarden') {
    agents.push(new AuditWardenAgent(AGENT_IDS.auditWarden));
  }
  if (runnerType === 'all' || runnerType === 'pixelProof') {
    agents.push(new PixelProofAgent(AGENT_IDS.pixelProof));
  }
  if (runnerType === 'all' || runnerType === 'chainScout') {
    agents.push(new ChainScoutAgent(AGENT_IDS.chainScout));
  }

  console.log(`[Agents] Starting ${agents.length} demo agents`);
  console.log('[Agents] Agent personalities loaded:');
  console.log('  - LogoForge: Premium designer, high prices, quality guarantee');
  console.log('  - CopyCrafter: Fast copywriter, competitive pricing');
  console.log('  - AuditWarden: Security auditor, zero-critical guarantee');
  console.log('  - PixelProof: Budget option, gets rejected in demo');
  console.log('  - ChainScout: Cross-chain researcher, Solana native');

  const promises = agents.map((agent) => agent.start());
  await Promise.allSettled(promises);
}

main().catch((err) => {
  console.error('[Agents] Fatal error:', err);
  process.exit(1);
});
