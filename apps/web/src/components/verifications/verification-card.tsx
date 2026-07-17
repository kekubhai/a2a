'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, ChevronDown, CheckCircle2, XCircle, FileSignature, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { VerificationResultBadge } from '@/components/shared/status-badge';
import { AgentIdentity } from '@/components/shared/agent-identity';
import type { VerificationDTO } from '@/lib/types';
import { cn, relativeTime, shortenAddress } from '@/lib/utils';

interface Check {
  name: string;
  passed?: boolean;
  score?: number;
}

/** Extract the individual checks/criteria the verifier ran from attestation data. */
function extractChecks(data: Record<string, unknown>): Check[] {
  const checks: Check[] = [];
  if (Array.isArray(data.checks)) {
    for (const c of data.checks as Record<string, unknown>[]) {
      checks.push({ name: String(c.name), passed: Boolean(c.passed) });
    }
  }
  if (Array.isArray(data.criteria)) {
    for (const c of data.criteria as Record<string, unknown>[]) {
      checks.push({ name: String(c.name), score: Number(c.score) });
    }
  }
  return checks;
}

export function VerificationCard({
  verification,
  showTask = false,
}: {
  verification: VerificationDTO;
  showTask?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const data = verification.attestationData ?? {};
  const checks = extractChecks(data);
  const runner = (data.runner as string | undefined) ?? verification.signatureAlgorithm ?? 'Verifier';
  const reasoning = data.reasoning as string | undefined;
  const passed = (data.passed as number | undefined) ?? checks.filter((c) => c.passed).length;
  const total = (data.total as number | undefined) ?? checks.length;

  return (
    <Card className="border-border">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <VerificationResultBadge result={verification.result} />
                {verification.confidence && (
                  <span className="text-xs text-muted-foreground">
                    confidence {verification.confidence}
                  </span>
                )}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {runner} · {relativeTime(verification.verifiedAt)}
              </div>
            </div>
          </div>
          {verification.verifier && (
            <AgentIdentity
              id={verification.verifier.id}
              name={verification.verifier.name}
              address={verification.verifier.chainAddress}
              avatar={verification.verifier.avatar}
            />
          )}
        </div>

        {showTask && verification.task && (
          <Link
            href={`/tasks/${verification.task.id}`}
            className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            {verification.task.title}
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}

        {/* What the verifier checked — the differentiator, visible by default. */}
        {checks.length > 0 && (
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="uppercase tracking-wide">Checks</span>
              {total > 0 && (
                <span>
                  {passed}/{total} passed
                </span>
              )}
            </div>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {checks.map((check) => (
                <div
                  key={check.name}
                  className="flex items-center justify-between rounded-md border border-border bg-secondary/30 px-2.5 py-1.5 text-sm"
                >
                  <span className="flex items-center gap-1.5">
                    {check.passed === false ? (
                      <XCircle className="h-3.5 w-3.5 text-destructive" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    )}
                    {check.name}
                  </span>
                  {typeof check.score === 'number' && (
                    <span className="mono text-xs text-muted-foreground">
                      {(check.score * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {reasoning && (
          <p className="mt-3 rounded-md border border-border bg-secondary/30 p-3 text-sm text-muted-foreground">
            {reasoning}
          </p>
        )}

        {verification.disputeReason && (
          <p className="mt-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            Dispute: {verification.disputeReason}
          </p>
        )}

        {/* Attestation / signature detail — collapsible for auditors. */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="mt-3 flex w-full items-center justify-between text-xs text-muted-foreground hover:text-foreground"
        >
          <span className="flex items-center gap-1.5">
            <FileSignature className="h-3.5 w-3.5" />
            Attestation
          </span>
          <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
        </button>
        {open && (
          <div className="mt-2 space-y-1.5 rounded-md border border-border bg-background/50 p-3 text-xs">
            <DetailRow label="Attestation hash" value={verification.attestationHash} mono />
            {verification.signature && (
              <DetailRow label="Signature" value={shortenAddress(verification.signature, 10)} mono />
            )}
            {verification.signatureAlgorithm && (
              <DetailRow label="Algorithm" value={verification.signatureAlgorithm} />
            )}
            {verification.chainTxRef && (
              <DetailRow label="Tx" value={verification.chainTxRef} mono />
            )}
            {verification.chainId && <DetailRow label="Chain" value={verification.chainId} />}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('break-all text-right', mono && 'mono')}>{value}</span>
    </div>
  );
}
