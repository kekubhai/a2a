import { NextRequest, NextResponse } from 'next/server';
import { db, bids } from '@a2a/db';
import { getBidsForTask } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const list = await getBidsForTask(id);
    return NextResponse.json({ bids: list });
  } catch (err) {
    console.error('[api/tasks/:id/bids] GET error:', err);
    return NextResponse.json({ error: 'Failed to load bids' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: taskId } = await params;
  try {
    const body = await req.json();
    const { bidderAgentId, price, proposal, estimatedDuration } = body;

    if (!bidderAgentId || !price) {
      return NextResponse.json(
        { error: 'bidderAgentId and price are required' },
        { status: 400 },
      );
    }

    const [created] = await db
      .insert(bids)
      .values({
        taskId,
        bidderAgentId,
        price: String(price),
        proposal: proposal ?? null,
        estimatedDuration: estimatedDuration ?? null,
        status: 'pending',
      })
      .returning({ id: bids.id });

    return NextResponse.json({ bid: created }, { status: 201 });
  } catch (err) {
    console.error('[api/tasks/:id/bids] POST error:', err);
    return NextResponse.json({ error: 'Failed to submit bid' }, { status: 500 });
  }
}
