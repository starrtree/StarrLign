'use client';

import { useState } from 'react';
import { useStore, formatDuration, formatRelativeTime, calculateWordCount } from '@/lib/store';
import { Task } from '@/lib/types';
import { cn } from '@/lib/utils';
import { LayoutGrid, List, ArrowLeft, Calendar, Clock, CheckCircle, AlertCircle, Pencil, FileText, Plus, Filter, Archive, FolderOpen, X, Trash2 } from 'lucide-react';
import TaskCard from './TaskCard';
import { toast } from 'sonner';

type ViewMode = 'modular' | 'list';

export default function ProjectView() {
  const { 
    projects, 
    tasks, 
    setSelectedProjectId, 
    selectedProjectId, 
    setCurrentView, 
    updateTask, 
    reorderTasksInProject,
    setProjectModalOpen, 
    setEditingProjectId, 
    setEditingTaskId,
    setDetailMode,
    documents, 
    setSelectedDocumentId,
    setModalOpen,
    setAutoSetProjectForTask,
    projectCategories,
    projectFilter,
    setProjectFilter,
    deleteProjectCategory,
    isProjectModalOpen
  } = useStore();
  
  const [viewMode, setViewMode] = useState<ViewMode>('modular');
  const [showFilters, setShowFilters] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const projectTasks = selectedProject 
    ? tasks.filter(t => t.project === selectedProject.name && !t.isArchived)
    : [];
  const projectDocuments = selectedProject
    ? documents.filter(d => d.projectId === selectedProject.id && !d.isArchived)
    : [];

  // Filter projects based on projectFilter
  const filteredProjects = projects.filter(p => {
    if (projectFilter === 'active') return !p.isArchived;
    if (projectFilter === 'archived') return p.isArchived;
    if (projectFilter === 'all') return true;
    // If filter is a category ID
    if (projectFilter.startsWith('cat-')) {
      return p.category === projectFilter && !p.isArchived;
    }
    return !p.isArchived;
  });

  // Group projects by category
  const projectsByCategory = projectCategories.map(cat => ({
    ...cat,
    projects: filteredProjects.filter(p => p.category === cat.id)
  }));

  // Projects without category
  const uncategorizedProjects = filteredProjects.filter(p => !p.category);

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

  const handleNewTaskFromProject = () => {
    if (selectedProjectId) {
      setAutoSetProjectForTask(selectedProjectId);
    }
    setModalOpen(true);
  };

  // Category header component
  const CategoryHeader = ({ name, count, categoryId }: { name: string; count: number; categoryId: string }) => (
    <div className="bg-[var(--brand-blue)] px-4 py-3 rounded-lg mb-3 flex items-center justify-between shadow-[3px_3px_0_black]">
      <div className="flex items-center gap-3">
        <span className="text-sm font-bold text-[var(--brand-yellow)]" style={{ fontFamily: 'var(--font-display)' }}>
          {name.toUpperCase()}
        </span>
        <span className="text-xs text-white/60" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
          {count} {count === 1 ? 'project' : 'projects'}
        </span>
      </div>
      <button
        onClick={() => {
          if (confirm(`Delete category "${name}"? Projects will be moved to "No Category".`)) {
            deleteProjectCategory(categoryId);
            if (projectFilter === categoryId) {
              setProjectFilter('active');
            }
            toast.success(`Category "${name}" deleted`);
          }
        }}
        className="p-1 text-white/40 hover:text-[var(--brand-red)] transition-colors cursor-pointer"
        title="Delete category"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  // Project card for grid view
  const ProjectCard = ({ project }: { project: typeof projects[0] }) => {
    const projectTasks = tasks.filter(t => t.project === project.name && !t.isArchived);
    const projectTaskCount = projectTasks.length;
    
    // Calculate progress including subtasks
    let totalSubtasks = 0;
    let completedSubtasks = 0;
    let completedTasks = 0;
    
    projectTasks.forEach(t => {
      if (t.subtasks && t.subtasks.length > 0) {
        totalSubtasks += t.subtasks.length;
        completedSubtasks += t.subtasks.filter(s => s.done).length;
      }
      if (t.status === 'done') completedTasks++;
    });
    
    // Progress is based on completed tasks + subtask progress for tasks in progress
    const progress = totalSubtasks > 0 
      ? Math.round(((completedTasks * 100) + (completedSubtasks * 100 / totalSubtasks)) / (projectTaskCount + 1))
      : projectTaskCount > 0 ? Math.round((completedTasks / projectTaskCount) * 100) : 0;
    
    const cardColor = colorMap[project.color] || colorMap.gray;
    
    // Check if project has approaching deadline
    const hasApproachingDeadline = project.due && project.due !== 'idk yet' && project.due !== 'Ongoing' && (() => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDate = new Date(project.due);
      dueDate.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 7 && diffDays >= 0;
    })();
    
    return (
      <div
        key={project.id}
        onClick={() => setSelectedProjectId(project.id)}
        className={cn(
          "p-5 border-[2px] border-black rounded-lg cursor-pointer transition-all duration-200 hover:shadow-[5px_5px_0_black] hover:translate-y-[-2px] group relative",
          hasApproachingDeadline && "ring-2 ring-[var(--brand-red)] ring-offset-1"
        )}
        style={{ 
          backgroundColor: cardColor,
          color: project.color === 'yellow' ? 'black' : 'white',
          borderLeft: `6px solid ${cardColor}`,
          boxShadow: `-4px 0 0 ${cardColor}`
        }}
      >
        {/* Deadline warning */}
        {hasApproachingDeadline && (
          <div className="absolute -top-1 -right-1">
            <AlertCircle className="w-4 h-4 text-[var(--brand-red)]" />
          </div>
        )}
        
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{project.icon}</span>
            <h3
              className="text-lg font-bold group-hover:text-[var(--brand-yellow)] transition-colors drop-shadow-[1px_1px_0_rgba(0,0,0,0.5)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {project.name}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingProjectId(project.id);
                setProjectModalOpen(true);
              }}
              className="opacity-0 group-hover:opacity-100 p-1.5 bg-white/20 border border-black rounded hover:bg-white/30 transition-all cursor-pointer"
            >
              <Pencil className="w-3 h-3" />
            </button>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full bg-black text-[var(--brand-yellow)]"
            >
              {progress}%
            </span>
          </div>
        </div>
        
        <div className={cn(
          "flex items-center gap-4 text-xs",
          project.color === 'yellow' ? "text-black/70" : "text-white/70"
        )} style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
          <span>{projectTaskCount} tasks</span>
          <span>•</span>
          <span>{completedTasks} completed</span>
          {project.due && project.due !== 'idk yet' && project.due !== 'Ongoing' && (
            <>
              <span>•</span>
              <span className={cn(hasApproachingDeadline && "text-[var(--brand-red)] font-bold")}>
                Due: {project.due}
              </span>
            </>
          )}
          {project.due === 'Ongoing' && (
            <>
              <span>•</span>
              <span className="text-[var(--brand-blue)]">
                ∞ Ongoing
              </span>
            </>
          )}
        </div>
        
        {/* Progress bar */}
        <div className="mt-3 h-2 bg-black/30 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-500 bg-[var(--brand-yellow)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  };

  if (!selectedProject) {
    return (
      <div className="max-w-[1100px] mx-auto">
        {/* Header with filters */}
        <div className="bg-[var(--brand-blue)] border-[2px] border-black rounded-lg shadow-[4px_4px_0_black] overflow-hidden mb-4">
          <div className="bg-black px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FolderOpen className="w-5 h-5 text-[var(--brand-yellow)]" />
              <h2
                className="text-xl text-[var(--brand-yellow)] tracking-wide"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                VIEW PROJECTS
              </h2>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex items-center gap-2 text-[10px] px-3 py-1.5 border border-white/20 rounded transition-all cursor-pointer",
                showFilters ? "bg-[var(--brand-yellow)] text-black" : "text-white hover:bg-white/10"
              )}
              style={{ fontFamily: 'var(--font-space-mono), monospace' }}
            >
              <Filter className="w-3 h-3" /> FILTERS
            </button>
          </div>
          
          {/* Filter bar */}
          {showFilters && (
            <div className="px-4 py-3 border-t-[2px] border-black bg-[var(--brand-blue-dark)]/50 flex flex-wrap items-center gap-2">
              <span className="text-xs text-white/70 mr-2" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
                Show:
              </span>
              <button
                onClick={() => setProjectFilter('active')}
                className={cn(
                  "px-3 py-1 text-xs border-[2px] border-black rounded-lg transition-all cursor-pointer",
                  projectFilter === 'active' 
                    ? "bg-[var(--brand-yellow)] text-black" 
                    : "bg-white/20 text-white hover:bg-white/30"
                )}
                style={{ fontFamily: 'var(--font-space-mono), monospace' }}
              >
                Active
              </button>
              <button
                onClick={() => setProjectFilter('archived')}
                className={cn(
                  "px-3 py-1 text-xs border-[2px] border-black rounded-lg transition-all cursor-pointer",
                  projectFilter === 'archived' 
                    ? "bg-[var(--gray-600)] text-white" 
                    : "bg-white/20 text-white hover:bg-white/30"
                )}
                style={{ fontFamily: 'var(--font-space-mono), monospace' }}
              >
                Archived
              </button>
              <button
                onClick={() => setProjectFilter('all')}
                className={cn(
                  "px-3 py-1 text-xs border-[2px] border-black rounded-lg transition-all cursor-pointer",
                  projectFilter === 'all' 
                    ? "bg-[var(--brand-red)] text-white" 
                    : "bg-white/20 text-white hover:bg-white/30"
                )}
                style={{ fontFamily: 'var(--font-space-mono), monospace' }}
              >
                All
              </button>
              
              <div className="w-px h-6 bg-white/30 mx-2" />
              
              <span className="text-xs text-white/70 mr-2" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
                Category:
              </span>
              {projectCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setProjectFilter(cat.id)}
                  className={cn(
                    "px-3 py-1 text-xs border-[2px] border-black rounded-lg transition-all cursor-pointer",
                    projectFilter === cat.id 
                      ? "bg-[var(--brand-yellow)] text-black" 
                      : "bg-white/20 text-white hover:bg-white/30"
                  )}
                  style={{ fontFamily: 'var(--font-space-mono), monospace' }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Projects by category */}
        <div className="space-y-6">
          {/* Projects with categories */}
          {projectsByCategory.map(cat => {
            if (cat.projects.length === 0) return null;
            return (
              <div key={cat.id}>
                <CategoryHeader name={cat.name} count={cat.projects.length} categoryId={cat.id} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cat.projects.map(project => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              </div>
            );
          })}
          
          {/* Uncategorized projects */}
          {uncategorizedProjects.length > 0 && (
            <div>
              <div className="bg-[var(--gray-600)] px-4 py-3 rounded-lg mb-3 shadow-[3px_3px_0_black]">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                    NO CATEGORY
                  </span>
                  <span className="text-xs text-white/60" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
                    {uncategorizedProjects.length} {uncategorizedProjects.length === 1 ? 'project' : 'projects'}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {uncategorizedProjects.map(project => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </div>
          )}
          
          {/* Empty state */}
          {filteredProjects.length === 0 && (
            <div className="bg-[var(--brand-yellow)] border-[2px] border-black rounded-lg p-8 text-center shadow-[4px_4px_0_black]">
              <Archive className="w-12 h-12 mx-auto mb-3 text-black/40" />
              <p className="text-black/70" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
                {projectFilter === 'archived' 
                  ? 'No archived projects yet' 
                  : projectFilter === 'all' 
                    ? 'No projects found'
                    : projectFilter.startsWith('cat-')
                      ? 'No projects in this category'
                      : 'No active projects'}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Calculate stats for selected project
  const stats = {
    total: projectTasks.length,
    todo: projectTasks.filter(t => t.status === 'todo').length,
    doing: projectTasks.filter(t => t.status === 'doing').length,
    done: projectTasks.filter(t => t.status === 'done').length,
    review: projectTasks.filter(t => t.status === 'review').length,
    high: projectTasks.filter(t => t.priority === 'high').length,
  };

  const handleBack = () => {
    setSelectedProjectId(null);
  };

  const handleEditProject = () => {
    if (selectedProjectId) {
      setEditingProjectId(selectedProjectId);
      setProjectModalOpen(true);
    }
  };

  // List Item Component
  const TaskListItem = ({ task }: { task: Task }) => {
    const duration = formatDuration(task.durationHours, task.durationMinutes);
    const textColor = selectedProject.color === 'yellow' ? 'text-black' : 'text-white';
    const textColorMuted = selectedProject.color === 'yellow' ? 'text-black/60' : 'text-white/60';
    
    const handleQuickMove = (newStatus: Task['status']) => {
      updateTask(task.id, { status: newStatus });
      toast.success(`Moved to ${newStatus}`);
    };

    const handleOpenTask = () => {
      setEditingTaskId(task.id);
      setDetailMode(true);
      setModalOpen(true);
    };

    const handleEditTask = (e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingTaskId(task.id);
      setDetailMode(false);
      setModalOpen(true);
    };

    return (
      <div
        onClick={handleOpenTask}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = 'move';
          setDraggedTaskId(task.id);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleTaskDrop(task.id);
        }}
        className="flex items-center gap-4 p-3 border-b-[1px] border-black/20 hover:bg-black/10 transition-colors group cursor-pointer"
      >
        {/* Status indicator */}
        <div
          onClick={() => handleQuickMove(task.status === 'done' ? 'todo' : 'done')}
          className={cn(
            "w-5 h-5 rounded-full border-2 cursor-pointer flex items-center justify-center flex-shrink-0 transition-all",
            task.status === 'done' ? "bg-[var(--brand-green)] border-[var(--brand-green)] text-white" : 
            task.status === 'doing' ? "bg-[var(--brand-blue)] border-[var(--brand-blue)]" :
            task.status === 'review' ? "bg-[var(--brand-yellow)] border-[var(--brand-yellow)]" :
            "bg-[var(--shimmering-opal)] border-black"
          )}
        >
          {task.status === 'done' && <CheckCircle className="w-3 h-3" />}
        </div>
        
        {/* Title & Meta */}
        <div className="flex-1 min-w-0">
          <div className={cn(
            "font-medium text-sm truncate",
            textColor,
            task.status === 'done' && "line-through opacity-40"
          )}>
            {task.title}
          </div>
          <div className={cn("flex items-center gap-2 text-[10px] mt-0.5", textColorMuted)} style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
            <Clock className="w-3 h-3" /> {duration}
            {task.due && task.due !== 'idk yet' && task.due !== 'Ongoing' && (
              <>
                <span>•</span>
                <Calendar className="w-3 h-3" /> {task.due}
              </>
            )}
            {task.due === 'idk yet' && (
              <>
                <span>•</span>
                <span className="text-[var(--brand-yellow)]">idk yet</span>
              </>
            )}
            {task.due === 'Ongoing' && (
              <>
                <span>•</span>
                <span className="text-[var(--brand-blue)]">∞ Ongoing</span>
              </>
            )}
          </div>
        </div>
        
        {/* Priority */}
        <span
          className={cn(
            "text-[9px] font-bold px-2 py-0.5 rounded border-[1.5px] border-black uppercase",
            task.priority === 'high' && "bg-[var(--brand-red)] text-white",
            task.priority === 'medium' && "bg-[var(--brand-yellow)] text-black",
            task.priority === 'low' && "bg-[var(--gray-400)] text-white"
          )}
          style={{ fontFamily: 'var(--font-space-mono), monospace' }}
        >
          {task.priority}
        </span>
        
        {/* Tags */}
        <div className="hidden md:flex gap-1">
          {task.tags.slice(0, 2).map(tag => (
            <span
              key={tag}
              className={cn("text-[9px] px-1.5 py-0.5 rounded", selectedProject.color === 'yellow' ? "bg-black/20" : "bg-white/20")}
              style={{ fontFamily: 'var(--font-space-mono), monospace' }}
            >
              {tag}
            </span>
          ))}
        </div>
        
        {/* Actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleEditTask}
            className="text-[9px] px-2 py-1 bg-white/80 text-black rounded border-[1.5px] border-black"
            style={{ fontFamily: 'var(--font-space-mono), monospace' }}
          >
            EDIT
          </button>
          {task.status !== 'doing' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleQuickMove('doing');
              }}
              className="text-[9px] px-2 py-1 bg-[var(--brand-blue)] text-white rounded border-[1.5px] border-black"
              style={{ fontFamily: 'var(--font-space-mono), monospace' }}
            >
              START
            </button>
          )}
        </div>
      </div>
    );
  };

  const handleTaskDrop = (targetTaskId: string) => {
    if (!draggedTaskId || !selectedProject) return;
    reorderTasksInProject(selectedProject.name, draggedTaskId, targetTaskId);
    setDraggedTaskId(null);
    toast.success('Task order updated');
  };

  const projectColor = colorMap[selectedProject.color] || colorMap.gray;

  return (
    <div className="max-w-[1100px] mx-auto">
      {/* Header */}
      <div 
        className="border-[2px] border-black rounded-lg shadow-[4px_4px_0_black] overflow-hidden mb-4"
        style={{ backgroundColor: projectColor }}
      >
        <div className="bg-black px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 bg-[var(--brand-blue)] text-white border-[2px] border-black rounded cursor-pointer transition-all hover:bg-[var(--brand-blue-dark)] shadow-[2px_2px_0_var(--brand-yellow)]"
              style={{ fontFamily: 'var(--font-space-mono), monospace' }}
            >
              <ArrowLeft className="w-3 h-3" /> BACK
            </button>
            <span className="text-xl">{selectedProject.icon}</span>
            <h2
              className="text-xl text-[var(--brand-yellow)] tracking-wide"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {selectedProject.name}
            </h2>
            <button
              onClick={handleEditProject}
              className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded transition-all cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-white/20 rounded-lg p-1">
              <button
                onClick={() => setViewMode('modular')}
                className={cn(
                  "p-1.5 rounded transition-all",
                  viewMode === 'modular' ? "bg-[var(--brand-yellow)] text-black" : "text-white hover:bg-white/10"
                )}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-1.5 rounded transition-all",
                  viewMode === 'list' ? "bg-[var(--brand-yellow)] text-black" : "text-white hover:bg-white/10"
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            
            {/* New Task Button */}
            <button
              onClick={handleNewTaskFromProject}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--brand-yellow)] text-xs font-bold border-[2px] border-black rounded-lg hover:bg-[var(--brand-yellow-dark)] transition-all cursor-pointer shadow-[2px_2px_0_black] btn-shine"
              style={{ fontFamily: 'var(--font-space-mono), monospace', color: '#000000' }}
            >
              <Plus className="w-3.5 h-3.5" /> NEW TASK
            </button>
          </div>
        </div>
        
        {/* Stats Bar */}
        <div className={cn(
          "px-4 py-3 flex items-center gap-6 border-t-[2px] border-black",
          selectedProject.color === 'yellow' ? "bg-black/10" : "bg-black/20"
        )}>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[var(--gray-400)]" />
            <span className={cn("text-xs", selectedProject.color === 'yellow' ? "text-black/70" : "text-white/80")} style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
              <span className="font-bold">{stats.total}</span> Total
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[var(--brand-blue)]" />
            <span className={cn("text-xs", selectedProject.color === 'yellow' ? "text-black/70" : "text-white/80")} style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
              <span className="font-bold">{stats.todo}</span> To Do
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[var(--brand-yellow)]" />
            <span className={cn("text-xs", selectedProject.color === 'yellow' ? "text-black/70" : "text-white/80")} style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
              <span className="font-bold">{stats.doing}</span> In Progress
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[var(--brand-red)]" />
            <span className={cn("text-xs", selectedProject.color === 'yellow' ? "text-black/70" : "text-white/80")} style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
              <span className="font-bold">{stats.review}</span> Review
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[var(--brand-green)]" />
            <span className={cn("text-xs", selectedProject.color === 'yellow' ? "text-black/70" : "text-white/80")} style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
              <span className="font-bold">{stats.done}</span> Done
            </span>
          </div>
          {stats.high > 0 && (
            <div className="flex items-center gap-2 ml-auto">
              <AlertCircle className="w-4 h-4 text-[var(--brand-red)]" />
              <span className="text-xs text-[var(--brand-red)] font-bold" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
                {stats.high} High Priority
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content */ }
      {projectTasks.length === 0 ? (
        <div 
          className="border-[2px] border-black rounded-lg p-8 text-center shadow-[4px_4px_0_black]"
          style={{ backgroundColor: projectColor }}
        >
          <p 
            className={cn("mb-4", selectedProject.color === 'yellow' ? "text-black/70" : "text-white/70")} 
            style={{ fontFamily: 'var(--font-space-mono), monospace' }}
          >
            No tasks in this project yet
          </p>
          <button
            onClick={handleNewTaskFromProject}
            className="px-4 py-2 bg-[var(--brand-blue)] text-white text-xs font-bold border-[2px] border-black rounded-lg hover:bg-[var(--brand-blue-dark)] transition-all cursor-pointer shadow-[3px_3px_0_black] btn-shine"
            style={{ fontFamily: 'var(--font-space-mono), monospace' }}
          >
            <Plus className="w-3.5 h-3.5 inline mr-1.5" /> CREATE FIRST TASK
          </button>
        </div>
      ) : viewMode === 'modular' ? (
        /* Modular View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projectTasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      ) : (
        /* List View */
        <div 
          className="border-[2px] border-black rounded-lg shadow-[4px_4px_0_black] overflow-hidden"
          style={{ backgroundColor: projectColor }}
        >
          <div className="divide-y divide-black/20">
            {projectTasks
              .sort((a, b) => {
                const statusOrder = { doing: 0, todo: 1, review: 2, done: 3 };
                return statusOrder[a.status] - statusOrder[b.status];
              })
              .map(task => (
                <TaskListItem key={task.id} task={task} />
              ))}
          </div>
        </div>
      )}

      {/* Project Documents Section */}
      {projectDocuments.length > 0 && (
        <div className="mt-6">
          <h3
            className={cn("text-lg tracking-wide mb-3", selectedProject.color === 'yellow' ? "text-black" : "text-white")}
            style={{ fontFamily: 'var(--font-display)' }}
          >
            DOCUMENTS ({projectDocuments.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {projectDocuments.map(doc => {
              const wordCount = calculateWordCount(doc.blocks);
              return (
                <div
                  key={doc.id}
                  onClick={() => {
                    setSelectedDocumentId(doc.id);
                    setCurrentView('documents');
                  }}
                  className="border-[2px] border-black rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-[4px_4px_0_black] hover:translate-y-[-2px] group"
                  style={{ 
                    backgroundColor: projectColor,
                    color: selectedProject.color === 'yellow' ? 'black' : 'white'
                  }}
                >
                  <div className="flex items-start gap-3">
                    <FileText className={cn("w-5 h-5 mt-0.5", selectedProject.color === 'yellow' ? "text-black" : "text-[var(--brand-yellow)]")} />
                    <div className="flex-1 min-w-0">
                      <h4 className={cn("font-semibold text-sm transition-colors truncate", 
                        selectedProject.color === 'yellow' ? "group-hover:text-[var(--brand-blue)]" : "group-hover:text-[var(--brand-yellow)]"
                      )}>
                        {doc.title || 'Untitled Document'}
                      </h4>
                      <div className={cn("flex items-center gap-2 text-[10px] mt-1", selectedProject.color === 'yellow' ? "text-black/60" : "text-white/60")} style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
                        <span>{formatRelativeTime(doc.updatedAt)}</span>
                        <span>•</span>
                        <span>{wordCount} words</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
