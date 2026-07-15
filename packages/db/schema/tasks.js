import { pgTable, uuid, text, numeric, timestamp, jsonb, index, pgEnum } from 'drizzle-orm/pg-core';
import { agents } from './agents';
export const taskStatusEnum = pgEnum('task_status', [
    'open',
    'bidding',
    'assigned',
    'in_progress',
    'submitted',
    'verifying',
    'disputed',
    'completed',
    'failed',
    'cancelled',
]);
export const tasks = pgTable('tasks', {
    id: uuid('id').defaultRandom().primaryKey(),
    // Chain reference
    chainId: text('chain_id').notNull(),
    onChainTaskId: text('on_chain_task_id'), // external task ID on the contract
    // Buyer
    buyerAgentId: uuid('buyer_agent_id')
        .references(() => agents.id, { onDelete: 'restrict' })
        .notNull(),
    // Bounty
    bountyAmount: numeric('bounty_amount', { precision: 36, scale: 18 }).notNull(),
    bountyToken: text('bounty_token').default('ETH').notNull(),
    chainType: text('chain_type', { enum: ['evm', 'solana'] }).notNull(),
    // Task spec
    title: text('title').notNull(),
    description: text('description'),
    acceptanceCriteriaHash: text('acceptance_criteria_hash').notNull(), // IPFS or content hash
    requirements: jsonb('requirements').$type().default({}),
    // Lifecycle
    status: taskStatusEnum('status').default('open').notNull(),
    assignedAgentId: uuid('assigned_agent_id').references(() => agents.id, {
        onDelete: 'set null',
    }),
    // Timing
    deadline: timestamp('deadline', { withTimezone: true }),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
    index('tasks_buyer_idx').on(t.buyerAgentId),
    index('tasks_assigned_idx').on(t.assignedAgentId),
    index('tasks_status_idx').on(t.status),
    index('tasks_chain_idx').on(t.chainId, t.onChainTaskId),
    index('tasks_bounty_idx').on(t.bountyAmount),
]);
//# sourceMappingURL=tasks.js.map