'use client';

import { useStore } from '@/lib/store';
import { ViewType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Star, Zap, CalendarDays, Menu, X, FolderOpen, Folder, GripVertical, Pencil, Archive, Wallet, Settings } from 'lucide-react';
import { useState } from 'react';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

function SidebarItem({ icon, label, active, onClick }: SidebarItemProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 px-4 py-2 cursor-pointer text-sm font-medium transition-all duration-150",
        "border-l-[3px] border-transparent",
        "text-white/70 hover:bg-white/10 hover:text-white",
        active && "bg-[var(--brand-yellow)] text-black border-l-[3px] border-black font-bold"
      )}
    >
      <span className="text-base">{icon}</span>
      {label}
    </div>
  );
}

interface ProjectItemProps {
  id: string;
  name: string;
  color: string;
  icon: string;
  active?: boolean;
  onClick?: () => void;
  onEdit?: () => void;
  onDragStart?: (e: React.DragEvent, id: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, id: string) => void;
  isDragging?: boolean;
  isDragOver?: boolean;
}

function ProjectItem({ id, name, color, icon, active, onClick, onEdit, onDragStart, onDragOver, onDrop, isDragging, isDragOver }: ProjectItemProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart?.(e, id)}
      onDragOver={(e) => onDragOver?.(e)}
      onDrop={(e) => onDrop?.(e, id)}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 px-4 py-2 cursor-pointer text-sm font-medium transition-all duration-150 group relative",
        "border-l-[3px] border-transparent",
        "text-white/70 hover:bg-white/10 hover:text-white",
        active && "bg-white/20 text-white border-l-[3px] border-[var(--brand-yellow)]",
        isDragging && "opacity-50 bg-white/10",
        isDragOver && "border-t-2 border-t-[var(--brand-yellow)]"
      )}
    >
      {/* Drag Handle */}
      <div 
        className="absolute left-1 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-3 h-3 text-white/40" />
      </div>
      
      {/* Icon */}
      <span className="text-base ml-2">{icon}</span>
      
      <span className="flex-1 truncate">{name}</span>
      
      {/* Edit button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit?.();
        }}
        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/20 rounded transition-all cursor-pointer"
      >
        <Pencil className="w-3 h-3" />
      </button>
    </div>
  );
}

export default function Sidebar() {
  const { 
    currentView, 
    setCurrentView, 
    tags, 
    projects, 
    setModalOpen, 
    setEditingTaskId, 
    setSelectedProjectId, 
    selectedProjectId, 
    setSelectedDocumentId,
    setProjectModalOpen,
    setEditingProjectId,
    reorderProjects,
    setSettingsOpen,
    tagFilter,
    toggleTagFilter,
    clearTagFilter
  } = useStore();
  
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [draggedProjectId, setDraggedProjectId] = useState<string | null>(null);
  const [dragOverProjectId, setDragOverProjectId] = useState<string | null>(null);

  const handleNavClick = (view: ViewType) => {
    setCurrentView(view);
    setIsMobileOpen(false);
  };

  const handleProjectClick = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentView('projects');
    setIsMobileOpen(false);
  };

  const handleProjectEdit = (projectId: string) => {
    setEditingProjectId(projectId);
    setProjectModalOpen(true);
    setIsMobileOpen(false);
  };

  const handleTagClick = (tag: string) => {
    // Toggle tag filter - add/remove tag from the filter array
    toggleTagFilter(tag);
    // Navigate to All Tasks view if not already there
    if (currentView !== 'kanban') {
      setCurrentView('kanban');
    }
    setIsMobileOpen(false);
  };

  const handleSettingsClick = () => {
    setSettingsOpen(true);
    setIsMobileOpen(false);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, projectId: string) => {
    setDraggedProjectId(projectId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetProjectId: string) => {
    e.preventDefault();
    if (!draggedProjectId || draggedProjectId === targetProjectId) return;
    
    const sortedProjects = [...projects].sort((a, b) => a.order - b.order);
    const startIndex = sortedProjects.findIndex(p => p.id === draggedProjectId);
    const endIndex = sortedProjects.findIndex(p => p.id === targetProjectId);
    
    if (startIndex !== -1 && endIndex !== -1) {
      reorderProjects(startIndex, endIndex);
    }
    
    setDraggedProjectId(null);
    setDragOverProjectId(null);
  };

  // Sort projects by order and filter out archived
  const sortedProjects = [...projects].filter(p => !p.isArchived).sort((a, b) => a.order - b.order);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed top-4 left-4 z-[200] p-2 bg-[var(--brand-blue)] border-[2px] border-black rounded-lg shadow-[2px_2px_0_black] lg:hidden transition-transform duration-150 active:scale-95"
      >
        {isMobileOpen ? (
          <X className="w-5 h-5 text-white" />
        ) : (
          <Menu className="w-5 h-5 text-white" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[90] lg:hidden transition-opacity duration-200"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar - BLUE */}
      <aside
        className={cn(
          "fixed left-0 top-0 bottom-0 w-[260px] bg-[var(--brand-blue)] border-r-[2px] border-black flex flex-col z-[100] overflow-y-auto transition-transform duration-300",
          "lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="p-5 border-b-[2px] border-black">
          <h1
            className="text-[28px] leading-tight tracking-[2px]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <span style={{ color: 'var(--brand-yellow)' }}>STARR★</span>
            <span style={{ color: 'var(--brand-red)' }}>LIGN→</span>
          </h1>
          <span
            className="text-[10px] text-white/60 tracking-[1px] mt-0.5 block"
            style={{ fontFamily: 'var(--font-space-mono), monospace' }}
          >
            PERSONAL FOCUS OS v1.0
          </span>
        </div>

        {/* Workspace Section */}
        <div className="py-3 border-b-[2px] border-black/20">
          <div
            className="px-4 pb-1.5 text-[9px] text-white/50 tracking-[2px] uppercase"
            style={{ fontFamily: 'var(--font-space-mono), monospace' }}
          >
            Workspace
          </div>
          <SidebarItem
            icon={<Star className="w-4 h-4" />}
            label="Focus Dashboard"
            active={currentView === 'dashboard'}
            onClick={() => handleNavClick('dashboard')}
          />
          <SidebarItem
            icon={<Zap className="w-4 h-4" />}
            label="All Tasks"
            active={currentView === 'kanban'}
            onClick={() => handleNavClick('kanban')}
          />
          <SidebarItem
            icon={<span className="text-base">📄</span>}
            label="Documents"
            active={currentView === 'documents'}
            onClick={() => { 
              setSelectedDocumentId(null);
              handleNavClick('documents');
            }}
          />
          <SidebarItem
            icon={<Wallet className="w-4 h-4" />}
            label="Money"
            active={currentView === 'money'}
            onClick={() => handleNavClick('money')}
          />
          <SidebarItem
            icon={<CalendarDays className="w-4 h-4" />}
            label="Calendar"
            active={currentView === 'calendar'}
            onClick={() => handleNavClick('calendar')}
          />
          <SidebarItem
            icon={<Archive className="w-4 h-4" />}
            label="Sacrifice Pit"
            active={currentView === 'archive'}
            onClick={() => handleNavClick('archive')}
          />
        </div>

        {/* Active Projects */}
        <div className="py-3 border-b-[2px] border-black/20">
          <div
            className="px-4 pb-1.5 text-[9px] text-white/50 tracking-[2px] uppercase flex items-center gap-2"
            style={{ fontFamily: 'var(--font-space-mono), monospace' }}
          >
            <FolderOpen className="w-3 h-3" /> Active Projects
          </div>
          {sortedProjects.map((project) => (
            <ProjectItem
              key={project.id}
              id={project.id}
              name={project.name}
              color={project.color}
              icon={project.icon}
              active={currentView === 'projects' && selectedProjectId === project.id}
              onClick={() => handleProjectClick(project.id)}
              onEdit={() => handleProjectEdit(project.id)}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              isDragging={draggedProjectId === project.id}
              isDragOver={dragOverProjectId === project.id}
            />
          ))}
          {/* View Projects */}
          <div
            onClick={() => {
              setSelectedProjectId(null);
              setCurrentView('projects');
              setIsMobileOpen(false);
            }}
            className={cn(
              "flex items-center gap-2.5 px-4 py-2 cursor-pointer text-sm font-medium transition-all duration-150",
              "border-l-[3px] border-transparent",
              "text-white/50 hover:text-white hover:bg-white/10",
              currentView === 'projects' && !selectedProjectId && "bg-white/10 text-white border-l-[3px] border-[var(--brand-yellow)]"
            )}
          >
            <Folder className="w-4 h-4" />
            View Projects
          </div>
        </div>

        {/* Tag Library */}
        <div className="py-3 border-b-[2px] border-black/20">
          <div
            className="px-4 pb-1.5 text-[9px] text-white/50 tracking-[2px] uppercase flex items-center justify-between"
            style={{ fontFamily: 'var(--font-space-mono), monospace' }}
          >
            <span>TAG LIBRARY</span>
            {tagFilter.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearTagFilter();
                }}
                className="text-[8px] px-1.5 py-0.5 bg-white/20 rounded hover:bg-white/30 transition-colors"
              >
                CLEAR ({tagFilter.length})
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2 px-4 pb-3">
            {tags.map((tag) => {
              const isSelected = tagFilter.includes(tag);
              return (
                <div
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  className={cn(
                    "text-[10px] px-2 py-1 border-[2px] border-black rounded cursor-pointer transition-all duration-150 hover:-translate-y-0.5",
                    isSelected 
                      ? "bg-[var(--brand-yellow)] text-black font-bold shadow-[2px_2px_0_black]" 
                      : "bg-[var(--brand-red)] text-white hover:bg-[var(--brand-yellow)] hover:text-black"
                  )}
                  style={{ fontFamily: 'var(--font-space-mono), monospace' }}
                >
                  #{tag}
                </div>
              );
            })}
          </div>
        </div>

        {/* Tools */}
        <div className="py-3 mt-auto">
          <div
            className="px-4 pb-1.5 text-[9px] text-white/50 tracking-[2px] uppercase"
            style={{ fontFamily: 'var(--font-space-mono), monospace' }}
          >
            Tools
          </div>
          <div
            onClick={handleSettingsClick}
            className={cn(
              "flex items-center gap-2.5 px-4 py-2 cursor-pointer text-sm font-medium transition-all duration-150",
              "border-l-[3px] border-transparent",
              "text-white/70 hover:bg-white/10 hover:text-white"
            )}
          >
            <Settings className="w-4 h-4" />
            Settings
          </div>
        </div>
      </aside>
    </>
  );
}
