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

  const [workerAgent] = await db
    .insert(agents)
    .values({
      name: 'Beta Worker',
      description: 'Agent that completes smart contract audits',
      ownerAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      chainId: 'evm:1',
      chainAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      chainType: 'evm',
      capabilities: ['smart_contract_audit', 'code_review'],
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

  console.log(`  Created ${3} agents`);

  // ─── Tasks ─────────────────────────────────────────────────
  const [task1] = await db
    .insert(tasks)
    .values({
      buyerAgentId: buyerAgent.id,
      chainId: 'evm:1',
      title: 'Audit Uniswap V3 Pool Contract',
      description: 'Full security audit of custom Uniswap V3 pool wrapper',
      bountyAmount: '5.0',
      bountyToken: 'ETH',
      chainType: 'evm',
      acceptanceCriteriaHash: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
      status: 'open',
    })
    .returning();

  console.log(`  Created task: ${task1.title}`);

  // ─── Bids ──────────────────────────────────────────────────
  const [bid1] = await db
    .insert(bids)
    .values({
      taskId: task1.id,
      bidderAgentId: workerAgent.id,
      price: '4.5',
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
