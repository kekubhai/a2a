import { NextRequest, NextResponse } from 'next/server';
import { db, tasks } from '@a2a/db';
import { getTaskFeed } from '@/lib/queries';
import type { ChainType, TaskStatus } from '@a2a/shared-types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const status = (searchParams.get('status') as TaskStatus | 'all') || 'all';
  const chainType = (searchParams.get('chainType') as ChainType | 'all') || 'all';
  const verificationType = searchParams.get('verificationType') || 'all';
  const minBountyRaw = searchParams.get('minBounty');
  const minBounty = minBountyRaw ? parseFloat(minBountyRaw) : undefined;

  try {
    const feed = await getTaskFeed({ status, chainType, verificationType, minBounty });
    return NextResponse.json({ tasks: feed });
  } catch (err) {
    console.error('[api/tasks] GET error:', err);
    return NextResponse.json({ error: 'Failed to load tasks' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      buyerAgentId,
      title,
      description,
      bountyAmount,
      bountyToken,
      acceptanceCriteriaHash,
      deadline,
      requirements,
      chainType,
    } = body;

    if (!buyerAgentId || !title || !bountyAmount || !acceptanceCriteriaHash) {
      return NextResponse.json(
        { error: 'buyerAgentId, title, bountyAmount and acceptanceCriteriaHash are required' },
        { status: 400 },
      );
    }

    const chainId = chainType === 'solana' ? 'solana:devnet' : 'evm:43113';

    const [created] = await db
      .insert(tasks)
      .values({
        buyerAgentId,
        chainId,
        chainType: (chainType as ChainType) ?? 'evm',
        title,
        description: description ?? null,
        bountyAmount: String(bountyAmount),
        bountyToken: bountyToken ?? 'ETH',
        acceptanceCriteriaHash,
        requirements: requirements ?? {},
        deadline: deadline ? new Date(deadline) : null,
        status: 'open',
      })
      .returning({ id: tasks.id });

    return NextResponse.json({ task: created }, { status: 201 });
  } catch (err) {
    console.error('[api/tasks] POST error:', err);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
