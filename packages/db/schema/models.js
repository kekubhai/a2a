import { pgTable, uuid, text, numeric, boolean, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
export const models = pgTable('models', {
    id: uuid('id').defaultRandom().primaryKey(),
    // Identity
    provider: text('provider').notNull(),
    name: text('name').notNull(),
    modelType: text('model_type', { enum: ['llm', 'image'] })
        .default('llm')
        .notNull(),
    // Pricing (per million tokens)
    inputPrice: numeric('input_price', { precision: 10, scale: 3 }).notNull(),
    outputPrice: numeric('output_price', { precision: 10, scale: 3 }).notNull(),
    // Benchmarks (nullable — not all models have scores)
    codingBenchmark: numeric('coding_benchmark', { precision: 5, scale: 1 }),
    writingBenchmark: numeric('writing_benchmark', { precision: 5, scale: 1 }),
    generalBenchmark: numeric('general_benchmark', { precision: 5, scale: 1 }),
    // Image generation specific
    imageElo: numeric('image_elo', { precision: 5, scale: 1 }),
    imageTextRanking: text('image_text_ranking'),
    imagePhotorealism: text('image_photorealism'),
    imageLatency: text('image_latency'),
    // Status & metadata
    isActive: boolean('is_active').default(true).notNull(),
    metadata: jsonb('metadata').$type().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
    index('models_provider_idx').on(t.provider),
    index('models_type_idx').on(t.modelType),
    index('models_active_idx').on(t.isActive),
]);
//# sourceMappingURL=models.js.map