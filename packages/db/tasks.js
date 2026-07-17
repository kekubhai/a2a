"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tasks = exports.taskStatusEnum = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
var agents_1 = require("./agents");
exports.taskStatusEnum = (0, pg_core_1.pgEnum)('task_status', [
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
exports.tasks = (0, pg_core_1.pgTable)('tasks', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    // Chain reference
    chainId: (0, pg_core_1.text)('chain_id').notNull(),
    onChainTaskId: (0, pg_core_1.text)('on_chain_task_id'), // external task ID on the contract
    // Buyer
    buyerAgentId: (0, pg_core_1.uuid)('buyer_agent_id')
        .references(function () { return agents_1.agents.id; }, { onDelete: 'restrict' })
        .notNull(),
    // Bounty
    bountyAmount: (0, pg_core_1.numeric)('bounty_amount', { precision: 36, scale: 18 }).notNull(),
    bountyToken: (0, pg_core_1.text)('bounty_token').default('ETH').notNull(),
    chainType: (0, pg_core_1.text)('chain_type', { enum: ['evm', 'solana'] }).notNull(),
    // Task spec
    title: (0, pg_core_1.text)('title').notNull(),
    description: (0, pg_core_1.text)('description'),
    acceptanceCriteriaHash: (0, pg_core_1.text)('acceptance_criteria_hash').notNull(), // IPFS or content hash
    requirements: (0, pg_core_1.jsonb)('requirements').$type().default({}),
    // Lifecycle
    status: (0, exports.taskStatusEnum)('status').default('open').notNull(),
    assignedAgentId: (0, pg_core_1.uuid)('assigned_agent_id').references(function () { return agents_1.agents.id; }, {
        onDelete: 'set null',
    }),
    // Timing
    deadline: (0, pg_core_1.timestamp)('deadline', { withTimezone: true }),
    submittedAt: (0, pg_core_1.timestamp)('submitted_at', { withTimezone: true }),
    completedAt: (0, pg_core_1.timestamp)('completed_at', { withTimezone: true }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, function (t) { return [
    (0, pg_core_1.index)('tasks_buyer_idx').on(t.buyerAgentId),
    (0, pg_core_1.index)('tasks_assigned_idx').on(t.assignedAgentId),
    (0, pg_core_1.index)('tasks_status_idx').on(t.status),
    (0, pg_core_1.index)('tasks_chain_idx').on(t.chainId, t.onChainTaskId),
    (0, pg_core_1.index)('tasks_bounty_idx').on(t.bountyAmount),
]; });
