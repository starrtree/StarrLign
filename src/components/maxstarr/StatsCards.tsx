'use client';

import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Task } from '@/lib/types';

interface StatCardProps {
  label: string;
  value: number;
  bgClass: string;
  textColor: string;
  filter: 'all' | Task['status'];
  helper: string;
}

function StatCard({ label, value, bgClass, textColor, filter, helper }: StatCardProps) {
  const { setCurrentView } = useStore();

  const handleOpenFilteredTasks = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('starrlign-task-status-filter', filter);
      window.dispatchEvent(new CustomEvent('starrlign:task-status-filter', { detail: { filter } }));
      window.dispatchEvent(new Event('starrlign:ui-open'));
    }
    setCurrentView('kanban');
  };

  return (
    <button
      type="button"
      onClick={handleOpenFilteredTasks}
      className={cn(
        'border-[2px] border-black rounded-lg p-4 relative shadow-[3px_3px_0_black] transition-all duration-200 hover:shadow-[5px_5px_0_black] hover:translate-y-[-2px] text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--brand-yellow)]',
        bgClass
      )}
      title={helper}
    >
      <div
        className="text-[9px] text-white/70 dark:text-black tracking-wider uppercase mb-1"
        style={{ fontFamily: 'var(--font-space-mono), monospace' }}
      >
        {label}
      </div>
      <div
        className={cn('text-[32px] leading-none', textColor)}
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {value}
      </div>
      <div className="mt-2 text-[9px] uppercase tracking-[1.2px] text-white/80 dark:text-black/70" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
        Tap to view
      </div>
    </button>
  );
}

export default function StatsCards() {
  const { tasks } = useStore();

  const activeTasks = tasks.filter(t => !t.isArchived);
  const total = activeTasks.length;
  const inProgress = activeTasks.filter(t => t.status === 'doing').length;
  const completed = activeTasks.filter(t => t.status === 'done').length;
  const backlog = activeTasks.filter(t => t.status === 'todo').length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <StatCard
        label="TOTAL TASKS"
        value={total}
        bgClass="bg-[var(--brand-blue)]"
        textColor="text-[var(--brand-yellow)]"
        filter="all"
        helper="View all active tasks"
      />
      <StatCard
        label="IN PROGRESS"
        value={inProgress}
        bgClass="bg-[var(--brand-yellow)]"
        textColor="text-black"
        filter="doing"
        helper="View tasks currently in progress"
      />
      <StatCard
        label="COMPLETED"
        value={completed}
        bgClass="bg-[var(--brand-green)]"
        textColor="text-white"
        filter="done"
        helper="View completed tasks"
      />
      <StatCard
        label="BACKLOG"
        value={backlog}
        bgClass="bg-[var(--gray-600)]"
        textColor="text-white"
        filter="todo"
        helper="View backlog tasks"
      />
    </div>
  );
}
