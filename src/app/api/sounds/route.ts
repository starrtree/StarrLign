import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

const AUDIO_EXTENSIONS = new Set(['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.webm']);

async function listAudioFiles(root: string, publicPrefix: string) {
  try {
    const entries = await fs.readdir(root, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((name) => AUDIO_EXTENSIONS.has(path.extname(name).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
      .map((name) => ({ name, url: `${publicPrefix}/${encodeURIComponent(name)}` }));
  } catch {
    return [];
  }
}

export async function GET() {
  const publicSounds = await listAudioFiles(path.join(process.cwd(), 'public', 'sounds'), '/sounds');
  const rootSounds = await listAudioFiles(path.join(process.cwd(), 'sounds'), '/api/sounds');
  return NextResponse.json({ sounds: [...publicSounds, ...rootSounds] });
}
