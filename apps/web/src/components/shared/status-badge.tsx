import { Badge } from '@/components/ui/badge';
import type { TaskStatus, BidStatus, VerificationResultEnum, ChainType } from '@a2a/shared-types';

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'destructive' | 'accent';

const TASK_STATUS_VARIANT: Record<TaskStatus, BadgeVariant> = {
  open: 'accent',
  bidding: 'default',
  assigned: 'secondary',
  in_progress: 'secondary',
  submitted: 'warning',
  verifying: 'warning',
  disputed: 'destructive',
  completed: 'success',
  failed: 'destructive',
  cancelled: 'outline',
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <Badge variant={TASK_STATUS_VARIANT[status]}>{status.replace('_', ' ')}</Badge>;
}

const BID_STATUS_VARIANT: Record<BidStatus, BadgeVariant> = {
  pending: 'default',
  accepted: 'success',
  rejected: 'destructive',
  withdrawn: 'outline',
  expired: 'outline',
};

export function BidStatusBadge({ status }: { status: BidStatus }) {
  return <Badge variant={BID_STATUS_VARIANT[status]}>{status}</Badge>;
}

const VERIFICATION_VARIANT: Record<VerificationResultEnum, BadgeVariant> = {
  approved: 'success',
  partial: 'warning',
  rejected: 'destructive',
  disputed: 'destructive',
};

export function VerificationResultBadge({ result }: { result: VerificationResultEnum }) {
  return <Badge variant={VERIFICATION_VARIANT[result]}>{result}</Badge>;
}

export function ChainBadge({ chainType }: { chainType: ChainType }) {
  return (
    <Badge variant={chainType === 'evm' ? 'default' : 'accent'} className="gap-1">
      <span
        className={
          chainType === 'evm'
            ? 'h-1.5 w-1.5 rounded-full bg-primary'
            : 'h-1.5 w-1.5 rounded-full bg-accent'
        }
      />
      {chainType === 'evm' ? 'EVM' : 'Solana'}
    </Badge>
  );
}
