'use client';

import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: number;
  bgClass: string;
  textColor: string;
}

function StatCard({ label, value, bgClass, textColor }: StatCardProps) {
  return (
    <div className={cn(
      "border-[2px] border-black rounded-lg p-4 relative shadow-[3px_3px_0_black] transition-all duration-200 hover:shadow-[5px_5px_0_black] hover:translate-y-[-2px]",
      bgClass
    )}>
      <div
        className="text-[9px] text-white/70 dark:text-black tracking-wider uppercase mb-1"
        style={{ fontFamily: 'var(--font-space-mono), monospace' }}
      >
        {label}
      </div>
      <div
        className={cn("text-[32px] leading-none", textColor)}
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {value}
      </div>
    </div>
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
      />
      <StatCard 
        label="IN PROGRESS" 
        value={inProgress} 
        bgClass="bg-[var(--brand-yellow)]" 
        textColor="text-black" 
      />
      <StatCard 
        label="COMPLETED" 
        value={completed} 
        bgClass="bg-[var(--brand-green)]" 
        textColor="text-white" 
      />
      <StatCard 
        label="BACKLOG" 
        value={backlog} 
        bgClass="bg-[var(--gray-600)]" 
        textColor="text-white" 
      />
    </div>
  );
}

