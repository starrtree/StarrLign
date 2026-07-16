'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FocusEvent, KeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import { AnimatePresence, PanInfo, motion, useMotionValue, useTransform } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight, ExternalLink, FolderOpen, Layers3, Maximize2, Plus, Sparkles, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useStore, formatDuration } from '@/lib/store';
import { cn } from '@/lib/utils';
import { playAppSound } from '@/lib/sound';
import { Task } from '@/lib/types';

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

export default function FocusZone() {
  const {
    tasks,
    projects,
    theme,
    soundEnabled,
    updateTask,
    toggleSubtask,
    addSubtask,
    updateSubtask,
    deleteSubtask,
    setEditingTaskId,
    setModalOpen,
    setDetailMode,
    setCurrentView,
    setSelectedProjectId,
  } = useStore();

  const activeFocusTasks = useMemo(
    () => tasks.filter((task) => task.status === 'doing' && !task.isArchived),
    [tasks]
  );

  const [focusIndex, setFocusIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<1 | -1>(1);
  const [focusLayout, setFocusLayout] = useState<'single' | 'multi'>('single');
  const [editingNotes, setEditingNotes] = useState(false);
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editingSubtaskText, setEditingSubtaskText] = useState('');
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [isCardCelebrating, setIsCardCelebrating] = useState(false);

  const arrowClickRef = useRef(0);
  const newSubtaskRef = useRef<HTMLInputElement>(null);
  const subtaskInputRef = useRef<HTMLInputElement>(null);

  const focusSwipeX = useMotionValue(0);
  const focusSwipeRotate = useTransform(focusSwipeX, [-280, 0, 280], [-8, 0, 8]);
  const swipeLeftOpacity = useTransform(focusSwipeX, [-230, -90, 0], [0.95, 0.4, 0]);
  const swipeRightOpacity = useTransform(focusSwipeX, [0, 90, 230], [0, 0.4, 0.95]);
  const swipeProgress = useTransform(focusSwipeX, [-230, 0, 230], [1, 0, 1]);

  const focusTask = activeFocusTasks[focusIndex] ?? activeFocusTasks[0];
  const isDark = theme === 'dark';

  const getTaskProject = (task?: Task) => projects.find((project) => project.name === task?.project);
  const getTaskColor = (task?: Task) => colorMap[getTaskProject(task)?.color || 'yellow'] || colorMap.yellow;
  const getTaskProgress = (task?: Task) => {
    if (!task) return 0;
    if (task.subtasks?.length) {
      const done = task.subtasks.filter((subtask) => subtask.done).length;
      return Math.round((done / task.subtasks.length) * 100);
    }
    return task.progress || 0;
  };

  const projectColor = getTaskProject(focusTask)?.color || 'yellow';
  const mainColor = getTaskColor(focusTask);
  const progress = getTaskProgress(focusTask);
  const textColor = projectColor === 'yellow' ? 'black' : 'white';
  const mutedTextColor = projectColor === 'yellow' ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.75)';
  const duration = focusTask ? formatDuration(focusTask.durationHours, focusTask.durationMinutes) : '';
  const previousTask = activeFocusTasks[(focusIndex - 1 + activeFocusTasks.length) % activeFocusTasks.length];
  const nextTask = activeFocusTasks[(focusIndex + 1) % activeFocusTasks.length];

  useEffect(() => {
    if (focusIndex > activeFocusTasks.length - 1) {
      setFocusIndex(Math.max(activeFocusTasks.length - 1, 0));
    }
  }, [activeFocusTasks.length, focusIndex]);

  useEffect(() => {
    focusSwipeX.set(0);
  }, [focusTask?.id, focusSwipeX]);

  useEffect(() => {
    if (isAddingSubtask) newSubtaskRef.current?.focus();
  }, [isAddingSubtask]);

  useEffect(() => {
    if (editingSubtaskId) {
      subtaskInputRef.current?.focus();
      subtaskInputRef.current?.select();
    }
  }, [editingSubtaskId]);

  const handleSwipeTask = (direction: 1 | -1) => {
    if (activeFocusTasks.length <= 1) return;
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('starrlign:task-swipe'));
    setSwipeDirection(direction);
    setFocusIndex((prev) => {
      const next = prev + direction;
      if (next < 0) return activeFocusTasks.length - 1;
      if (next >= activeFocusTasks.length) return 0;
      return next;
    });
  };

  const handleArrowSwipe = (direction: 1 | -1, event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const now = Date.now();
    if (now - arrowClickRef.current < 220) return;
    arrowClickRef.current = now;

    focusSwipeX.set(0);
    handleSwipeTask(direction);
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const horizontal = Math.abs(info.offset.x);
    const vertical = Math.abs(info.offset.y);
    const fastHorizontal = Math.abs(info.velocity.x) > 950 && horizontal > 80;
    const intentionalSwipe = horizontal > 130 && horizontal > vertical * 1.45;

    if (!intentionalSwipe && !fastHorizontal) {
      focusSwipeX.set(0);
      return;
    }

    handleSwipeTask(info.offset.x > 0 ? -1 : 1);
    window.setTimeout(() => focusSwipeX.set(0), 0);
  };

  const handleOpenDetails = (taskId = focusTask?.id) => {
    if (!taskId) return;
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('starrlign:ui-open'));
    setEditingTaskId(taskId);
    setDetailMode(true);
    setModalOpen(true);
  };

  const handleCompleteMission = () => {
    if (!focusTask) return;
    updateTask(focusTask.id, {
      status: 'done',
      progress: 100,
      completedAt: new Date().toISOString(),
      previousStatusBeforeDone: focusTask.status === 'done' ? focusTask.previousStatusBeforeDone || 'todo' : focusTask.status,
    });
    toast.success('Mission completed');
    setIsCardCelebrating(true);
    window.setTimeout(() => setIsCardCelebrating(false), 1450);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('starrlign:task-complete', { detail: { taskId: focusTask.id, title: focusTask.title, previousStatus: focusTask.status } }));
    }
  };

  const handleRemoveFromFocus = () => {
    if (!focusTask) return;
    updateTask(focusTask.id, { status: 'todo', completedAt: null, previousStatusBeforeDone: null });
    toast.success('Removed from focus deck');
  };

  const handleProjectClick = () => {
    if (!focusTask) return;
    const project = projects.find((candidate) => candidate.name === focusTask.project);
    if (project) {
      setSelectedProjectId(project.id);
      setCurrentView('projects');
    }
  };

  const handleNotesBlur = (event: FocusEvent<HTMLTextAreaElement>) => {
    setEditingNotes(false);
    if (focusTask && event.currentTarget.value !== focusTask.notes) {
      updateTask(focusTask.id, { notes: event.currentTarget.value });
      toast.success('Notes saved');
    }
  };

  const handleNotesChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    if (focusTask) updateTask(focusTask.id, { notes: event.target.value });
  };

  const handleNotesKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const textarea = event.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = textarea.value.substring(0, start) + '\n• ' + textarea.value.substring(end);
    if (focusTask) updateTask(focusTask.id, { notes: newValue });
    window.setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + 3;
    }, 0);
  };

  const formatNotesWithBullets = (notes: string) => {
    if (!notes) return '• ';
    const lines = notes.split('\n');
    const bulletedLines = lines
      .map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return '';
        if (trimmed.startsWith('•')) return line;
        return `• ${trimmed}`;
      })
      .filter(Boolean);
    return bulletedLines.join('\n') || '• ';
  };

  const handleSubtaskSave = () => {
    if (focusTask && editingSubtaskId && editingSubtaskText.trim()) {
      updateSubtask(focusTask.id, editingSubtaskId, editingSubtaskText.trim());
    }
    setEditingSubtaskId(null);
    setEditingSubtaskText('');
  };

  const handleSubtaskKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') handleSubtaskSave();
    if (event.key === 'Escape') {
      setEditingSubtaskId(null);
      setEditingSubtaskText('');
    }
  };

  const handleNewSubtaskSave = () => {
    if (focusTask && newSubtaskText.trim()) {
      addSubtask(focusTask.id, newSubtaskText.trim());
      setNewSubtaskText('');
      toast.success('Subtask added');
    }
    setIsAddingSubtask(false);
  };

  const handleNewSubtaskKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') handleNewSubtaskSave();
    if (event.key === 'Escape') {
      setIsAddingSubtask(false);
      setNewSubtaskText('');
    }
  };

  const selectTaskInDeck = (taskId: string) => {
    const nextIndex = activeFocusTasks.findIndex((candidate) => candidate.id === taskId);
    if (nextIndex === -1) return;
    setSwipeDirection(nextIndex >= focusIndex ? 1 : -1);
    setFocusIndex(nextIndex);
  };

  const getGlowStyle = () => {
    if (progress === 0) return {};
    const intensity = Math.min(progress / 100, 1);
    if (isDark) {
      const alpha = 0.7 + intensity * 0.3;
      return { boxShadow: `0 0 ${15 + progress * 0.4}px rgba(237, 28, 36, ${alpha}), 0 0 ${30 + progress * 0.6}px rgba(237, 28, 36, ${alpha * 0.6})` };
    }
    const alpha = 0.5 + intensity * 0.4;
    return { boxShadow: `0 0 ${8 + progress * 0.15}px rgba(255, 209, 0, ${alpha}), 0 0 ${15 + progress * 0.25}px rgba(255, 209, 0, ${alpha * 0.5})` };
  };

  if (!focusTask) {
    return (
      <div
        className="yellow-card-contrast border-[3px] border-black rounded-lg p-8 md:p-16 mb-6 md:mb-8 relative shadow-[4px_4px_0_black] md:shadow-[6px_6px_0_black] text-center"
        style={{ backgroundColor: colorMap.yellow }}
      >
        <div className="text-[40px] md:text-[50px] leading-none mb-1 text-black">★</div>
        <div className="text-[9px] md:text-[10px] tracking-[1.5px] uppercase mb-2.5 font-bold text-black/60" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
          CURRENT MISSION
        </div>
        <div className="text-[28px] md:text-[40px] mb-4 md:mb-5 leading-tight text-black" style={{ fontFamily: 'var(--font-display)' }}>
          NO ACTIVE MISSION
        </div>
        <div className="text-sm md:text-base mb-5 text-black/70">You are free. Select a task below to begin focus mode.</div>
        <button
          onClick={() => setCurrentView('kanban')}
          className="px-4 py-2 bg-[var(--brand-blue)] text-white text-xs font-bold tracking-wider border-[2px] border-black rounded-lg shadow-[4px_4px_0_black] btn-shine"
          style={{ fontFamily: 'var(--font-space-mono), monospace' }}
        >
          SELECT A TASK
        </button>
      </div>
    );
  }

  const isYellowFocusCard = projectColor === 'yellow';

  return (
    <div className="mb-6 md:mb-8 relative">
      <div className="absolute top-2 right-2 z-40 flex items-center gap-1 rounded-full border border-black/25 bg-black/25 p-1 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => setFocusLayout('single')}
          className={cn('px-2 py-1 text-[9px] rounded-full border flex items-center gap-1', focusLayout === 'single' ? 'bg-[var(--brand-yellow)] text-black border-black' : 'bg-transparent text-white border-white/35')}
        >
          <Maximize2 className="w-3 h-3" /> Single
        </button>
        <button
          type="button"
          onClick={() => setFocusLayout('multi')}
          className={cn('px-2 py-1 text-[9px] rounded-full border flex items-center gap-1', focusLayout === 'multi' ? 'bg-[var(--brand-yellow)] text-black border-black' : 'bg-transparent text-white border-white/35')}
        >
          <Layers3 className="w-3 h-3" /> Deck
        </button>
      </div>

      {focusLayout === 'single' && activeFocusTasks.length > 1 && (
        <>
          <motion.div style={{ opacity: swipeLeftOpacity }} className="pointer-events-none absolute inset-y-0 left-0 w-28 md:w-40 rounded-l-lg bg-gradient-to-r from-black/45 to-transparent z-30 flex items-center justify-center">
            <span className="text-white text-[9px] md:text-xs uppercase tracking-[2px] font-bold">Next</span>
          </motion.div>
          <motion.div style={{ opacity: swipeRightOpacity }} className="pointer-events-none absolute inset-y-0 right-0 w-28 md:w-40 rounded-r-lg bg-gradient-to-l from-black/45 to-transparent z-30 flex items-center justify-center">
            <span className="text-white text-[9px] md:text-xs uppercase tracking-[2px] font-bold">Previous</span>
          </motion.div>
          <motion.div style={{ opacity: swipeProgress }} className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-10 text-[9px] uppercase tracking-[2px] rounded-full border border-black/30 px-2 py-0.5 bg-black/25 text-white backdrop-blur-md z-30">
            Release past the edge to switch cards
          </motion.div>
          <button
            type="button"
            data-no-swipe="1"
            onPointerDown={(event) => handleArrowSwipe(-1, event)}
            onClick={(event) => { event.preventDefault(); event.stopPropagation(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-50 bg-black/35 hover:bg-black/55 text-white p-2 rounded-full border border-white/30 shadow-[2px_2px_0_black]"
            title={`Previous: ${previousTask?.title || 'Task'}`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            data-no-swipe="1"
            onPointerDown={(event) => handleArrowSwipe(1, event)}
            onClick={(event) => { event.preventDefault(); event.stopPropagation(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-50 bg-black/35 hover:bg-black/55 text-white p-2 rounded-full border border-white/30 shadow-[2px_2px_0_black]"
            title={`Next: ${nextTask?.title || 'Task'}`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {focusLayout === 'multi' ? (
        <div
          className={cn(
            'border-[3px] border-black rounded-lg p-4 md:p-6 relative transition-all duration-300 shadow-[4px_4px_0_black] md:shadow-[6px_6px_0_black]',
            isYellowFocusCard && 'yellow-card-contrast',
            isCardCelebrating && 'card-gyrate'
          )}
          style={{ backgroundColor: mainColor, ...getGlowStyle() }}
        >
          <div className="mb-4 pr-24">
            <div className="text-[10px] uppercase tracking-[2px] font-bold" style={{ color: mutedTextColor, fontFamily: 'var(--font-space-mono), monospace' }}>
              Focus Deck • {activeFocusTasks.length} active mission{activeFocusTasks.length === 1 ? '' : 's'}
            </div>
            <div className="text-2xl md:text-3xl leading-tight" style={{ color: textColor, fontFamily: 'var(--font-display)' }}>
              Select the card you want to drive right now.
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {activeFocusTasks.map((task) => {
              const selected = task.id === focusTask.id;
              const taskProject = getTaskProject(task);
              const taskColor = getTaskColor(task);
              const taskProgress = getTaskProgress(task);
              const taskTextColor = (taskProject?.color || 'yellow') === 'yellow' ? 'black' : 'white';
              const yellowTask = (taskProject?.color || 'yellow') === 'yellow';
              return (
                <motion.div
                  key={task.id}
                  layout
                  onClick={() => selectTaskInDeck(task.id)}
                  whileHover={{ y: -3 }}
                  className={cn(
                    'rounded-xl border-[3px] border-black p-4 text-left cursor-pointer shadow-[4px_4px_0_black] transition-all',
                    yellowTask && 'yellow-card-contrast',
                    selected ? 'md:col-span-2 xl:col-span-2 min-h-[260px]' : 'min-h-[155px]'
                  )}
                  style={{ backgroundColor: taskColor, color: taskTextColor }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[9px] uppercase tracking-[1.6px] opacity-70" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
                        {selected ? 'Current expanded card' : 'Tap to expand'}
                      </div>
                      <div className={cn('font-bold leading-tight truncate', selected ? 'text-2xl md:text-3xl' : 'text-lg')} style={{ fontFamily: selected ? 'var(--font-display)' : undefined }}>
                        {task.title}
                      </div>
                    </div>
                    <div className="rounded-full border border-black/25 bg-black/25 px-2 py-1 text-[10px] font-bold shrink-0">
                      {taskProgress}%
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2 text-[11px] opacity-80" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
                    <span className="truncate">{task.project}</span>
                    <span>{formatDuration(task.durationHours, task.durationMinutes)}</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-black/25 overflow-hidden border border-black/20">
                    <div className="h-full bg-[linear-gradient(90deg,var(--brand-blue)_0%,var(--brand-yellow)_100%)]" style={{ width: `${taskProgress}%` }} />
                  </div>
                  {selected && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="rounded-lg bg-black/10 border border-black/20 p-3">
                        <div className="text-[10px] uppercase tracking-[1.4px] font-bold mb-1" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>Quick notes</div>
                        <div className="text-sm leading-relaxed opacity-85 line-clamp-4">{task.notes ? task.notes.replaceAll('•', '').trim() : 'No notes yet. Open details or single view to add notes.'}</div>
                      </div>
                      <div className="rounded-lg bg-black/10 border border-black/20 p-3">
                        <div className="text-[10px] uppercase tracking-[1.4px] font-bold mb-1" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>Subtasks</div>
                        <div className="space-y-1 text-sm">
                          {(task.subtasks || []).slice(0, 3).map((subtask) => (
                            <div key={subtask.id} className="flex gap-2">
                              <span>{subtask.done ? '✓' : '○'}</span>
                              <span className={cn('truncate', subtask.done && 'line-through opacity-60')}>{subtask.text}</span>
                            </div>
                          ))}
                          {(task.subtasks || []).length === 0 && <div className="opacity-70">No subtasks yet.</div>}
                        </div>
                      </div>
                      <div className="md:col-span-2 flex flex-wrap gap-2">
                        <button onClick={(event) => { event.stopPropagation(); updateTask(task.id, { status: 'done', progress: 100, completedAt: new Date().toISOString(), previousStatusBeforeDone: task.status }); }} className="px-3 py-1.5 bg-[var(--brand-green)] text-white text-xs font-bold border-[2px] border-black rounded-lg">Complete</button>
                        <button onClick={(event) => { event.stopPropagation(); handleOpenDetails(task.id); }} className="px-3 py-1.5 bg-[var(--brand-blue)] text-white text-xs font-bold border-[2px] border-black rounded-lg">Open details</button>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={focusTask.id}
            initial={{ x: swipeDirection > 0 ? 145 : -145, opacity: 0.35, scale: 0.96, rotate: swipeDirection > 0 ? 3 : -3 }}
            animate={{ x: 0, opacity: 1, scale: 1, rotate: 0 }}
            exit={{ x: swipeDirection > 0 ? -260 : 260, opacity: 0.1, scale: 0.97, rotate: swipeDirection > 0 ? -9 : 9 }}
            transition={{ duration: 0.28, ease: [0.25, 1, 0.3, 1] }}
            drag={activeFocusTasks.length > 1 ? 'x' : false}
            dragDirectionLock
            dragElastic={0.12}
            dragMomentum={false}
            dragSnapToOrigin
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            style={{ x: focusSwipeX, rotate: focusSwipeRotate, touchAction: 'pan-y', backgroundColor: mainColor, ...getGlowStyle() }}
            whileDrag={{ scale: 1.015, cursor: 'grabbing' }}
            className={cn(
              'border-[3px] border-black rounded-lg p-4 md:p-8 relative transition-shadow duration-300 grid grid-cols-1 lg:grid-cols-[1fr_1.5fr_1fr] gap-6 md:gap-8 shadow-[4px_4px_0_black] md:shadow-[6px_6px_0_black] cursor-grab active:cursor-grabbing select-none',
              isYellowFocusCard && 'yellow-card-contrast',
              isCardCelebrating && 'card-gyrate'
            )}
          >
            <div className="lg:border-r-[2px] lg:border-dashed lg:border-black/20 lg:pr-5 flex flex-col" data-no-swipe="1">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-[var(--brand-red)]" />
                <div className="text-[10px] tracking-[1.5px] uppercase font-bold text-[var(--brand-blue)]" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>NOTES</div>
              </div>
              <div className={cn('flex-1 min-h-[110px] lg:min-h-0 rounded-xl overflow-hidden transition-all duration-300', editingNotes && 'ring-2 ring-[var(--brand-blue)] ring-offset-2 ring-offset-transparent')} style={{ background: isDark ? 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.08) 100%)' : 'linear-gradient(135deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.03) 100%)', backdropFilter: 'blur(8px)' }}>
                <textarea
                  key={focusTask.id}
                  value={formatNotesWithBullets(focusTask.notes)}
                  onChange={handleNotesChange}
                  onFocus={() => setEditingNotes(true)}
                  onBlur={handleNotesBlur}
                  onKeyDown={handleNotesKeyDown}
                  className={cn('w-full h-full min-h-[110px] lg:min-h-0 p-4 text-[11px] whitespace-pre-wrap leading-relaxed outline-none cursor-text resize-none bg-transparent select-text', isDark ? 'text-[var(--brand-red)]' : 'text-[#1a2a3a]')}
                  style={{ fontFamily: 'var(--font-space-mono), monospace' }}
                  placeholder="• Click here to add notes..."
                />
              </div>
            </div>

            <div className="flex flex-col items-center text-center justify-center">
              <div className="text-[40px] md:text-[50px] leading-none mb-1" style={{ color: projectColor === 'yellow' ? 'black' : 'var(--brand-yellow)' }}>★</div>
              <div className="text-[24px] md:text-[34px] leading-tight mb-2 md:mb-2.5" style={{ color: textColor, fontFamily: 'var(--font-display)' }}>{focusTask.title}</div>
              <div className="flex items-center gap-2 md:gap-2.5 text-[10px] md:text-xs mb-3 md:mb-4 flex-wrap justify-center" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
                <span className="bg-black px-2 py-0.5 rounded border-[2px] border-black font-bold text-[var(--brand-yellow)]">⏱ {duration}</span>
                <button onClick={handleProjectClick} className="flex items-center gap-1 px-2 py-0.5 rounded border-[2px] border-black font-bold bg-[var(--brand-blue)] text-white transition-all hover:bg-[var(--brand-blue-dark)] hover:-translate-y-0.5 cursor-pointer">
                  <FolderOpen className="w-3 h-3" /> {focusTask.project}
                </button>
              </div>
              <div className="w-full max-w-md h-3 bg-black/30 rounded-md border-[2px] border-black overflow-hidden mb-4 md:mb-5 relative">
                <div className="h-full transition-all duration-500" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, var(--brand-blue) 0%, var(--brand-yellow) 100%)' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[9px] font-bold" style={{ color: textColor, fontFamily: 'var(--font-space-mono), monospace' }}>{progress}%</div>
              </div>
              <div className="flex flex-col items-center gap-2 md:gap-2.5" data-no-swipe="1">
                <button onClick={handleCompleteMission} className="px-5 md:px-6 py-2 md:py-2.5 bg-[var(--brand-green)] text-white text-xs md:text-sm font-bold tracking-wider border-[2px] border-black rounded-lg shadow-[4px_4px_0_black] btn-shine" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>★ COMPLETE MISSION</button>
                <button onClick={() => handleOpenDetails()} className="px-4 py-2 bg-[var(--brand-blue)] text-white text-[10px] md:text-[11px] font-bold tracking-wider border-[2px] border-black rounded-lg flex items-center gap-1.5 shadow-[2px_2px_0_black]" style={{ fontFamily: 'var(--font-space-mono), monospace' }}><ExternalLink className="w-3 h-3" /> OPEN DETAILS</button>
                <button onClick={handleRemoveFromFocus} className="px-4 py-2 bg-black/75 text-white text-[10px] md:text-[11px] font-bold tracking-wider border-[2px] border-black rounded-lg flex items-center gap-1.5 shadow-[2px_2px_0_black]" style={{ fontFamily: 'var(--font-space-mono), monospace' }}><Trash2 className="w-3 h-3" /> REMOVE FROM FOCUS</button>
              </div>
            </div>

            <div className="lg:border-l-[2px] lg:border-dashed lg:border-black/20 lg:pl-5" data-no-swipe="1">
              <div className="flex items-center gap-2 mb-3">
                <div className="text-[10px] tracking-[1.5px] uppercase font-bold text-[var(--brand-blue)]" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>SUBTASKS</div>
                <div className="text-[9px] px-2 py-0.5 rounded-full bg-black/10 font-bold" style={{ color: textColor, fontFamily: 'var(--font-space-mono), monospace' }}>{focusTask.subtasks?.filter((subtask) => subtask.done).length || 0}/{focusTask.subtasks?.length || 0}</div>
              </div>
              <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin rounded-xl p-2" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.02) 100%)' }}>
                {focusTask.subtasks && focusTask.subtasks.length > 0 ? (
                  focusTask.subtasks.map((subtask, index) => (
                    <div key={subtask.id} className={cn('group flex items-center gap-3 text-[11px] select-none p-2.5 rounded-lg transition-all duration-200', editingSubtaskId === subtask.id ? 'bg-black/20 ring-2 ring-[var(--brand-blue)]' : 'hover:bg-black/10')} style={{ fontFamily: 'var(--font-space-mono), monospace', animationDelay: `${index * 50}ms` }}>
                      <div
                        onClick={() => {
                          const wasDone = subtask.done;
                          toggleSubtask(focusTask.id, subtask.id);
                          if (wasDone) playAppSound('subtaskToggle', soundEnabled);
                          else if (typeof window !== 'undefined') window.dispatchEvent(new Event('starrlign:subtask-complete'));
                        }}
                        className={cn('w-5 h-5 border-[2px] rounded-md flex items-center justify-center flex-shrink-0 cursor-pointer transition-all duration-200 transform hover:scale-110', subtask.done ? 'bg-[var(--brand-green)] border-[var(--brand-green)] text-white shadow-lg shadow-green-500/30' : 'border-black/30 bg-black/10 backdrop-blur-sm hover:bg-black/20')}
                      >
                        {subtask.done && <Check className="w-3 h-3 text-white" style={{ animation: 'checkmark 0.3s var(--ease-bounce)' }} />}
                      </div>
                      {editingSubtaskId === subtask.id ? (
                        <input ref={subtaskInputRef} type="text" value={editingSubtaskText} onChange={(event) => setEditingSubtaskText(event.target.value)} onBlur={handleSubtaskSave} onKeyDown={handleSubtaskKeyDown} className="flex-1 bg-transparent outline-none border-none select-text" style={{ color: textColor }} />
                      ) : (
                        <span onClick={() => { setEditingSubtaskId(subtask.id); setEditingSubtaskText(subtask.text); }} className={cn('flex-1 leading-relaxed cursor-text transition-all duration-200 select-text', subtask.done && 'line-through opacity-50')} style={{ color: textColor }}>{subtask.text}</span>
                      )}
                      <button onClick={() => { deleteSubtask(focusTask.id, subtask.id); toast.success('Subtask deleted'); }} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-black/20 rounded transition-all duration-150" style={{ color: textColor }}>
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                ) : (
                  !isAddingSubtask && <div className="text-[11px] text-center py-6 opacity-50" style={{ color: textColor, fontFamily: 'var(--font-space-mono), monospace' }}>No subtasks yet</div>
                )}
                {isAddingSubtask && (
                  <div className="flex items-center gap-3 p-2.5 bg-black/15 backdrop-blur-sm ring-2 ring-[var(--brand-blue)] rounded-lg">
                    <div className="w-5 h-5 border-[2px] border-black/30 rounded-md bg-black/10 backdrop-blur-sm flex-shrink-0" />
                    <input ref={newSubtaskRef} type="text" value={newSubtaskText} onChange={(event) => setNewSubtaskText(event.target.value)} onBlur={handleNewSubtaskSave} onKeyDown={handleNewSubtaskKeyDown} placeholder="Enter subtask..." className="flex-1 bg-transparent outline-none border-none text-[11px] placeholder:opacity-50 select-text" style={{ color: textColor, fontFamily: 'var(--font-space-mono), monospace' }} />
                  </div>
                )}
                <button onClick={() => setIsAddingSubtask(true)} className="flex items-center justify-center gap-2 text-[10px] font-bold p-2.5 rounded-lg hover:bg-black/10 transition-all duration-200 mt-1 border border-dashed border-black/20" style={{ color: textColor, fontFamily: 'var(--font-space-mono), monospace' }}>
                  <Plus className="w-3.5 h-3.5" /> ADD SUBTASK
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
