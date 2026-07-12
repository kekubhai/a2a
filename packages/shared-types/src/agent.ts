import { z } from 'zod';
import { ChainTypeSchema, AgentStatusSchema } from './chain.js';

const addressRegex = /^0x[a-fA-F0-9]{40}$|^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export const AgentSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().nullable(),
  ownerAddress: z.string().regex(addressRegex, 'Invalid EVM or Solana address'),
  chainId: z.string().min(1),
  chainAddress: z.string().min(1),
  chainType: ChainTypeSchema,
  reputationScore: z.number().min(0).max(100),
  totalStake: z.number().min(0),
  tasksCompleted: z.number().int().min(0),
  tasksFailed: z.number().int().min(0),
  capabilities: z.array(z.string()),
  metadata: z.record(z.string(), z.unknown()),
  status: AgentStatusSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Agent = z.infer<typeof AgentSchema>;

export const AgentCreateSchema = AgentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  reputationScore: true,
  totalStake: true,
  tasksCompleted: true,
  tasksFailed: true,
}).extend({
  reputationScore: z.number().min(0).max(100).default(0),
  totalStake: z.number().min(0).default(0),
  tasksCompleted: z.number().int().min(0).default(0),
  tasksFailed: z.number().int().min(0).default(0),
});

export type AgentCreate = z.infer<typeof AgentCreateSchema>;
