'use client';

import { useState } from 'react';
import { useStore, createNewProject } from '@/lib/store';
import { cn } from '@/lib/utils';
import { X, Trash2, Palette, Archive, FolderOpen, Plus, HelpCircle, Pencil, Check, Infinity } from 'lucide-react';
import { toast } from 'sonner';

const COLORS = [
  { name: 'red', value: 'var(--brand-red)' },
  { name: 'blue', value: 'var(--brand-blue)' },
  { name: 'yellow', value: 'var(--brand-yellow)' },
  { name: 'gray', value: 'var(--gray-400)' },
  { name: 'green', value: '#22c55e' },
  { name: 'purple', value: '#a855f7' },
  { name: 'orange', value: '#f97316' },
  { name: 'pink', value: '#ec4899' },
];

const EMOJIS = [
  '📁', '🚀', '🎨', '💡', '⚡', '🔥', 
  '🎯', '📢', '💼', '📊', '🔧', '🌟', 
  '💻', '📱', '🎪', '🏆', '🎵', '🎬',
  '✨', '🔮', '📚', '🏠', '💎', '🌈'
];

interface ProjectModalContentProps {
  editingProjectId: string | null;
  editingProject: { id: string; name: string; color: string; icon: string; due: string; startDate: string; endDate: string; category: string | null } | null;
  onClose: () => void;
}

function ProjectModalContent({ editingProjectId, editingProject, onClose }: ProjectModalContentProps) {
  const { addProject, updateProject, deleteProject, archiveProject, tasks, projects, projectCategories, addProjectCategory, updateProjectCategory, deleteProjectCategory } = useStore();
  
  // Initialize state with editing project data or defaults
  const [name, setName] = useState(editingProject?.name || '');
  const [color, setColor] = useState(editingProject?.color || 'blue');
  const [icon, setIcon] = useState(editingProject?.icon || '📁');
  const [due, setDue] = useState(editingProject?.due || '');
  const [startDate, setStartDate] = useState(editingProject?.startDate || '');
  const [endDate, setEndDate] = useState(editingProject?.endDate || '');
  const [category, setCategory] = useState<string | null>(editingProject?.category || null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  // Category editing state
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Project name is required');
      return;
    }

    if (editingProjectId) {
      updateProject(editingProjectId, { 
        name: name.trim(), 
        color, 
        icon,
        startDate,
        endDate,
        due,
        category
      });
      toast.success('Project updated');
    } else {
      const newProject = createNewProject({
        name: name.trim(),
        color,
        icon,
        startDate,
        endDate,
        due,
        category,
        order: projects.length,
      });
      addProject(newProject);
      toast.success('Project created');
    }
    onClose();
  };
  
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    addProjectCategory(newCategoryName.trim());
    setNewCategoryName('');
    setShowNewCategory(false);
    toast.success('Category added');
  };

  const handleRenameCategory = (categoryId: string) => {
    if (!editingCategoryName.trim()) return;
    updateProjectCategory(categoryId, editingCategoryName.trim());
    setEditingCategoryId(null);
    setEditingCategoryName('');
    toast.success('Category renamed');
  };

  const handleDeleteCategory = (categoryId: string) => {
    deleteProjectCategory(categoryId);
    setDeletingCategoryId(null);
    toast.success('Category deleted');
  };

  const handleDelete = () => {
    if (!editingProjectId || !editingProject) return;
    
    const projectTasks = tasks.filter(
      (t) => t.project === editingProject.name || (t.linkedProjects || []).includes(editingProject.name)
    );
    if (projectTasks.length > 0) {
      toast.error(`Cannot delete: ${projectTasks.length} tasks are assigned to this project`);
      return;
    }
    
    deleteProject(editingProjectId);
    toast.success('Project deleted');
    onClose();
  };

  const handleSacrifice = () => {
    if (!editingProjectId) return;
    archiveProject(editingProjectId);
    toast.success('Project sacrificed');
    onClose();
  };

  return (
    <div 
      className="bg-white border-[3px] border-black rounded-lg shadow-[8px_8px_0_black] w-full max-w-md animate-in fade-in-0 zoom-in-95 duration-200"
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div className="bg-black px-4 py-3 flex items-center justify-between">
        <h2 
          className="text-lg text-[var(--brand-yellow)] tracking-wide"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {editingProjectId ? 'EDIT PROJECT' : 'NEW PROJECT'}
        </h2>
        <button 
          onClick={onClose}
          className="text-white/70 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Icon & Name */}
        <div className="flex gap-3">
          {/* Icon Picker */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="w-14 h-14 border-[2px] border-black rounded-lg flex items-center justify-center text-2xl bg-[var(--gray-100)] hover:bg-[var(--gray-200)] transition-colors cursor-pointer"
            >
              {icon}
            </button>
            
            {showEmojiPicker && (
              <div className="absolute top-full left-0 mt-2 bg-white border-[2px] border-black rounded-lg shadow-[4px_4px_0_black] p-3 grid grid-cols-6 gap-2 z-10 min-w-[240px]">
                {EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      setIcon(emoji);
                      setShowEmojiPicker(false);
                    }}
                    className={cn(
                      "w-10 h-10 flex items-center justify-center text-xl rounded-lg transition-all cursor-pointer",
                      icon === emoji ? "bg-[var(--brand-yellow)] border-[2px] border-black" : "hover:bg-[var(--gray-100)] border-[2px] border-transparent"
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Name */}
          <div className="flex-1">
            <label 
              className="block text-[10px] text-[var(--gray-500)] mb-1 tracking-wider uppercase"
              style={{ fontFamily: 'var(--font-space-mono), monospace' }}
            >
              Project Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter project name..."
              className="w-full px-3 py-2.5 border-[2px] border-black rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)] transition-all"
              autoFocus
            />
          </div>
        </div>

        {/* Due Date */}
        <div>
          <label 
            className="block text-[10px] text-[var(--gray-500)] mb-1 tracking-wider uppercase"
            style={{ fontFamily: 'var(--font-space-mono), monospace' }}
          >
            Due Date
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              value={due && due !== 'idk yet' && due !== 'Ongoing' ? due : ''}
              onChange={e => setDue(e.target.value)}
              className="flex-1 px-3 py-2.5 border-[2px] border-black rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={due === 'idk yet' || due === 'Ongoing'}
            />
            <button
              type="button"
              onClick={() => setDue(due === 'Ongoing' ? '' : 'Ongoing')}
              className={cn(
                "px-3 py-2 border-[2px] border-black rounded-lg transition-all flex items-center gap-1.5 cursor-pointer",
                due === 'Ongoing' 
                  ? "bg-[var(--brand-blue)] text-white" 
                  : "bg-[var(--gray-100)] text-[var(--gray-600)] hover:bg-[var(--gray-200)]"
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
              onClick={() => setDue(due === 'idk yet' ? '' : 'idk yet')}
              className={cn(
                "px-3 py-2 border-[2px] border-black rounded-lg transition-all flex items-center gap-1.5 cursor-pointer",
                due === 'idk yet' 
                  ? "bg-[var(--brand-yellow)] text-black" 
                  : "bg-[var(--gray-100)] text-[var(--gray-600)] hover:bg-[var(--gray-200)]"
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

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-[var(--gray-500)] mb-1 tracking-wider uppercase" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2.5 border-[2px] border-black rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)] transition-all"
            />
          </div>
          <div>
            <label className="block text-[10px] text-[var(--gray-500)] mb-1 tracking-wider uppercase" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
              Event / End
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2.5 border-[2px] border-black rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)] transition-all"
            />
          </div>
        </div>

        {/* Color Picker */}
        <div>
          <label 
            className="block text-[10px] text-[var(--gray-500)] mb-2 tracking-wider uppercase"
            style={{ fontFamily: 'var(--font-space-mono), monospace' }}
          >
            <Palette className="w-3 h-3 inline mr-1" /> Color
          </label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map(c => (
              <button
                key={c.name}
                type="button"
                onClick={() => setColor(c.name)}
                className={cn(
                  "w-8 h-8 rounded-lg border-[2px] border-black transition-all cursor-pointer",
                  color === c.name && "ring-2 ring-offset-2 ring-black scale-110"
                )}
                style={{ backgroundColor: c.value }}
              />
            ))}
          </div>
        </div>

        {/* Category Selection */}
        <div>
          <label 
            className="block text-[10px] text-[var(--gray-500)] mb-2 tracking-wider uppercase"
            style={{ fontFamily: 'var(--font-space-mono), monospace' }}
          >
            <FolderOpen className="w-3 h-3 inline mr-1" /> Category
          </label>
          <div className="flex flex-wrap gap-2">
            {/* No category option */}
            <button
              type="button"
              onClick={() => setCategory(null)}
              className={cn(
                "px-3 py-1.5 text-xs border-[2px] border-black rounded-lg transition-all cursor-pointer",
                category === null 
                  ? "bg-[var(--brand-yellow)] text-black" 
                  : "bg-white text-[var(--gray-600)] hover:bg-[var(--gray-100)]"
              )}
              style={{ fontFamily: 'var(--font-space-mono), monospace' }}
            >
              No Category
            </button>
            {/* Existing categories */}
            {projectCategories.map(cat => (
              <div key={cat.id} className="relative">
                {editingCategoryId === cat.id ? (
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={editingCategoryName}
                      onChange={e => setEditingCategoryName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleRenameCategory(cat.id)}
                      className="px-2 py-1 text-xs border-[2px] border-black rounded-lg w-24"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => handleRenameCategory(cat.id)}
                      className="p-1 bg-[var(--brand-green)] text-white rounded"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEditingCategoryId(null); setEditingCategoryName(''); }}
                      className="p-1 bg-[var(--gray-400)] text-white rounded"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={cn(
                        "px-3 py-1.5 text-xs border-[2px] border-black rounded-lg transition-all cursor-pointer",
                        category === cat.id 
                          ? "bg-[var(--brand-blue)] text-white" 
                          : "bg-white text-[var(--gray-600)] hover:bg-[var(--gray-100)]"
                      )}
                      style={{ fontFamily: 'var(--font-space-mono), monospace' }}
                    >
                      {cat.name}
                    </button>
                    {/* Edit/Delete buttons */}
                    <button
                      type="button"
                      onClick={() => { setEditingCategoryId(cat.id); setEditingCategoryName(cat.name); }}
                      className="p-1 text-[var(--gray-400)] hover:text-[var(--brand-blue)] transition-colors cursor-pointer"
                      title="Rename category"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingCategoryId(cat.id)}
                      className="p-1 text-[var(--gray-400)] hover:text-[var(--brand-red)] transition-colors cursor-pointer"
                      title="Delete category"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}
            {/* Add new category button */}
            <button
              type="button"
              onClick={() => setShowNewCategory(!showNewCategory)}
              className="px-2 py-1.5 text-xs border-[2px] border-dashed border-[var(--gray-400)] rounded-lg text-[var(--gray-500)] hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)] transition-all cursor-pointer"
              style={{ fontFamily: 'var(--font-space-mono), monospace' }}
            >
              <Plus className="w-3 h-3 inline" />
            </button>
          </div>
          {/* New category input */}
          {showNewCategory && (
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                placeholder="Category name..."
                className="flex-1 px-3 py-1.5 text-xs border-[2px] border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]"
                autoFocus
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="px-3 py-1.5 bg-[var(--brand-blue)] text-white text-xs border-[2px] border-black rounded-lg hover:bg-[var(--brand-blue-light)] transition-all cursor-pointer"
                style={{ fontFamily: 'var(--font-space-mono), monospace' }}
              >
                ADD
              </button>
            </div>
          )}
          
          {/* Delete Category Verification Dialog */}
          {deletingCategoryId && (
            <div className="mt-3 p-3 bg-[var(--brand-red)]/10 border-[2px] border-[var(--brand-red)] rounded-lg">
              <p className="text-xs text-[var(--brand-red)] mb-2" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
                ⚠️ Delete "{projectCategories.find(c => c.id === deletingCategoryId)?.name}"? Projects will be moved to "No Category".
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(deletingCategoryId)}
                  className="px-3 py-1.5 bg-[var(--brand-red)] text-white text-xs border-[2px] border-black rounded-lg"
                  style={{ fontFamily: 'var(--font-space-mono), monospace' }}
                >
                  DELETE
                </button>
                <button
                  type="button"
                  onClick={() => setDeletingCategoryId(null)}
                  className="px-3 py-1.5 bg-white text-[var(--gray-600)] text-xs border-[2px] border-black rounded-lg"
                  style={{ fontFamily: 'var(--font-space-mono), monospace' }}
                >
                  CANCEL
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="border-t-[2px] border-[var(--gray-200)] pt-4">
          <label 
            className="block text-[10px] text-[var(--gray-500)] mb-2 tracking-wider uppercase"
            style={{ fontFamily: 'var(--font-space-mono), monospace' }}
          >
            Preview
          </label>
          <div 
            className="flex items-center gap-3 p-3 border-[2px] border-black rounded-lg"
            style={{ 
              background: `linear-gradient(135deg, ${COLORS.find(c => c.name === color)?.value}15 0%, ${COLORS.find(c => c.name === color)?.value}05 100%)`,
              borderLeft: `4px solid ${COLORS.find(c => c.name === color)?.value}`
            }}
          >
            <span className="text-xl">{icon}</span>
            <div>
              <div className="font-medium text-sm">{name || 'Project Name'}</div>
              <div className="text-[10px] text-[var(--gray-500)]" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
                {due || 'No due date'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t-[2px] border-black bg-[var(--gray-100)] flex items-center justify-between">
        <div className="flex gap-2">
          {editingProjectId && (
            <>
              <button
                onClick={handleSacrifice}
                className="flex items-center gap-1.5 px-3 py-2 bg-[var(--gray-600)] text-white border-[2px] border-black rounded-lg hover:bg-[var(--gray-800)] transition-all text-xs font-bold cursor-pointer btn-shine"
                style={{ fontFamily: 'var(--font-space-mono), monospace' }}
              >
                <Archive className="w-3.5 h-3.5" /> SACRIFICE
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-2 text-[var(--brand-red)] border-[2px] border-[var(--brand-red)] rounded-lg hover:bg-[var(--brand-red)] hover:text-white transition-all text-xs font-bold cursor-pointer"
                style={{ fontFamily: 'var(--font-space-mono), monospace' }}
              >
                <Trash2 className="w-3.5 h-3.5" /> DELETE
              </button>
            </>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[var(--gray-600)] border-[2px] border-[var(--gray-300)] rounded-lg hover:bg-[var(--gray-200)] transition-all text-xs font-bold cursor-pointer"
            style={{ fontFamily: 'var(--font-space-mono), monospace' }}
          >
            CANCEL
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-[var(--brand-blue)] text-white border-[2px] border-black rounded-lg hover:bg-[var(--brand-blue-light)] transition-all text-xs font-bold shadow-[2px_2px_0_black] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_black] active:translate-x-0 active:translate-y-0 active:shadow-none cursor-pointer"
            style={{ fontFamily: 'var(--font-space-mono), monospace' }}
          >
            {editingProjectId ? 'UPDATE' : 'CREATE'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProjectModal() {
  const { 
    isProjectModalOpen, 
    setProjectModalOpen, 
    editingProjectId, 
    setEditingProjectId,
    projects
  } = useStore();

  const editingProject = editingProjectId 
    ? projects.find(p => p.id === editingProjectId) 
    : null;

  const handleClose = () => {
    setProjectModalOpen(false);
    setEditingProjectId(null);
  };

  if (!isProjectModalOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] p-4"
      onClick={handleClose}
    >
      {/* Using key to reset the form when editingProjectId changes */}
      <ProjectModalContent
        key={editingProjectId || 'new'}
        editingProjectId={editingProjectId}
        editingProject={editingProject ? {
          id: editingProject.id,
          name: editingProject.name,
          color: editingProject.color,
          icon: editingProject.icon,
          startDate: editingProject.startDate || '',
          endDate: editingProject.endDate || '',
          due: editingProject.due,
          category: editingProject.category
        } : null}
        onClose={handleClose}
      />
    </div>
  );
}
