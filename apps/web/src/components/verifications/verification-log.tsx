'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { fetcher, type VerificationsResponse } from '@/lib/api';
import type { VerificationDTO } from '@/lib/types';
import { Select } from '@/components/ui/select';
import { LiveDot } from '@/components/shared/live-dot';
import { VerificationCard } from './verification-card';

const RESULTS = ['all', 'approved', 'partial', 'rejected', 'disputed'];

export function VerificationLog({ initial }: { initial: VerificationDTO[] }) {
  const [result, setResult] = useState('all');

  const query = useMemo(() => (result !== 'all' ? `?result=${result}` : ''), [result]);

  const { data } = useSWR<VerificationsResponse>(`/api/verifications${query}`, fetcher, {
    fallbackData: { verifications: initial },
    refreshInterval: 5000,
    keepPreviousData: true,
  });

  const verifications = data?.verifications ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Attestation log</h2>
          <LiveDot />
        </div>
        <Select value={result} onChange={(e) => setResult(e.target.value)} className="w-40">
          {RESULTS.map((r) => (
            <option key={r} value={r}>
              {r === 'all' ? 'All results' : r}
            </option>
          ))}
        </Select>
      </div>

      {verifications.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center text-muted-foreground">
          No verifications yet.
        </div>
      ) : (
        <div className="space-y-3">
          {verifications.map((v) => (
            <VerificationCard key={v.id} verification={v} showTask />
          ))}
        </div>
      )}
    </div>
  );
}
