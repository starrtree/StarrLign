'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Archive, RotateCcw, Trash2, FileText, FolderOpen, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

type TabType = 'tasks' | 'projects' | 'documents';

export default function ArchiveView() {
  const { 
    tasks, 
    projects, 
    documents, 
    restoreTask, 
    restoreProject, 
    restoreDocument,
    deleteTask,
    deleteProject,
    deleteDocument
  } = useStore();
  
  const [activeTab, setActiveTab] = useState<TabType>('tasks');

  const archivedTasks = tasks.filter(t => t.isArchived);
  const archivedProjects = projects.filter(p => p.isArchived);
  const archivedDocuments = documents.filter(d => d.isArchived);

  const handleRestoreTask = (id: string, title: string) => {
    restoreTask(id);
    toast.success(`Restored: ${title}`);
  };

  const handleRestoreProject = (id: string, name: string) => {
    restoreProject(id);
    toast.success(`Restored: ${name}`);
  };

  const handleRestoreDocument = (id: string, title: string) => {
    restoreDocument(id);
    toast.success(`Restored: ${title}`);
  };

  const handleDeleteTask = (id: string, title: string) => {
    if (confirm(`Permanently delete "${title}"?`)) {
      deleteTask(id);
      toast.success(`Deleted: ${title}`);
    }
  };

  const handleDeleteProject = (id: string, name: string) => {
    if (confirm(`Permanently delete "${name}"?`)) {
      deleteProject(id);
      toast.success(`Deleted: ${name}`);
    }
  };

  const handleDeleteDocument = (id: string, title: string) => {
    if (confirm(`Permanently delete "${title}"?`)) {
      deleteDocument(id);
      toast.success(`Deleted: ${title}`);
    }
  };

  return (
    <div className="max-w-[900px] mx-auto">
      {/* Header */}
      <div className="bg-[var(--brand-red)] border-[2px] border-black rounded-lg shadow-[4px_4px_0_black] overflow-hidden mb-4">
        <div className="bg-black px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Archive className="w-5 h-5 text-[var(--brand-yellow)]" />
            <h2
              className="text-xl text-[var(--brand-yellow)] tracking-wide"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              NEST
            </h2>
          </div>
          <div className="text-xs text-white/60" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
            {archivedTasks.length + archivedProjects.length + archivedDocuments.length} items nested
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b-[2px] border-black">
          {([
            { key: 'tasks', label: 'Tasks', count: archivedTasks.length },
            { key: 'projects', label: 'Projects', count: archivedProjects.length },
            { key: 'documents', label: 'Documents', count: archivedDocuments.length },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex-1 px-4 py-2.5 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2",
                activeTab === tab.key 
                  ? "bg-[var(--brand-yellow)] text-black border-b-[3px] border-black -mb-[2px]" 
                  : "text-white/70 hover:bg-white/10",
                "uppercase tracking-wider"
              )}
              style={{ fontFamily: 'var(--font-space-mono), monospace' }}
            >
              {tab.label}
              <span className={cn(
                "px-1.5 py-0.5 rounded text-[9px]",
                activeTab === tab.key ? "bg-black text-[var(--brand-yellow)]" : "bg-black/30 text-white"
              )}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-[var(--gray-400)] border-[2px] border-black rounded-lg shadow-[3px_3px_0_black] overflow-hidden">
        {activeTab === 'tasks' && (
          <div>
            {archivedTasks.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-black/40" />
                <p className="text-black/60 text-sm" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
                  No nested tasks
                </p>
                <p className="text-xs text-black/40 mt-1" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
                  Tasks you nest will appear here
                </p>
              </div>
            ) : (
              <div className="divide-y divide-black/20">
                {archivedTasks.map(task => (
                  <div key={task.id} className="p-4 flex items-center gap-4 hover:bg-black/10 transition-colors group">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm line-through text-black/50 truncate">
                        {task.title}
                      </div>
                      <div className="text-[10px] text-black/40 mt-0.5" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
                        {task.project} • {task.priority} priority
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleRestoreTask(task.id, task.title)}
                        className="flex items-center gap-1 px-2 py-1 bg-[var(--brand-blue)] text-white text-[10px] rounded border-[1.5px] border-black hover:bg-[var(--brand-blue-dark)] transition-colors cursor-pointer"
                        style={{ fontFamily: 'var(--font-space-mono), monospace' }}
                      >
                        <RotateCcw className="w-3 h-3" /> RESTORE
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id, task.title)}
                        className="flex items-center gap-1 px-2 py-1 bg-[var(--brand-red)] text-white text-[10px] rounded border-[1.5px] border-black hover:bg-[var(--brand-red-dark)] transition-colors cursor-pointer"
                        style={{ fontFamily: 'var(--font-space-mono), monospace' }}
                      >
                        <Trash2 className="w-3 h-3" /> DELETE
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'projects' && (
          <div>
            {archivedProjects.length === 0 ? (
              <div className="p-8 text-center">
                <FolderOpen className="w-12 h-12 mx-auto mb-3 text-black/40" />
                <p className="text-black/60 text-sm" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
                  No nested projects
                </p>
                <p className="text-xs text-black/40 mt-1" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
                  Projects you nest will appear here
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                {archivedProjects.map(project => (
                  <div key={project.id} className="p-4 border-[2px] border-black/30 rounded-lg bg-black/10 group relative">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xl opacity-50">{project.icon}</span>
                      <div className="font-medium text-sm line-through text-black/50 truncate">
                        {project.name}
                      </div>
                    </div>
                    <div className="text-[10px] text-black/40" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
                      {project.due}
                    </div>
                    <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleRestoreProject(project.id, project.name)}
                        className="flex items-center gap-1 px-2 py-1 bg-[var(--brand-blue)] text-white text-[10px] rounded border-[1.5px] border-black hover:bg-[var(--brand-blue-dark)] transition-colors cursor-pointer"
                        style={{ fontFamily: 'var(--font-space-mono), monospace' }}
                      >
                        <RotateCcw className="w-3 h-3" /> RESTORE
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project.id, project.name)}
                        className="flex items-center gap-1 px-2 py-1 bg-[var(--brand-red)] text-white text-[10px] rounded border-[1.5px] border-black hover:bg-[var(--brand-red-dark)] transition-colors cursor-pointer"
                        style={{ fontFamily: 'var(--font-space-mono), monospace' }}
                      >
                        <Trash2 className="w-3 h-3" /> DELETE
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div>
            {archivedDocuments.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="w-12 h-12 mx-auto mb-3 text-black/40" />
                <p className="text-black/60 text-sm" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
                  No nested documents
                </p>
                <p className="text-xs text-black/40 mt-1" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
                  Documents you nest will appear here
                </p>
              </div>
            ) : (
              <div className="divide-y divide-black/20">
                {archivedDocuments.map(doc => (
                  <div key={doc.id} className="p-4 flex items-center gap-4 hover:bg-black/10 transition-colors group">
                    <FileText className="w-5 h-5 text-black/40" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm line-through text-black/50 truncate">
                        {doc.title || 'Untitled'}
                      </div>
                      <div className="text-[10px] text-black/40 mt-0.5" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
                        {doc.wordCount} words
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleRestoreDocument(doc.id, doc.title)}
                        className="flex items-center gap-1 px-2 py-1 bg-[var(--brand-blue)] text-white text-[10px] rounded border-[1.5px] border-black hover:bg-[var(--brand-blue-dark)] transition-colors cursor-pointer"
                        style={{ fontFamily: 'var(--font-space-mono), monospace' }}
                      >
                        <RotateCcw className="w-3 h-3" /> RESTORE
                      </button>
                      <button
                        onClick={() => handleDeleteDocument(doc.id, doc.title)}
                        className="flex items-center gap-1 px-2 py-1 bg-[var(--brand-red)] text-white text-[10px] rounded border-[1.5px] border-black hover:bg-[var(--brand-red-dark)] transition-colors cursor-pointer"
                        style={{ fontFamily: 'var(--font-space-mono), monospace' }}
                      >
                        <Trash2 className="w-3 h-3" /> DELETE
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

