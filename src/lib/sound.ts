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

const SOUND_FILES: Record<AppSound, string> = {
  taskComplete: '/sounds/task-complete.mp3',
  subtaskToggle: '/sounds/subtask-toggle.mp3',
  subtaskComplete: '/sounds/subtask-complete.mp3',
  projectComplete: '/sounds/project-complete.mp3',
  cardComplete: '/sounds/cashchaching.mp3',
  taskSwipe: '/sounds/task-swipe-whoosh.mp3',
  uiOpen: '/sounds/ui-open-pop.mp3',
  uiClose: '/sounds/ui-close-tap.mp3',
  moneyAdd: '/sounds/money-add-chime.mp3',
  moneyDelete: '/sounds/money-delete-soft.mp3',
  achievement: '/sounds/achievement-shine.mp3',
};

export function playAppSound(sound: AppSound, enabled: boolean) {
  if (!enabled || typeof window === 'undefined') return;
  const src = SOUND_FILES[sound];
  if (!src) return;

  const audio = new Audio(src);
  audio.volume =
    sound === 'projectComplete'
      ? 0.78
      : sound === 'cardComplete'
        ? 0.8
        : sound === 'achievement'
          ? 0.72
          : sound === 'moneyAdd'
            ? 0.62
            : sound === 'moneyDelete'
              ? 0.5
              : sound === 'taskSwipe'
                ? 0.48
                : sound === 'uiOpen' || sound === 'uiClose'
                  ? 0.42
                  : sound === 'taskComplete'
                    ? 0.6
                    : 0.45;
  void audio.play().catch(() => {
    // ignore autoplay/playback errors
  });
}

export function vibrateDevice(pattern: number | number[]) {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  navigator.vibrate(pattern);
}
