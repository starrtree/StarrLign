export type AppSound = 'taskComplete' | 'subtaskToggle' | 'subtaskComplete' | 'projectComplete' | 'cardComplete';

const SOUND_FILES: Record<AppSound, string> = {
  taskComplete: '/sounds/task-complete.mp3',
  subtaskToggle: '/sounds/subtask-toggle.mp3',
  subtaskComplete: '/sounds/subtask-complete.mp3',
  projectComplete: '/sounds/project-complete.mp3',
  cardComplete: '/sounds/cashchaching.mp3',
};

export function playAppSound(sound: AppSound, enabled: boolean) {
  if (!enabled || typeof window === 'undefined') return;
  const src = SOUND_FILES[sound];
  if (!src) return;

  const audio = new Audio(src);
  audio.volume = sound === 'projectComplete' ? 0.75 : sound === 'cardComplete' ? 0.8 : sound === 'taskComplete' ? 0.6 : 0.45;
  void audio.play().catch(() => {
    // ignore autoplay/playback errors
  });
}

export function vibrateDevice(pattern: number | number[]) {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  navigator.vibrate(pattern);
}
