'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useStore, createNewBlock, calculateWordCount, estimateReadTime, formatRelativeTime } from '@/lib/store';
import { Block, BlockType, Task } from '@/lib/types';
import { cn } from '@/lib/utils';
import { 
  ArrowLeft, Check, ChevronDown, Copy, MoreVertical, 
  GripVertical, Trash2, ExternalLink, Archive, 
  FileText, Code, Link2, MessageSquare, AlertCircle
} from 'lucide-react';

const BLOCK_TYPES: { type: BlockType; label: string; icon: string }[] = [
  { type: 'h1', label: 'Heading 1', icon: 'H1' },
  { type: 'h2', label: 'Heading 2', icon: 'H2' },
  { type: 'h3', label: 'Heading 3', icon: 'H3' },
  { type: 'text', label: 'Text', icon: '¶' },
  { type: 'task', label: 'Task', icon: '☑' },
  { type: 'divider', label: 'Divider', icon: '──' },
  { type: 'progress', label: 'Progress', icon: '📊' },
  { type: 'link', label: 'Link', icon: '🔗' },
  { type: 'comment', label: 'Comment', icon: '💬' },
  { type: 'code', label: 'Code', icon: '<>' },
  { type: 'callout', label: 'Callout', icon: '★' },
];

export default function DocumentEditor() {
  const { 
    documents, 
    selectedDocumentId, 
    setSelectedDocumentId,
    projects,
    tasks,
    updateDocument,
    addBlock,
    updateBlock,
    deleteBlock,
    moveBlock,
    archiveDocument,
    duplicateDocument,
    deleteDocument,
    updateTask,
  } = useStore();

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showBlockPicker, setShowBlockPicker] = useState<string | null>(null);
  const [showTaskPicker, setShowTaskPicker] = useState(false);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [activeHeading, setActiveHeading] = useState<string | null>(null);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const doc = documents.find(d => d.id === selectedDocumentId);
  const project = doc?.projectId ? projects.find(p => p.id === doc.projectId) : null;
  const wordCount = doc ? calculateWordCount(doc.blocks) : 0;

  // Auto-save with debounce
  const triggerSave = useCallback(() => {
    setIsSaving(true);
    setIsSaved(false);
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      // Simulate save
      setIsSaving(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }, 800);
  }, []);

  // Handle heading scroll tracking for TOC
  useEffect(() => {
    const handleScroll = () => {
      if (!editorRef.current) return;
      
      const headings = editorRef.current.querySelectorAll('[data-heading]');
      let closest: Element | null = null;
      let closestDistance = Infinity;
      
      headings.forEach((heading) => {
        const rect = heading.getBoundingClientRect();
        const distance = Math.abs(rect.top - 120);
        if (distance < closestDistance) {
          closestDistance = distance;
          closest = heading;
        }
      });
      
      if (closest) {
        setActiveHeading(closest.id);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle back
  const handleBack = () => {
    setSelectedDocumentId(null);
  };

  // Handle title change
  const handleTitleChange = (title: string) => {
    if (doc) {
      updateDocument(doc.id, { title });
      triggerSave();
    }
  };

  // Handle adding block
  const handleAddBlock = (type: BlockType, afterBlockId?: string) => {
    if (!doc) return;
    
    const newBlock = createNewBlock(type);
    
    // Set default meta for certain types
    if (type === 'callout') {
      newBlock.meta = { emoji: '💡', bgColor: 'yellow' };
    } else if (type === 'progress') {
      newBlock.meta = { progressMode: 'manual', progressValue: 0, progressColor: 'blue' };
    } else if (type === 'code') {
      newBlock.meta = { language: 'javascript' };
    }
    
    addBlock(doc.id, newBlock, afterBlockId);
    setShowBlockPicker(null);
    triggerSave();
  };

  // Handle block content change
  const handleBlockContentChange = (blockId: string, content: string) => {
    if (!doc) return;
    updateBlock(doc.id, blockId, { content });
    triggerSave();
  };

  const handleTextBlockPaste = (e: React.ClipboardEvent<HTMLDivElement>, blockId: string) => {
    const items = Array.from(e.clipboardData.items || []);
    const imageItem = items.find((item) => item.type.startsWith('image/'));
    if (!imageItem) return;

    e.preventDefault();
    const file = imageItem.getAsFile();
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      if (!dataUrl) return;
      const html = `<img src="${dataUrl}" alt="Pasted image" style="max-width:100%;border-radius:8px;margin:8px 0;" />`;
      document.execCommand('insertHTML', false, html);
      const target = e.currentTarget;
      handleBlockContentChange(blockId, target.innerHTML || '');
    };
    reader.readAsDataURL(file);
  };

  // Handle block delete
  const handleDeleteBlock = (blockId: string) => {
    if (!doc) return;
    deleteBlock(doc.id, blockId);
    triggerSave();
  };

  // Handle block move
  const handleMoveBlock = (blockId: string, direction: 'up' | 'down') => {
    if (!doc) return;
    const currentIndex = doc.blocks.findIndex(b => b.id === blockId);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex >= 0 && newIndex < doc.blocks.length) {
      moveBlock(doc.id, blockId, newIndex);
      triggerSave();
    }
  };

  // Handle drag and drop
  const handleDragStart = (blockId: string) => {
    setDraggedBlockId(blockId);
  };

  const handleDragOver = (e: React.DragEvent, targetBlockId: string) => {
    e.preventDefault();
    if (!draggedBlockId || draggedBlockId === targetBlockId || !doc) return;
  };

  const handleDrop = (e: React.DragEvent, targetBlockId: string) => {
    e.preventDefault();
    if (!draggedBlockId || draggedBlockId === targetBlockId || !doc) return;
    
    const draggedIndex = doc.blocks.findIndex(b => b.id === draggedBlockId);
    const targetIndex = doc.blocks.findIndex(b => b.id === targetBlockId);
    
    moveBlock(doc.id, draggedBlockId, targetIndex);
    setDraggedBlockId(null);
    triggerSave();
  };

  // Handle task block
  const handleTaskToggle = (blockId: string, taskId?: string) => {
    if (taskId) {
      // Update global task
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        updateTask(taskId, { status: task.status === 'done' ? 'todo' : 'done' });
      }
    }
    if (doc) {
      const block = doc.blocks.find(b => b.id === blockId);
      if (block?.meta) {
        updateBlock(doc.id, blockId, { 
          meta: { 
            ...block.meta, 
            status: block.meta.status === 'done' ? 'todo' : 'done' 
          } 
        });
      }
    }
    triggerSave();
  };

  const handleTaskPriorityCycle = (blockId: string) => {
    if (!doc) return;
    const block = doc.blocks.find(b => b.id === blockId);
    if (!block?.meta) return;
    
    const priorities: Array<'high' | 'medium' | 'low'> = ['high', 'medium', 'low'];
    const currentPriority = block.meta.priority || 'medium';
    const currentIndex = priorities.indexOf(currentPriority);
    const nextPriority = priorities[(currentIndex + 1) % priorities.length];
    
    updateBlock(doc.id, blockId, { meta: { ...block.meta, priority: nextPriority } });
    triggerSave();
  };

  const handleTaskStatusCycle = (blockId: string) => {
    if (!doc) return;
    const block = doc.blocks.find(b => b.id === blockId);
    if (!block?.meta) return;
    
    const statuses: Array<'todo' | 'doing' | 'review' | 'done'> = ['todo', 'doing', 'review', 'done'];
    const currentStatus = block.meta.status || 'todo';
    const currentIndex = statuses.indexOf(currentStatus);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    
    updateBlock(doc.id, blockId, { meta: { ...block.meta, status: nextStatus } });
    triggerSave();
  };

  // Handle progress block
  const handleProgressModeCycle = (blockId: string) => {
    if (!doc) return;
    const block = doc.blocks.find(b => b.id === blockId);
    if (!block?.meta) return;
    
    const modes: Array<'manual' | 'auto' | 'project'> = ['manual', 'auto', 'project'];
    const currentIndex = modes.indexOf(block.meta.progressMode || 'manual');
    const nextMode = modes[(currentIndex + 1) % modes.length];
    
    updateBlock(doc.id, blockId, { meta: { ...block.meta, progressMode: nextMode } });
    triggerSave();
  };

  const handleProgressColorCycle = (blockId: string) => {
    if (!doc) return;
    const block = doc.blocks.find(b => b.id === blockId);
    if (!block?.meta) return;
    
    const colors: Array<'blue' | 'yellow' | 'red' | 'green'> = ['blue', 'yellow', 'red', 'green'];
    const currentIndex = colors.indexOf(block.meta.progressColor || 'blue');
    const nextColor = colors[(currentIndex + 1) % colors.length];
    
    updateBlock(doc.id, blockId, { meta: { ...block.meta, progressColor: nextColor } });
    triggerSave();
  };

  // Handle callout
  const handleCalloutColorCycle = (blockId: string) => {
    if (!doc) return;
    const block = doc.blocks.find(b => b.id === blockId);
    if (!block?.meta) return;
    
    const colors: Array<'blue' | 'yellow' | 'red' | 'green'> = ['blue', 'yellow', 'red', 'green'];
    const currentIndex = colors.indexOf(block.meta.bgColor || 'yellow');
    const nextColor = colors[(currentIndex + 1) % colors.length];
    
    updateBlock(doc.id, blockId, { meta: { ...block.meta, bgColor: nextColor } });
    triggerSave();
  };

  // Document actions
  const handleArchive = () => {
    if (doc && confirm('Archive this document?')) {
      archiveDocument(doc.id);
      setSelectedDocumentId(null);
    }
    setShowMenu(false);
  };

  const handleDuplicate = () => {
    if (doc) {
      duplicateDocument(doc.id);
    }
    setShowMenu(false);
  };

  const handleDelete = () => {
    if (doc && confirm('Delete this document permanently?')) {
      deleteDocument(doc.id);
    }
    setShowMenu(false);
  };

  const handleProjectChange = (projectId: string | null) => {
    if (doc) {
      updateDocument(doc.id, { projectId });
      triggerSave();
    }
    setShowProjectPicker(false);
  };

  // Get headings for TOC
  const headings = doc?.blocks.filter(b => ['h1', 'h2', 'h3'].includes(b.type)) || [];
  const showToc = headings.length >= 2;

  // Calculate progress for auto mode
  const getAutoProgress = () => {
    if (!doc) return 0;
    const taskBlocks = doc.blocks.filter(b => b.type === 'task');
    if (taskBlocks.length === 0) return 0;
    const done = taskBlocks.filter(b => b.meta?.status === 'done').length;
    return Math.round((done / taskBlocks.length) * 100);
  };

  // Get project progress
  const getProjectProgress = () => {
    if (!project) return 0;
    return Math.round((project.completed / project.tasks) * 100);
  };

  if (!doc) {
    return (
      <div className="max-w-[720px] mx-auto bg-white border-[2px] border-black rounded-lg p-8 text-center">
        <p className="text-[var(--gray-400)]">Document not found</p>
      </div>
    );
  }

  // Color maps
  const colorMap: Record<string, string> = {
    red: 'var(--brand-red)',
    blue: 'var(--brand-blue)',
    yellow: 'var(--brand-yellow)',
    gray: 'var(--gray-400)',
    green: '#22c55e',
  };

  const bgColorMap: Record<string, string> = {
    blue: '#d6e4f7',
    yellow: '#fff8d6',
    red: '#fde8e9',
    green: '#dcfce7',
  };

  return (
    <div className="flex relative">
      {/* Main Editor */}
      <div className="flex-1 max-w-[720px] mx-auto">
        {/* Toolbar */}
        <div className="bg-black sticky top-[60px] z-50 px-3 md:px-4 py-2 border-b-[2px] border-black">
          <div className="flex items-center gap-2 justify-between mb-2">
            {/* Back */}
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-[10px] px-2 py-1 text-white/80 bg-white/10 rounded hover:text-white transition-colors shrink-0"
              style={{ fontFamily: 'var(--font-space-mono), monospace' }}
            >
              <ArrowLeft className="w-3 h-3" /> <span className="hidden sm:inline">All Docs</span>
            </button>

            {/* Project tag */}
            <div className="relative">
              <button 
                onClick={() => setShowProjectPicker(!showProjectPicker)}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 rounded border border-white/20 hover:bg-white/20 transition-colors"
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: project ? colorMap[project.color] : 'var(--gray-400)' }}
                />
                <span className="text-[10px] text-white" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
                  {project?.name || 'No Project'}
                </span>
                <ChevronDown className="w-3 h-3 text-white/50" />
              </button>
              
              {showProjectPicker && (
                <div className="absolute left-0 top-full mt-1 bg-white border-[2px] border-black rounded-lg shadow-[4px_4px_0_black] py-1 min-w-[180px] z-50">
                  <button
                    onClick={() => handleProjectChange(null)}
                    className={cn(
                      "w-full px-3 py-2 text-left text-xs hover:bg-[var(--gray-100)] flex items-center gap-2",
                      !project && "bg-[var(--gray-100)]"
                    )}
                    style={{ fontFamily: 'var(--font-space-mono), monospace' }}
                  >
                    <span className="w-2 h-2 rounded-full bg-[var(--gray-400)]" />
                    No Project
                  </button>
                  <div className="border-t border-[var(--gray-200)] my-1" />
                  {projects.filter(p => !p.isArchived).map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleProjectChange(p.id)}
                      className={cn(
                        "w-full px-3 py-2 text-left text-xs hover:bg-[var(--gray-100)] flex items-center gap-2",
                        project?.id === p.id && "bg-[var(--gray-100)]"
                      )}
                      style={{ fontFamily: 'var(--font-space-mono), monospace' }}
                    >
                      <span 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: colorMap[p.color] || 'var(--gray-400)' }}
                      />
                      <span>{p.icon}</span>
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Save status */}
            <div
              className={cn(
                "text-[10px] px-2 py-1 rounded flex items-center gap-1 transition-all",
                isSaving && "bg-[var(--brand-yellow)] text-black animate-pulse",
                isSaved && "bg-[#22c55e] text-white",
                !isSaving && !isSaved && "bg-white/10 text-white/50"
              )}
              style={{ fontFamily: 'var(--font-space-mono), monospace' }}
            >
              {isSaving && 'SAVING...'}
              {isSaved && !isSaving && <><Check className="w-3 h-3" /> SAVED</>}
              {!isSaving && !isSaved && 'Ready'}
            </div>

            {/* Menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="w-7 h-7 flex items-center justify-center text-white hover:bg-white/10 rounded"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white border-[2px] border-black rounded-lg shadow-[4px_4px_0_black] py-1 min-w-[160px] z-50">
                  <button
                    onClick={() => { updateDocument(doc.id, { title: '' }); setShowMenu(false); }}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-[var(--gray-100)]"
                    style={{ fontFamily: 'var(--font-space-mono), monospace' }}
                  >
                    Rename
                  </button>
                  <button
                    onClick={handleDuplicate}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-[var(--gray-100)]"
                    style={{ fontFamily: 'var(--font-space-mono), monospace' }}
                  >
                    Duplicate
                  </button>
                  <button
                    onClick={handleArchive}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-[var(--gray-100)]"
                    style={{ fontFamily: 'var(--font-space-mono), monospace' }}
                  >
                    Archive
                  </button>
                  <div className="border-t border-[var(--gray-200)] my-1" />
                  <button
                    onClick={handleDelete}
                    className="w-full px-3 py-2 text-left text-xs text-[var(--brand-red)] hover:bg-[var(--gray-100)]"
                    style={{ fontFamily: 'var(--font-space-mono), monospace' }}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap no-scrollbar">
            {BLOCK_TYPES.map((bt) => (
              <button
                key={bt.type}
                onClick={() => handleAddBlock(bt.type)}
                className="text-[11px] px-2 py-1 bg-white/10 text-white border border-white/20 rounded cursor-pointer transition-all hover:bg-[var(--brand-yellow)] hover:text-black hover:border-[var(--brand-yellow)] shrink-0"
                style={{ fontFamily: 'var(--font-space-mono), monospace' }}
              >
                {bt.icon}
              </button>
            ))}
          </div>
        </div>

        {/* Document Body */}
        <div 
          ref={editorRef}
          className="bg-white border-x-[2px] border-b-[2px] border-black rounded-b-lg p-8 min-h-[500px]"
        >
          {/* Title */}
          <input
            type="text"
            value={doc.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Untitled Document"
            className="w-full text-[40px] tracking-wide border-none outline-none bg-transparent mb-2"
            style={{ fontFamily: 'var(--font-display)' }}
          />

          {/* Meta row */}
          <div className="text-[10px] text-[var(--gray-500)] mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
            {project?.name && <>{project.name}</>}
            {project?.name && <span>·</span>}
            <span>Last edited {formatRelativeTime(doc.updatedAt)}</span>
            <span>·</span>
            <span>{wordCount} words</span>
            <span>·</span>
            <span>{estimateReadTime(wordCount)}</span>
          </div>

          {/* Divider */}
          <hr className="border-t border-[var(--gray-200)] mb-6" />

          {/* Blocks */}
          <div className="space-y-1">
            {doc.blocks.map((block, index) => {
              // Render each block type
              const blockControls = (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleMoveBlock(block.id, 'up')}
                    disabled={index === 0}
                    className="p-1 text-[var(--gray-400)] hover:text-black hover:bg-[var(--gray-100)] rounded disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => handleMoveBlock(block.id, 'down')}
                    disabled={index === doc.blocks.length - 1}
                    className="p-1 text-[var(--gray-400)] hover:text-black hover:bg-[var(--gray-100)] rounded disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => handleDeleteBlock(block.id)}
                    className="p-1 text-[var(--gray-400)] hover:text-[var(--brand-red)] hover:bg-[var(--gray-100)] rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );

              const dragHandle = (
                <div
                  draggable
                  onDragStart={() => handleDragStart(block.id)}
                  onDragOver={(e) => handleDragOver(e, block.id)}
                  onDrop={(e) => handleDrop(e, block.id)}
                  className="absolute left-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-grab p-1 text-[var(--gray-400)] hover:text-black transition-opacity"
                >
                  <GripVertical className="w-4 h-4" />
                </div>
              );

              switch (block.type) {
                case 'h1':
                  return (
                    <div
                      key={block.id}
                      id={`heading-${block.id}`}
                      data-heading
                      className="group relative pl-8 pr-20"
                    >
                      {dragHandle}
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => handleBlockContentChange(block.id, e.currentTarget.textContent || '')}
                        className="text-[30px] text-black border-l-4 border-[var(--brand-blue)] pl-3 outline-none"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        {block.content}
                      </div>
                      {blockControls}
                    </div>
                  );

                case 'h2':
                  return (
                    <div
                      key={block.id}
                      id={`heading-${block.id}`}
                      data-heading
                      className="group relative pl-8 pr-20"
                    >
                      {dragHandle}
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => handleBlockContentChange(block.id, e.currentTarget.textContent || '')}
                        className="text-[22px] text-[var(--brand-blue)] outline-none"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        {block.content}
                      </div>
                      {blockControls}
                    </div>
                  );

                case 'h3':
                  return (
                    <div
                      key={block.id}
                      id={`heading-${block.id}`}
                      data-heading
                      className="group relative pl-8 pr-20"
                    >
                      {dragHandle}
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => handleBlockContentChange(block.id, e.currentTarget.textContent || '')}
                        className="text-[16px] font-bold text-black outline-none"
                      >
                        {block.content}
                      </div>
                      {blockControls}
                    </div>
                  );

                case 'text':
                  return (
                    <div
                      key={block.id}
                      className="group relative pl-8 pr-20"
                    >
                      {dragHandle}
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => handleBlockContentChange(block.id, e.currentTarget.innerHTML || '')}
                        onKeyDown={(e) => {
                          if (e.key === '/' && !block.content) {
                            setShowBlockPicker(block.id);
                          }
                        }}
                        onPaste={(e) => handleTextBlockPaste(e, block.id)}
                        className="text-[15px] leading-relaxed text-black outline-none min-h-[1.5em]"
                        data-placeholder="Start writing…"
                        dangerouslySetInnerHTML={{ __html: block.content || '' }}
                      />
                      {blockControls}
                      
                      {/* Block picker */}
                      {showBlockPicker === block.id && (
                        <div className="absolute left-8 top-full mt-1 bg-white border-[2px] border-black rounded-lg shadow-[4px_4px_0_black] py-1 z-50 min-w-[150px]">
                          {BLOCK_TYPES.map((bt) => (
                            <button
                              key={bt.type}
                              onClick={() => handleAddBlock(bt.type, block.id)}
                              className="w-full px-3 py-2 text-left text-xs hover:bg-[var(--gray-100)] flex items-center gap-2"
                              style={{ fontFamily: 'var(--font-space-mono), monospace' }}
                            >
                              <span className="w-5">{bt.icon}</span> {bt.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );

                case 'task':
                  const isDone = block.meta?.status === 'done';
                  const priority = block.meta?.priority || 'medium';
                  const status = block.meta?.status || 'todo';
                  
                  return (
                    <div
                      key={block.id}
                      className="group relative pl-8 pr-20"
                    >
                      {dragHandle}
                      <div className="flex items-center gap-3 p-2 border-[1.5px] border-[var(--gray-200)] rounded-lg bg-[var(--off-white)]">
                        {/* Checkbox */}
                        <div
                          onClick={() => handleTaskToggle(block.id, block.meta?.taskId)}
                          className={cn(
                            "w-[18px] h-[18px] rounded-full border-2 cursor-pointer flex items-center justify-center flex-shrink-0 transition-all",
                            isDone ? "bg-[#22c55e] border-[#22c55e] text-white" : "border-[var(--gray-300)] bg-white"
                          )}
                        >
                          {isDone && <Check className="w-3 h-3" />}
                        </div>
                        
                        {/* Task title */}
                        <div
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => handleBlockContentChange(block.id, e.currentTarget.textContent || '')}
                          className={cn(
                            "flex-1 text-[14px] font-medium outline-none",
                            isDone && "line-through text-[var(--gray-400)]"
                          )}
                        >
                          {block.content}
                        </div>
                        
                        {/* Priority badge */}
                        <button
                          onClick={() => handleTaskPriorityCycle(block.id)}
                          className={cn(
                            "text-[9px] px-2 py-0.5 rounded-full border-[1.5px] border-black font-bold uppercase",
                            priority === 'high' && "bg-[var(--brand-red)] text-white",
                            priority === 'medium' && "bg-[var(--brand-yellow)] text-black",
                            priority === 'low' && "bg-[var(--gray-200)] text-[var(--gray-600)]"
                          )}
                          style={{ fontFamily: 'var(--font-space-mono), monospace' }}
                        >
                          {priority}
                        </button>
                        
                        {/* Status badge */}
                        <button
                          onClick={() => handleTaskStatusCycle(block.id)}
                          className={cn(
                            "text-[9px] px-2 py-0.5 rounded-full border-[1.5px] border-black font-bold uppercase",
                            status === 'todo' && "bg-[var(--gray-200)] text-[var(--gray-600)]",
                            status === 'doing' && "bg-[var(--brand-blue)] text-white",
                            status === 'review' && "bg-[var(--brand-yellow)] text-black",
                            status === 'done' && "bg-[#22c55e] text-white"
                          )}
                          style={{ fontFamily: 'var(--font-space-mono), monospace' }}
                        >
                          {status}
                        </button>
                      </div>
                      {blockControls}
                    </div>
                  );

                case 'divider':
                  return (
                    <div
                      key={block.id}
                      className="group relative pl-8 pr-20 py-2"
                    >
                      {dragHandle}
                      <hr className="border-t-[2px] border-[var(--gray-200)]" />
                      {blockControls}
                    </div>
                  );

                case 'progress':
                  const mode = block.meta?.progressMode || 'manual';
                  const color = block.meta?.progressColor || 'blue';
                  let progressValue = block.meta?.progressValue || 0;
                  
                  if (mode === 'auto') progressValue = getAutoProgress();
                  if (mode === 'project') progressValue = getProjectProgress();
                  
                  return (
                    <div
                      key={block.id}
                      className="group relative pl-8 pr-20"
                    >
                      {dragHandle}
                      <div className="p-3 border-[1.5px] border-[var(--gray-200)] rounded-lg bg-[var(--off-white)]">
                        <div className="flex items-center justify-between mb-2">
                          <div
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => handleBlockContentChange(block.id, e.currentTarget.textContent || '')}
                            className="font-semibold text-[13px] outline-none"
                          >
                            {block.content || 'Progress'}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-bold" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
                              {progressValue}%
                            </span>
                            <button
                              onClick={() => handleProgressModeCycle(block.id)}
                              className="text-[9px] px-1.5 py-0.5 bg-white border border-[var(--gray-200)] rounded uppercase"
                              style={{ fontFamily: 'var(--font-space-mono), monospace' }}
                            >
                              {mode}
                            </button>
                          </div>
                        </div>
                        <div className="h-2 bg-[var(--gray-200)] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${progressValue}%`, backgroundColor: colorMap[color] }}
                          />
                        </div>
                        <button
                          onClick={() => handleProgressColorCycle(block.id)}
                          className="mt-2 text-[9px] px-1.5 py-0.5 border border-[var(--gray-200)] rounded"
                          style={{ fontFamily: 'var(--font-space-mono), monospace' }}
                        >
                          Color: {color}
                        </button>
                      </div>
                      {blockControls}
                    </div>
                  );

                case 'link':
                  return (
                    <div
                      key={block.id}
                      className="group relative pl-8 pr-20"
                    >
                      {dragHandle}
                      <div className="flex items-center gap-3 p-2 border-[1.5px] border-[var(--gray-200)] rounded-lg hover:border-[var(--brand-blue)] transition-colors">
                        <Link2 className="w-4 h-4 text-[var(--gray-400)]" />
                        <div className="flex-1">
                          <div
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => {
                              const url = e.currentTarget.textContent || '';
                              updateBlock(doc.id, block.id, { meta: { ...block.meta, url } });
                            }}
                            className="text-[11px] text-[var(--gray-500)] outline-none font-mono"
                          >
                            {block.meta?.url || 'https://...'}
                          </div>
                          <div
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => handleBlockContentChange(block.id, e.currentTarget.textContent || '')}
                            className="text-[13px] font-medium outline-none"
                          >
                            {block.content || 'Link title'}
                          </div>
                        </div>
                        {block.meta?.url && (
                          <a
                            href={block.meta.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-[var(--gray-400)] hover:text-[var(--brand-blue)]"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                      {blockControls}
                    </div>
                  );

                case 'comment':
                  return (
                    <div
                      key={block.id}
                      className="group relative pl-8 pr-20"
                    >
                      {dragHandle}
                      <div className="border-l-[3px] border-[var(--brand-yellow)] bg-[#fff8d6] p-3 rounded-r-lg">
                        <div className="text-[9px] text-[var(--gray-500)] uppercase tracking-wider mb-1" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
                          Note
                        </div>
                        <div
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => handleBlockContentChange(block.id, e.currentTarget.textContent || '')}
                          className="text-[13px] italic outline-none leading-relaxed"
                        >
                          {block.content}
                        </div>
                      </div>
                      {blockControls}
                    </div>
                  );

                case 'code':
                  return (
                    <div
                      key={block.id}
                      className="group relative pl-8 pr-20"
                    >
                      {dragHandle}
                      <div className="bg-[var(--black)] rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/10">
                          <span className="text-[10px] text-white/50 uppercase" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
                            {block.meta?.language || 'code'}
                          </span>
                          <button className="text-[10px] text-white/50 hover:text-white flex items-center gap-1" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
                            <Copy className="w-3 h-3" /> Copy
                          </button>
                        </div>
                        <textarea
                          value={block.content}
                          onChange={(e) => handleBlockContentChange(block.id, e.target.value)}
                          className="w-full p-4 bg-transparent text-white font-mono text-[13px] outline-none resize-none min-h-[100px]"
                          style={{ fontFamily: 'Space Mono, monospace' }}
                        />
                      </div>
                      {blockControls}
                    </div>
                  );

                case 'callout':
                  const bgKey = block.meta?.bgColor || 'yellow';
                  
                  return (
                    <div
                      key={block.id}
                      className="group relative pl-8 pr-20"
                    >
                      {dragHandle}
                      <div
                        className="flex items-start gap-3 p-3 border-[1.5px] border-[var(--gray-200)] rounded-lg"
                        style={{ backgroundColor: bgColorMap[bgKey] }}
                      >
                        <button
                          onClick={() => {
                            const emojis = ['💡', '📌', '⚠️', '✅', '❗', '📝', '🎯'];
                            const current = block.meta?.emoji || '💡';
                            const next = emojis[(emojis.indexOf(current) + 1) % emojis.length];
                            updateBlock(doc.id, block.id, { meta: { ...block.meta, emoji: next } });
                          }}
                          className="text-[28px] leading-none hover:scale-110 transition-transform"
                        >
                          {block.meta?.emoji || '💡'}
                        </button>
                        <div
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => handleBlockContentChange(block.id, e.currentTarget.textContent || '')}
                          className="flex-1 text-[14px] leading-relaxed outline-none"
                        >
                          {block.content}
                        </div>
                        <button
                          onClick={() => handleCalloutColorCycle(block.id)}
                          className="w-4 h-4 rounded-full border-2 border-black flex-shrink-0"
                          style={{ backgroundColor: colorMap[bgKey] }}
                        />
                      </div>
                      {blockControls}
                    </div>
                  );

                default:
                  return null;
              }
            })}
          </div>

          {/* Add block button at end */}
          <button
            onClick={() => handleAddBlock('text')}
            className="mt-4 w-full py-3 border-[2px] border-dashed border-[var(--gray-200)] rounded-lg text-[var(--gray-400)] text-xs hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)] transition-colors"
            style={{ fontFamily: 'var(--font-space-mono), monospace' }}
          >
            + Add Block
          </button>
        </div>
      </div>

      {/* Table of Contents */}
      {showToc && (
        <div className="fixed right-[24px] top-[140px] w-[180px] hidden xl:block">
          <div className="text-[9px] text-[var(--gray-500)] uppercase tracking-[1.5px] mb-2" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
            On This Page
          </div>
          <div className="space-y-1">
            {headings.map((h) => {
              const isActive = activeHeading === `heading-${h.id}`;
              const indent = h.type === 'h2' ? 'pl-[10px]' : h.type === 'h3' ? 'pl-[20px]' : '';
              
              return (
                <button
                  key={h.id}
                  onClick={() => {
                    document.getElementById(`heading-${h.id}`)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={cn(
                    "block w-full text-left text-[12px] py-0.5 transition-colors",
                    indent,
                    h.type === 'h3' && "text-[11px] text-[var(--gray-500)]",
                    h.type !== 'h3' && isActive && "text-[var(--brand-blue)] font-semibold",
                    h.type !== 'h3' && !isActive && "text-[var(--gray-600)]",
                    h.type !== 'h3' && "hover:text-[var(--brand-blue)]"
                  )}
                >
                  {h.content || 'Untitled'}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
