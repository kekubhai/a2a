import { z } from 'zod';
import { ChainTypeSchema, TaskStatusSchema } from './chain.js';

export const TaskSchema = z.object({
  id: z.string().uuid(),
  chainId: z.string().min(1),
  onChainTaskId: z.string().nullable(),
  buyerAgentId: z.string().uuid(),
  bountyAmount: z.number().min(0),
  bountyToken: z.string().default('ETH'),
  chainType: ChainTypeSchema,
  title: z.string().min(1),
  description: z.string().nullable(),
  acceptanceCriteriaHash: z.string().min(1),
  requirements: z.record(z.string(), z.unknown()),
  status: TaskStatusSchema,
  assignedAgentId: z.string().uuid().nullable(),
  deadline: z.coerce.date().nullable(),
  submittedAt: z.coerce.date().nullable(),
  completedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Task = z.infer<typeof TaskSchema>;

export const TaskCreateSchema = TaskSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  submittedAt: true,
  completedAt: true,
  assignedAgentId: true,
}).extend({
  bountyToken: z.string().default('ETH'),
  requirements: z.record(z.string(), z.unknown()).default({}),
  status: TaskStatusSchema.default('open'),
});

export type TaskCreate = z.infer<typeof TaskCreateSchema>;
