import { NextRequest, NextResponse } from 'next/server';
import { isBidWindowOpen, getBidWindowTTL } from '@a2a/redis';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: taskId } = await params;
  try {
    const [open, ttl] = await Promise.all([isBidWindowOpen(taskId), getBidWindowTTL(taskId)]);
    return NextResponse.json({ taskId, open, ttl });
  } catch (err) {
    // Redis may be unavailable in some environments; degrade gracefully.
    console.error('[api/tasks/:id/bid-window] GET error:', err);
    return NextResponse.json({ taskId, open: false, ttl: 0 });
  }
}
