export type AppSound = 'taskComplete' | 'subtaskToggle';

const SOUND_FILES: Record<AppSound, string> = {
  taskComplete: '/sounds/task-complete.mp3',
  subtaskToggle: '/sounds/subtask-toggle.mp3',
};

export function playAppSound(sound: AppSound, enabled: boolean) {
  if (!enabled || typeof window === 'undefined') return;
  const src = SOUND_FILES[sound];
  if (!src) return;

  const audio = new Audio(src);
  audio.volume = sound === 'taskComplete' ? 0.6 : 0.45;
  void audio.play().catch(() => {
    // ignore autoplay/playback errors
  });
}
