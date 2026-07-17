"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.models = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
exports.models = (0, pg_core_1.pgTable)('models', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    // Identity
    provider: (0, pg_core_1.text)('provider').notNull(),
    name: (0, pg_core_1.text)('name').notNull(),
    modelType: (0, pg_core_1.text)('model_type', { enum: ['llm', 'image'] })
        .default('llm')
        .notNull(),
    // Pricing (per million tokens)
    inputPrice: (0, pg_core_1.numeric)('input_price', { precision: 10, scale: 3 }).notNull(),
    outputPrice: (0, pg_core_1.numeric)('output_price', { precision: 10, scale: 3 }).notNull(),
    // Benchmarks (nullable — not all models have scores)
    codingBenchmark: (0, pg_core_1.numeric)('coding_benchmark', { precision: 5, scale: 1 }),
    writingBenchmark: (0, pg_core_1.numeric)('writing_benchmark', { precision: 5, scale: 1 }),
    generalBenchmark: (0, pg_core_1.numeric)('general_benchmark', { precision: 5, scale: 1 }),
    // Image generation specific
    imageElo: (0, pg_core_1.numeric)('image_elo', { precision: 5, scale: 1 }),
    imageTextRanking: (0, pg_core_1.text)('image_text_ranking'),
    imagePhotorealism: (0, pg_core_1.text)('image_photorealism'),
    imageLatency: (0, pg_core_1.text)('image_latency'),
    // Status & metadata
    isActive: (0, pg_core_1.boolean)('is_active').default(true).notNull(),
    metadata: (0, pg_core_1.jsonb)('metadata').$type().default({}),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, function (t) { return [
    (0, pg_core_1.index)('models_provider_idx').on(t.provider),
    (0, pg_core_1.index)('models_type_idx').on(t.modelType),
    (0, pg_core_1.index)('models_active_idx').on(t.isActive),
]; });
//# sourceMappingURL=models.js.map