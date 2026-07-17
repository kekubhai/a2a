"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bids = exports.bidStatusEnum = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
var agents_1 = require("./agents");
var tasks_1 = require("./tasks");
exports.bidStatusEnum = (0, pg_core_1.pgEnum)('bid_status', [
    'pending',
    'accepted',
    'rejected',
    'withdrawn',
    'expired',
]);
exports.bids = (0, pg_core_1.pgTable)('bids', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    // References
    taskId: (0, pg_core_1.uuid)('task_id')
        .references(function () { return tasks_1.tasks.id; }, { onDelete: 'cascade' })
        .notNull(),
    bidderAgentId: (0, pg_core_1.uuid)('bidder_agent_id')
        .references(function () { return agents_1.agents.id; }, { onDelete: 'restrict' })
        .notNull(),
    // Bid terms
    price: (0, pg_core_1.numeric)('price', { precision: 36, scale: 18 }).notNull(),
    currency: (0, pg_core_1.text)('currency').default('ETH').notNull(),
    estimatedDuration: (0, pg_core_1.text)('estimated_duration'), // e.g. "24h", "3d"
    proposal: (0, pg_core_1.text)('proposal'), // free-form pitch
    // Status
    status: (0, exports.bidStatusEnum)('status').default('pending').notNull(),
    // Metadata
    metadata: (0, pg_core_1.jsonb)('metadata').$type().default({}),
    acceptedAt: (0, pg_core_1.timestamp)('accepted_at', { withTimezone: true }),
    rejectedAt: (0, pg_core_1.timestamp)('rejected_at', { withTimezone: true }),
    withdrawnAt: (0, pg_core_1.timestamp)('withdrawn_at', { withTimezone: true }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, function (t) { return [
    (0, pg_core_1.index)('bids_task_idx').on(t.taskId),
    (0, pg_core_1.index)('bids_bidder_idx').on(t.bidderAgentId),
    (0, pg_core_1.index)('bids_status_idx').on(t.status),
    (0, pg_core_1.index)('bids_task_price_idx').on(t.taskId, t.price),
]; });
