'use client';

import { useStore, formatDuration } from '@/lib/store';
import { Task } from '@/lib/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface UpNextCardProps {
  task: Task;
  onStart: () => void;
  onOpen: () => void;
  onEdit: () => void;
}

function UpNextCard({ task, onStart, onOpen, onEdit }: UpNextCardProps) {
  const duration = formatDuration(task.durationHours, task.durationMinutes);
  const { projects } = useStore();
  
  // Get project color
  const project = projects.find(p => p.name === task.project);
  const projectColor = project?.color || 'yellow';
  
  const colorMap: Record<string, string> = {
    red: 'var(--brand-red)',
    blue: 'var(--brand-blue)',
    yellow: 'var(--brand-yellow)',
    gray: 'var(--gray-400)',
    green: '#22c55e',
    purple: '#a855f7',
    orange: '#f97316',
    pink: '#ec4899',
  };
  
  const cardColor = colorMap[projectColor] || colorMap.yellow;
  const textColor = projectColor === 'yellow' ? 'text-black' : 'text-white';
  const textColorMuted = projectColor === 'yellow' ? 'text-black/70' : 'text-white/70';

  return (
    <div
      onClick={onOpen}
      className="border-[2px] border-black rounded-lg p-5 flex items-center justify-between shadow-[4px_4px_0_black] cursor-pointer transition-all duration-200 hover:shadow-[6px_6px_0_black] hover:translate-x-[-2px] hover:translate-y-[-2px] group"
      style={{ backgroundColor: cardColor }}
    >
      <div>
        <div className={cn("text-lg font-bold transition-colors duration-150", textColor, "group-hover:text-[var(--brand-yellow)]")}>
          {task.title}
        </div>
        <div
          className={cn("text-xs mt-1", textColorMuted)}
          style={{ fontFamily: 'var(--font-space-mono), monospace' }}
        >
          {task.project} • {task.priority.toUpperCase()} • {duration}
          {task.due && task.due !== 'idk yet' && task.due !== 'Ongoing' && (
            <span className="ml-2">• Due: {task.due}</span>
          )}
          {task.due === 'Ongoing' && (
            <span className="ml-2">• ∞ Ongoing</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="px-2.5 py-1 bg-white/90 text-black text-[10px] font-bold tracking-wider border-[2px] border-black rounded-lg"
          style={{ fontFamily: 'var(--font-space-mono), monospace' }}
        >
          EDIT
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStart();
          }}
          className="px-3 py-1.5 bg-black text-[var(--brand-yellow)] text-xs font-bold tracking-wider border-[2px] border-black rounded-lg cursor-pointer transition-all duration-150 shadow-[3px_3px_0_var(--brand-yellow)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0_var(--brand-yellow)] active:translate-x-0 active:translate-y-0 active:shadow-none btn-shine"
          style={{ fontFamily: 'var(--font-space-mono), monospace' }}
        >
          START
        </button>
      </div>
    </div>
  );
}

export default function UpNextQueue() {
  const { tasks, updateTask, setEditingTaskId, setModalOpen, setCurrentView, setDetailMode } = useStore();

  // Priority order (higher = more important)
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  
  // Sort by priority first, then by due date (earlier dates first, 'idk yet' and 'Ongoing' last)
  const nextTasks = tasks
    .filter(t => t.status === 'todo' && !t.isArchived)
    .sort((a, b) => {
      // First sort by priority
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then sort by due date
      const aDate = a.due && a.due !== 'idk yet' && a.due !== 'Ongoing' ? new Date(a.due).getTime() : Infinity;
      const bDate = b.due && b.due !== 'idk yet' && b.due !== 'Ongoing' ? new Date(b.due).getTime() : Infinity;
      
      return aDate - bDate;
    })
    .slice(0, 2);

  const handleStart = (taskId: string) => {
    updateTask(taskId, { status: 'doing' });
    toast.success('Task started! ⚡');
  };

  const handleEdit = (taskId: string) => {
    setEditingTaskId(taskId);
    setDetailMode(false);
    setModalOpen(true);
  };

  const handleOpen = (taskId: string) => {
    setEditingTaskId(taskId);
    setDetailMode(true);
    setModalOpen(true);
  };

  const handleViewAllTasks = () => {
    setCurrentView('kanban');
  };

  return (
    <>
      <div className="flex justify-between items-center mb-5">
        <h3
          className="text-xl tracking-wide text-black"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          UP NEXT QUEUE
        </h3>
        <button
          onClick={handleViewAllTasks}
          className="px-4 py-2 bg-[var(--brand-blue)] text-white text-xs font-bold tracking-wider border-[2px] border-black rounded-lg cursor-pointer transition-all duration-150 shadow-[2px_2px_0_black] hover:shadow-[4px_4px_0_black] hover:translate-x-[-1px] hover:translate-y-[-1px]"
          style={{ fontFamily: 'var(--font-space-mono), monospace' }}
        >
          VIEW ALL TASKS
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        {nextTasks.length === 0 ? (
          <div
            className="col-span-2 text-center text-black p-5 bg-[var(--brand-green)] border-[2px] border-black rounded-lg shadow-[4px_4px_0_black]"
            style={{ fontFamily: 'var(--font-space-mono), monospace' }}
          >
            🎉 QUEUE EMPTY. GREAT JOB!
          </div>
        ) : (
          nextTasks.map(task => (
            <UpNextCard
              key={task.id}
              task={task}
              onStart={() => handleStart(task.id)}
              onOpen={() => handleOpen(task.id)}
              onEdit={() => handleEdit(task.id)}
            />
          ))
        )}
      </div>
    </>
  );
}
