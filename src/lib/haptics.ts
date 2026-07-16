type HapticKind = 'tap' | 'open' | 'close' | 'complete' | 'undo' | 'drag' | 'error';

let hapticsAttached = false;

const patterns: Record<HapticKind, number | number[]> = {
  tap: 7,
  open: 10,
  close: 9,
  complete: [22, 24, 28],
  undo: [14, 18, 14],
  drag: 8,
  error: [28, 35, 28],
};

function canVibrate() {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

export function fireHaptic(kind: HapticKind = 'tap') {
  if (!canVibrate()) return;
  navigator.vibrate(patterns[kind]);
}

function inferHapticKind(interactive: HTMLElement): HapticKind {
  const explicit = interactive.dataset.haptic as HapticKind | undefined;
  if (explicit && explicit in patterns) return explicit;

  const text = `${interactive.textContent || ''} ${interactive.getAttribute('aria-label') || ''} ${interactive.getAttribute('title') || ''}`.toLowerCase();
  if (text.includes('done') || text.includes('complete')) return 'complete';
  if (text.includes('undo') || text.includes('restore')) return 'undo';
  if (text.includes('delete') || text.includes('trash') || text.includes('close') || text.includes('cancel')) return 'close';
  if (text.includes('open') || text.includes('search') || text.includes('new') || text.includes('add')) return 'open';
  return 'tap';
}

function pressElement(interactive: HTMLElement) {
  interactive.classList.remove('starr-pressed');
  // Restart the press animation even when tapping the same button repeatedly.
  void interactive.offsetWidth;
  interactive.classList.add('starr-pressed');
  window.setTimeout(() => interactive.classList.remove('starr-pressed'), 260);
}

export function installHapticFeedback() {
  if (typeof window === 'undefined' || hapticsAttached) return;
  hapticsAttached = true;

  window.addEventListener(
    'pointerdown',
    (event) => {
      const target = event.target as HTMLElement | null;
      const interactive = target?.closest('button, a, [role="button"], input, textarea, select, [contenteditable="true"], .cursor-pointer, .task-card, .document-card, .project-item') as HTMLElement | null;
      if (!interactive || interactive.dataset.haptic === 'off') return;
      if (interactive.matches('input, textarea, [contenteditable="true"]')) {
        fireHaptic('tap');
        return;
      }
      pressElement(interactive);
      fireHaptic(inferHapticKind(interactive));
    },
    { capture: true, passive: true }
  );

  window.addEventListener('starrlign:task-complete', () => fireHaptic('complete'));
  window.addEventListener('starrlign:project-complete', () => fireHaptic('complete'));
  window.addEventListener('starrlign:subtask-complete', () => fireHaptic('complete'));
  window.addEventListener('starrlign:task-swipe', () => fireHaptic('drag'));
  window.addEventListener('starrlign:ui-open', () => fireHaptic('open'));
  window.addEventListener('starrlign:ui-close', () => fireHaptic('close'));
}
