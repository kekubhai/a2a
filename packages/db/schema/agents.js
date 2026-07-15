import { pgTable, uuid, text, numeric, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
export const agents = pgTable('agents', {
    id: uuid('id').defaultRandom().primaryKey(),
    // Identity
    name: text('name').notNull(),
    description: text('description'),
    ownerAddress: text('owner_address').notNull(), // EVM or Solana address
    // Chain bindings
    chainId: text('chain_id').notNull(), // e.g. "evm:1", "solana:mainnet"
    chainAddress: text('chain_address').notNull(), // on-chain identity
    chainType: text('chain_type', { enum: ['evm', 'solana'] }).notNull(),
    // Reputation & stake
    reputationScore: numeric('reputation_score', { precision: 5, scale: 2 })
        .default('0')
        .notNull(),
    totalStake: numeric('total_stake', { precision: 36, scale: 18 })
        .default('0')
        .notNull(),
    tasksCompleted: numeric('tasks_completed').default('0').notNull(),
    tasksFailed: numeric('tasks_failed').default('0').notNull(),
    // Metadata
    capabilities: jsonb('capabilities').$type().default([]).notNull(),
    metadata: jsonb('metadata').$type().default({}),
    // Status
    status: text('status', { enum: ['active', 'suspended', 'deregistered'] })
        .default('active')
        .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
    index('agents_owner_address_idx').on(t.ownerAddress),
    index('agents_chain_idx').on(t.chainType, t.chainAddress),
    index('agents_status_idx').on(t.status),
]);
//# sourceMappingURL=agents.js.map