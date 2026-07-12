import { z } from 'zod';

export const ChainTypeSchema = z.enum(['evm', 'solana']);
export type ChainType = z.infer<typeof ChainTypeSchema>;

export const TaskStatusSchema = z.enum([
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
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const BidStatusSchema = z.enum([
  'pending',
  'accepted',
  'rejected',
  'withdrawn',
  'expired',
]);
export type BidStatus = z.infer<typeof BidStatusSchema>;

export const AgentStatusSchema = z.enum(['active', 'suspended', 'deregistered']);
export type AgentStatus = z.infer<typeof AgentStatusSchema>;

export const VerificationResultEnumSchema = z.enum([
  'approved',
  'rejected',
  'partial',
  'disputed',
]);
export type VerificationResultEnum = z.infer<typeof VerificationResultEnumSchema>;
