'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { playAppSound } from '@/lib/sound';
import { toast } from 'sonner';

export default function DataProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [burst, setBurst] = useState<'task' | 'project' | null>(null);
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
      playAppSound('taskComplete', soundEnabled);
      toast.success('Task complete! ✨');
      setTimeout(() => setBurst(null), 700);
    };

    const onProjectComplete = (event: Event) => {
      const detail = (event as CustomEvent<{ projectName?: string }>).detail;
      setBurst('project');
      playAppSound('projectComplete', soundEnabled);
      toast.success(`Project complete${detail?.projectName ? `: ${detail.projectName}` : ''}! 🏆`);
      setTimeout(() => setBurst(null), 1100);
    };

    window.addEventListener('starrlign:task-complete', onTaskComplete);
    window.addEventListener('starrlign:project-complete', onProjectComplete);
    return () => {
      window.removeEventListener('starrlign:task-complete', onTaskComplete);
      window.removeEventListener('starrlign:project-complete', onProjectComplete);
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
        </div>
      )}
    </>
  );
}
