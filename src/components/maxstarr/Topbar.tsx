'use client';

import { useStore } from '@/lib/store';
import { Search, Plus, Sparkles, Moon, Sun, CheckCircle2 } from 'lucide-react';

const viewTitles: Record<string, string> = {
  dashboard: 'FOCUS DASHBOARD',
  kanban: 'ALL TASKS',
  documents: 'DOCUMENTS',
  projects: 'PROJECTS',
  money: 'MONEY LAB',
  calendar: 'CALENDAR',
  archive: 'NEST',
};

function isToday(value?: string | null) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

export default function Topbar() {
  const {
    currentView,
    setModalOpen,
    setEditingTaskId,
    selectedProjectId,
    projects,
    selectedDocumentId,
    documents,
    setProjectModalOpen,
    setEditingProjectId,
    setSearchOpen,
    theme,
    setTheme,
    tasks,
  } = useStore();
  const isDark = theme === 'dark';

  const completedTasksToday = tasks.filter((task) => !task.isArchived && task.status === 'done' && isToday(task.completedAt)).length;
  const completedSubtasksToday = tasks.reduce(
    (count, task) => count + (task.subtasks || []).filter((subtask) => subtask.done && isToday(subtask.completedAt)).length,
    0
  );
  const dailyWins = completedTasksToday + completedSubtasksToday;

  const handleNewTask = () => {
    setEditingTaskId(null);
    setModalOpen(true);
  };

  const handleNewProject = () => {
    setEditingProjectId(null);
    setProjectModalOpen(true);
  };

  const handleToggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  let title = viewTitles[currentView];
  if (currentView === 'projects' && selectedProjectId) {
    const project = projects.find(p => p.id === selectedProjectId);
    if (project) title = project.name.toUpperCase();
  }
  if (currentView === 'documents' && selectedDocumentId) {
    const doc = documents.find(d => d.id === selectedDocumentId);
    if (doc) title = doc.title ? doc.title.toUpperCase().slice(0, 30) : 'DOCUMENT';
  }

  const showNewTaskButton = currentView !== 'documents' || !selectedDocumentId;

  return (
    <header className="bg-[var(--brand-blue)] border-b-[3px] border-black px-3 md:px-6 h-[60px] flex items-center gap-2 md:gap-4 sticky top-0 z-[90] shadow-[0_4px_0_black]">
      <div className="w-10 lg:hidden" />

      <h1
        className="text-base md:text-[22px] tracking-wide text-[var(--brand-yellow)] flex-1 overflow-x-auto whitespace-nowrap no-scrollbar min-w-0"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {title}
      </h1>

      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full border-[2px] border-black bg-white/95 text-black text-[9px] md:text-[10px] font-bold tracking-[1px] shadow-[2px_2px_0_black] whitespace-nowrap" style={{ fontFamily: 'var(--font-space-mono), monospace' }} title={`${completedTasksToday} tasks + ${completedSubtasksToday} subtasks completed today`}>
        <CheckCircle2 className="w-3 h-3 text-[var(--brand-green)]" />
        <span>{dailyWins}</span>
        <span className="hidden sm:inline">DONE TODAY</span>
      </div>

      <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full border-[2px] border-black bg-[var(--brand-yellow)] text-black text-[9px] font-bold tracking-[1.5px] shadow-[2px_2px_0_black]" style={{ fontFamily: 'var(--font-space-mono), monospace' }} title="If you can see this, the latest feature drop is deployed.">
        <Sparkles className="w-3 h-3" /> V14 LIVE
      </div>

      <button
        onClick={handleToggleTheme}
        className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border-[2px] border-black bg-white/90 text-black text-[10px] font-bold tracking-[1.2px] shadow-[2px_2px_0_black]"
        style={{ fontFamily: 'var(--font-space-mono), monospace' }}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
        {isDark ? 'LIGHT' : 'DARK'}
      </button>

      <button
        onClick={() => setSearchOpen(true)}
        className="sm:hidden inline-flex items-center justify-center w-10 h-10 border-[2px] border-black rounded-lg bg-[var(--brand-yellow)] text-black shadow-[3px_3px_0_black] flex-shrink-0"
        title="Search"
        aria-label="Open search"
      >
        <Search className="w-4 h-4" />
      </button>

      <button
        onClick={() => setSearchOpen(true)}
        className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 border-[2px] border-black rounded-lg bg-[var(--brand-yellow)] dark:bg-[var(--brand-yellow)] min-w-[180px] md:min-w-[220px] cursor-pointer transition-all duration-150 hover:shadow-[2px_2px_0_black]"
      >
        <Search className="w-3.5 h-3.5 text-black/60" />
        <span className="border-none outline-none bg-transparent flex-1 text-sm text-black/50 text-left cursor-pointer">
          Search...
        </span>
        <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 bg-black/10 rounded text-[9px] text-black/50" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
          ⌘K
        </kbd>
      </button>

      {showNewTaskButton && (
        <button
          onClick={handleNewProject}
          className="inline-flex items-center justify-center md:justify-start px-2.5 md:px-4 py-2 bg-[var(--brand-yellow)] text-white text-[10px] md:text-xs font-bold tracking-wider border-[2px] border-black rounded-lg cursor-pointer transition-all duration-150 shadow-[3px_3px_0_black] hover:shadow-[5px_5px_0_black] hover:translate-x-[-1px] hover:translate-y-[-1px] whitespace-nowrap"
          style={{ fontFamily: 'var(--font-space-mono), monospace', color: isDark ? '#000000' : '#ffffff' }}
          title="Create new project"
        >
          <span className="hidden md:inline">+ NEW PROJECT</span>
          <Plus className="w-4 h-4 md:hidden" />
        </button>
      )}

      {showNewTaskButton && (
        <button
          onClick={handleNewTask}
          className="px-3 md:px-4 py-2 bg-[var(--brand-red)] text-white text-[10px] md:text-xs font-bold tracking-wider border-[2px] border-black rounded-lg cursor-pointer transition-all duration-150 shadow-[3px_3px_0_black] hover:shadow-[5px_5px_0_black] hover:translate-x-[-1px] hover:translate-y-[-1px] whitespace-nowrap btn-shine"
          style={{ fontFamily: 'var(--font-space-mono), monospace', color: isDark ? '#000000' : '#ffffff' }}
        >
          <span className="hidden sm:inline">+ NEW TASK</span>
          <span className="sm:hidden">+ TASK</span>
        </button>
      )}
    </header>
  );
}
