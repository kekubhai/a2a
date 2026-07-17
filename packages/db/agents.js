"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agents = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
exports.agents = (0, pg_core_1.pgTable)('agents', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    // Identity
    name: (0, pg_core_1.text)('name').notNull(),
    description: (0, pg_core_1.text)('description'),
    ownerAddress: (0, pg_core_1.text)('owner_address').notNull(), // EVM or Solana address
    // Chain bindings
    chainId: (0, pg_core_1.text)('chain_id').notNull(), // e.g. "evm:1", "solana:mainnet"
    chainAddress: (0, pg_core_1.text)('chain_address').notNull(), // on-chain identity
    chainType: (0, pg_core_1.text)('chain_type', { enum: ['evm', 'solana'] }).notNull(),
    // Reputation & stake
    reputationScore: (0, pg_core_1.numeric)('reputation_score', { precision: 5, scale: 2 })
        .default('0')
        .notNull(),
    totalStake: (0, pg_core_1.numeric)('total_stake', { precision: 36, scale: 18 })
        .default('0')
        .notNull(),
    tasksCompleted: (0, pg_core_1.numeric)('tasks_completed').default('0').notNull(),
    tasksFailed: (0, pg_core_1.numeric)('tasks_failed').default('0').notNull(),
    // Metadata
    capabilities: (0, pg_core_1.jsonb)('capabilities').$type().default([]).notNull(),
    metadata: (0, pg_core_1.jsonb)('metadata').$type().default({}),
    // Status
    status: (0, pg_core_1.text)('status', { enum: ['active', 'suspended', 'deregistered'] })
        .default('active')
        .notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, function (t) { return [
    (0, pg_core_1.index)('agents_owner_address_idx').on(t.ownerAddress),
    (0, pg_core_1.index)('agents_chain_idx').on(t.chainType, t.chainAddress),
    (0, pg_core_1.index)('agents_status_idx').on(t.status),
]; });
