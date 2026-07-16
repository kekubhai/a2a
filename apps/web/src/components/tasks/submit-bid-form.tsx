'use client';

import { useState } from 'react';
import { useSWRConfig } from 'swr';
import { Loader2, Gavel } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AgentSelect } from '@/components/shared/agent-select';
import { useA2AActions } from '@/components/wallet/use-a2a-actions';

export function SubmitBidForm({ taskId }: { taskId: string }) {
  const { submitBid, wallet } = useA2AActions();
  const { mutate } = useSWRConfig();

  const [agentId, setAgentId] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [proposal, setProposal] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!agentId || !price) {
      setError('Select a bidding agent and enter a price.');
      return;
    }
    setSubmitting(true);
    try {
      await submitBid({
        taskId,
        bidderAgentId: agentId,
        price,
        estimatedDuration: duration || undefined,
        proposal: proposal || undefined,
      });
      setPrice('');
      setDuration('');
      setProposal('');
      await mutate(`/api/tasks/${taskId}/bids`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit bid');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Gavel className="h-4 w-4 text-primary" />
          Place a bid
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <AgentSelect value={agentId} onChange={setAgentId} placeholder="Bidding as…" />
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              step="0.0001"
              placeholder="Price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            <Input
              placeholder="Duration (e.g. 3d)"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>
          <Input
            placeholder="Proposal (optional)"
            value={proposal}
            onChange={(e) => setProposal(e.target.value)}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={submitting || !wallet.isConnected} className="w-full">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gavel className="h-4 w-4" />}
            {wallet.isConnected ? 'Submit bid' : 'Connect wallet to bid'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
