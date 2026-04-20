'use client';

import { useStore, createNewProject } from '@/lib/store';
import { Search, Plus } from 'lucide-react';
import { useTheme } from 'next-themes';

const viewTitles: Record<string, string> = {
  dashboard: 'FOCUS DASHBOARD',
  kanban: 'ALL TASKS',
  documents: 'DOCUMENTS',
  projects: 'PROJECTS',
  money: 'MONEY LAB',
  calendar: 'CALENDAR',
  archive: 'NEST',
};

export default function Topbar() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { currentView, setModalOpen, setEditingTaskId, selectedProjectId, projects, selectedDocumentId, documents, setProjectModalOpen, setEditingProjectId, setSearchOpen } = useStore();

  const handleNewTask = () => {
    setEditingTaskId(null);
    setModalOpen(true);
  };

  const handleNewProject = () => {
    setEditingProjectId(null);
    setProjectModalOpen(true);
  };

  // Get the title based on current view
  let title = viewTitles[currentView];
  if (currentView === 'projects' && selectedProjectId) {
    const project = projects.find(p => p.id === selectedProjectId);
    if (project) {
      title = project.name.toUpperCase();
    }
  }
  if (currentView === 'documents' && selectedDocumentId) {
    const doc = documents.find(d => d.id === selectedDocumentId);
    if (doc) {
      title = doc.title ? doc.title.toUpperCase().slice(0, 30) : 'DOCUMENT';
    }
  }

  // Hide new task button on documents view when editing
  const showNewTaskButton = currentView !== 'documents' || !selectedDocumentId;

  return (
    <header className="bg-[var(--brand-blue)] border-b-[3px] border-black px-4 md:px-6 h-[60px] flex items-center gap-3 md:gap-4 sticky top-0 z-[90] shadow-[0_4px_0_black]">
      {/* Mobile Menu Button Space */}
      <div className="w-10 lg:hidden" />
      
      {/* Title */}
      <h1
        className="text-base md:text-[22px] tracking-wide text-[var(--brand-yellow)] flex-1 overflow-x-auto whitespace-nowrap no-scrollbar"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {title}
      </h1>

      {/* Search Bar - Opens SearchModal on click */}
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

      {/* New Project Button */}
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

      {/* New Task Button */}
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
