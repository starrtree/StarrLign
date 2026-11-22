import { createHash, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';

// Server-to-server authentication only. Never expose via NEXT_PUBLIC_*.
export function requireXLockBridge(request: Request): NextResponse | null {
  const expected = process.env.STARRLIGN_XLOCK_BRIDGE_KEY;

  if (!expected || expected.length < 32) {
    return NextResponse.json(
      { success: false, error: 'Task bridge is not configured' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const header = request.headers.get('authorization') || '';
  const candidate = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  // Hash to constant-length buffers before timing-safe equality.
  const actualHash = createHash('sha256').update(candidate).digest();
  const expectedHash = createHash('sha256').update(expected).digest();

  if (!candidate || !timingSafeEqual(actualHash, expectedHash)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  return null;
}
