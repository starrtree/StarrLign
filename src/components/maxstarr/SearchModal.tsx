'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Search, X, FileText, CheckCircle, Clock, AlertCircle, ArrowRight, Folder, Hash } from 'lucide-react';

interface SearchResult {
  type: 'task' | 'project' | 'document' | 'tag';
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}

export default function SearchModal() {
  const { 
    isSearchOpen, 
    setSearchOpen,
    searchQuery,
    setSearchQuery,
    tasks,
    projects,
    documents,
    tags,
    setCurrentView,
    setSelectedProjectId,
    setSelectedDocumentId,
    setEditingTaskId,
    setModalOpen,
    setDetailMode,
    toggleTagFilter
  } = useStore();

  if (!isSearchOpen) return null;

  return (
    <SearchModalContent
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      setSearchOpen={setSearchOpen}
      tasks={tasks}
      projects={projects}
      documents={documents}
      tags={tags}
      setCurrentView={setCurrentView}
      setSelectedProjectId={setSelectedProjectId}
      setSelectedDocumentId={setSelectedDocumentId}
      setEditingTaskId={setEditingTaskId}
      setModalOpen={setModalOpen}
      setDetailMode={setDetailMode}
      toggleTagFilter={toggleTagFilter}
    />
  );
}

function SearchModalContent({
  searchQuery,
  setSearchQuery,
  setSearchOpen,
  tasks,
  projects,
  documents,
  tags,
  setCurrentView,
  setSelectedProjectId,
  setSelectedDocumentId,
  setEditingTaskId,
  setModalOpen,
  setDetailMode,
  toggleTagFilter
}: {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  setSearchOpen: (open: boolean) => void;
  tasks: typeof useStore.getState extends () => infer R ? R['tasks'] : never;
  projects: typeof useStore.getState extends () => infer R ? R['projects'] : never;
  documents: typeof useStore.getState extends () => infer R ? R['documents'] : never;
  tags: typeof useStore.getState extends () => infer R ? R['tags'] : never;
  setCurrentView: (view: string) => void;
  setSelectedProjectId: (id: string | null) => void;
  setSelectedDocumentId: (id: string | null) => void;
  setEditingTaskId: (id: string | null) => void;
  setModalOpen: (open: boolean) => void;
  setDetailMode: (mode: boolean) => void;
  toggleTagFilter: (tag: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSearchOpen]);

  const handleClose = () => {
    setSearchOpen(false);
    setSearchQuery('');
  };

  // Build search results
  const searchLower = searchQuery.toLowerCase().trim();
  
  const results: SearchResult[] = useMemo(() => {
    const res: SearchResult[] = [];
    
    if (searchLower.length < 1) return res;

    // Search tasks
    tasks
      .filter(t => !t.isArchived)
      .filter(t => 
        t.title.toLowerCase().includes(searchLower) ||
        t.project.toLowerCase().includes(searchLower) ||
        t.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
        t.notes?.toLowerCase().includes(searchLower)
      )
      .slice(0, 8)
      .forEach(task => {
        res.push({
          type: 'task',
          id: task.id,
          title: task.title,
          subtitle: `${task.project} • ${task.priority} priority`,
          icon: task.status === 'done' ? <CheckCircle className="w-4 h-4 text-green-500" /> :
                task.status === 'doing' ? <Clock className="w-4 h-4 text-[var(--brand-yellow)]" /> :
                task.status === 'review' ? <AlertCircle className="w-4 h-4 text-[var(--brand-red)]" /> :
                <Clock className="w-4 h-4 text-[var(--gray-400)]" />
        });
      });

    // Search projects
    projects
      .filter(p => !p.isArchived)
      .filter(p => 
        p.name.toLowerCase().includes(searchLower)
      )
      .slice(0, 5)
      .forEach(project => {
        res.push({
          type: 'project',
          id: project.id,
          title: `${project.icon} ${project.name}`,
          subtitle: project.due || 'No due date',
          icon: <Folder className="w-4 h-4 text-[var(--brand-blue)]" />
        });
      });

    // Search documents
    documents
      .filter(d => !d.isArchived)
      .filter(d => 
        d.title.toLowerCase().includes(searchLower) ||
        d.blocks.some(b => b.content.toLowerCase().includes(searchLower))
      )
      .slice(0, 5)
      .forEach(doc => {
        res.push({
          type: 'document',
          id: doc.id,
          title: doc.title || 'Untitled Document',
          subtitle: `${doc.wordCount} words`,
          icon: <FileText className="w-4 h-4 text-[var(--brand-blue)]" />
        });
      });

    // Search tags
    tags
      .filter(tag => tag.toLowerCase().includes(searchLower))
      .slice(0, 6)
      .forEach(tag => {
        const taskCount = tasks.filter(t => t.tags.includes(tag) && !t.isArchived).length;
        res.push({
          type: 'tag',
          id: tag,
          title: `#${tag}`,
          subtitle: `${taskCount} task${taskCount !== 1 ? 's' : ''}`,
          icon: <Hash className="w-4 h-4 text-[var(--brand-red)]" />
        });
      });

    return res;
  }, [searchLower, tasks, projects, documents, tags]);

  const handleSelect = (result: SearchResult) => {
    switch (result.type) {
      case 'task':
        setEditingTaskId(result.id);
        setDetailMode(true);
        setModalOpen(true);
        break;
      case 'project':
        setSelectedProjectId(result.id);
        setCurrentView('projects');
        break;
      case 'document':
        setSelectedDocumentId(result.id);
        setCurrentView('documents');
        break;
      case 'tag':
        toggleTagFilter(result.id);
        setCurrentView('kanban');
        break;
    }
    handleClose();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-start justify-center z-[200] pt-[10vh] p-4"
      onClick={handleClose}
    >
      <div 
        className="bg-white dark:bg-[#1a1a1a] border-[3px] border-black rounded-lg shadow-[8px_8px_0_black] w-full max-w-xl animate-in fade-in-0 zoom-in-95 duration-200 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b-[2px] border-black dark:border-[#333]">
          <Search className="w-5 h-5 text-[var(--gray-400)]" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search tasks, projects, documents, tags..."
            className="flex-1 text-base outline-none bg-transparent dark:text-white"
            style={{ fontFamily: 'var(--font-body), sans-serif' }}
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 bg-[var(--gray-100)] dark:bg-[#333] border border-[var(--gray-300)] dark:border-[#444] rounded text-[10px] text-[var(--gray-500)] dark:text-[var(--gray-400)]" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
            ESC
          </kbd>
          <button 
            onClick={handleClose}
            className="p-1 hover:bg-[var(--gray-100)] dark:hover:bg-[#333] rounded transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-[var(--gray-400)]" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {searchLower.length < 1 ? (
            <div className="p-8 text-center text-[var(--gray-400)]">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
                Start typing to search everything
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-[var(--gray-400)]">
              <p className="text-sm" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
                No results found for "{searchQuery}"
              </p>
            </div>
          ) : (
            <div className="py-2">
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSelect(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left cursor-pointer",
                    index === selectedIndex 
                      ? "bg-[var(--brand-yellow)] text-black" 
                      : "hover:bg-[var(--gray-100)] dark:hover:bg-[#333]"
                  )}
                >
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-lg border-[2px] border-black",
                    index === selectedIndex ? "bg-black text-white" : "bg-white dark:bg-[#2a2a2a]"
                  )}>
                    {result.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={cn(
                      "font-medium text-sm truncate",
                      index === selectedIndex ? "text-black" : "dark:text-white"
                    )}>
                      {result.title}
                    </div>
                    <div className={cn(
                      "text-[10px]",
                      index === selectedIndex ? "text-black/70" : "text-[var(--gray-500)]"
                    )} style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
                      {result.type.toUpperCase()} • {result.subtitle}
                    </div>
                  </div>
                  <ArrowRight className={cn(
                    "w-4 h-4",
                    index === selectedIndex ? "text-black/50" : "text-[var(--gray-300)]"
                  )} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t-[2px] border-black dark:border-[#333] bg-[var(--gray-100)] dark:bg-[#222] flex items-center justify-between">
          <div className="flex items-center gap-3 text-[10px] text-[var(--gray-500)]" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-[#333] border border-[var(--gray-300)] dark:border-[#444] rounded text-[9px]">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-[#333] border border-[var(--gray-300)] dark:border-[#444] rounded text-[9px]">↓</kbd>
              to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-[#333] border border-[var(--gray-300)] dark:border-[#444] rounded text-[9px]">↵</kbd>
              to select
            </span>
          </div>
          <span className="text-[10px] text-[var(--gray-400)]" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
            ⌘K to toggle
          </span>
        </div>
      </div>
    </div>
  );
}
