'use client';

import { useMemo } from 'react';
import { useStore, formatDuration } from '@/lib/store';
import { Task } from '@/lib/types';
import { X, Clock, Calendar, Tag, CheckCircle, Circle, Pencil, Trash2, Archive, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { playAppSound } from '@/lib/sound';

export default function TaskDetailModal() {
  const { 
    isModalOpen, 
    setModalOpen, 
    editingTaskId, 
    tasks, 
    projects,
    updateTask,
    deleteTask,
    archiveTask,
    setEditingTaskId,
    setCurrentView,
    setDetailMode,
    soundEnabled
  } = useStore();
  
  // Find the task being viewed
  const task = useMemo(() => {
    if (editingTaskId) {
      return tasks.find(t => t.id === editingTaskId);
    }
    return null;
  }, [editingTaskId, tasks]);

  // Get project color
  const project = useMemo(() => {
    if (task) {
      return projects.find(p => p.name === task.project);
    }
    return null;
  }, [task, projects]);
  
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
  
  const mainColor = colorMap[projectColor] || colorMap.yellow;
  const textColor = projectColor === 'yellow' ? 'text-black' : 'text-white';
  const textColorMuted = projectColor === 'yellow' ? 'text-black/70' : 'text-white/70';

  const handleClose = () => {
    setModalOpen(false);
    setEditingTaskId(null);
    setDetailMode(false);
  };

  const handleStartTask = () => {
    if (task) {
      updateTask(task.id, { status: 'doing' });
      toast.success('Task started! ⚡');
      handleClose();
    }
  };

  const handleCompleteTask = () => {
    if (task) {
      updateTask(task.id, { status: 'done', progress: 100 });
      toast.success('Task completed! 🎉');
      playAppSound('taskComplete', soundEnabled);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('starrlign:task-complete'));
      }
      handleClose();
    }
  };

  const handleDelete = () => {
    if (task && confirm('Delete this task?')) {
      deleteTask(task.id);
      handleClose();
      toast.success('Task deleted');
    }
  };

  const handleArchive = () => {
    if (task) {
      archiveTask(task.id);
      handleClose();
      toast.success('Task sacrificed');
    }
  };

  const handleToggleSubtask = (subtaskId: string) => {
    if (task) {
      const currentSubtask = task.subtasks.find((st) => st.id === subtaskId);
      const updatedSubtasks = task.subtasks.map(st => 
        st.id === subtaskId ? { ...st, done: !st.done } : st
      );
      updateTask(task.id, { subtasks: updatedSubtasks });
      playAppSound(currentSubtask?.done ? 'subtaskToggle' : 'subtaskComplete', soundEnabled);
    }
  };

  const handleEdit = () => {
    // Switch to edit mode - close detail modal and open edit modal
    setDetailMode(false);
  };

  if (!isModalOpen || !task) return null;

  const duration = formatDuration(task.durationHours, task.durationMinutes);
  const progress = task.subtasks && task.subtasks.length > 0
    ? Math.round((task.subtasks.filter(s => s.done).length / task.subtasks.length) * 100)
    : task.progress || 0;

  return (
    <div
      className="fixed inset-0 bg-black/70 z-[500] flex items-center justify-center p-5"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div
        className="border-[2px] border-black rounded-lg w-full max-w-[500px] shadow-[8px_8px_0_black] animate-[modalIn_0.2s_ease] max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: mainColor }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-black px-5 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{project?.icon || '📋'}</span>
            <h2
              className="text-xl text-[var(--brand-yellow)] tracking-wide"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {task.title.toUpperCase()}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="w-[30px] h-[30px] flex items-center justify-center bg-[var(--brand-red)] border-[2px] border-black rounded cursor-pointer text-white text-base font-bold transition-all duration-150 hover:bg-[var(--brand-red-dark)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {/* Status & Priority Row */}
          <div className="flex items-center gap-3 mb-5">
            <span
              className={cn(
                "text-[10px] font-bold px-3 py-1 rounded-full border-[2px] border-black uppercase",
                task.status === 'todo' && "bg-[var(--gray-400)] text-white",
                task.status === 'doing' && "bg-[var(--brand-blue)] text-white",
                task.status === 'review' && "bg-[var(--brand-yellow)] text-black",
                task.status === 'done' && "bg-[var(--brand-green)] text-white"
              )}
              style={{ fontFamily: 'var(--font-space-mono), monospace' }}
            >
              {task.status === 'doing' ? 'IN PROGRESS' : task.status === 'todo' ? 'TO DO' : task.status === 'review' ? 'IN REVIEW' : 'DONE'}
            </span>
            <span
              className={cn(
                "text-[10px] font-bold px-3 py-1 rounded-full border-[2px] border-black uppercase",
                task.priority === 'high' && "bg-[var(--brand-red)] text-white",
                task.priority === 'medium' && "bg-[var(--brand-yellow)] text-black",
                task.priority === 'low' && "bg-[var(--gray-400)] text-white"
              )}
              style={{ fontFamily: 'var(--font-space-mono), monospace' }}
            >
              {task.priority} PRIORITY
            </span>
          </div>

          {/* Meta Info */}
          <div className={cn("flex flex-wrap gap-4 mb-5", textColorMuted)} style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
            <div className="flex items-center gap-2 text-xs">
              <Clock className="w-4 h-4" />
              <span>{duration}</span>
            </div>
            {task.due && (
              <div className="flex items-center gap-2 text-xs">
                <Calendar className="w-4 h-4" />
                <span>
                  {task.due === 'idk yet' ? 'No due date set' : task.due === 'Ongoing' ? '∞ Ongoing' : task.due}
                </span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-5">
            <div className="flex justify-between items-center mb-2">
              <span className={cn("text-xs font-bold", textColor)} style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
                PROGRESS
              </span>
              <span className={cn("text-xs font-bold", textColor)} style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
                {progress}%
              </span>
            </div>
            <div className="h-3 bg-black/30 rounded-full overflow-hidden border-[2px] border-black">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${progress}%`, 
                  background: 'linear-gradient(90deg, var(--brand-blue) 0%, var(--brand-yellow) 100%)'
                }}
              />
            </div>
          </div>

          {/* Tags */}
          {task.tags.length > 0 && (
            <div className="mb-5">
              <div className={cn("flex items-center gap-2 mb-2", textColor)}>
                <Tag className="w-4 h-4" />
                <span className="text-xs font-bold" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>TAGS</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag, i) => (
                  <span
                    key={i}
                    className={cn("text-[10px] px-2 py-1 rounded border-[2px] border-black", 
                      projectColor === 'yellow' ? "bg-black/20" : "bg-white/20"
                    )}
                    style={{ fontFamily: 'var(--font-space-mono), monospace' }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {task.notes && (
            <div className="mb-5">
              <span className={cn("text-xs font-bold mb-2 block", textColor)} style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
                NOTES
              </span>
              <div 
                className={cn("p-3 rounded-lg border-[2px] border-black/30", projectColor === 'yellow' ? "bg-black/10" : "bg-black/20")}
                style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: '12px' }}
              >
                {task.notes}
              </div>
            </div>
          )}

          {/* Subtasks */}
          {task.subtasks && task.subtasks.length > 0 && (
            <div className="mb-5">
              <span className={cn("text-xs font-bold mb-2 block", textColor)} style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
                SUBTASKS ({task.subtasks.filter(s => s.done).length}/{task.subtasks.length})
              </span>
              <div className="space-y-2">
                {task.subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    onClick={() => handleToggleSubtask(subtask.id)}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all",
                      projectColor === 'yellow' ? "bg-black/10 hover:bg-black/20" : "bg-black/20 hover:bg-black/30"
                    )}
                  >
                    <div
                      className={cn(
                        "w-5 h-5 border-[2px] border-black rounded-[4px] flex items-center justify-center flex-shrink-0 transition-all",
                        subtask.done ? "bg-[var(--brand-green)] border-[var(--brand-green)] text-white" : "bg-[var(--shimmering-opal)]"
                      )}
                    >
                      {subtask.done && <CheckCircle className="w-3 h-3" />}
                    </div>
                    <span className={cn("text-sm", textColor, subtask.done && "line-through opacity-50")}>
                      {subtask.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t-[2px] border-black/30 flex gap-2 justify-between items-center sticky bottom-0" style={{ backgroundColor: mainColor }}>
          <div className="flex gap-2">
            <button
              onClick={handleArchive}
              className="p-2 bg-black/30 text-white rounded-lg border-[2px] border-black hover:bg-black/40 transition-all cursor-pointer"
              title="Archive"
            >
              <Archive className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 bg-[var(--brand-red)] text-white rounded-lg border-[2px] border-black hover:bg-[var(--brand-red-dark)] transition-all cursor-pointer"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-[var(--brand-blue)] text-white text-xs font-bold border-[2px] border-black rounded-lg cursor-pointer transition-all hover:bg-[var(--brand-blue-dark)] flex items-center gap-2"
              style={{ fontFamily: 'var(--font-space-mono), monospace' }}
            >
              <Pencil className="w-3 h-3" /> EDIT
            </button>
            {task.status !== 'done' && (
              task.status === 'doing' ? (
                <button
                  onClick={handleCompleteTask}
                  className="px-4 py-2 bg-[var(--brand-green)] text-white text-xs font-bold border-[2px] border-black rounded-lg cursor-pointer transition-all shadow-[3px_3px_0_black] hover:shadow-[5px_5px_0_black] hover:translate-x-[-1px] hover:translate-y-[-1px] btn-shine"
                  style={{ fontFamily: 'var(--font-space-mono), monospace' }}
                >
                  ★ COMPLETE
                </button>
              ) : (
                <button
                  onClick={handleStartTask}
                  className="px-4 py-2 bg-[var(--brand-red)] text-black text-xs font-bold border-[2px] border-black rounded-lg cursor-pointer transition-all shadow-[3px_3px_0_var(--brand-red-dark)] hover:shadow-[5px_5px_0_var(--brand-red-dark)] hover:translate-x-[-1px] hover:translate-y-[-1px] btn-shine"
                  style={{ fontFamily: 'var(--font-space-mono), monospace' }}
                >
                  <Play className="w-3 h-3 inline mr-1" /> START
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
