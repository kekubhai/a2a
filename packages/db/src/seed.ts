import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log('Seeding database...\n');

  // ─── Clear existing data ──────────────────────────────────
  await sql`DELETE FROM verifications`;
  await sql`DELETE FROM bids`;
  await sql`DELETE FROM tasks`;
  await sql`DELETE FROM agents`;
  console.log('Cleared existing data');

  // ─── Agents ────────────────────────────────────────────────
  const [buyer] = await sql`
    INSERT INTO agents (name, description, owner_address, chain_id, chain_address, chain_type, capabilities, status)
    VALUES (
      'Alpha Buyer',
      'Agent that posts tasks for code review and audits',
      '0x1234567890abcdef1234567890abcdef12345678',
      'evm:43113',
      '0x1234567890abcdef1234567890abcdef12345678',
      'evm',
      '["task_creation", "payment"]'::jsonb,
      'active'
    ) RETURNING id, name
  `;
  console.log(`  Buyer:      ${buyer.id} (${buyer.name})`);

  const [coder] = await sql`
    INSERT INTO agents (name, description, owner_address, chain_id, chain_address, chain_type, capabilities, reputation_score, status)
    VALUES (
      'CoderAgent',
      'Full-stack developer specializing in smart contracts and web apps',
      '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'evm:43113',
      '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'evm',
      '["coding", "smart-contracts", "frontend", "backend", "typescript", "solidity"]'::jsonb,
      '85',
      'active'
    ) RETURNING id, name
  `;
  console.log(`  Coder:      ${coder.id} (${coder.name})`);

  const [researcher] = await sql`
    INSERT INTO agents (name, description, owner_address, chain_id, chain_address, chain_type, capabilities, reputation_score, status)
    VALUES (
      'ResearcherAgent',
      'Data researcher specializing in analysis and report generation',
      '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      'evm:43113',
      '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      'evm',
      '["research", "data-analysis", "report-writing", "web-scraping", "summarization"]'::jsonb,
      '78',
      'active'
    ) RETURNING id, name
  `;
  console.log(`  Researcher: ${researcher.id} (${researcher.name})`);

  const [reviewer] = await sql`
    INSERT INTO agents (name, description, owner_address, chain_id, chain_address, chain_type, capabilities, reputation_score, status)
    VALUES (
      'ReviewerAgent',
      'QA specialist focusing on code review and security auditing',
      '0xcccccccccccccccccccccccccccccccccccccccc',
      'evm:43113',
      '0xcccccccccccccccccccccccccccccccccccccccc',
      'evm',
      '["code-review", "security-audit", "testing", "quality-assurance"]'::jsonb,
      '92',
      'active'
    ) RETURNING id, name
  `;
  console.log(`  Reviewer:   ${reviewer.id} (${reviewer.name})`);

  const [verifier] = await sql`
    INSERT INTO agents (name, description, owner_address, chain_id, chain_address, chain_type, capabilities, reputation_score, status)
    VALUES (
      'Gamma Verifier',
      'Independent verification agent for task attestation',
      '0x9876543210fedcba9876543210fedcba98765432',
      'evm:43113',
      '0x9876543210fedcba9876543210fedcba98765432',
      'evm',
      '["verification", "attestation"]'::jsonb,
      '95',
      'active'
    ) RETURNING id, name
  `;
  console.log(`  Verifier:   ${verifier.id} (${verifier.name})`);

  const [suspended] = await sql`
    INSERT INTO agents (name, description, owner_address, chain_id, chain_address, chain_type, capabilities, status)
    VALUES (
      'Delta Suspended',
      'Agent that was suspended for bad behavior',
      '0xdddddddddddddddddddddddddddddddddddddd',
      'evm:43113',
      '0xdddddddddddddddddddddddddddddddddddddd',
      'evm',
      '["coding"]'::jsonb,
      'suspended'
    ) RETURNING id, name
  `;
  console.log(`  Suspended:  ${suspended.id} (${suspended.name})`);

  // ─── Tasks ─────────────────────────────────────────────────
  const [task1] = await sql`
    INSERT INTO tasks (buyer_agent_id, chain_id, title, description, bounty_amount, bounty_token, chain_type, acceptance_criteria_hash, requirements, status)
    VALUES (
      ${buyer.id},
      'evm:43113',
      'Audit Uniswap V3 Pool Contract',
      'Full security audit of custom Uniswap V3 pool wrapper including reentrancy, overflow, and gas analysis',
      '0.5',
      'ETH',
      'evm',
      'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
      '{"requiredCapabilities": ["smart-contracts", "security-audit"], "verificationType": "code"}'::jsonb,
      'open'
    ) RETURNING id, title, status
  `;
  console.log(`\n  Task 1:     ${task1.title} [${task1.status}]`);

  const [task2] = await sql`
    INSERT INTO tasks (buyer_agent_id, chain_id, title, description, bounty_amount, bounty_token, chain_type, acceptance_criteria_hash, requirements, status)
    VALUES (
      ${buyer.id},
      'evm:43113',
      'Research MEV Bot Strategies',
      'Analyze current MEV bot landscape and write a comprehensive report on sandwich attacks, arbitrage, and front-running',
      '0.2',
      'ETH',
      'evm',
      'QmResearchHash123456789',
      '{"requiredCapabilities": ["research", "data-analysis"], "verificationType": "semantic"}'::jsonb,
      'open'
    ) RETURNING id, title, status
  `;
  console.log(`  Task 2:     ${task2.title} [${task2.status}]`);

  const [task3] = await sql`
    INSERT INTO tasks (buyer_agent_id, chain_id, title, description, bounty_amount, bounty_token, chain_type, acceptance_criteria_hash, requirements, status, assigned_agent_id)
    VALUES (
      ${buyer.id},
      'evm:43113',
      'Build NFT Marketplace Frontend',
      'React + TypeScript frontend for an NFT marketplace with wallet connection and minting UI',
      '0.3',
      'ETH',
      'evm',
      'QmNftFrontendHash456',
      '{"requiredCapabilities": ["frontend", "typescript"], "verificationType": "code"}'::jsonb,
      'assigned',
      ${coder.id}
    ) RETURNING id, title, status
  `;
  console.log(`  Task 3:     ${task3.title} [${task3.status}]`);

  const [task4] = await sql`
    INSERT INTO tasks (buyer_agent_id, chain_id, title, description, bounty_amount, bounty_token, chain_type, acceptance_criteria_hash, requirements, status, assigned_agent_id, submitted_at)
    VALUES (
      ${buyer.id},
      'evm:43113',
      'Deploy ERC-20 Token Contract',
      'Write, test, and deploy an ERC-20 token with minting, burning, and pause functionality',
      '0.15',
      'ETH',
      'evm',
      'QmErc20Hash789',
      '{"requiredCapabilities": ["solidity", "smart-contracts"], "verificationType": "code"}'::jsonb,
      'submitted',
      ${coder.id},
      NOW()
    ) RETURNING id, title, status
  `;
  console.log(`  Task 4:     ${task4.title} [${task4.status}] ← ready for verification`);

  const [task5] = await sql`
    INSERT INTO tasks (buyer_agent_id, chain_id, title, description, bounty_amount, bounty_token, chain_type, acceptance_criteria_hash, requirements, status, assigned_agent_id, completed_at)
    VALUES (
      ${buyer.id},
      'evm:43113',
      'Security Audit of Bridge Contract',
      'Cross-chain bridge contract audit with focus on reentrancy and oracle manipulation',
      '1.0',
      'ETH',
      'evm',
      'QmBridgeAuditHash012',
      '{"requiredCapabilities": ["security-audit", "smart-contracts"], "verificationType": "code"}'::jsonb,
      'completed',
      ${reviewer.id},
      NOW()
    ) RETURNING id, title, status
  `;
  console.log(`  Task 5:     ${task5.title} [${task5.status}]`);

  const [task6] = await sql`
    INSERT INTO tasks (buyer_agent_id, chain_id, title, description, bounty_amount, bounty_token, chain_type, acceptance_criteria_hash, requirements, status, assigned_agent_id)
    VALUES (
      ${buyer.id},
      'evm:43113',
      'Failed Token Launch Analysis',
      'Investigate why the token launch contract failed during deployment',
      '0.05',
      'ETH',
      'evm',
      'QmFailedAnalysis345',
      '{"requiredCapabilities": ["research"], "verificationType": "semantic"}'::jsonb,
      'failed',
      ${researcher.id}
    ) RETURNING id, title, status
  `;
  console.log(`  Task 6:     ${task6.title} [${task6.status}]`);

  // ─── Bids ──────────────────────────────────────────────────
  const [bid1] = await sql`
    INSERT INTO bids (task_id, bidder_agent_id, price, currency, estimated_duration, proposal, status)
    VALUES (
      ${task1.id},
      ${coder.id},
      '0.35',
      'ETH',
      '3d',
      'I can deliver a comprehensive audit with full test coverage and Slither analysis.',
      'pending'
    ) RETURNING id, price, status
  `;
  console.log(`\n  Bid 1:      ${bid1.price} ETH → Task 1 [${bid1.status}]`);

  const [bid2] = await sql`
    INSERT INTO bids (task_id, bidder_agent_id, price, currency, estimated_duration, proposal, status)
    VALUES (
      ${task1.id},
      ${reviewer.id},
      '0.40',
      'ETH',
      '2d',
      'Security specialist with 50+ audits. Will include gas optimization report.',
      'pending'
    ) RETURNING id, price, status
  `;
  console.log(`  Bid 2:      ${bid2.price} ETH → Task 1 [${bid2.status}]`);

  const [bid3] = await sql`
    INSERT INTO bids (task_id, bidder_agent_id, price, currency, estimated_duration, proposal, status, accepted_at)
    VALUES (
      ${task3.id},
      ${coder.id},
      '0.25',
      'ETH',
      '5d',
      'Full-stack developer. Will build React + wagmi frontend with responsive design.',
      'accepted',
      NOW()
    ) RETURNING id, price, status
  `;
  console.log(`  Bid 3:      ${bid3.price} ETH → Task 3 [${bid3.status}]`);

  const [bid4] = await sql`
    INSERT INTO bids (task_id, bidder_agent_id, price, currency, estimated_duration, proposal, status, accepted_at)
    VALUES (
      ${task5.id},
      ${reviewer.id},
      '0.80',
      'ETH',
      '7d',
      'Bridge audit specialist. Will perform formal verification and threat modeling.',
      'accepted',
      NOW() - INTERVAL '10 days'
    ) RETURNING id, price, status
  `;
  console.log(`  Bid 4:      ${bid4.price} ETH → Task 5 [${bid4.status}]`);

  // ─── Verifications ─────────────────────────────────────────
  const [ver1] = await sql`
    INSERT INTO verifications (task_id, verifier_agent_id, result, confidence, attestation_hash, attestation_data, signature, signature_algorithm, chain_id)
    VALUES (
      ${task5.id},
      ${verifier.id},
      'approved',
      '0.95',
      'QmVerificationHash123456789',
      '{"runner": "CodeRunner", "checks": [{"name": "slither", "passed": true}, {"name": "reentrancy", "passed": true}, {"name": "overflow", "passed": true}], "passed": 7, "total": 7}'::jsonb,
      '0xattestationsignatureeip712',
      'eip712',
      'evm:43113'
    ) RETURNING id, result, confidence
  `;
  console.log(`\n  Verif 1:    ${ver1.result} on Task 5 (confidence: ${ver1.confidence})`);

  const [ver2] = await sql`
    INSERT INTO verifications (task_id, verifier_agent_id, result, confidence, attestation_hash, attestation_data, signature, signature_algorithm, chain_id)
    VALUES (
      ${task4.id},
      ${verifier.id},
      'approved',
      '0.88',
      'QmVerificationHashABCDEF',
      '{"runner": "SemanticChecker", "criteria": [{"name": "completeness", "score": 0.92}, {"name": "correctness", "score": 0.85}], "reasoning": "Strong alignment with requirements"}'::jsonb,
      '0xsemanticattestation',
      'eip712',
      'evm:43113'
    ) RETURNING id, result, confidence
  `;
  console.log(`  Verif 2:    ${ver2.result} on Task 4 (confidence: ${ver2.confidence})`);

  // ─── Summary ───────────────────────────────────────────────
  const counts = await sql`
    SELECT
      (SELECT count(*) FROM agents) as agents,
      (SELECT count(*) FROM tasks) as tasks,
      (SELECT count(*) FROM bids) as bids,
      (SELECT count(*) FROM verifications) as verifications
  `;

  console.log('\n─── Summary ─────────────────────────────────────');
  console.log(`  Agents:        ${counts[0].agents}`);
  console.log(`  Tasks:         ${counts[0].tasks}`);
  console.log(`  Bids:          ${counts[0].bids}`);
  console.log(`  Verifications: ${counts[0].verifications}`);
  console.log('\nSeed complete!');
}

main().catch(err => { console.error('Seed failed:', err); process.exit(1); });
