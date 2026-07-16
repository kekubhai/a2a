'use client';

import { useState } from 'react';
import { useSWRConfig } from 'swr';
import { Plus, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { AgentSelect } from '@/components/shared/agent-select';
import { useA2AActions } from '@/components/wallet/use-a2a-actions';
import type { ChainType } from '@a2a/shared-types';

export function PostTaskDialog() {
  const { postTask, wallet } = useA2AActions();
  const { mutate } = useSWRConfig();
  const [open, setOpen] = useState(false);

  const [buyerAgentId, setBuyerAgentId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [bountyAmount, setBountyAmount] = useState('');
  const [bountyToken, setBountyToken] = useState('ETH');
  const [criteria, setCriteria] = useState('');
  const [verificationType, setVerificationType] = useState('code');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chainType: ChainType = wallet.chainType ?? 'evm';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!buyerAgentId || !title || !bountyAmount || !criteria) {
      setError('Buyer, title, bounty and acceptance criteria are required.');
      return;
    }
    setSubmitting(true);
    try {
      await postTask({
        buyerAgentId,
        title,
        description,
        bountyAmount,
        bountyToken,
        acceptanceCriteriaHash: criteria,
        requirements: { verificationType },
      });
      setOpen(false);
      setTitle('');
      setDescription('');
      setBountyAmount('');
      setCriteria('');
      await mutate((key) => typeof key === 'string' && key.startsWith('/api/tasks'), undefined, {
        revalidate: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post task');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={!wallet.isConnected} title={wallet.isConnected ? '' : 'Connect a wallet'}>
          <Plus className="h-4 w-4" />
          Post task
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Post a new task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <AgentSelect
            value={buyerAgentId}
            onChange={setBuyerAgentId}
            placeholder="Buyer agent…"
            chainTypeFilter={chainType}
          />
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              step="0.0001"
              placeholder="Bounty amount"
              value={bountyAmount}
              onChange={(e) => setBountyAmount(e.target.value)}
            />
            <Input
              placeholder="Token"
              value={bountyToken}
              onChange={(e) => setBountyToken(e.target.value)}
            />
          </div>
          <Input
            placeholder="Acceptance criteria hash (IPFS / content hash)"
            value={criteria}
            onChange={(e) => setCriteria(e.target.value)}
          />
          <Select value={verificationType} onChange={(e) => setVerificationType(e.target.value)}>
            <option value="code">Verification: code</option>
            <option value="semantic">Verification: semantic</option>
            <option value="image">Verification: image</option>
          </Select>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <p className="text-xs text-muted-foreground">
            Posting as <span className="uppercase">{chainType}</span> · signed by{' '}
            <span className="mono">{wallet.address ? wallet.address.slice(0, 10) : '—'}…</span>
          </p>
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Post task
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
