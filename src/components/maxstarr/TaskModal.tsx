'use client';

import { useState, useMemo } from 'react';
import { useStore, createNewTask, formatDuration } from '@/lib/store';
import { Task } from '@/lib/types';
import { X, Trash2, Plus, ChevronUp, ChevronDown, Archive, HelpCircle, Infinity } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function TaskModal() {
  const { isModalOpen, setModalOpen, editingTaskId, tasks, projects, tags: allTags, addTask, updateTask, deleteTask, archiveTask, selectedProjectId, autoSetProjectForTask, setAutoSetProjectForTask, setDetailMode, createTag, deleteTag } = useStore();
  
  // Find the task being edited
  const editingTask = useMemo(() => {
    if (editingTaskId) {
      return tasks.find(t => t.id === editingTaskId);
    }
    return null;
  }, [editingTaskId, tasks]);

  // Get the current project name from selectedProjectId or autoSetProjectForTask
  // Falls back to the first available project (instead of 'General')
  const currentProjectName = useMemo(() => {
    // First check autoSetProjectForTask (set from project view)
    if (autoSetProjectForTask) {
      const project = projects.find(p => p.id === autoSetProjectForTask);
      if (project) return project.name;
    }
    // Then check selectedProjectId
    if (selectedProjectId) {
      const project = projects.find(p => p.id === selectedProjectId);
      if (project) return project.name;
    }
    // Default to the first project in the list (e.g., "Your Journey")
    return projects[0]?.name || 'General';
  }, [autoSetProjectForTask, selectedProjectId, projects]);

  if (!isModalOpen) return null;

  return (
    <TaskModalContent
      editingTask={editingTask}
      currentProjectName={currentProjectName}
      onClose={() => {
        setModalOpen(false);
        setAutoSetProjectForTask(null);
        setDetailMode(false);
      }}
      onSave={(taskData: Partial<Task>, isEditing: boolean, taskId?: string) => {
        if (isEditing && taskId) {
          updateTask(taskId, taskData);
          toast.success('Task updated');
        } else {
          const newTask = createNewTask(taskData);
          addTask(newTask);
          toast.success('Task created');
        }
        setModalOpen(false);
        setAutoSetProjectForTask(null);
        setDetailMode(false);
      }}
      onDelete={(taskId: string) => {
        deleteTask(taskId);
        setModalOpen(false);
        setAutoSetProjectForTask(null);
        setDetailMode(false);
        toast.success('Task deleted');
      }}
      onArchive={(taskId: string) => {
        archiveTask(taskId);
        setModalOpen(false);
        setAutoSetProjectForTask(null);
        setDetailMode(false);
        toast.success('Task sacrificed');
      }}
      projects={projects}
      allTags={allTags}
      onCreateTag={createTag}
      onDeleteTag={deleteTag}
    />
  );
}

// Separate component that remounts each time modal opens, ensuring fresh form state
function TaskModalContent({
  editingTask,
  currentProjectName,
  onClose,
  onSave,
  onDelete,
  onArchive,
  projects,
  allTags,
  onCreateTag,
  onDeleteTag,
}: {
  editingTask: Task | null;
  currentProjectName: string;
  onClose: () => void;
  onSave: (taskData: Partial<Task>, isEditing: boolean, taskId?: string) => void;
  onDelete: (taskId: string) => void;
  onArchive: (taskId: string) => void;
  projects: { id: string; name: string }[];
  allTags: string[];
  onCreateTag: (tag: string) => void;
  onDeleteTag: (tag: string) => void;
}) {
  // Form state - fresh on each mount
  const [formData, setFormData] = useState<Partial<Task>>(() => {
    if (editingTask) {
      return {
        title: editingTask.title,
        project: editingTask.project,
        linkedProjects: editingTask.linkedProjects?.length ? [...editingTask.linkedProjects] : [editingTask.project],
        priority: editingTask.priority,
        status: editingTask.status,
        startDate: editingTask.startDate,
        endDate: editingTask.endDate,
        durationHours: editingTask.durationHours,
        durationMinutes: editingTask.durationMinutes,
        due: editingTask.due,
        tags: [...editingTask.tags],
        notes: editingTask.notes,
        subtasks: [...editingTask.subtasks],
      };
    }
    return {
      title: '',
      project: currentProjectName,
      linkedProjects: [currentProjectName],
      priority: 'medium',
      status: 'todo',
      startDate: '',
      endDate: '',
      durationHours: 0,
      durationMinutes: 30,
      due: '',
      tags: [],
      notes: '',
      subtasks: [],
    };
  });

  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [tagInput, setTagInput] = useState('');

  const handleSave = () => {
    if (!formData.title?.trim()) {
      toast.error('Task name is required');
      return;
    }

    // Parse subtasks from the list
    const subtasks = (formData.subtasks || []).map(st => ({
      id: st.id || Math.random().toString(36).substring(2, 9),
      text: st.text,
      done: st.done || false,
    }));

    const linkedProjects = (formData.linkedProjects || []).length > 0
      ? Array.from(new Set([formData.project || currentProjectName, ...(formData.linkedProjects || [])]))
      : [formData.project || currentProjectName];

    onSave(
      { ...formData, linkedProjects, subtasks },
      !!editingTask,
      editingTask?.id
    );
  };

  const handleDelete = () => {
    if (editingTask && confirm('Delete this task?')) {
      onDelete(editingTask.id);
    }
  };

  const handleSacrifice = () => {
    if (editingTask) {
      onArchive(editingTask.id);
    }
  };

  // Duration controls
  const adjustDuration = (field: 'durationHours' | 'durationMinutes', delta: number) => {
    const currentValue = formData[field] || 0;
    let newValue = currentValue + delta;
    
    if (field === 'durationMinutes') {
      if (newValue >= 60) {
        newValue = 0;
        setFormData(prev => ({
          ...prev,
          durationHours: (prev.durationHours || 0) + 1,
          durationMinutes: newValue,
        }));
        return;
      } else if (newValue < 0) {
        newValue = 59;
        setFormData(prev => ({
          ...prev,
          durationHours: Math.max(0, (prev.durationHours || 0) - 1),
          durationMinutes: newValue,
        }));
        return;
      }
    } else {
      newValue = Math.max(0, newValue);
    }
    
    setFormData({ ...formData, [field]: newValue });
  };

  // Tags management
  const handleAddTag = (tag: string) => {
    if (!formData.tags?.includes(tag)) {
      setFormData({ ...formData, tags: [...(formData.tags || []), tag] });
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags?.filter(t => t !== tag) || [] });
  };

  const handleAddCustomTag = () => {
    const tag = tagInput.trim();
    if (!tag) return;
    if (!allTags.includes(tag)) onCreateTag(tag);
    if (!formData.tags?.includes(tag)) handleAddTag(tag);
    setTagInput('');
  };

  // Subtasks management
  const handleAddSubtask = () => {
    if (newSubtaskText.trim()) {
      const newSubtask = {
        id: Math.random().toString(36).substring(2, 9),
        text: newSubtaskText.trim(),
        done: false,
      };
      setFormData({ 
        ...formData, 
        subtasks: [...(formData.subtasks || []), newSubtask] 
      });
      setNewSubtaskText('');
    }
  };

  const handleRemoveSubtask = (id: string) => {
    setFormData({ 
      ...formData, 
      subtasks: formData.subtasks?.filter(st => st.id !== id) || [] 
    });
  };

  const handleEditSubtask = (id: string, text: string) => {
    setFormData({
      ...formData,
      subtasks: formData.subtasks?.map(st => 
        st.id === id ? { ...st, text } : st
      ) || []
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 z-[500] flex items-center justify-center p-5"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-[#1a1a1a] border-[2px] border-[#3a3a3a] rounded-lg w-full max-w-[550px] shadow-[8px_8px_0_black] animate-[modalIn_0.2s_ease] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Black with Yellow Text */}
        <div className="bg-black px-4 py-3.5 flex items-center justify-between sticky top-0 z-10">
          <h2
            className="text-xl text-[var(--brand-yellow)] tracking-wide"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {editingTask ? 'EDIT TASK' : 'NEW TASK'}
          </h2>
          <button
            onClick={onClose}
            className="w-[30px] h-[30px] flex items-center justify-center bg-[var(--brand-red)] border-[2px] border-black rounded cursor-pointer text-white text-base font-bold transition-all duration-150 hover:bg-[var(--brand-red-dark)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body - Dark Mode */}
        <div className="p-5 bg-[#1a1a1a]">
          {/* Task Name */}
          <div className="mb-4">
            <label
              className="text-[10px] tracking-wider text-white/60 uppercase block mb-1.5"
              style={{ fontFamily: 'var(--font-space-mono), monospace' }}
            >
              Task Name *
            </label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="What is the mission?"
              className="w-full px-3 py-2 text-sm border-[2px] border-[#3a3a3a] rounded-lg bg-[#2a2a2a] text-white outline-none transition-all duration-150 focus:border-[var(--brand-blue)] placeholder:text-white/30"
            />
          </div>

          {/* Project & Priority */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label
                className="text-[10px] tracking-wider text-white/60 uppercase block mb-1.5"
                style={{ fontFamily: 'var(--font-space-mono), monospace' }}
              >
                Project
              </label>
              <select
                value={formData.project || ''}
                onChange={(e) => setFormData({ ...formData, project: e.target.value, linkedProjects: Array.from(new Set([e.target.value, ...(formData.linkedProjects || [])])) })}
                className="w-full px-3 py-2 text-xs border-[2px] border-[#3a3a3a] rounded-lg bg-[#2a2a2a] text-white outline-none cursor-pointer appearance-none transition-all duration-150"
                style={{ 
                  fontFamily: 'var(--font-space-mono), monospace',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 7L11 1' stroke='white' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                }}
              >
                {projects.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label
                className="text-[10px] tracking-wider text-white/60 uppercase block mb-1.5"
                style={{ fontFamily: 'var(--font-space-mono), monospace' }}
              >
                Priority
              </label>
              <select
                value={formData.priority || 'medium'}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as Task['priority'] })}
                className="w-full px-3 py-2 text-xs border-[2px] border-[#3a3a3a] rounded-lg bg-[#2a2a2a] text-white outline-none cursor-pointer appearance-none transition-all duration-150"
                style={{ 
                  fontFamily: 'var(--font-space-mono), monospace',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 7L11 1' stroke='white' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                }}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Multi-project linking */}
          <div className="mb-4">
            <label className="text-[10px] tracking-wider text-white/60 uppercase block mb-1.5" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
              Also linked to projects
            </label>
            <div className="grid grid-cols-2 gap-2">
              {projects.map((project) => (
                <label key={project.id} className="flex items-center gap-2 text-xs text-white/80">
                  <input
                    type="checkbox"
                    checked={(formData.linkedProjects || []).includes(project.name)}
                    onChange={(e) => {
                      const selected = new Set(formData.linkedProjects || [formData.project || currentProjectName]);
                      if (e.target.checked) {
                        selected.add(project.name);
                      } else if (project.name !== formData.project) {
                        selected.delete(project.name);
                      }
                      setFormData({ ...formData, linkedProjects: Array.from(selected) });
                    }}
                  />
                  <span>{project.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Duration Spinners */}
          <div className="mb-4">
            <label
              className="text-[10px] tracking-wider text-white/60 uppercase block mb-1.5"
              style={{ fontFamily: 'var(--font-space-mono), monospace' }}
            >
              Duration
            </label>
            <div className="flex items-center gap-4">
              {/* Hours */}
              <div className="flex items-center gap-2">
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => adjustDuration('durationHours', 1)}
                    className="p-1 border-[2px] border-[#3a3a3a] bg-[#2a2a2a] rounded-t hover:bg-[var(--brand-yellow)] hover:text-black transition-colors duration-150 text-white"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustDuration('durationHours', -1)}
                    className="p-1 border-x-[2px] border-b-[2px] border-[#3a3a3a] bg-[#2a2a2a] rounded-b hover:bg-[#3a3a3a] transition-colors duration-150 text-white"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    value={formData.durationHours || 0}
                    onChange={(e) => setFormData({ ...formData, durationHours: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-14 px-2 py-2 text-center text-sm border-[2px] border-[#3a3a3a] rounded-lg bg-[#2a2a2a] text-white outline-none"
                  />
                  <span className="text-xs font-bold text-white/60" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>hrs</span>
                </div>
              </div>
              
              {/* Minutes */}
              <div className="flex items-center gap-2">
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => adjustDuration('durationMinutes', 5)}
                    className="p-1 border-[2px] border-[#3a3a3a] bg-[#2a2a2a] rounded-t hover:bg-[var(--brand-yellow)] hover:text-black transition-colors duration-150 text-white"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustDuration('durationMinutes', -5)}
                    className="p-1 border-x-[2px] border-b-[2px] border-[#3a3a3a] bg-[#2a2a2a] rounded-b hover:bg-[#3a3a3a] transition-colors duration-150 text-white"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={formData.durationMinutes || 0}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: Math.min(59, Math.max(0, parseInt(e.target.value) || 0)) })}
                    className="w-14 px-2 py-2 text-center text-sm border-[2px] border-[#3a3a3a] rounded-lg bg-[#2a2a2a] text-white outline-none"
                  />
                  <span className="text-xs font-bold text-white/60" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>min</span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeframe */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-[10px] tracking-wider text-white/60 uppercase block mb-1.5" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate || ''}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 text-xs border-[2px] border-[#3a3a3a] rounded-lg bg-[#2a2a2a] text-white outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] tracking-wider text-white/60 uppercase block mb-1.5" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
                Event / End Date
              </label>
              <input
                type="date"
                value={formData.endDate || ''}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 text-xs border-[2px] border-[#3a3a3a] rounded-lg bg-[#2a2a2a] text-white outline-none"
              />
            </div>
          </div>

          {/* Due Date */}
          <div className="mb-4">
            <label
              className="text-[10px] tracking-wider text-white/60 uppercase block mb-1.5"
              style={{ fontFamily: 'var(--font-space-mono), monospace' }}
            >
              Due Date
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={formData.due && formData.due !== 'idk yet' && formData.due !== 'Ongoing' ? formData.due : ''}
                onChange={(e) => setFormData({ ...formData, due: e.target.value })}
                className="flex-1 px-3 py-2 text-sm border-[2px] border-[#3a3a3a] rounded-lg bg-[#2a2a2a] text-white outline-none transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={formData.due === 'idk yet' || formData.due === 'Ongoing'}
              />
              <button
                type="button"
                onClick={() => setFormData({ ...formData, due: formData.due === 'Ongoing' ? '' : 'Ongoing' })}
                className={cn(
                  "px-3 py-2 border-[2px] border-[#3a3a3a] rounded-lg transition-all duration-150 flex items-center gap-1.5 cursor-pointer",
                  formData.due === 'Ongoing' 
                    ? "bg-[var(--brand-blue)] text-white border-[var(--brand-blue)]" 
                    : "bg-[#2a2a2a] text-white/60 hover:bg-[#3a3a3a]"
                )}
                title="Set as ongoing"
              >
                <Infinity className="w-4 h-4" />
                <span className="text-xs font-medium hidden sm:inline" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
                  ONGOING
                </span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, due: formData.due === 'idk yet' ? '' : 'idk yet' })}
                className={cn(
                  "px-3 py-2 border-[2px] border-[#3a3a3a] rounded-lg transition-all duration-150 flex items-center gap-1.5 cursor-pointer",
                  formData.due === 'idk yet' 
                    ? "bg-[var(--brand-yellow)] text-black border-[var(--brand-yellow)]" 
                    : "bg-[#2a2a2a] text-white/60 hover:bg-[#3a3a3a]"
                )}
                title="Set to 'I don't know yet'"
              >
                <HelpCircle className="w-4 h-4" />
                <span className="text-xs font-medium" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
                  IDK
                </span>
              </button>
            </div>
          </div>

          {/* Tags - Clickable chips */}
          <div className="mb-4">
            <label
              className="text-[10px] tracking-wider text-white/60 uppercase block mb-1.5"
              style={{ fontFamily: 'var(--font-space-mono), monospace' }}
            >
              Tags (click to add/remove)
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {/* Selected tags */}
              {formData.tags?.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleRemoveTag(tag)}
                  className="text-[10px] px-2 py-1 bg-[var(--brand-blue)] text-white border-[2px] border-black rounded cursor-pointer transition-all duration-150 hover:bg-[var(--brand-red)] hover:line-through"
                  style={{ fontFamily: 'var(--font-space-mono), monospace' }}
                >
                  #{tag} ✕
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {/* Available tags */}
              {allTags.filter(t => !formData.tags?.includes(t)).map((tag) => (
                <div key={tag} className="flex items-center gap-1">
                  <button
                    onClick={() => handleAddTag(tag)}
                    className="text-[10px] px-2 py-1 bg-[#2a2a2a] text-white border-[2px] border-[#3a3a3a] rounded cursor-pointer transition-all duration-150 hover:bg-[var(--brand-yellow)] hover:text-black hover:border-black"
                    style={{ fontFamily: 'var(--font-space-mono), monospace' }}
                  >
                    + #{tag}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete tag "${tag}" everywhere? This removes it from all tasks.`)) {
                        onDeleteTag(tag);
                        toast.success(`Deleted #${tag} globally`);
                      }
                    }}
                    className="p-1 text-white/40 hover:text-[var(--brand-red)]"
                    title="Delete tag globally"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            {/* Custom tag input */}
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTag()}
                placeholder="Add custom tag..."
                className="flex-1 px-3 py-1.5 text-xs border-[2px] border-[#3a3a3a] rounded-lg bg-[#2a2a2a] text-white outline-none placeholder:text-white/30"
              />
              <button
                onClick={handleAddCustomTag}
                className="px-3 py-1.5 bg-[var(--brand-yellow)] text-black text-xs font-bold border-[2px] border-black rounded-lg transition-all duration-150 hover:bg-[var(--brand-yellow-dark)]"
                style={{ fontFamily: 'var(--font-space-mono), monospace' }}
              >
                ADD
              </button>
            </div>
          </div>

          {/* Notes */}
          <div className="mb-4">
            <label
              className="text-[10px] tracking-wider text-white/60 uppercase block mb-1.5"
              style={{ fontFamily: 'var(--font-space-mono), monospace' }}
            >
              Notes
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Context, thoughts, links..."
              className="w-full px-3 py-2 text-xs border-[2px] border-[#3a3a3a] rounded-lg bg-[#2a2a2a] text-white outline-none resize-vertical min-h-[80px] transition-all duration-150 focus:border-[var(--brand-blue)] placeholder:text-white/30"
              style={{ fontFamily: 'var(--font-space-mono), monospace' }}
            />
          </div>

          {/* Subtasks */}
          <div className="mb-4">
            <label
              className="text-[10px] tracking-wider text-white/60 uppercase block mb-1.5"
              style={{ fontFamily: 'var(--font-space-mono), monospace' }}
            >
              Subtasks
            </label>
            
            {/* Subtask list */}
            <div className="space-y-2 mb-2">
              {formData.subtasks?.map((st) => (
                <div
                  key={st.id}
                  className="flex items-center gap-2 p-2 bg-[#2a2a2a] border-[2px] border-[#3a3a3a] rounded-lg group"
                >
                  <input
                    value={st.text}
                    onChange={(e) => handleEditSubtask(st.id, e.target.value)}
                    className="flex-1 text-sm text-white bg-transparent border border-white/10 rounded px-2 py-1 outline-none focus:border-[var(--brand-blue)]"
                  />
                  <button
                    onClick={() => handleRemoveSubtask(st.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[var(--brand-red)] hover:text-white rounded transition-all duration-150 text-white/40"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add subtask input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtaskText}
                onChange={(e) => setNewSubtaskText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                placeholder="Add a subtask..."
                className="flex-1 px-3 py-1.5 text-xs border-[2px] border-[#3a3a3a] rounded-lg bg-[#2a2a2a] text-white outline-none placeholder:text-white/30"
              />
              <button
                onClick={handleAddSubtask}
                className="px-3 py-1.5 bg-[var(--brand-yellow)] text-black text-xs font-bold border-[2px] border-black rounded-lg transition-all duration-150 hover:bg-[var(--brand-yellow-dark)] flex items-center gap-1"
                style={{ fontFamily: 'var(--font-space-mono), monospace' }}
              >
                <Plus className="w-3 h-3" /> ADD
              </button>
            </div>
          </div>
        </div>

        {/* Footer - Dark Mode */}
        <div className="px-4 py-3.5 border-t-[2px] border-[#3a3a3a] flex gap-2.5 justify-end items-center sticky bottom-0 bg-[#1a1a1a] z-10">
          {editingTask && (
            <div className="flex gap-2">
              <button
                onClick={handleSacrifice}
                className="px-3 py-2 bg-[#3a3a3a] text-white text-xs font-bold tracking-wider border-[2px] border-[#4a4a4a] rounded-lg cursor-pointer transition-all duration-150 hover:bg-[#4a4a4a] flex items-center gap-1.5"
                style={{ fontFamily: 'var(--font-space-mono), monospace' }}
              >
                <Archive className="w-4 h-4" /> SACRIFICE
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-2 bg-transparent text-[var(--brand-red)] text-xs font-bold tracking-wider border-[2px] border-[var(--brand-red)] rounded-lg cursor-pointer transition-all duration-150 hover:bg-[var(--brand-red)] hover:text-white flex items-center gap-1.5"
                style={{ fontFamily: 'var(--font-space-mono), monospace' }}
              >
                <Trash2 className="w-4 h-4" /> DELETE
              </button>
            </div>
          )}
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="px-4 py-2 bg-transparent text-white/60 text-xs font-bold tracking-wider border-none rounded-lg cursor-pointer transition-all duration-150 hover:bg-[#2a2a2a] hover:text-white"
            style={{ fontFamily: 'var(--font-space-mono), monospace' }}
          >
            CANCEL
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-[var(--brand-red)] text-black text-xs font-bold tracking-wider border-[2px] border-black rounded-lg cursor-pointer transition-all duration-150 shadow-[4px_4px_0_var(--brand-red-dark)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_var(--brand-red-dark)] active:translate-x-0 active:translate-y-0 active:shadow-none btn-shine"
            style={{ fontFamily: 'var(--font-space-mono), monospace' }}
          >
            {editingTask ? 'SAVE' : 'CREATE TASK'}
          </button>
        </div>
      </div>
    </div>
  );
}
