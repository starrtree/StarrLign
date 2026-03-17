'use client';

import { Task } from '@/lib/types';
import { useStore, formatDuration } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Clock, Pencil, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface TaskCardProps {
  task: Task;
  onEdit?: () => void;
}

// Helper function to check if deadline is approaching (within 3 days) or overdue
function getDeadlineStatus(due: string | undefined): 'overdue' | 'approaching' | 'ok' {
  if (!due || due === 'idk yet' || due === 'Ongoing') return 'ok';
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(due);
  dueDate.setHours(0, 0, 0, 0);
  
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'overdue';
  if (diffDays <= 3) return 'approaching';
  return 'ok';
}

export default function TaskCard({ task, onEdit }: TaskCardProps) {
  const { updateTask, setEditingTaskId, setModalOpen, projects, setDetailMode } = useStore();
  
  // Get project color
  const project = projects.find(p => p.name === task.project);
  const projectColor = project?.color || 'yellow';
  
  const colorMap: Record<string, { bg: string; text: string; textMuted: string }> = {
    red: { bg: 'var(--brand-red)', text: 'white', textMuted: 'rgba(255,255,255,0.7)' },
    blue: { bg: 'var(--brand-blue)', text: 'white', textMuted: 'rgba(255,255,255,0.7)' },
    yellow: { bg: 'var(--brand-yellow)', text: 'black', textMuted: 'rgba(0,0,0,0.6)' },
    gray: { bg: 'var(--gray-400)', text: 'white', textMuted: 'rgba(255,255,255,0.7)' },
    green: { bg: '#22c55e', text: 'white', textMuted: 'rgba(255,255,255,0.7)' },
    purple: { bg: '#a855f7', text: 'white', textMuted: 'rgba(255,255,255,0.7)' },
    orange: { bg: '#f97316', text: 'white', textMuted: 'rgba(255,255,255,0.7)' },
    pink: { bg: '#ec4899', text: 'white', textMuted: 'rgba(255,255,255,0.7)' },
  };
  
  const colors = colorMap[projectColor] || colorMap.yellow;
  const deadlineStatus = getDeadlineStatus(task.due);
  const duration = formatDuration(task.durationHours, task.durationMinutes);

  const handleQuickMove = (newStatus: Task['status'], e: React.MouseEvent) => {
    e.stopPropagation();
    updateTask(task.id, { status: newStatus });
    toast.success(`Task moved to ${newStatus.toUpperCase()}`);
  };

  // Click on card → Opens detail view (expanded view)
  const handleCardClick = () => {
    setEditingTaskId(task.id);
    setDetailMode(true); // true = detail view mode
    setModalOpen(true);
  };

  // Click EDIT button → Opens edit form
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit();
    } else {
      setEditingTaskId(task.id);
      setDetailMode(false); // false = edit mode
      setModalOpen(true);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        "border-[2px] border-black rounded-lg p-3 cursor-pointer transition-all duration-200 relative shadow-[3px_3px_0_black] hover:shadow-[5px_5px_0_black] hover:translate-x-[-1px] hover:translate-y-[-1px]",
        deadlineStatus === 'overdue' && "border-[var(--brand-red)] ring-2 ring-[var(--brand-red)] ring-offset-1",
        deadlineStatus === 'approaching' && "border-[var(--brand-red)]"
      )}
      style={{ backgroundColor: colors.bg }}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('taskId', task.id);
        e.stopPropagation();
      }}
    >
      {/* Deadline Warning */}
      {deadlineStatus !== 'ok' && task.status !== 'done' && (
        <div className="absolute -top-1 -right-1">
          <AlertTriangle className={cn(
            "w-4 h-4",
            deadlineStatus === 'overdue' ? "text-[var(--brand-red)]" : "text-[var(--brand-yellow)]"
          )} />
        </div>
      )}
      
      {/* Priority Badge */}
      <span
        className={cn(
          "inline-block text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded-[3px] border-[1.5px] border-black mb-2 uppercase",
          task.priority === 'high' && "bg-[var(--brand-red)] text-white",
          task.priority === 'medium' && "bg-[var(--brand-yellow)] text-black",
          task.priority === 'low' && "bg-black/30 text-white"
        )}
        style={{ fontFamily: 'var(--font-space-mono), monospace' }}
      >
        {task.priority}
      </span>

      {/* Title */}
      <div 
        className="text-sm font-semibold leading-snug mb-2 drop-shadow-[1px_1px_0_rgba(0,0,0,0.5)]"
        style={{ color: colors.text }}
      >
        {task.title}
      </div>

      {/* Meta */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Duration */}
        <div
          className="text-[10px] font-bold flex items-center gap-1"
          style={{ color: colors.textMuted, fontFamily: 'var(--font-space-mono), monospace' }}
        >
          <Clock className="w-3 h-3" />
          {duration}
        </div>

        {/* Tags */}
        {task.tags.map((tag, i) => (
          <span
            key={i}
            className="text-[10px] px-1.5 py-0.5 rounded-[3px] border-[1.5px] border-black bg-black/20 text-white"
            style={{ fontFamily: 'var(--font-space-mono), monospace' }}
          >
            {tag}
          </span>
        ))}

        {/* Due Date */}
        {task.due && (
          <span
            className={cn(
              "text-[10px] ml-auto flex items-center gap-1",
              deadlineStatus === 'overdue' && "text-[var(--brand-red)] font-bold",
              deadlineStatus === 'approaching' && "text-[var(--brand-yellow)] font-bold"
            )}
            style={{ 
              color: deadlineStatus === 'ok' ? colors.textMuted : undefined,
              fontFamily: 'var(--font-space-mono), monospace' 
            }}
          >
            {task.due === 'idk yet' ? 'idk yet' : task.due === 'Ongoing' ? '∞ Ongoing' : task.due}
          </span>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-1.5 mt-2.5 pt-2 border-t border-black/20 flex-wrap">
        {task.status !== 'done' && (
          <button
            onClick={(e) => handleQuickMove('done', e)}
            className="flex items-center gap-1 px-2 py-1 text-[9px] font-bold tracking-wider rounded-[5px] border-[1.5px] border-black cursor-pointer transition-all duration-150 bg-[var(--brand-green)] text-white hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[2px_2px_0_black]"
            style={{ fontFamily: 'var(--font-space-mono), monospace' }}
          >
            ✓ DONE
          </button>
        )}
        {task.status === 'todo' && (
          <button
            onClick={(e) => handleQuickMove('doing', e)}
            className="flex items-center gap-1 px-2 py-1 text-[9px] font-bold tracking-wider rounded-[5px] border-[1.5px] border-black cursor-pointer transition-all duration-150 bg-[var(--brand-blue)] text-white hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[2px_2px_0_black]"
            style={{ fontFamily: 'var(--font-space-mono), monospace' }}
          >
            ⚡ START
          </button>
        )}
        {task.status === 'doing' && (
          <button
            onClick={(e) => handleQuickMove('review', e)}
            className="flex items-center gap-1 px-2 py-1 text-[9px] font-bold tracking-wider rounded-[5px] border-[1.5px] border-black cursor-pointer transition-all duration-150 bg-[var(--brand-yellow)] text-black hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[2px_2px_0_black]"
            style={{ fontFamily: 'var(--font-space-mono), monospace' }}
          >
            REVIEW
          </button>
        )}
        <button
          onClick={handleEditClick}
          className="flex items-center gap-1 px-2 py-1 text-[9px] font-bold tracking-wider rounded-[5px] border-[1.5px] border-black cursor-pointer transition-all duration-150 bg-[var(--shimmering-opal)] text-black hover:translate-x-[-1px] hover:translate-y-[-1px]"
          style={{ fontFamily: 'var(--font-space-mono), monospace' }}
        >
          <Pencil className="w-3 h-3" /> EDIT
        </button>
      </div>
    </div>
  );
}
