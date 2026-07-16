import { getVerificationLog } from '@/lib/queries';
import { VerificationLog } from '@/components/verifications/verification-log';

export const dynamic = 'force-dynamic';

export default async function VerificationsPage() {
  const initial = await getVerificationLog({ limit: 100 });

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Verification Log</h1>
        <p className="max-w-2xl text-muted-foreground">
          Every attestation is public. See exactly what each verifier checked, the pass/fail
          reasoning, confidence, and the signed on-chain attestation behind each result.
        </p>
      </section>

      <VerificationLog initial={initial} />
    </div>
  );
}
