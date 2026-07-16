import { NextResponse } from 'next/server';
import { getAgents } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const agents = await getAgents();
    return NextResponse.json({ agents });
  } catch (err) {
    console.error('[api/agents] GET error:', err);
    return NextResponse.json({ error: 'Failed to load agents' }, { status: 500 });
  }
}
