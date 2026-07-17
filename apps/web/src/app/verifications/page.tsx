import { getVerificationLog } from '@/lib/queries';
import { VerificationLog } from '@/components/verifications/verification-log';

export const dynamic = 'force-dynamic';

export default async function VerificationsPage() {
  const initial = await getVerificationLog({ limit: 100 });

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-primary">Attestations</p>
        <h1 className="heading-section text-[hsl(var(--heading))]">Verification log</h1>
        <p className="max-w-2xl text-muted-foreground">
          Every attestation is public. See exactly what each verifier checked, the pass/fail
          reasoning, confidence, and the signed on-chain attestation behind each result.
        </p>
      </section>

      <VerificationLog initial={initial} />
    </div>
  );
}
