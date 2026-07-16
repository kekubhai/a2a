import { NextRequest, NextResponse } from 'next/server';
import { getTaskById } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const task = await getTaskById(id);
    return NextResponse.json({ task });
  } catch (err) {
    console.error('[api/tasks/:id] GET error:', err);
    return NextResponse.json({ error: 'Failed to load task' }, { status: 500 });
  }
}
