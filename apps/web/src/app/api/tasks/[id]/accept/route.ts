import { NextRequest, NextResponse } from 'next/server';
import { db, bids, tasks } from '@a2a/db';
import { eq, and, ne } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: taskId } = await params;
  try {
    const body = await req.json();
    const { bidId } = body;
    if (!bidId) {
      return NextResponse.json({ error: 'bidId is required' }, { status: 400 });
    }

    const [bid] = await db.select().from(bids).where(eq(bids.id, bidId)).limit(1);
    if (!bid || bid.taskId !== taskId) {
      return NextResponse.json({ error: 'Bid not found for this task' }, { status: 404 });
    }

    const now = new Date();

    await db
      .update(bids)
      .set({ status: 'accepted', acceptedAt: now, updatedAt: now })
      .where(eq(bids.id, bidId));

    // Reject all other pending bids on the task.
    await db
      .update(bids)
      .set({ status: 'rejected', rejectedAt: now, updatedAt: now })
      .where(and(eq(bids.taskId, taskId), ne(bids.id, bidId), eq(bids.status, 'pending')));

    await db
      .update(tasks)
      .set({ status: 'assigned', assignedAgentId: bid.bidderAgentId, updatedAt: now })
      .where(eq(tasks.id, taskId));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/tasks/:id/accept] POST error:', err);
    return NextResponse.json({ error: 'Failed to accept bid' }, { status: 500 });
  }
}
