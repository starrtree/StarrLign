import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

const MIME_TYPES: Record<string, string> = {
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.ogg': 'audio/ogg',
  '.webm': 'audio/webm',
};

function safeJoin(base: string, segments: string[]) {
  const root = path.resolve(base);
  const target = path.resolve(root, ...segments);
  if (!target.startsWith(root)) return null;
  return target;
}

export async function GET(_request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  const requestedPath = params.path || [];

  const roots = [
    path.join(process.cwd(), 'public', 'sounds'),
    path.join(process.cwd(), 'sounds'),
  ];

  for (const root of roots) {
    const filePath = safeJoin(root, requestedPath);
    if (!filePath) continue;

    try {
      const file = await fs.readFile(filePath);
      const ext = path.extname(filePath).toLowerCase();
      return new NextResponse(file, {
        headers: {
          'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    } catch {
      // Try next possible folder/root.
    }
  }

  return NextResponse.json({ error: 'Sound file not found', path: requestedPath.join('/') }, { status: 404 });
}
