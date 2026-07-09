export type AppSound =
  | 'taskComplete'
  | 'subtaskToggle'
  | 'subtaskComplete'
  | 'projectComplete'
  | 'cardComplete'
  | 'taskSwipe'
  | 'uiOpen'
  | 'uiClose'
  | 'moneyAdd'
  | 'moneyDelete'
  | 'achievement';

const DEFAULT_VOLUME = 0.68;
const EXTENSIONS = ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'webm'];

const SOUND_BASE_NAMES: Record<AppSound, string[]> = {
  taskComplete: ['task-complete', 'task_complete', 'task-completed', 'complete-task', 'complete', 'success'],
  subtaskToggle: ['subtask-toggle', 'subtask_toggle', 'check-subtask', 'button-click', 'click', 'tap'],
  subtaskComplete: ['subtask-complete', 'subtask_complete', 'subtask-completed', 'check-subtask', 'check', 'success'],
  projectComplete: ['project-complete', 'project_complete', 'project-completed', 'achievement', 'success', 'shine'],
  cardComplete: ['cashchaching', 'cash-chaching', 'chaching', 'caching', 'money-complete', 'money'],
  taskSwipe: ['task-swipe', 'task-swipe-whoosh', 'swipe', 'whoosh', 'swoosh'],
  uiOpen: ['ui-open', 'open', 'modal-open', 'button-open', 'button-click', 'click', 'tap', 'pop'],
  uiClose: ['ui-close', 'close', 'modal-close', 'button-close', 'button-click', 'click', 'tap'],
  moneyAdd: ['money-add', 'money_add', 'add-money', 'cashchaching', 'chaching', 'money'],
  moneyDelete: ['money-delete', 'money_delete', 'delete-money', 'delete', 'trash'],
  achievement: ['achievement', 'achievement-shine', 'shine', 'project-complete', 'sparkle'],
};

const FALLBACK_SOUND_FILES: Record<AppSound, string[]> = Object.fromEntries(
  Object.entries(SOUND_BASE_NAMES).map(([sound, names]) => {
    const candidates = names.flatMap((name) => EXTENSIONS.flatMap((ext) => [`/sounds/${name}.${ext}`, `/api/sounds/${name}.${ext}`]));
    return [sound, Array.from(new Set(candidates))];
  })
) as Record<AppSound, string[]>;

let audioUnlocked = false;
let unlockAttached = false;
let buttonSoundsAttached = false;
let manifestLoading: Promise<void> | null = null;
let manifestLoaded = false;
let resolvedSoundFiles: Partial<Record<AppSound, string>> = {};
const audioCache = new Map<string, HTMLAudioElement>();

type SoundManifestItem = { name: string; url: string };

function getVolume(sound: AppSound) {
  if (sound === 'projectComplete' || sound === 'cardComplete' || sound === 'achievement') return 0.78;
  if (sound === 'uiOpen' || sound === 'uiClose') return 0.64;
  if (sound === 'moneyDelete' || sound === 'taskSwipe') return 0.66;
  return DEFAULT_VOLUME;
}

function normalizeName(name: string) {
  return name.toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]+/g, '-');
}

function rankManifestMatch(sound: AppSound, item: SoundManifestItem) {
  const normalized = normalizeName(item.name);
  const hints = SOUND_BASE_NAMES[sound].map(normalizeName);
  const exactIndex = hints.findIndex((hint) => normalized === hint);
  if (exactIndex !== -1) return 1000 - exactIndex;
  const includesIndex = hints.findIndex((hint) => normalized.includes(hint) || hint.includes(normalized));
  if (includesIndex !== -1) return 500 - includesIndex;
  return 0;
}

async function loadSoundManifest() {
  if (typeof window === 'undefined' || manifestLoaded) return;
  if (manifestLoading) return manifestLoading;

  manifestLoading = fetch('/api/sounds', { cache: 'no-store' })
    .then((response) => response.json())
    .then((data) => {
      const sounds = Array.isArray(data.sounds) ? (data.sounds as SoundManifestItem[]) : [];
      const nextResolved: Partial<Record<AppSound, string>> = {};

      (Object.keys(SOUND_BASE_NAMES) as AppSound[]).forEach((sound) => {
        const best = sounds
          .map((item) => ({ item, score: rankManifestMatch(sound, item) }))
          .filter((match) => match.score > 0)
          .sort((a, b) => b.score - a.score)[0];
        if (best) nextResolved[sound] = best.item.url;
      });

      resolvedSoundFiles = nextResolved;
      manifestLoaded = true;
      preloadAppSounds();
    })
    .catch(() => {
      manifestLoaded = true;
    });

  return manifestLoading;
}

function getCandidates(sound: AppSound) {
  return Array.from(new Set([resolvedSoundFiles[sound], ...(FALLBACK_SOUND_FILES[sound] || [])].filter(Boolean) as string[]));
}

function getCachedAudio(src: string, sound: AppSound) {
  const cached = audioCache.get(src);
  if (cached) return cached.cloneNode(true) as HTMLAudioElement;

  const audio = new Audio(src);
  audio.preload = 'auto';
  audio.volume = getVolume(sound);
  audio.load();
  audioCache.set(src, audio);
  return audio.cloneNode(true) as HTMLAudioElement;
}

function warnSoundFailure(sound: AppSound, candidates: string[]) {
  if (typeof window === 'undefined' || process.env.NODE_ENV === 'production') return;
  console.warn(`[StarrLign sound] Could not play "${sound}". Tried: ${candidates.join(', ')}`);
}

function unlockAudio() {
  if (audioUnlocked || typeof window === 'undefined') return;
  audioUnlocked = true;

  const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQQAAAAAAA==');
  silentAudio.volume = 0;
  void silentAudio.play().then(() => {
    silentAudio.pause();
    silentAudio.currentTime = 0;
  }).catch(() => undefined);

  void loadSoundManifest();
  preloadAppSounds();
}

export function preloadAppSounds() {
  if (typeof window === 'undefined') return;
  (Object.keys(SOUND_BASE_NAMES) as AppSound[]).forEach((sound) => {
    const src = getCandidates(sound)[0];
    if (!src || audioCache.has(src)) return;
    const audio = new Audio(src);
    audio.preload = 'auto';
    audio.volume = getVolume(sound);
    audio.load();
    audioCache.set(src, audio);
  });
}

export function installAudioUnlock() {
  if (typeof window === 'undefined' || unlockAttached) return;
  unlockAttached = true;

  void loadSoundManifest();
  const unlock = () => unlockAudio();
  window.addEventListener('pointerdown', unlock, { once: true, passive: true });
  window.addEventListener('touchstart', unlock, { once: true, passive: true });
  window.addEventListener('keydown', unlock, { once: true });
}

export function installButtonSoundEffects(getEnabled: () => boolean) {
  if (typeof window === 'undefined' || buttonSoundsAttached) return;
  buttonSoundsAttached = true;

  window.addEventListener(
    'pointerdown',
    (event) => {
      if (!getEnabled()) return;
      const target = event.target as HTMLElement | null;
      const interactive = target?.closest('button, a, [role="button"]') as HTMLElement | null;
      if (!interactive || interactive.dataset.sound === 'off') return;

      const text = (interactive.textContent || interactive.getAttribute('aria-label') || interactive.getAttribute('title') || '').toLowerCase();
      if (text.includes('done') || text.includes('complete')) return;
      if (text.includes('delete') || text.includes('trash') || text.includes('close') || text.includes('cancel')) {
        playAppSound('uiClose', true);
        return;
      }
      playAppSound('uiOpen', true);
    },
    { capture: true, passive: true }
  );
}

export function playAppSound(sound: AppSound, enabled: boolean) {
  if (!enabled || typeof window === 'undefined') return;

  unlockAudio();

  const candidates = getCandidates(sound);
  if (candidates.length === 0) return;

  let candidateIndex = 0;

  const tryPlay = () => {
    const src = candidates[candidateIndex];
    if (!src) {
      warnSoundFailure(sound, candidates);
      return;
    }

    const audio = getCachedAudio(src, sound);
    audio.volume = getVolume(sound);
    audio.currentTime = 0;
    void audio.play().catch(() => {
      audioCache.delete(src);
      candidateIndex += 1;
      tryPlay();
    });
  };

  tryPlay();
}

export function vibrateDevice(pattern: number | number[]) {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  navigator.vibrate(pattern);
}
