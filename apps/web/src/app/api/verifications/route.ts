import { NextRequest, NextResponse } from 'next/server';
import { getVerificationLog } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const result = req.nextUrl.searchParams.get('result') || 'all';
  try {
    const verifications = await getVerificationLog({ result });
    return NextResponse.json({ verifications });
  } catch (err) {
    console.error('[api/verifications] GET error:', err);
    return NextResponse.json({ error: 'Failed to load verifications' }, { status: 500 });
  }
}
