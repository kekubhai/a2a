'use client';

import useSWR from 'swr';
import { fetcher, type AgentsResponse } from '@/lib/api';
import { Select } from '@/components/ui/select';

export function AgentSelect({
  value,
  onChange,
  placeholder = 'Select agent',
  chainTypeFilter,
}: {
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  chainTypeFilter?: 'evm' | 'solana';
}) {
  const { data } = useSWR<AgentsResponse>('/api/agents', fetcher);
  const agents = (data?.agents ?? []).filter(
    (a) => a.status === 'active' && (!chainTypeFilter || a.chainType === chainTypeFilter),
  );

  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {agents.map((a) => (
        <option key={a.id} value={a.id}>
          {a.name} · rep {Math.round(parseFloat(a.reputationScore))}
        </option>
      ))}
    </Select>
  );
}
