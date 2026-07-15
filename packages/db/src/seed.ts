import { db } from './client';
import { agents, tasks, bids, verifications } from '../schema';

async function seed() {
  console.log('Seeding database...');

  // ─── Agents ────────────────────────────────────────────────
  const [buyerAgent] = await db
    .insert(agents)
    .values({
      name: 'Alpha Buyer',
      description: 'Agent that posts tasks for code review',
      ownerAddress: '0x1234567890abcdef1234567890abcdef12345678',
      chainId: 'evm:1',
      chainAddress: '0x1234567890abcdef1234567890abcdef12345678',
      chainType: 'evm',
      capabilities: ['task_creation', 'payment'],
    })
    .returning();

  const [coderAgent] = await db
    .insert(agents)
    .values({
      id: 'agent-coder-001',
      name: 'CoderAgent',
      description: 'Full-stack developer specializing in smart contracts and web apps',
      ownerAddress: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      chainId: 'evm:1',
      chainAddress: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      chainType: 'evm',
      capabilities: ['coding', 'smart-contracts', 'frontend', 'backend', 'typescript', 'solidity'],
      reputationScore: '85',
    })
    .returning();

  await db
    .insert(agents)
    .values({
      id: 'agent-researcher-001',
      name: 'ResearcherAgent',
      description: 'Data researcher specializing in analysis and report generation',
      ownerAddress: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      chainId: 'evm:1',
      chainAddress: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      chainType: 'evm',
      capabilities: ['research', 'data-analysis', 'report-writing', 'web-scraping', 'summarization'],
      reputationScore: '78',
    })
    .returning();

  await db
    .insert(agents)
    .values({
      id: 'agent-reviewer-001',
      name: 'ReviewerAgent',
      description: 'QA specialist focusing on code review and security auditing',
      ownerAddress: '0xcccccccccccccccccccccccccccccccccccccccc',
      chainId: 'evm:1',
      chainAddress: '0xcccccccccccccccccccccccccccccccccccccccc',
      chainType: 'evm',
      capabilities: ['code-review', 'security-audit', 'testing', 'quality-assurance'],
      reputationScore: '92',
    })
    .returning();

  const [verifierAgent] = await db
    .insert(agents)
    .values({
      name: 'Gamma Verifier',
      description: 'Agent that verifies task completion',
      ownerAddress: '0x9876543210fedcba9876543210fedcba98765432',
      chainId: 'evm:1',
      chainAddress: '0x9876543210fedcba9876543210fedcba98765432',
      chainType: 'evm',
      capabilities: ['verification', 'attestation'],
    })
    .returning();

  console.log(`  Created ${4} agents`);

  // ─── Tasks ─────────────────────────────────────────────────
  const [task1] = await db
    .insert(tasks)
    .values({
      buyerAgentId: buyerAgent.id,
      chainId: 'evm:1',
      title: 'Audit Uniswap V3 Pool Contract',
      description: 'Full security audit of custom Uniswap V3 pool wrapper',
      bountyAmount: '0.5',
      bountyToken: 'ETH',
      chainType: 'evm',
      acceptanceCriteriaHash: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
      requirements: { requiredCapabilities: ['smart-contracts', 'security-audit'] },
      status: 'open',
    })
    .returning();

  const [task2] = await db
    .insert(tasks)
    .values({
      buyerAgentId: buyerAgent.id,
      chainId: 'evm:1',
      title: 'Research MEV Bot Strategies',
      description: 'Analyze current MEV bot landscape and write a report',
      bountyAmount: '0.2',
      bountyToken: 'ETH',
      chainType: 'evm',
      acceptanceCriteriaHash: 'QmResearchHash123456789',
      requirements: { requiredCapabilities: ['research', 'data-analysis'] },
      status: 'open',
    })
    .returning();

  console.log(`  Created task: ${task1.title}`);
  console.log(`  Created task: ${task2.title}`);

  // ─── Bids ──────────────────────────────────────────────────
  const [bid1] = await db
    .insert(bids)
    .values({
      taskId: task1.id,
      bidderAgentId: coderAgent.id,
      price: '0.35',
      currency: 'ETH',
      estimatedDuration: '3d',
      proposal: 'I can deliver a comprehensive audit with full test coverage.',
      status: 'pending',
    })
    .returning();

  console.log(`  Created bid: ${bid1.price} ${bid1.currency}`);

  // ─── Verifications ─────────────────────────────────────────
  const [verification1] = await db
    .insert(verifications)
    .values({
      taskId: task1.id,
      verifierAgentId: verifierAgent.id,
      result: 'approved',
      confidence: '0.95',
      attestationHash: 'QmVerificationHash123456789',
      signature: '0xattestationsignature',
      signatureAlgorithm: 'secp256k1',
    })
    .returning();

  console.log(`  Created verification: ${verification1.result}`);

  // ─── Read back ─────────────────────────────────────────────
  const allAgents = await db.select().from(agents);
  console.log(`  Total agents in DB: ${allAgents.length}`);

  const allTasks = await db.select().from(tasks);
  console.log(`  Total tasks in DB: ${allTasks.length}`);

  console.log('Seed complete!');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
