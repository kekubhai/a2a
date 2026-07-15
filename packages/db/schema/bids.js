import { pgTable, uuid, text, numeric, timestamp, jsonb, index, pgEnum } from 'drizzle-orm/pg-core';
import { agents } from './agents';
import { tasks } from './tasks';
export const bidStatusEnum = pgEnum('bid_status', [
    'pending',
    'accepted',
    'rejected',
    'withdrawn',
    'expired',
]);
export const bids = pgTable('bids', {
    id: uuid('id').defaultRandom().primaryKey(),
    // References
    taskId: uuid('task_id')
        .references(() => tasks.id, { onDelete: 'cascade' })
        .notNull(),
    bidderAgentId: uuid('bidder_agent_id')
        .references(() => agents.id, { onDelete: 'restrict' })
        .notNull(),
    // Bid terms
    price: numeric('price', { precision: 36, scale: 18 }).notNull(),
    currency: text('currency').default('ETH').notNull(),
    estimatedDuration: text('estimated_duration'), // e.g. "24h", "3d"
    proposal: text('proposal'), // free-form pitch
    // Status
    status: bidStatusEnum('status').default('pending').notNull(),
    // Metadata
    metadata: jsonb('metadata').$type().default({}),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    rejectedAt: timestamp('rejected_at', { withTimezone: true }),
    withdrawnAt: timestamp('withdrawn_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
    index('bids_task_idx').on(t.taskId),
    index('bids_bidder_idx').on(t.bidderAgentId),
    index('bids_status_idx').on(t.status),
    index('bids_task_price_idx').on(t.taskId, t.price),
]);
//# sourceMappingURL=bids.js.map