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
  uiOpen: ['ui-open', 'open', 'modal-open', 'button-open', 'pop'],
  uiClose: ['ui-close', 'close', 'modal-close', 'button-close', 'tap'],
  moneyAdd: ['money-add', 'money_add', 'add-money', 'cashchaching', 'chaching', 'money'],
  moneyDelete: ['money-delete', 'money_delete', 'delete-money', 'delete', 'trash'],
  achievement: ['achievement', 'achievement-shine', 'shine', 'project-complete', 'sparkle'],
};

const SOUND_FILES: Record<AppSound, string[]> = Object.fromEntries(
  Object.entries(SOUND_BASE_NAMES).map(([sound, names]) => {
    const candidates = names.flatMap((name) => EXTENSIONS.flatMap((ext) => [
      `/sounds/${name}.${ext}`,
      `/api/sounds/${name}.${ext}`,
    ]));
    return [sound, Array.from(new Set(candidates))];
  })
) as Record<AppSound, string[]>;

let audioUnlocked = false;
let unlockAttached = false;

function getVolume(sound: AppSound) {
  if (sound === 'projectComplete' || sound === 'cardComplete' || sound === 'achievement') return 0.78;
  if (sound === 'uiOpen' || sound === 'uiClose') return 0.64;
  if (sound === 'moneyDelete' || sound === 'taskSwipe') return 0.66;
  return DEFAULT_VOLUME;
}

function warnSoundFailure(sound: AppSound, candidates: string[]) {
  if (typeof window === 'undefined') return;
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
}

export function installAudioUnlock() {
  if (typeof window === 'undefined' || unlockAttached) return;
  unlockAttached = true;

  const unlock = () => unlockAudio();
  window.addEventListener('pointerdown', unlock, { once: true, passive: true });
  window.addEventListener('touchstart', unlock, { once: true, passive: true });
  window.addEventListener('keydown', unlock, { once: true });
}

export function playAppSound(sound: AppSound, enabled: boolean) {
  if (!enabled || typeof window === 'undefined') return;

  const candidates = SOUND_FILES[sound] || [];
  if (candidates.length === 0) return;

  unlockAudio();

  let candidateIndex = 0;
  const audio = new Audio();
  audio.preload = 'auto';
  audio.volume = getVolume(sound);

  const tryPlay = () => {
    const src = candidates[candidateIndex];
    if (!src) {
      warnSoundFailure(sound, candidates);
      return;
    }

    audio.src = src;
    void audio.play().catch(() => {
      candidateIndex += 1;
      tryPlay();
    });
  };

  audio.onerror = () => {
    candidateIndex += 1;
    tryPlay();
  };

  tryPlay();
}

export function vibrateDevice(pattern: number | number[]) {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  navigator.vibrate(pattern);
}
