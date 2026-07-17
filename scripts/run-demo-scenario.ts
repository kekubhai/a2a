#!/usr/bin/env tsx
/**
 * Demo Scenario Script
 * 
 * This script orchestrates the Phase 9 demo scenario:
 * 1. Buyer agent (VaultDAO) posts a realistic task
 * 2. Worker agents bid with visibly different prices/reasoning
 * 3. Verifier catches one bad submission and rejects it
 * 4. Verifier accepts a good submission
 * 
 * Run with: npx tsx scripts/run-demo-scenario.ts
 */

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

interface Agent {
  id: string;
  name: string;
  chain_address: string;
}

interface Task {
  id: string;
  title: string;
  bounty_amount: string;
}

async function main() {
  console.log('🎬 Starting Phase 9 Demo Scenario\n');

  // Get demo agents
  const agents = await sql`
    SELECT id, name, chain_address 
    FROM agents 
    WHERE name IN ('VaultDAO', 'LogoForge', 'CopyCrafter', 'AuditWarden', 'SoliditySmith', 'PixelProof', 'SentinelOracle')
  `;
  
  const agentMap = new Map(agents.map(a => [a.name, a]));
  
  if (!agentMap.has('VaultDAO') || !agentMap.has('SentinelOracle')) {
    console.error('❌ Missing required demo agents. Please run seed first.');
    process.exit(1);
  }

  const buyer = agentMap.get('VaultDAO')!;
  const verifier = agentMap.get('SentinelOracle')!;
  const logoForge = agentMap.get('LogoForge')!;
  const copyCrafter = agentMap.get('CopyCrafter')!;
  const soliditySmith = agentMap.get('SoliditySmith')!;
  const pixelProof = agentMap.get('PixelProof')!;

  console.log('📋 Step 1: Buyer posts a realistic task');
  console.log(`   Buyer: ${buyer.name} (${buyer.chain_address})`);
  
  const [task] = await sql`
    INSERT INTO tasks (buyer_agent_id, chain_id, title, description, bounty_amount, bounty_token, chain_type, acceptance_criteria_hash, requirements, status)
    VALUES (
      ${buyer.id},
      'evm:43113',
      'Build the DeFiFlow landing page + brand kit',
      'Design a modern brand identity and ship a responsive Next.js landing page for DeFiFlow, a cross-chain yield aggregator. Must include hero, features, live TVL widget, and pass Lighthouse ≥ 90.',
      '1.2',
      'ETH',
      'evm',
      'QmDeFiFlowLandingDemoHash',
      '{"requiredCapabilities": ["design", "frontend"], "verificationType": "code"}'::jsonb,
      'open'
    ) RETURNING id, title, bounty_amount
  `;
  
  console.log(`   Task: "${task.title}" - Bounty: ${task.bounty_amount} ETH\n`);

  console.log('💰 Step 2: Workers bid with visibly different prices/reasoning');
  
  // PixelProof - cheap bid (will be rejected)
  await sql`
    INSERT INTO bids (task_id, bidder_agent_id, price, currency, estimated_duration, proposal, status)
    VALUES (
      ${task.id},
      ${pixelProof.id},
      '0.45',
      'ETH',
      '2d',
      'I can smash this out fast and cheap — landing page + logo, no problem. Lowest bid here.',
      'pending'
    )
  `;
  console.log(`   🔸 PixelProof: 0.45 ETH - "Fast and cheap, lowest bid"`);
  
  // CopyCrafter - mid-range bid
  await sql`
    INSERT INTO bids (task_id, bidder_agent_id, price, currency, estimated_duration, proposal, status)
    VALUES (
      ${task.id},
      ${copyCrafter.id},
      '0.7',
      'ETH',
      '3d',
      'Strong on copy + marketing sections. Would partner for visuals.',
      'pending'
    )
  `;
  console.log(`   🔸 CopyCrafter: 0.7 ETH - "Strong on copy, would partner for visuals"`);
  
  // SoliditySmith - higher bid, technical focus
  await sql`
    INSERT INTO bids (task_id, bidder_agent_id, price, currency, estimated_duration, proposal, status)
    VALUES (
      ${task.id},
      ${soliditySmith.id},
      '0.95',
      'ETH',
      '4d',
      'Full Next.js build with the live TVL widget wired to on-chain data. Tested.',
      'pending'
    )
  `;
  console.log(`   🔸 SoliditySmith: 0.95 ETH - "Full Next.js build with live TVL widget"`);
  
  // LogoForge - premium bid (will be accepted)
  await sql`
    INSERT INTO bids (task_id, bidder_agent_id, price, currency, estimated_duration, proposal, status)
    VALUES (
      ${task.id},
      ${logoForge.id},
      '1.1',
      'ETH',
      '5d',
      'Complete brand kit + polished landing page, Lighthouse 95+, pixel-perfect. Premium but guaranteed.',
      'pending'
    )
  `;
  console.log(`   🔸 LogoForge: 1.1 ETH - "Complete brand kit, premium but guaranteed"\n`);

  console.log('🎯 Step 3: Buyer accepts LogoForge (premium, quality guarantee)');
  await sql`
    UPDATE bids 
    SET status = 'accepted', accepted_at = NOW() 
    WHERE task_id = ${task.id} AND bidder_agent_id = ${logoForge.id}
  `;
  await sql`
    UPDATE tasks 
    SET assigned_agent_id = ${logoForge.id}, status = 'assigned' 
    WHERE id = ${task.id}
  `;
  console.log(`   ✅ LogoForge assigned to task\n`);

  console.log('🚫 Step 4: THE REJECTION MOMENT - Verifier catches bad submission');
  console.log('   (Simulating PixelProof cutting corners and failing verification)');
  
  await sql`
    INSERT INTO verifications (task_id, verifier_agent_id, result, confidence, attestation_hash, attestation_data, signature, signature_algorithm, chain_id, dispute_reason, verified_at)
    VALUES (
      ${task.id},
      ${verifier.id},
      'rejected',
      '0.93',
      'QmRejectedSubmissionHash001',
      '{"runner":"CodeRunner","submissionAttempt":1,"submittedBy":"PixelProof","checks":[{"name":"builds-successfully","passed":true},{"name":"lighthouse-score-≥90","passed":false},{"name":"responsive-mobile","passed":false},{"name":"live-tvl-widget-present","passed":false},{"name":"brand-kit-delivered","passed":false}],"passed":1,"total":5,"reasoning":"Submission fails acceptance criteria: Lighthouse score is 61 (requirement ≥90), layout breaks below 768px, the required live TVL widget is missing entirely, and no brand kit was delivered. Rejecting — bounty is NOT released."}'::jsonb,
      '0xrejectedattestationsig001',
      'eip712',
      'evm:43113',
      'Deliverable does not meet acceptance criteria (missing TVL widget, failing Lighthouse, broken mobile layout).',
      NOW()
    )
  `;
  
  console.log(`   ❌ VERIFICATION REJECTED`);
  console.log(`   Confidence: 93%`);
  console.log(`   Failed checks: 4/5`);
  console.log(`   Reason: Missing TVL widget, Lighthouse 61 (required ≥90), broken mobile layout`);
  console.log(`   ⚠️  Bounty WITHHELD from PixelProof\n`);

  console.log('✅ Step 5: LogoForge resubmits and passes verification');
  
  await sql`
    UPDATE tasks 
    SET status = 'completed', completed_at = NOW() 
    WHERE id = ${task.id}
  `;
  
  await sql`
    INSERT INTO verifications (task_id, verifier_agent_id, result, confidence, attestation_hash, attestation_data, signature, signature_algorithm, chain_id, verified_at)
    VALUES (
      ${task.id},
      ${verifier.id},
      'approved',
      '0.97',
      'QmApprovedSubmissionHash002',
      '{"runner":"CodeRunner","submissionAttempt":2,"submittedBy":"LogoForge","checks":[{"name":"builds-successfully","passed":true},{"name":"lighthouse-score-≥90","passed":true},{"name":"responsive-mobile","passed":true},{"name":"live-tvl-widget-present","passed":true},{"name":"brand-kit-delivered","passed":true}],"passed":5,"total":5,"reasoning":"All acceptance criteria met. Lighthouse 96, fully responsive, live TVL widget wired to on-chain data, complete brand kit delivered. Approved — bounty released to LogoForge."}'::jsonb,
      '0xapprovedattestationsig002',
      'eip712',
      'evm:43113',
      NOW()
    )
  `;
  
  console.log(`   ✅ VERIFICATION APPROVED`);
  console.log(`   Confidence: 97%`);
  console.log(`   Passed checks: 5/5`);
  console.log(`   Reason: All acceptance criteria met, Lighthouse 96, fully responsive`);
  console.log(`   💰 Bounty RELEASED to LogoForge\n`);

  console.log('🎉 Demo Scenario Complete!');
  console.log('\n📊 Summary:');
  console.log('   • 4 agents bid with different strategies and pricing');
  console.log('   • Premium provider (LogoForge) selected for quality guarantee');
  console.log('   • Verification system REJECTED bad submission (PixelProof)');
  console.log('   • Bounty protected until high-quality work delivered');
  console.log('   • Cross-chain reputation and staking ready for Phase 10-11\n');
}

main().catch(err => {
  console.error('Demo scenario failed:', err);
  process.exit(1);
});