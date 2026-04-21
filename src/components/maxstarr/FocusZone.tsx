'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useStore, formatDuration } from '@/lib/store';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Plus, Trash2, ExternalLink, Check, FolderOpen, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence, PanInfo, motion, useMotionValue, useTransform } from 'framer-motion';
import { playAppSound } from '@/lib/sound';

export default function FocusZone() {
  const { 
    tasks, 
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
    projects,
    theme,
    soundEnabled
  } = useStore();
  
  const activeFocusTasks = useMemo(
    () => tasks.filter(t => t.status === 'doing' && !t.isArchived),
    [tasks]
  );
  const [focusIndex, setFocusIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState(1);
  const touchStartXRef = useRef<number | null>(null);
  const focusTask = activeFocusTasks[focusIndex] ?? activeFocusTasks[0];

  useEffect(() => {
    if (focusIndex > activeFocusTasks.length - 1) {
      setFocusIndex(Math.max(activeFocusTasks.length - 1, 0));
    }
  }, [activeFocusTasks.length, focusIndex]);

  // Local state for editing
  const [editingNotes, setEditingNotes] = useState(false);
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editingSubtaskText, setEditingSubtaskText] = useState('');
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [isCardCelebrating, setIsCardCelebrating] = useState(false);

  const subtaskInputRef = useRef<HTMLInputElement>(null);
  const newSubtaskRef = useRef<HTMLInputElement>(null);

  // Get project color for theming
  const focusProject = projects.find(p => p.name === focusTask?.project);
  const projectColor = focusProject?.color || 'yellow';
  
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

  useEffect(() => {
    if (isAddingSubtask && newSubtaskRef.current) {
      newSubtaskRef.current.focus();
    }
  }, [isAddingSubtask]);

  useEffect(() => {
    if (editingSubtaskId && subtaskInputRef.current) {
      subtaskInputRef.current.focus();
      subtaskInputRef.current.select();
    }
  }, [editingSubtaskId]);

  const handleCompleteMission = () => {
    if (focusTask) {
      updateTask(focusTask.id, { status: 'done', progress: 100 });
      toast.success('Mission completed! 🎉');
      setIsCardCelebrating(true);
      setTimeout(() => setIsCardCelebrating(false), 1450);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('starrlign:task-complete'));
      }
    }
  };

  const handleOpenDetails = () => {
    if (focusTask) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('starrlign:ui-open'));
      }
      setEditingTaskId(focusTask.id);
      setDetailMode(true);
      setModalOpen(true);
    }
  };

  const handleSwipeTask = (direction: 1 | -1) => {
    if (activeFocusTasks.length <= 1) return;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('starrlign:task-swipe'));
    }
    setSwipeDirection(direction);
    setFocusIndex((prev) => {
      const next = prev + direction;
      if (next < 0) return activeFocusTasks.length - 1;
      if (next >= activeFocusTasks.length) return 0;
      return next;
    });
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) < 75 && Math.abs(info.velocity.x) < 450) return;
    handleSwipeTask(info.offset.x > 0 ? -1 : 1);
  };

  const handleSelectTask = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('starrlign:ui-close'));
    }
    setCurrentView('kanban');
  };

  const handleProjectClick = () => {
    if (focusTask) {
      const project = projects.find(p => p.name === focusTask.project);
      if (project) {
        setSelectedProjectId(project.id);
        setCurrentView('projects');
      }
    }
  };

  const handleNotesBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setEditingNotes(false);
    const newNotes = e.currentTarget.value || '';
    if (focusTask && newNotes !== focusTask.notes) {
      updateTask(focusTask.id, { notes: newNotes });
      toast.success('Notes saved');
    }
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (focusTask) {
      updateTask(focusTask.id, { notes: e.target.value });
    }
  };

  const handleNotesKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;
      
      // Find the start of the current line
      let lineStart = start - 1;
      while (lineStart >= 0 && value[lineStart] !== '\n') {
        lineStart--;
      }
      lineStart++;
      
      // Get the current line
      const currentLine = value.substring(lineStart, start);
      
      // Check if the current line is empty (just a bullet)
      if (currentLine.trim() === '•' || currentLine.trim() === '• ') {
        // Remove the empty bullet and move to previous line
        const newValue = value.substring(0, lineStart) + value.substring(start);
        if (focusTask) {
          updateTask(focusTask.id, { notes: newValue });
        }
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = lineStart;
        }, 0);
        return;
      }
      
      // Insert new bullet point
      const newValue = value.substring(0, start) + '\n• ' + value.substring(end);
      if (focusTask) {
        updateTask(focusTask.id, { notes: newValue });
      }
      
      // Set cursor position after the new bullet
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 3;
      }, 0);
    }
  };

  // Format notes with bullet points
  const formatNotesWithBullets = (notes: string): string => {
    if (!notes) return '• ';
    
    // Split by existing bullet points or newlines
    const lines = notes.split('\n');
    const bulletedLines = lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('•')) return line;
      return '• ' + trimmed;
    }).filter(line => line !== '');
    
    return bulletedLines.join('\n') || '• ';
  };

  const handleSubtaskEdit = (subtaskId: string, currentText: string) => {
    setEditingSubtaskId(subtaskId);
    setEditingSubtaskText(currentText);
  };

  const handleSubtaskSave = () => {
    if (focusTask && editingSubtaskId) {
      if (editingSubtaskText.trim()) {
        updateSubtask(focusTask.id, editingSubtaskId, editingSubtaskText.trim());
      }
      setEditingSubtaskId(null);
      setEditingSubtaskText('');
    }
  };

  const handleSubtaskKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubtaskSave();
    } else if (e.key === 'Escape') {
      setEditingSubtaskId(null);
      setEditingSubtaskText('');
    }
  };

  const handleSubtaskDelete = (subtaskId: string) => {
    if (focusTask) {
      deleteSubtask(focusTask.id, subtaskId);
      toast.success('Subtask deleted');
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

  const handleNewSubtaskKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNewSubtaskSave();
    } else if (e.key === 'Escape') {
      setIsAddingSubtask(false);
      setNewSubtaskText('');
    }
  };

  const progress = useMemo(() => {
    if (!focusTask) return 0;
    if (focusTask.subtasks && focusTask.subtasks.length > 0) {
      const done = focusTask.subtasks.filter(s => s.done).length;
      return Math.round((done / focusTask.subtasks.length) * 100);
    }
    return focusTask.progress || 0;
  }, [focusTask]);

  const isDark = theme === 'dark';
  const swipeX = useMotionValue(0);
  const swipeRotate = useTransform(swipeX, [-260, 0, 260], [-10, 0, 10]);
  const swipeLeftOpacity = useTransform(swipeX, [-220, -70, 0], [0.8, 0.45, 0]);
  const swipeRightOpacity = useTransform(swipeX, [0, 70, 220], [0, 0.45, 0.8]);
  const swipeProgress = useTransform(swipeX, [-220, 0, 220], [1, 0, 1]);

  const previousTask = activeFocusTasks[(focusIndex - 1 + activeFocusTasks.length) % activeFocusTasks.length];
  const nextTask = activeFocusTasks[(focusIndex + 1) % activeFocusTasks.length];

  const getGlowStyle = () => {
    if (progress === 0) return {};
    
    const intensity = Math.min(progress / 100, 1);
    
    if (isDark) {
      const alpha = 0.7 + (intensity * 0.3);
      return {
        boxShadow: `0 0 ${15 + progress * 0.4}px rgba(237, 28, 36, ${alpha}), 0 0 ${30 + progress * 0.6}px rgba(237, 28, 36, ${alpha * 0.6})`,
      };
    } else {
      const alpha = 0.5 + (intensity * 0.4);
      return {
        boxShadow: `0 0 ${8 + progress * 0.15}px rgba(255, 209, 0, ${alpha}), 0 0 ${15 + progress * 0.25}px rgba(255, 209, 0, ${alpha * 0.5})`,
      };
    }
  };

  if (!focusTask) {
    return (
      <div
        className="border-[3px] border-black rounded-lg p-8 md:p-16 mb-6 md:mb-8 relative shadow-[4px_4px_0_black] md:shadow-[6px_6px_0_black] transition-all duration-200 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_black] md:hover:shadow-[8px_8px_0_black] text-center"
        style={{ backgroundColor: mainColor }}
      >
        <div
          className="text-[40px] md:text-[50px] leading-none mb-1 star-glow-red"
          style={{ color: projectColor === 'yellow' ? 'black' : 'var(--brand-yellow)' }}
        >
          ★
        </div>
        <div
          className="text-[9px] md:text-[10px] tracking-[1.5px] uppercase mb-2.5 font-bold"
          style={{ color: projectColor === 'yellow' ? 'black/60' : 'white/70', fontFamily: 'var(--font-space-mono), monospace' }}
        >
          CURRENT MISSION
        </div>
        <div
          className="text-[28px] md:text-[40px] mb-4 md:mb-5 leading-tight"
          style={{ color: projectColor === 'yellow' ? 'black' : 'white', fontFamily: 'var(--font-display)' }}
        >
          NO ACTIVE MISSION
        </div>
        <div className="text-sm md:text-base mb-5"
          style={{ color: projectColor === 'yellow' ? 'black/70' : 'white/80' }}
        >
          You are free. Select a task below to begin focus mode.
        </div>
        <button
          onClick={handleSelectTask}
          className="px-4 py-2 bg-[var(--brand-blue)] text-white text-xs font-bold tracking-wider border-[2px] border-black rounded-lg cursor-pointer transition-all duration-150 shadow-[4px_4px_0_black] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_black] active:translate-x-0 active:translate-y-0 active:shadow-none btn-shine"
          style={{ fontFamily: 'var(--font-space-mono), monospace' }}
        >
          SELECT A TASK
        </button>
      </div>
    );
  }

  const duration = formatDuration(focusTask.durationHours, focusTask.durationMinutes);
  const textColor = projectColor === 'yellow' ? 'black' : 'white';
  const swipeX = useMotionValue(0);
  const swipeRotate = useTransform(swipeX, [-260, 0, 260], [-10, 0, 10]);

  return (
    <div
      onTouchStart={(e) => {
        touchStartXRef.current = e.changedTouches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        if (touchStartXRef.current === null) return;
        const endX = e.changedTouches[0]?.clientX ?? touchStartXRef.current;
        const delta = endX - touchStartXRef.current;
        if (Math.abs(delta) > 40) {
          handleSwipeTask(delta > 0 ? -1 : 1);
        }
        touchStartXRef.current = null;
      }}
      className={cn(
        "border-[3px] border-black rounded-lg p-4 md:p-8 mb-6 md:mb-8 relative transition-all duration-500 grid grid-cols-1 lg:grid-cols-[1fr_1.5fr_1fr] gap-6 md:gap-8",
        progress === 0 && "shadow-[4px_4px_0_black] md:shadow-[6px_6px_0_black]",
        isCardCelebrating && "card-gyrate"
      )}
      style={{
        backgroundColor: mainColor,
        ...getGlowStyle(),
      }}
    >
      {activeFocusTasks.length > 1 && (
        <>
          <motion.div
            style={{ opacity: swipeLeftOpacity }}
            className="pointer-events-none absolute inset-y-0 left-0 w-24 md:w-32 rounded-l-lg bg-gradient-to-r from-black/40 to-transparent z-10 flex items-center justify-center"
          >
            <span className="text-white text-[9px] md:text-xs uppercase tracking-[2px] font-bold">Next ⟶</span>
          </motion.div>
          <motion.div
            style={{ opacity: swipeRightOpacity }}
            className="pointer-events-none absolute inset-y-0 right-0 w-24 md:w-32 rounded-r-lg bg-gradient-to-l from-black/40 to-transparent z-10 flex items-center justify-center"
          >
            <span className="text-white text-[9px] md:text-xs uppercase tracking-[2px] font-bold">⟵ Previous</span>
          </motion.div>
          <div className="pointer-events-none absolute -left-3 md:-left-5 top-1/2 -translate-y-1/2 hidden md:block w-24 rounded-lg border-2 border-black/30 bg-white/20 p-2 backdrop-blur-md z-[1]">
            <div className="text-[8px] uppercase tracking-[1.5px] text-white/80">Prev Task</div>
            <div className="text-[10px] font-bold text-white truncate">{previousTask?.title || '—'}</div>
          </div>
          <div className="pointer-events-none absolute -right-3 md:-right-5 top-1/2 -translate-y-1/2 hidden md:block w-24 rounded-lg border-2 border-black/30 bg-white/20 p-2 backdrop-blur-md z-[1]">
            <div className="text-[8px] uppercase tracking-[1.5px] text-white/80">Next Task</div>
            <div className="text-[10px] font-bold text-white truncate">{nextTask?.title || '—'}</div>
          </div>
          <motion.div
            style={{ opacity: swipeProgress }}
            className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-2 text-[9px] uppercase tracking-[2px] rounded-full border border-black/30 px-2 py-0.5 bg-black/20 text-white backdrop-blur-md z-20"
          >
            Swipe to cycle missions
          </motion.div>
        </>
      )}

      {activeFocusTasks.length > 1 && (
        <>
          <button
            onClick={() => handleSwipeTask(-1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-black/25 hover:bg-black/40 text-white p-1.5 rounded-full border border-white/20"
            title="Previous active task"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleSwipeTask(1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-black/25 hover:bg-black/40 text-white p-1.5 rounded-full border border-white/20"
            title="Next active task"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={focusTask.id}
          initial={{
            x: swipeDirection > 0 ? 130 : -130,
            opacity: 0.45,
            scale: 0.9,
            rotate: swipeDirection > 0 ? 5 : -5,
          }}
          animate={{
            x: 0,
            opacity: 1,
            scale: [1.03, 1],
            rotate: [swipeDirection > 0 ? -1.5 : 1.5, 0],
          }}
          exit={{
            x: swipeDirection > 0 ? -220 : 220,
            opacity: 0,
            scale: [1, 1.06, 0.9],
            rotate: swipeDirection > 0 ? -7 : 7,
          }}
          transition={{ duration: 0.36, times: [0, 1], ease: [0.25, 1, 0.3, 1] }}
          drag={activeFocusTasks.length > 1 ? 'x' : false}
          dragElastic={0.18}
          dragMomentum
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={handleDragEnd}
          style={{ x: swipeX, rotate: swipeRotate }}
          whileDrag={{ scale: 1.02, cursor: 'grabbing' }}
          className="contents"
        >
      {/* LEFT: Notes */}
      <div className="lg:border-r-[2px] lg:border-dashed lg:border-black/20 lg:pr-5 flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-[var(--brand-red)]" />
          <div
            className="text-[10px] tracking-[1.5px] uppercase font-bold text-[var(--brand-blue)]"
            style={{ fontFamily: 'var(--font-space-mono), monospace' }}
          >
            NOTES
          </div>
        </div>
        <div
          className={cn(
            "flex-1 min-h-[100px] lg:min-h-0 rounded-xl overflow-hidden transition-all duration-300",
            editingNotes ? "ring-2 ring-[var(--brand-blue)] ring-offset-2 ring-offset-transparent" : ""
          )}
          style={{
            background: isDark 
              ? 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.08) 100%)'
              : 'linear-gradient(135deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.03) 100%)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <textarea
            key={focusTask.id}
            value={formatNotesWithBullets(focusTask.notes)}
            onChange={handleNotesChange}
            onFocus={() => setEditingNotes(true)}
            onBlur={handleNotesBlur}
            onKeyDown={handleNotesKeyDown}
            className={cn(
              "w-full h-full min-h-[100px] lg:min-h-0 p-4 text-[11px] whitespace-pre-wrap leading-relaxed outline-none cursor-text resize-none bg-transparent",
              isDark ? "text-[var(--brand-red)]" : "text-[#1a2a3a]"
            )}
            style={{ 
              fontFamily: 'var(--font-space-mono), monospace',
            }}
            placeholder="• Click here to add notes..."
          />
          <style jsx global>{`
            .dark .notes-bullet-points::first-line {
              color: var(--brand-blue);
            }
          `}</style>
        </div>
      </div>

      {/* CENTER: Main */}
      <div className="flex flex-col items-center text-center justify-center">
        <div
          className="text-[40px] md:text-[50px] leading-none mb-1 star-glow-red"
          style={{ color: projectColor === 'yellow' ? 'black' : 'var(--brand-yellow)' }}
        >
          ★
        </div>
        <div
          className="text-[24px] md:text-[32px] leading-tight mb-2 md:mb-2.5"
          style={{ color: textColor, fontFamily: 'var(--font-display)' }}
        >
          {focusTask.title}
        </div>

        <div className="flex items-center gap-2 md:gap-2.5 text-[10px] md:text-xs mb-3 md:mb-4 flex-wrap justify-center" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
          <span className="bg-black px-2 py-0.5 rounded border-[2px] border-black font-bold"
            style={{ color: projectColor === 'yellow' ? 'var(--brand-yellow)' : 'var(--brand-yellow)' }}
          >
            ⏱ {duration}
          </span>
          <button
            onClick={handleProjectClick}
            className="flex items-center gap-1 px-2 py-0.5 rounded border-[2px] border-black font-bold bg-[var(--brand-blue)] text-white transition-all hover:bg-[var(--brand-blue-dark)] hover:-translate-y-0.5 cursor-pointer"
          >
            <FolderOpen className="w-3 h-3" />
            {focusTask.project}
          </button>
        </div>

        {/* Progress Bar - Blue to Yellow Gradient */}
        <div className="w-full max-w-md h-3 bg-black/30 rounded-md border-[2px] border-black overflow-hidden mb-4 md:mb-5 relative">
          <div
            className="h-full transition-all duration-500"
            style={{ 
              width: `${progress}%`, 
              background: `linear-gradient(90deg, var(--brand-blue) 0%, var(--brand-yellow) 100%)`
            }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[9px] font-bold"
            style={{ color: textColor, fontFamily: 'var(--font-space-mono), monospace' }}
          >
            {progress}%
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 md:gap-2.5">
          <div className="flex gap-2">
            <button
              onClick={handleCompleteMission}
              className="px-5 md:px-6 py-2 md:py-2.5 bg-[var(--brand-green)] text-white text-xs md:text-sm font-bold tracking-wider border-[2px] border-black rounded-lg cursor-pointer transition-all duration-150 shadow-[4px_4px_0_black] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_black] active:translate-x-0 active:translate-y-0 active:shadow-none btn-shine"
              style={{ fontFamily: 'var(--font-space-mono), monospace' }}
            >
              ★ COMPLETE MISSION
            </button>
          </div>
          <button
            onClick={handleOpenDetails}
            className="px-4 py-2 bg-[var(--brand-blue)] text-white text-[10px] md:text-[11px] font-bold tracking-wider border-[2px] border-black rounded-lg cursor-pointer transition-all flex items-center gap-1.5 shadow-[2px_2px_0_black] hover:shadow-[4px_4px_0_black] hover:translate-x-[-1px] hover:translate-y-[-1px]"
            style={{ fontFamily: 'var(--font-space-mono), monospace' }}
          >
            <ExternalLink className="w-3 h-3" /> OPEN DETAILS
          </button>
        </div>
      </div>

      {/* RIGHT: Subtasks */}
      <div className="lg:border-l-[2px] lg:border-dashed lg:border-black/20 lg:pl-5">
        <div className="flex items-center gap-2 mb-3">
          <div
            className="text-[10px] tracking-[1.5px] uppercase font-bold text-[var(--brand-blue)]"
            style={{ fontFamily: 'var(--font-space-mono), monospace' }}
          >
            SUBTASKS
          </div>
          <div
            className="text-[9px] px-2 py-0.5 rounded-full bg-black/10 font-bold"
            style={{ color: textColor, fontFamily: 'var(--font-space-mono), monospace' }}
          >
            {focusTask.subtasks?.filter(s => s.done).length || 0}/{focusTask.subtasks?.length || 0}
          </div>
        </div>
        <div
          className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-1 scrollbar-thin"
          style={{
            background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.02) 100%)',
            borderRadius: '12px',
            padding: '8px',
          }}
        >
          {focusTask.subtasks && focusTask.subtasks.length > 0 ? (
            focusTask.subtasks.map((subtask, index) => (
              <div
                key={subtask.id}
                className={cn(
                  "group flex items-center gap-3 text-[11px] select-none p-2.5 rounded-lg transition-all duration-200",
                  editingSubtaskId === subtask.id 
                    ? "bg-black/20 ring-2 ring-[var(--brand-blue)]" 
                    : "hover:bg-black/10"
                )}
                style={{ 
                  fontFamily: 'var(--font-space-mono), monospace',
                  animationDelay: `${index * 50}ms`
                }}
              >
                {/* Glass-style Checkbox */}
                <div
                  onClick={() => {
                    const wasDone = subtask.done;
                    toggleSubtask(focusTask.id, subtask.id);
                    if (wasDone) {
                      playAppSound('subtaskToggle', soundEnabled);
                    } else if (typeof window !== 'undefined') {
                      window.dispatchEvent(new Event('starrlign:subtask-complete'));
                    }
                  }}
                  className={cn(
                    "w-5 h-5 border-[2px] rounded-md flex items-center justify-center flex-shrink-0 cursor-pointer transition-all duration-200 transform hover:scale-110",
                    subtask.done 
                      ? "bg-[var(--brand-green)] border-[var(--brand-green)] text-white shadow-lg shadow-green-500/30" 
                      : "border-black/30 bg-black/10 backdrop-blur-sm hover:bg-black/20"
                  )}
                >
                  {subtask.done && (
                    <Check className="w-3 h-3 text-white" style={{ animation: 'checkmark 0.3s var(--ease-bounce)' }} />
                  )}
                </div>
                
                {/* Text */}
                {editingSubtaskId === subtask.id ? (
                  <input
                    ref={subtaskInputRef}
                    type="text"
                    value={editingSubtaskText}
                    onChange={(e) => setEditingSubtaskText(e.target.value)}
                    onBlur={handleSubtaskSave}
                    onKeyDown={handleSubtaskKeyDown}
                    className="flex-1 bg-transparent outline-none border-none"
                    style={{ color: textColor }}
                  />
                ) : (
                  <span
                    onClick={() => handleSubtaskEdit(subtask.id, subtask.text)}
                    className={cn(
                      "flex-1 leading-relaxed cursor-text transition-all duration-200",
                      subtask.done ? "line-through opacity-50" : ""
                    )}
                    style={{ color: textColor }}
                  >
                    {subtask.text}
                  </span>
                )}

                {/* Delete button */}
                <button
                  onClick={() => handleSubtaskDelete(subtask.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-black/20 rounded transition-all duration-150"
                  style={{ color: textColor }}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))
          ) : (
            !isAddingSubtask && (
              <div
                className="text-[11px] text-center py-6 opacity-50"
                style={{ color: textColor, fontFamily: 'var(--font-space-mono), monospace' }}
              >
                No subtasks yet
              </div>
            )
          )}

          {/* Add new subtask input */}
          {isAddingSubtask && (
            <div className="flex items-center gap-3 p-2.5 bg-black/15 backdrop-blur-sm ring-2 ring-[var(--brand-blue)] rounded-lg">
              <div className="w-5 h-5 border-[2px] border-black/30 rounded-md bg-black/10 backdrop-blur-sm flex-shrink-0" />
              <input
                ref={newSubtaskRef}
                type="text"
                value={newSubtaskText}
                onChange={(e) => setNewSubtaskText(e.target.value)}
                onBlur={handleNewSubtaskSave}
                onKeyDown={handleNewSubtaskKeyDown}
                placeholder="Enter subtask..."
                className="flex-1 bg-transparent outline-none border-none text-[11px] placeholder:opacity-50"
                style={{ color: textColor, fontFamily: 'var(--font-space-mono), monospace' }}
              />
            </div>
          )}

          {/* Add subtask button */}
          <button
            onClick={() => setIsAddingSubtask(true)}
            className="flex items-center justify-center gap-2 text-[10px] font-bold p-2.5 rounded-lg hover:bg-black/10 transition-all duration-200 mt-1 border border-dashed border-black/20"
            style={{ color: textColor, fontFamily: 'var(--font-space-mono), monospace' }}
          >
            <Plus className="w-3.5 h-3.5" /> ADD SUBTASK
          </button>
        </div>
      </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
