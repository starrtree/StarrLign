'use client';

import { useStore } from '@/lib/store';
import { Task } from '@/lib/types';
import TaskCard from './TaskCard';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { Filter, X } from 'lucide-react';

interface TagFilterBadgeProps {
  tag: string;
}

function TagFilterBadge({ tag }: TagFilterBadgeProps) {
  const { toggleTagFilter } = useStore();

  return (
    <div
      className="flex items-center gap-1.5 text-[10px] px-2 py-1 bg-[var(--brand-red)] text-white border-[2px] border-black rounded cursor-pointer hover:bg-[var(--brand-red)]/80 transition-colors"
      style={{ fontFamily: 'var(--font-space-mono), monospace' }}
      onClick={() => toggleTagFilter(tag)}
      title="Click to remove this tag filter"
    >
      #{tag}
      <X className="w-3 h-3" />
    </div>
  );
}

interface KanbanColumnProps {
  id: Task['status'];
  label: string;
  headerBg: string;
  bodyBg: string;
  countBg: string;
  countText: string;
  tasks: Task[];
  onDrop: (taskId: string, newStatus: Task['status']) => void;
}

function KanbanColumn({ id, label, headerBg, bodyBg, countBg, countText, tasks, onDrop }: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const { theme } = useStore();
  const isDark = theme === 'dark';

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      onDrop(taskId, id);
    }
  };

  return (
    <div
      className={cn(
        'border-[3px] border-black rounded-lg flex flex-col transition-all duration-200 shadow-[4px_4px_0_black]',
        isDragOver && 'border-[var(--brand-yellow)] scale-[1.02]'
      )}
    >
      <div className={cn('px-3 py-2.5 border-b-[3px] border-black flex items-center justify-between rounded-t-lg', headerBg)}>
        <h4
          className="text-sm tracking-wide text-white"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {label}
        </h4>
        <span
          className={cn(
            'text-[10px] px-2 py-0.5 rounded-full border-[2px] border-black font-bold',
            countBg,
            countText
          )}
          style={{ fontFamily: 'var(--font-space-mono), monospace' }}
        >
          {tasks.length}
        </span>
      </div>

      <div
        className={cn(
          'p-2 overflow-y-auto flex flex-col gap-2 min-h-[150px] max-h-[400px] rounded-b-lg transition-all',
          bodyBg,
          isDragOver && 'ring-2 ring-[var(--brand-yellow)] ring-inset'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {tasks.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-white/50 text-[10px] py-4" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
            Drop tasks here
          </div>
        ) : (
          tasks.map(task => <TaskCard key={task.id} task={task} />)
        )}
      </div>
    </div>
  );
}

type StatusFilter = 'all' | Task['status'];

function getInitialStatusFilter(): StatusFilter {
  if (typeof window === 'undefined') return 'all';
  const stored = window.localStorage.getItem('starrlign-task-status-filter');
  return ['all', 'todo', 'doing', 'review', 'done'].includes(stored || '') ? (stored as StatusFilter) : 'all';
}

export default function KanbanBoard() {
  const { tasks, projects, projectCategories, tags, updateTask, tagFilter, toggleTagFilter, clearTagFilter, searchQuery } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<'all' | string>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(getInitialStatusFilter);

  useEffect(() => {
    const handleStatusFilter = (event: Event) => {
      const detail = (event as CustomEvent<{ filter?: StatusFilter }>).detail;
      const nextFilter = detail?.filter || getInitialStatusFilter();
      setStatusFilter(nextFilter);
      if (typeof window !== 'undefined') window.localStorage.setItem('starrlign-task-status-filter', nextFilter);
    };

    window.addEventListener('starrlign:task-status-filter', handleStatusFilter);
    return () => window.removeEventListener('starrlign:task-status-filter', handleStatusFilter);
  }, []);

  const activeTasks = tasks.filter(t => {
    if (t.isArchived) return false;

    if (tagFilter.length > 0) {
      const hasAllTags = tagFilter.every(tag => t.tags.includes(tag));
      if (!hasAllTags) return false;
    }

    if (selectedCategory !== 'all') {
      const belongsToCategory = projects.some(
        (project) =>
          project.category === selectedCategory &&
          (project.name === t.project || (t.linkedProjects || []).includes(project.name))
      );
      if (!belongsToCategory) return false;
    }

    if (statusFilter !== 'all' && t.status !== statusFilter) return false;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = t.title.toLowerCase().includes(query);
      const matchesProject = t.project.toLowerCase().includes(query);
      const matchesTags = t.tags.some(tag => tag.toLowerCase().includes(query));
      const matchesNotes = t.notes?.toLowerCase().includes(query);
      if (!matchesTitle && !matchesProject && !matchesTags && !matchesNotes) return false;
    }

    return true;
  });

  const handleDrop = (taskId: string, newStatus: Task['status']) => {
    updateTask(taskId, { status: newStatus });
  };

  const clearStatusFilter = () => {
    setStatusFilter('all');
    if (typeof window !== 'undefined') window.localStorage.setItem('starrlign-task-status-filter', 'all');
  };

  const columns = [
    {
      id: 'todo' as const,
      label: 'TO DO',
      headerBg: 'bg-[var(--gray-600)]',
      bodyBg: 'bg-[var(--gray-400)]',
      countBg: 'bg-[var(--brand-yellow)]',
      countText: 'text-black',
    },
    {
      id: 'doing' as const,
      label: 'IN PROGRESS',
      headerBg: 'bg-[var(--brand-blue)]',
      bodyBg: 'bg-[var(--brand-blue-dark)]',
      countBg: 'bg-[var(--brand-yellow)]',
      countText: 'text-black',
    },
    {
      id: 'review' as const,
      label: 'IN REVIEW',
      headerBg: 'bg-[var(--brand-yellow)]',
      bodyBg: 'bg-[var(--brand-yellow-dark)]',
      countBg: 'bg-black',
      countText: 'text-white',
    },
    {
      id: 'done' as const,
      label: 'DONE',
      headerBg: 'bg-[var(--brand-green)]',
      bodyBg: 'bg-[var(--brand-green)]/70',
      countBg: 'bg-white',
      countText: 'text-black',
    },
  ];

  const visibleColumns = statusFilter === 'all' ? columns : columns.filter((column) => column.id === statusFilter);

  return (
    <div className="space-y-4">
      <div className="bg-[var(--brand-blue)] border-[2px] border-black rounded-lg shadow-[3px_3px_0_black] p-3 md:p-4 space-y-3">
        <div className="flex items-center gap-2 text-[var(--brand-yellow)]">
          <Filter className="w-4 h-4" />
          <span className="text-[11px] tracking-wider" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
            FILTER ALL TASKS
          </span>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <label
            className="text-[10px] text-white/80"
            style={{ fontFamily: 'var(--font-space-mono), monospace' }}
          >
            Category:
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-[11px] px-2.5 py-1.5 border-[2px] border-black rounded bg-[var(--brand-yellow)] text-black"
            style={{ fontFamily: 'var(--font-space-mono), monospace' }}
          >
            <option value="all">All categories</option>
            {projectCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {selectedCategory !== 'all' && (
            <button
              onClick={() => setSelectedCategory('all')}
              className="text-[10px] px-2 py-1 bg-white/20 text-white border border-white/30 rounded"
              style={{ fontFamily: 'var(--font-space-mono), monospace' }}
            >
              Reset category
            </button>
          )}
          {statusFilter !== 'all' && (
            <button
              onClick={clearStatusFilter}
              className="text-[10px] px-2 py-1 bg-[var(--brand-yellow)] text-black border-[2px] border-black rounded font-bold"
              style={{ fontFamily: 'var(--font-space-mono), monospace' }}
            >
              Showing {statusFilter.toUpperCase()} ✕
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {tags.slice(0, 14).map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTagFilter(tag)}
              className={cn(
                'text-[10px] px-2 py-1 border-[1.5px] border-black rounded transition-colors',
                tagFilter.includes(tag)
                  ? 'bg-[var(--brand-red)] text-white'
                  : 'bg-white/20 text-white hover:bg-white/30'
              )}
              style={{ fontFamily: 'var(--font-space-mono), monospace' }}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {tagFilter.length > 0 && (
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-xs text-[var(--gray-500)]" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
            Filtering by:
          </span>
          {tagFilter.map((tag) => (
            <TagFilterBadge key={tag} tag={tag} />
          ))}
          <button
            onClick={() => clearTagFilter()}
            className="text-[10px] px-2 py-1 bg-black/10 hover:bg-black/20 text-black/70 rounded border border-black/20 transition-colors"
            style={{ fontFamily: 'var(--font-space-mono), monospace' }}
          >
            Clear All
          </button>
        </div>
      )}

      <div className={cn('grid grid-cols-1 gap-4', statusFilter === 'all' && 'md:grid-cols-2')}>
        {visibleColumns.map(col => (
          <KanbanColumn
            key={col.id}
            {...col}
            tasks={activeTasks.filter(t => t.status === col.id)}
            onDrop={handleDrop}
          />
        ))}
      </div>
    </div>
  );
}
