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

const AUDIO_EXTENSIONS = new Set(Object.keys(MIME_TYPES));

const SOUND_HINTS: Record<string, string[]> = {
  introLoading: ['intro-loading', 'intro_loading', 'loading-intro', 'loading_intro', 'intro-load', 'intro', 'loading', 'loadup', 'load-up', 'startup', 'starrlign-loading', 'starrlign-intro'],
  buttonClick: ['button-click', 'button_click', 'click', 'tap', 'press', 'select'],
  taskComplete: ['task-complete', 'task_complete', 'task-completed', 'complete-task', 'complete', 'success', 'done'],
  taskSwipe: ['task-swipe', 'task-swipe-whoosh', 'swipe', 'whoosh', 'swoosh'],
  undo: ['undo', 'restore', 'back', 'reverse', 'rewind'],
};

function normalizeName(name: string) {
  return name.toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]+/g, '-');
}

function scoreFile(sound: string, filename: string) {
  const normalized = normalizeName(filename);
  const hints = SOUND_HINTS[sound] || [sound];
  const normalizedHints = hints.map(normalizeName);
  const exactIndex = normalizedHints.findIndex((hint) => normalized === hint);
  if (exactIndex !== -1) return 1000 - exactIndex;
  const startsIndex = normalizedHints.findIndex((hint) => normalized.startsWith(hint) || hint.startsWith(normalized));
  if (startsIndex !== -1) return 720 - startsIndex;
  const includesIndex = normalizedHints.findIndex((hint) => normalized.includes(hint) || hint.includes(normalized));
  if (includesIndex !== -1) return 500 - includesIndex;
  return 0;
}

async function findBestSound(sound: string) {
  const roots = [path.join(process.cwd(), 'public', 'sounds'), path.join(process.cwd(), 'sounds')];

  for (const root of roots) {
    try {
      const entries = await fs.readdir(root, { withFileTypes: true });
      const matches = entries
        .filter((entry) => entry.isFile())
        .map((entry) => entry.name)
        .filter((name) => AUDIO_EXTENSIONS.has(path.extname(name).toLowerCase()))
        .map((name) => ({ name, score: scoreFile(sound, name), filePath: path.join(root, name) }))
        .filter((match) => match.score > 0)
        .sort((a, b) => b.score - a.score);

      if (matches[0]) return matches[0].filePath;
    } catch {
      // Try the next possible sound folder.
    }
  }

  return null;
}

export async function GET(_request: NextRequest, context: { params: Promise<{ sound: string }> }) {
  const params = await context.params;
  const filePath = await findBestSound(params.sound);

  if (!filePath) {
    return NextResponse.json({ error: 'Named sound not found', sound: params.sound }, { status: 404 });
  }

  const file = await fs.readFile(filePath);
  const ext = path.extname(filePath).toLowerCase();
  return new NextResponse(file, {
    headers: {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
