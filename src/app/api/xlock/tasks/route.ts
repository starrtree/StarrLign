import { NextRequest, NextResponse } from 'next/server';
import { requireXLockBridge } from '@/lib/xlock-bridge-auth';
import { listXLockTaskFeed } from '@/lib/xlock-task-feed';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rejected = requireXLockBridge(request);
  if (rejected) return rejected;

  try {
    const rawLimit = Number(request.nextUrl.searchParams.get('limit') || 8);
    const feed = await listXLockTaskFeed(Number.isFinite(rawLimit) ? rawLimit : 8);
    return NextResponse.json(
      { success: true, ...feed },
      { headers: { 'Cache-Control': 'private, no-store, max-age=0' } }
    );
  } catch (error) {
    console.error('XLock task feed failed:', error);
    return NextResponse.json(
      { success: false, error: 'Task feed unavailable' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    { success: false, error: 'Read-only endpoint' },
    { status: 405, headers: { Allow: 'GET' } }
  );
}
