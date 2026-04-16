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
      playAppSound('cardComplete', soundEnabled);
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
      playAppSound('cardComplete', soundEnabled);
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

    window.addEventListener('starrlign:task-complete', onTaskComplete);
    window.addEventListener('starrlign:project-complete', onProjectComplete);
    window.addEventListener('starrlign:subtask-complete', onSubtaskComplete);
    return () => {
      window.removeEventListener('starrlign:task-complete', onTaskComplete);
      window.removeEventListener('starrlign:project-complete', onProjectComplete);
      window.removeEventListener('starrlign:subtask-complete', onSubtaskComplete);
    };
  }, [soundEnabled]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--off-white)] flex items-center justify-center">
        <div className="text-center">
          <div className="text-[40px] mb-4 text-[var(--brand-yellow)]" style={{ animation: 'pulse 2s infinite ease-in-out' }}>
            ★
          </div>
          <div className="text-sm text-[var(--gray-600)]" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
            Loading your workspace...
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
