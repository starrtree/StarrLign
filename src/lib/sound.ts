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
  taskComplete: [
    '/sounds/task-complete.mp3',
    '/sounds/task_complete.mp3',
    '/sounds/task-completed.mp3',
    '/sounds/complete-task.mp3',
  ],
  subtaskToggle: [
    '/sounds/subtask-toggle.mp3',
    '/sounds/subtask_toggle.mp3',
    '/sounds/check-subtask.mp3',
    '/sounds/button-click.mp3',
    '/sounds/click.mp3',
  ],
  subtaskComplete: [
    '/sounds/subtask-complete.mp3',
    '/sounds/subtask_complete.mp3',
    '/sounds/subtask-completed.mp3',
    '/sounds/check-subtask.mp3',
  ],
  projectComplete: [
    '/sounds/project-complete.mp3',
    '/sounds/project_complete.mp3',
    '/sounds/project-completed.mp3',
    '/sounds/achievement.mp3',
  ],
  cardComplete: [
    '/sounds/cashchaching.mp3',
    '/sounds/cash-chaching.mp3',
    '/sounds/chaching.mp3',
    '/sounds/caching.mp3',
    '/sounds/money-complete.mp3',
  ],
  taskSwipe: [
    '/sounds/task-swipe.mp3',
    '/sounds/task-swipe-whoosh.mp3',
    '/sounds/swipe.mp3',
    '/sounds/whoosh.mp3',
  ],
  uiOpen: [
    '/sounds/ui-open.mp3',
    '/sounds/open.mp3',
    '/sounds/modal-open.mp3',
    '/sounds/button-open.mp3',
  ],
  uiClose: [
    '/sounds/ui-close.mp3',
    '/sounds/close.mp3',
    '/sounds/modal-close.mp3',
    '/sounds/button-close.mp3',
  ],
  moneyAdd: [
    '/sounds/money-add.mp3',
    '/sounds/money_add.mp3',
    '/sounds/add-money.mp3',
    '/sounds/cashchaching.mp3',
  ],
  moneyDelete: [
    '/sounds/money-delete.mp3',
    '/sounds/money_delete.mp3',
    '/sounds/delete-money.mp3',
    '/sounds/delete.mp3',
  ],
  achievement: [
    '/sounds/achievement.mp3',
    '/sounds/achievement-shine.mp3',
    '/sounds/shine.mp3',
    '/sounds/project-complete.mp3',
  ],
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
