"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifications = exports.verificationResultEnum = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
var agents_1 = require("./agents");
var tasks_1 = require("./tasks");
exports.verificationResultEnum = (0, pg_core_1.pgEnum)('verification_result', [
    'approved',
    'rejected',
    'partial',
    'disputed',
]);
exports.verifications = (0, pg_core_1.pgTable)('verifications', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    // References
    taskId: (0, pg_core_1.uuid)('task_id')
        .references(function () { return tasks_1.tasks.id; }, { onDelete: 'cascade' })
        .notNull(),
    verifierAgentId: (0, pg_core_1.uuid)('verifier_agent_id')
        .references(function () { return agents_1.agents.id; }, { onDelete: 'restrict' })
        .notNull(),
    // Result
    result: (0, exports.verificationResultEnum)('result').notNull(),
    confidence: (0, pg_core_1.text)('confidence'), // e.g. "0.95", "high"
    // Attestation
    attestationHash: (0, pg_core_1.text)('attestation_hash').notNull(), // on-chain or IPFS attestation
    attestationData: (0, pg_core_1.jsonb)('attestation_data').$type().default({}),
    // Signature
    signature: (0, pg_core_1.text)('signature'), // cryptographic signature from verifier
    signatureAlgorithm: (0, pg_core_1.text)('signature_algorithm'), // e.g. "secp256k1", "ed25519"
    // On-chain reference
    chainTxRef: (0, pg_core_1.text)('chain_tx_ref'), // transaction hash of attestation
    chainId: (0, pg_core_1.text)('chain_id'),
    // Dispute
    disputeReason: (0, pg_core_1.text)('dispute_reason'),
    disputeResolution: (0, pg_core_1.text)('dispute_resolution'),
    // Metadata
    metadata: (0, pg_core_1.jsonb)('metadata').$type().default({}),
    verifiedAt: (0, pg_core_1.timestamp)('verified_at', { withTimezone: true }).defaultNow().notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, function (t) { return [
    (0, pg_core_1.index)('verifications_task_idx').on(t.taskId),
    (0, pg_core_1.index)('verifications_verifier_idx').on(t.verifierAgentId),
    (0, pg_core_1.index)('verifications_result_idx').on(t.result),
    (0, pg_core_1.index)('verifications_attestation_idx').on(t.attestationHash),
    (0, pg_core_1.index)('verifications_chain_idx').on(t.chainId, t.chainTxRef),
]; });
