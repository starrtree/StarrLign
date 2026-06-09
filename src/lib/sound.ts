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

const SOUND_FILES: Record<AppSound, string[]> = {
  taskComplete: ['/sounds/task-complete.mp3', '/api/sounds/task-complete.mp3', '/api/sounds/task complete.mp3'],
  subtaskToggle: ['/sounds/subtask-toggle.mp3', '/api/sounds/subtask-toggle.mp3', '/api/sounds/subtask toggle.mp3'],
  subtaskComplete: ['/sounds/subtask-complete.mp3', '/api/sounds/subtask-complete.mp3', '/api/sounds/subtask complete.mp3'],
  projectComplete: ['/sounds/project-complete.mp3', '/api/sounds/project-complete.mp3', '/api/sounds/project complete.mp3'],
  cardComplete: [
    '/sounds/cashchaching.mp3',
    '/api/sounds/cashchaching.mp3',
    '/api/sounds/caching.mp3',
    '/api/sounds/chaching.mp3',
    '/api/sounds/cash-chaching.mp3',
  ],
  taskSwipe: ['/sounds/task-swipe-whoosh.mp3', '/api/sounds/task-swipe-whoosh.mp3', '/api/sounds/task swipe whoosh.mp3'],
  uiOpen: ['/sounds/ui-open-pop.mp3', '/api/sounds/ui-open-pop.mp3', '/api/sounds/open.mp3'],
  uiClose: ['/sounds/ui-close-tap.mp3', '/api/sounds/ui-close-tap.mp3', '/api/sounds/close.mp3'],
  moneyAdd: ['/sounds/money-add-chime.mp3', '/api/sounds/money-add-chime.mp3', '/api/sounds/money add chime.mp3'],
  moneyDelete: ['/sounds/money-delete-soft.mp3', '/api/sounds/money-delete-soft.mp3', '/api/sounds/money delete soft.mp3'],
  achievement: ['/sounds/achievement-shine.mp3', '/api/sounds/achievement-shine.mp3', '/api/sounds/achievement shine.mp3'],
};

function getVolume(sound: AppSound) {
  if (sound === 'projectComplete' || sound === 'cardComplete' || sound === 'achievement') return 0.74;
  if (sound === 'uiOpen' || sound === 'uiClose') return 0.58;
  if (sound === 'moneyDelete' || sound === 'taskSwipe') return 0.62;
  return DEFAULT_VOLUME;
}

function warnSoundFailure(sound: AppSound, candidates: string[]) {
  if (process.env.NODE_ENV === 'production') return;
  console.warn(`[StarrLign sound] Could not play "${sound}". Tried: ${candidates.join(', ')}`);
}

export function playAppSound(sound: AppSound, enabled: boolean) {
  if (!enabled || typeof window === 'undefined') return;

  const candidates = SOUND_FILES[sound] || [];
  if (candidates.length === 0) return;

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
