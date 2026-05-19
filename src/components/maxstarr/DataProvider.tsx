'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { playAppSound, vibrateDevice } from '@/lib/sound';
import { toast } from 'sonner';

type BurstType = 'task' | 'project' | null;

function createConfetti(count: number) {
  return Array.from({ length: count }).map((_, index) => ({
    id: `${Date.now()}-${index}`,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 160}ms`,
    duration: `${850 + Math.random() * 950}ms`,
    rotation: `${Math.random() * 720 - 360}deg`,
    color: ['#ffd100', '#ed1c24', '#0052b4', '#22c55e', '#ffffff'][index % 5],
    size: `${6 + Math.random() * 8}px`,
  }));
}

export default function DataProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [burst, setBurst] = useState<BurstType>(null);
  const [confetti, setConfetti] = useState<ReturnType<typeof createConfetti>>([]);
  const hydrateFromDatabase = useStore((state) => state.hydrateFromDatabase);
  const soundEnabled = useStore((state) => state.soundEnabled);

  useEffect(() => {
    const init = async () => {
      try {
        await hydrateFromDatabase();
      } catch (error) {
        console.error('Failed to hydrate from database:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    init();
  }, [hydrateFromDatabase]);

  useEffect(() => {
    const onTaskComplete = () => {
      setBurst('task');
      setConfetti(createConfetti(18));
      playAppSound('taskComplete', soundEnabled);
      vibrateDevice([22, 30, 22]);
      toast.success('Task complete! ✨');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('starrlign:card-complete'));
      }
      setTimeout(() => {
        setBurst(null);
        setConfetti([]);
      }, 1100);
    };

    const onProjectComplete = (event: Event) => {
      const detail = (event as CustomEvent<{ projectName?: string }>).detail;
      setBurst('project');
      setConfetti(createConfetti(36));
      playAppSound('projectComplete', soundEnabled);
      vibrateDevice([45, 60, 45, 60]);
      toast.success(`Project complete${detail?.projectName ? `: ${detail.projectName}` : ''}! 🏆`);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('starrlign:card-complete'));
      }
      setTimeout(() => {
        setBurst(null);
        setConfetti([]);
      }, 1500);
    };

    const onSubtaskComplete = () => {
      playAppSound('subtaskComplete', soundEnabled);
      vibrateDevice(14);
    };

    const onCardComplete = () => {
      playAppSound('cardComplete', soundEnabled);
    };

    const onTaskSwipe = () => {
      playAppSound('taskSwipe', soundEnabled);
      vibrateDevice(8);
    };

    const onUiOpen = () => playAppSound('uiOpen', soundEnabled);
    const onUiClose = () => playAppSound('uiClose', soundEnabled);
    const onMoneyAdd = () => playAppSound('moneyAdd', soundEnabled);
    const onMoneyDelete = () => playAppSound('moneyDelete', soundEnabled);
    const onAchievement = () => playAppSound('achievement', soundEnabled);

    window.addEventListener('starrlign:task-complete', onTaskComplete);
    window.addEventListener('starrlign:project-complete', onProjectComplete);
    window.addEventListener('starrlign:subtask-complete', onSubtaskComplete);
    window.addEventListener('starrlign:card-complete', onCardComplete);
    window.addEventListener('starrlign:task-swipe', onTaskSwipe);
    window.addEventListener('starrlign:ui-open', onUiOpen);
    window.addEventListener('starrlign:ui-close', onUiClose);
    window.addEventListener('starrlign:money-add', onMoneyAdd);
    window.addEventListener('starrlign:money-delete', onMoneyDelete);
    window.addEventListener('starrlign:achievement', onAchievement);
    return () => {
      window.removeEventListener('starrlign:task-complete', onTaskComplete);
      window.removeEventListener('starrlign:project-complete', onProjectComplete);
      window.removeEventListener('starrlign:subtask-complete', onSubtaskComplete);
      window.removeEventListener('starrlign:card-complete', onCardComplete);
      window.removeEventListener('starrlign:task-swipe', onTaskSwipe);
      window.removeEventListener('starrlign:ui-open', onUiOpen);
      window.removeEventListener('starrlign:ui-close', onUiClose);
      window.removeEventListener('starrlign:money-add', onMoneyAdd);
      window.removeEventListener('starrlign:money-delete', onMoneyDelete);
      window.removeEventListener('starrlign:achievement', onAchievement);
    };
  }, [soundEnabled]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--off-white)] flex items-center justify-center px-4">
        <div className="text-center relative">
          <div className="absolute -inset-8 rounded-[28px] bg-[radial-gradient(circle_at_top,rgba(255,209,0,0.24),transparent_55%)] pointer-events-none" />
          <div className="relative border-[3px] border-black rounded-2xl px-8 py-7 bg-[linear-gradient(180deg,rgba(0,0,0,0.06)_0%,rgba(255,255,255,0.75)_100%)] shadow-[8px_8px_0_black] overflow-hidden">
            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-[var(--brand-yellow)]/35 blur-2xl" />
            <div
              className="text-[52px] md:text-[72px] leading-none font-black tracking-[4px] text-[var(--brand-yellow)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              ST<span className="inline-block starr-loader-star">★</span>RR
            </div>
            <div
              className="text-[44px] md:text-[64px] -mt-1 leading-none font-black tracking-[5px] text-[var(--brand-red)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              LIGN
            </div>
            <div className="mt-3 flex items-center justify-center gap-2">
              <div className="h-[3px] w-[220px] md:w-[300px] rounded-full bg-gradient-to-r from-transparent via-[var(--brand-yellow)] to-[var(--brand-red)] starr-loader-arrow" />
              <div className="w-0 h-0 border-y-[8px] border-y-transparent border-l-[14px] border-l-[var(--brand-red)]" />
            </div>
            <div className="text-xs mt-4 text-[var(--gray-600)] uppercase tracking-[2px]" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
              Loading your workspace
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      {burst && (
        <div className="pointer-events-none fixed inset-0 z-[600] flex items-center justify-center">
          <div className={burst === 'project' ? 'text-[96px] animate-ping' : 'text-[72px] animate-bounce'}>
            {burst === 'project' ? '🏆' : '✨'}
          </div>
          {confetti.map((piece) => (
            <span
              key={piece.id}
              className="absolute confetti-burst-piece"
              style={{
                left: piece.left,
                width: piece.size,
                height: piece.size,
                backgroundColor: piece.color,
                animationDelay: piece.delay,
                animationDuration: piece.duration,
                transform: `rotate(${piece.rotation})`,
              }}
            />
          ))}
        </div>
      )}
    </>
  );
}
