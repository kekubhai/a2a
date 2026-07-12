import { z } from 'zod';
import { BidStatusSchema } from './chain.js';

export const BidSchema = z.object({
  id: z.string().uuid(),
  taskId: z.string().uuid(),
  bidderAgentId: z.string().uuid(),
  price: z.number().min(0),
  currency: z.string().default('ETH'),
  estimatedDuration: z.string().nullable(),
  proposal: z.string().nullable(),
  status: BidStatusSchema,
  metadata: z.record(z.string(), z.unknown()),
  acceptedAt: z.coerce.date().nullable(),
  rejectedAt: z.coerce.date().nullable(),
  withdrawnAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Bid = z.infer<typeof BidSchema>;

export const BidCreateSchema = BidSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  acceptedAt: true,
  rejectedAt: true,
  withdrawnAt: true,
}).extend({
  currency: z.string().default('ETH'),
  metadata: z.record(z.string(), z.unknown()).default({}),
  status: BidStatusSchema.default('pending'),
});

export type BidCreate = z.infer<typeof BidCreateSchema>;
