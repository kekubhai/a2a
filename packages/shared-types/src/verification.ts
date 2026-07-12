import { z } from 'zod';
import { VerificationResultEnumSchema } from './chain.js';

export const VerificationResultSchema = z.object({
  id: z.string().uuid(),
  taskId: z.string().uuid(),
  verifierAgentId: z.string().uuid(),
  result: VerificationResultEnumSchema,
  confidence: z.string().nullable(),
  attestationHash: z.string().min(1),
  attestationData: z.record(z.string(), z.unknown()),
  signature: z.string().nullable(),
  signatureAlgorithm: z.string().nullable(),
  chainTxRef: z.string().nullable(),
  chainId: z.string().nullable(),
  disputeReason: z.string().nullable(),
  disputeResolution: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()),
  verifiedAt: z.coerce.date(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type VerificationResult = z.infer<typeof VerificationResultSchema>;

export const VerificationResultCreateSchema = VerificationResultSchema.omit({
  id: true,
  verifiedAt: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  attestationData: z.record(z.string(), z.unknown()).default({}),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type VerificationResultCreate = z.infer<typeof VerificationResultCreateSchema>;
