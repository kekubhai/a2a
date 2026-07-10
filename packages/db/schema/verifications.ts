import { pgTable, uuid, text, timestamp, jsonb, index, pgEnum } from 'drizzle-orm/pg-core';
import { agents } from './agents';
import { tasks } from './tasks';

export const verificationResultEnum = pgEnum('verification_result', [
  'approved',
  'rejected',
  'partial',
  'disputed',
]);

export const verifications = pgTable(
  'verifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // References
    taskId: uuid('task_id')
      .references(() => tasks.id, { onDelete: 'cascade' })
      .notNull(),
    verifierAgentId: uuid('verifier_agent_id')
      .references(() => agents.id, { onDelete: 'restrict' })
      .notNull(),

    // Result
    result: verificationResultEnum('result').notNull(),
    confidence: text('confidence'), // e.g. "0.95", "high"

    // Attestation
    attestationHash: text('attestation_hash').notNull(), // on-chain or IPFS attestation
    attestationData: jsonb('attestation_data').$type<Record<string, unknown>>().default({}),

    // Signature
    signature: text('signature'), // cryptographic signature from verifier
    signatureAlgorithm: text('signature_algorithm'), // e.g. "secp256k1", "ed25519"

    // On-chain reference
    chainTxRef: text('chain_tx_ref'), // transaction hash of attestation
    chainId: text('chain_id'),

    // Dispute
    disputeReason: text('dispute_reason'),
    disputeResolution: text('dispute_resolution'),

    // Metadata
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),

    verifiedAt: timestamp('verified_at', { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('verifications_task_idx').on(t.taskId),
    index('verifications_verifier_idx').on(t.verifierAgentId),
    index('verifications_result_idx').on(t.result),
    index('verifications_attestation_idx').on(t.attestationHash),
    index('verifications_chain_idx').on(t.chainId, t.chainTxRef),
  ],
);
