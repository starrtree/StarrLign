'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type DragEvent,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { useStore, calculateWordCount, createNewBlock, estimateReadTime, formatRelativeTime } from '@/lib/store';
import { Block, BlockType, Document } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  GripVertical,
  Link2,
  MoreVertical,
  Plus,
  Redo2,
  Trash2,
  Undo2,
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

const TITLE_PLACEHOLDERS = new Set(['', 'Untitled', 'Untitled Document']);

type DocSnapshot = Pick<Document, 'title' | 'projectId' | 'blocks'>;

function cloneBlocks(blocks: Block[]) {
  return JSON.parse(JSON.stringify(blocks)) as Block[];
}

function buildDefaultBlock(type: BlockType, content = ''): Block {
  const block = createNewBlock(type, content);

  if (type === 'callout') {
    block.meta = { emoji: '💡', bgColor: 'yellow' };
    block.content = content || 'Idea';
  } else if (type === 'progress') {
    block.meta = { progressMode: 'manual', progressValue: 0, progressColor: 'blue' };
    block.content = content || 'Progress';
  } else if (type === 'code') {
    block.meta = { language: 'javascript' };
  } else if (type === 'task') {
    block.meta = { status: 'todo', priority: 'medium' };
  } else if (type === 'link') {
    block.meta = { url: '' };
    block.content = content || 'Link title';
  }

  return block;
}

function placeCaretAtEnd(element: HTMLElement) {
  element.focus();
  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(false);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

function getCaretTextOffset(element: HTMLElement) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return element.textContent?.length || 0;

  const range = selection.getRangeAt(0);
  const preRange = range.cloneRange();
  preRange.selectNodeContents(element);
  preRange.setEnd(range.endContainer, range.endOffset);
  return preRange.toString().length;
}

function findBlockIdFromSelection() {
  const selection = window.getSelection();
  const node = selection?.anchorNode;
  const element = node instanceof HTMLElement ? node : node?.parentElement;
  return element?.closest('[data-document-block-id]')?.getAttribute('data-document-block-id') || null;
}

export default function DocumentEditor() {
  const {
    documents,
    selectedDocumentId,
    setSelectedDocumentId,
    projects,
    tasks,
    updateDocument,
    archiveDocument,
    duplicateDocument,
    deleteDocument,
    updateTask,
  } = useStore();

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showBlockPicker, setShowBlockPicker] = useState<string | null>(null);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [activeHeading, setActiveHeading] = useState<string | null>(null);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [dropTargetBlockId, setDropTargetBlockId] = useState<string | null>(null);
  const [pendingFocusBlockId, setPendingFocusBlockId] = useState<string | null>(null);
  const [historyVersion, setHistoryVersion] = useState(0);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<DocSnapshot[]>([]);
  const redoRef = useRef<DocSnapshot[]>([]);
  const applyingHistoryRef = useRef(false);

  const doc = documents.find((candidate) => candidate.id === selectedDocumentId);
  const project = doc?.projectId ? projects.find((candidate) => candidate.id === doc.projectId) : null;
  const wordCount = doc ? calculateWordCount(doc.blocks) : 0;

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

  const bgColorMap: Record<string, string> = {
    blue: '#d6e4f7',
    yellow: '#fff8d6',
    red: '#fde8e9',
    green: '#dcfce7',
  };

  const headings = useMemo(() => doc?.blocks.filter((block) => ['h1', 'h2', 'h3'].includes(block.type)) || [], [doc?.blocks]);
  const showToc = headings.length >= 2;

  const triggerSave = useCallback(() => {
    setIsSaving(true);
    setIsSaved(false);

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      setIsSaving(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 1800);
    }, 650);
  }, []);

  const getSnapshot = useCallback((): DocSnapshot | null => {
    if (!doc) return null;
    return {
      title: doc.title,
      projectId: doc.projectId,
      blocks: cloneBlocks(doc.blocks),
    };
  }, [doc]);

  const recordHistory = useCallback(() => {
    if (applyingHistoryRef.current) return;
    const snapshot = getSnapshot();
    if (!snapshot) return;

    const previous = historyRef.current[historyRef.current.length - 1];
    if (previous && JSON.stringify(previous) === JSON.stringify(snapshot)) return;

    historyRef.current.push(snapshot);
    if (historyRef.current.length > 80) historyRef.current.shift();
    redoRef.current = [];
    setHistoryVersion((version) => version + 1);
  }, [getSnapshot]);

  const applySnapshot = useCallback((snapshot: DocSnapshot) => {
    if (!doc) return;
    applyingHistoryRef.current = true;
    updateDocument(doc.id, {
      title: snapshot.title,
      projectId: snapshot.projectId,
      blocks: cloneBlocks(snapshot.blocks),
      updatedAt: new Date().toISOString(),
    });
    applyingHistoryRef.current = false;
    triggerSave();
  }, [doc, triggerSave, updateDocument]);

  const handleUndo = useCallback(() => {
    const snapshot = historyRef.current.pop();
    const current = getSnapshot();
    if (!snapshot || !current) return;
    redoRef.current.push(current);
    applySnapshot(snapshot);
    setActiveBlockId(null);
    setHistoryVersion((version) => version + 1);
  }, [applySnapshot, getSnapshot]);

  const handleRedo = useCallback(() => {
    const snapshot = redoRef.current.pop();
    const current = getSnapshot();
    if (!snapshot || !current) return;
    historyRef.current.push(current);
    applySnapshot(snapshot);
    setActiveBlockId(null);
    setHistoryVersion((version) => version + 1);
  }, [applySnapshot, getSnapshot]);

  const updateBlocks = useCallback((blocks: Block[], shouldRecord = true) => {
    if (!doc) return;
    if (shouldRecord) recordHistory();
    updateDocument(doc.id, { blocks, updatedAt: new Date().toISOString() });
    triggerSave();
  }, [doc, recordHistory, triggerSave, updateDocument]);

  const updateSingleBlock = useCallback((blockId: string, updates: Partial<Block>, shouldRecord = true) => {
    if (!doc) return;
    updateBlocks(
      doc.blocks.map((block) => (block.id === blockId ? { ...block, ...updates } : block)),
      shouldRecord
    );
  }, [doc, updateBlocks]);

  const getInsertionAnchor = useCallback((explicitAfterBlockId?: string) => {
    if (explicitAfterBlockId !== undefined) return explicitAfterBlockId;
    return findBlockIdFromSelection() || activeBlockId || doc?.blocks.at(-1)?.id;
  }, [activeBlockId, doc?.blocks]);

  const insertBlock = useCallback((type: BlockType, afterBlockId?: string, focusNewBlock = false, content = '') => {
    if (!doc) return null;
    const newBlock = buildDefaultBlock(type, content);
    const anchorId = getInsertionAnchor(afterBlockId);
    const nextBlocks = [...doc.blocks];
    const anchorIndex = anchorId ? nextBlocks.findIndex((block) => block.id === anchorId) : -1;
    nextBlocks.splice(anchorIndex >= 0 ? anchorIndex + 1 : nextBlocks.length, 0, newBlock);
    updateBlocks(nextBlocks);
    setShowBlockPicker(null);
    setActiveBlockId(newBlock.id);
    if (focusNewBlock) setPendingFocusBlockId(newBlock.id);
    return newBlock.id;
  }, [doc, getInsertionAnchor, updateBlocks]);

  const handleDeleteBlock = useCallback((blockId: string) => {
    if (!doc) return;
    updateBlocks(doc.blocks.filter((block) => block.id !== blockId));
  }, [doc, updateBlocks]);

  const handleMoveBlock = useCallback((blockId: string, direction: 'up' | 'down') => {
    if (!doc) return;
    const currentIndex = doc.blocks.findIndex((block) => block.id === blockId);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (currentIndex === -1 || newIndex < 0 || newIndex >= doc.blocks.length) return;

    const nextBlocks = [...doc.blocks];
    const [moved] = nextBlocks.splice(currentIndex, 1);
    nextBlocks.splice(newIndex, 0, moved);
    updateBlocks(nextBlocks);
  }, [doc, updateBlocks]);

  const moveBlockToIndex = useCallback((blockId: string, rawTargetIndex: number) => {
    if (!doc) return;
    const currentIndex = doc.blocks.findIndex((block) => block.id === blockId);
    if (currentIndex === -1) return;

    const nextBlocks = [...doc.blocks];
    const [moved] = nextBlocks.splice(currentIndex, 1);
    const targetIndex = Math.max(0, Math.min(rawTargetIndex > currentIndex ? rawTargetIndex - 1 : rawTargetIndex, nextBlocks.length));
    nextBlocks.splice(targetIndex, 0, moved);
    updateBlocks(nextBlocks);
  }, [doc, updateBlocks]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    historyRef.current = [];
    redoRef.current = [];
    setHistoryVersion((version) => version + 1);
  }, [selectedDocumentId]);

  useEffect(() => {
    const handleScroll = () => {
      if (!editorRef.current) return;
      const headingsInEditor = editorRef.current.querySelectorAll('[data-heading]');
      let closest: Element | null = null;
      let closestDistance = Infinity;

      headingsInEditor.forEach((heading) => {
        const rect = heading.getBoundingClientRect();
        const distance = Math.abs(rect.top - 120);
        if (distance < closestDistance) {
          closestDistance = distance;
          closest = heading;
        }
      });

      if (closest) setActiveHeading((closest as HTMLElement).id);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!pendingFocusBlockId) return;
    const timeout = window.setTimeout(() => {
      const target = document.querySelector(`[data-block-editor-id="${pendingFocusBlockId}"]`) as HTMLElement | null;
      if (target) placeCaretAtEnd(target);
      setPendingFocusBlockId(null);
    }, 60);
    return () => window.clearTimeout(timeout);
  }, [pendingFocusBlockId, doc?.blocks.length]);

  if (!doc) {
    return (
      <div className="max-w-[720px] mx-auto bg-white border-[2px] border-black rounded-lg p-8 text-center">
        <p className="text-[var(--gray-400)]">Document not found</p>
      </div>
    );
  }

  const handleBack = () => setSelectedDocumentId(null);

  const handleTitleChange = (title: string) => {
    recordHistory();
    updateDocument(doc.id, { title, updatedAt: new Date().toISOString() });
    triggerSave();
  };

  const handleTitleFocus = (event: FocusEvent<HTMLInputElement>) => {
    if (TITLE_PLACEHOLDERS.has(doc.title.trim())) {
      window.setTimeout(() => event.currentTarget.select(), 0);
    }
  };

  const handleTitlePointerDown = (event: PointerEvent<HTMLInputElement>) => {
    if (TITLE_PLACEHOLDERS.has(doc.title.trim())) {
      window.setTimeout(() => event.currentTarget.select(), 0);
    }
  };

  const handleProjectChange = (projectId: string | null) => {
    recordHistory();
    updateDocument(doc.id, { projectId, updatedAt: new Date().toISOString() });
    triggerSave();
    setShowProjectPicker(false);
  };

  const handleArchive = () => {
    if (confirm('Archive this document?')) {
      archiveDocument(doc.id);
      setSelectedDocumentId(null);
    }
    setShowMenu(false);
  };

  const handleDelete = () => {
    if (confirm('Delete this document permanently?')) {
      deleteDocument(doc.id);
      setSelectedDocumentId(null);
    }
    setShowMenu(false);
  };

  const handleTextBlockPaste = (event: ClipboardEvent<HTMLDivElement>, blockId: string) => {
    const items = Array.from(event.clipboardData.items || []);
    const imageItem = items.find((item) => item.type.startsWith('image/'));
    if (!imageItem) return;

    event.preventDefault();
    const file = imageItem.getAsFile();
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      if (!dataUrl) return;
      document.execCommand('insertHTML', false, `<img src="${dataUrl}" alt="Pasted image" style="max-width:100%;border-radius:8px;margin:8px 0;" />`);
      updateSingleBlock(blockId, { content: event.currentTarget.innerHTML || '' });
    };
    reader.readAsDataURL(file);
  };

  const handleEditableFocus = (blockId: string) => {
    setActiveBlockId(blockId);
  };

  const handleEditableBlur = (block: Block, element: HTMLElement, contentType: 'text' | 'html' = 'text') => {
    const content = contentType === 'html' ? element.innerHTML || '' : element.textContent || '';
    if (content !== block.content) updateSingleBlock(block.id, { content });
  };

  const handleEnterCreatesBlock = (event: KeyboardEvent<HTMLElement>, block: Block, nextType: BlockType = 'text') => {
    if (event.key !== 'Enter' || event.shiftKey) return false;

    event.preventDefault();
    const element = event.currentTarget;
    const text = element.textContent || '';
    const offset = getCaretTextOffset(element);
    const before = text.slice(0, offset).trimEnd();
    const after = text.slice(offset).trimStart();

    const nextBlocks = [...doc.blocks];
    const index = nextBlocks.findIndex((candidate) => candidate.id === block.id);
    if (index === -1) return true;

    const newBlock = buildDefaultBlock(nextType, after);
    nextBlocks[index] = { ...block, content: before };
    nextBlocks.splice(index + 1, 0, newBlock);
    updateBlocks(nextBlocks);
    setActiveBlockId(newBlock.id);
    setPendingFocusBlockId(newBlock.id);
    return true;
  };

  const handleGeneralEditableKeyDown = (event: KeyboardEvent<HTMLDivElement>, block: Block, nextType: BlockType = 'text') => {
    if (event.key === '/' && !block.content) {
      setShowBlockPicker(block.id);
      return;
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      handleEnterCreatesBlock(event, block, nextType);
    }

    if (event.key === 'Backspace' && !event.currentTarget.textContent && doc.blocks.length > 1) {
      const index = doc.blocks.findIndex((candidate) => candidate.id === block.id);
      const previousBlock = doc.blocks[index - 1];
      if (previousBlock) {
        event.preventDefault();
        handleDeleteBlock(block.id);
        setPendingFocusBlockId(previousBlock.id);
      }
    }
  };

  const handleTaskToggle = (blockId: string, taskId?: string) => {
    if (taskId) {
      const task = tasks.find((candidate) => candidate.id === taskId);
      if (task) updateTask(taskId, { status: task.status === 'done' ? 'todo' : 'done' });
    }

    const block = doc.blocks.find((candidate) => candidate.id === blockId);
    updateSingleBlock(blockId, {
      meta: {
        ...block?.meta,
        status: block?.meta?.status === 'done' ? 'todo' : 'done',
      },
    });
  };

  const handleTaskPriorityCycle = (blockId: string) => {
    const block = doc.blocks.find((candidate) => candidate.id === blockId);
    const priorities: Array<'high' | 'medium' | 'low'> = ['high', 'medium', 'low'];
    const currentPriority = block?.meta?.priority || 'medium';
    const nextPriority = priorities[(priorities.indexOf(currentPriority) + 1) % priorities.length];
    updateSingleBlock(blockId, { meta: { ...block?.meta, priority: nextPriority } });
  };

  const handleTaskStatusCycle = (blockId: string) => {
    const block = doc.blocks.find((candidate) => candidate.id === blockId);
    const statuses: Array<'todo' | 'doing' | 'review' | 'done'> = ['todo', 'doing', 'review', 'done'];
    const currentStatus = block?.meta?.status || 'todo';
    const nextStatus = statuses[(statuses.indexOf(currentStatus) + 1) % statuses.length];
    updateSingleBlock(blockId, { meta: { ...block?.meta, status: nextStatus } });
  };

  const handleProgressModeCycle = (blockId: string) => {
    const block = doc.blocks.find((candidate) => candidate.id === blockId);
    const modes: Array<'manual' | 'auto' | 'project'> = ['manual', 'auto', 'project'];
    const currentMode = block?.meta?.progressMode || 'manual';
    const nextMode = modes[(modes.indexOf(currentMode) + 1) % modes.length];
    updateSingleBlock(blockId, { meta: { ...block?.meta, progressMode: nextMode } });
  };

  const handleProgressColorCycle = (blockId: string) => {
    const block = doc.blocks.find((candidate) => candidate.id === blockId);
    const colors: Array<'blue' | 'yellow' | 'red' | 'green'> = ['blue', 'yellow', 'red', 'green'];
    const currentColor = block?.meta?.progressColor || 'blue';
    const nextColor = colors[(colors.indexOf(currentColor) + 1) % colors.length];
    updateSingleBlock(blockId, { meta: { ...block?.meta, progressColor: nextColor } });
  };

  const handleCalloutColorCycle = (blockId: string) => {
    const block = doc.blocks.find((candidate) => candidate.id === blockId);
    const colors: Array<'blue' | 'yellow' | 'red' | 'green'> = ['blue', 'yellow', 'red', 'green'];
    const currentColor = block?.meta?.bgColor || 'yellow';
    const nextColor = colors[(colors.indexOf(currentColor) + 1) % colors.length];
    updateSingleBlock(blockId, { meta: { ...block?.meta, bgColor: nextColor } });
  };

  const handleLinkUrlBlur = (block: Block, element: HTMLElement) => {
    const url = element.textContent || '';
    if (url !== (block.meta?.url || '')) {
      updateSingleBlock(block.id, { meta: { ...block.meta, url } });
    }
  };

  const handleCodeBlur = (block: Block, value: string) => {
    if (value !== block.content) updateSingleBlock(block.id, { content: value });
  };

  const handleCodeKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>, block: Block) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      insertBlock('text', block.id, true);
    }
  };

  const getAutoProgress = () => {
    const taskBlocks = doc.blocks.filter((block) => block.type === 'task');
    if (taskBlocks.length === 0) return 0;
    const done = taskBlocks.filter((block) => block.meta?.status === 'done').length;
    return Math.round((done / taskBlocks.length) * 100);
  };

  const getProjectProgress = () => {
    if (!project || project.tasks === 0) return 0;
    return Math.round((project.completed / project.tasks) * 100);
  };

  const handleDragStart = (event: DragEvent<HTMLButtonElement>, blockId: string) => {
    setDraggedBlockId(blockId);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', blockId);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>, targetBlockId: string) => {
    event.preventDefault();
    const sourceId = draggedBlockId || event.dataTransfer.getData('text/plain');
    setDraggedBlockId(null);
    setDropTargetBlockId(null);
    if (!sourceId || sourceId === targetBlockId) return;
    const targetIndex = doc.blocks.findIndex((block) => block.id === targetBlockId);
    moveBlockToIndex(sourceId, targetIndex);
  };

  const blockControls = (block: Block, index: number) => (
    <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <button type="button" onClick={() => handleMoveBlock(block.id, 'up')} disabled={index === 0} className="p-1 text-[var(--gray-400)] hover:text-black hover:bg-[var(--gray-100)] rounded disabled:opacity-30">↑</button>
      <button type="button" onClick={() => handleMoveBlock(block.id, 'down')} disabled={index === doc.blocks.length - 1} className="p-1 text-[var(--gray-400)] hover:text-black hover:bg-[var(--gray-100)] rounded disabled:opacity-30">↓</button>
      <button type="button" onClick={() => handleDeleteBlock(block.id)} className="p-1 text-[var(--gray-400)] hover:text-[var(--brand-red)] hover:bg-[var(--gray-100)] rounded"><Trash2 className="w-3.5 h-3.5" /></button>
    </div>
  );

  const dragHandle = (block: Block) => (
    <button
      type="button"
      draggable
      onDragStart={(event) => handleDragStart(event, block.id)}
      onDragEnd={() => {
        setDraggedBlockId(null);
        setDropTargetBlockId(null);
      }}
      className="absolute left-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-1 text-[var(--gray-400)] hover:text-black transition-opacity"
      title="Drag block"
    >
      <GripVertical className="w-4 h-4" />
    </button>
  );

  const shell = (block: Block, index: number, children: ReactNode, extraClass = '') => (
    <div
      key={block.id}
      data-document-block-id={block.id}
      onPointerDown={() => setActiveBlockId(block.id)}
      onDragOver={(event) => {
        event.preventDefault();
        setDropTargetBlockId(block.id);
      }}
      onDragLeave={() => setDropTargetBlockId((current) => (current === block.id ? null : current))}
      onDrop={(event) => handleDrop(event, block.id)}
      className={cn(
        'group relative pl-8 pr-20 rounded-md transition-all',
        activeBlockId === block.id && 'bg-[var(--brand-yellow)]/5',
        dropTargetBlockId === block.id && 'ring-2 ring-[var(--brand-blue)] bg-[var(--brand-blue)]/5',
        draggedBlockId === block.id && 'opacity-45',
        extraClass
      )}
    >
      {dragHandle(block)}
      {children}
      {blockControls(block, index)}
    </div>
  );

  const blockPicker = (afterBlockId: string) => (
    <div className="absolute left-8 top-full mt-1 bg-white border-[2px] border-black rounded-lg shadow-[4px_4px_0_black] py-1 z-50 min-w-[170px]">
      {BLOCK_TYPES.map((blockType) => (
        <button
          key={blockType.type}
          type="button"
          onClick={() => insertBlock(blockType.type, afterBlockId, true)}
          className="w-full px-3 py-2 text-left text-xs hover:bg-[var(--gray-100)] flex items-center gap-2"
          style={{ fontFamily: 'var(--font-space-mono), monospace' }}
        >
          <span className="w-5">{blockType.icon}</span> {blockType.label}
        </button>
      ))}
    </div>
  );

  const editableProps = (block: Block, contentType: 'text' | 'html' = 'text') => ({
    'data-block-editor-id': block.id,
    contentEditable: true,
    suppressContentEditableWarning: true,
    onFocus: () => handleEditableFocus(block.id),
    onBlur: (event: FocusEvent<HTMLDivElement>) => handleEditableBlur(block, event.currentTarget, contentType),
  });

  const renderBlock = (block: Block, index: number) => {
    if (block.type === 'h1') {
      return shell(block, index, (
        <div
          {...editableProps(block)}
          id={`heading-${block.id}`}
          data-heading
          onKeyDown={(event) => handleGeneralEditableKeyDown(event, block)}
          className="text-[30px] text-black border-l-4 border-[var(--brand-blue)] pl-3 outline-none min-h-[1.2em]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {block.content}
        </div>
      ));
    }

    if (block.type === 'h2' || block.type === 'h3') {
      return shell(block, index, (
        <div
          {...editableProps(block)}
          id={`heading-${block.id}`}
          data-heading
          onKeyDown={(event) => handleGeneralEditableKeyDown(event, block)}
          className={cn('outline-none min-h-[1.25em]', block.type === 'h2' ? 'text-[22px] text-[var(--brand-blue)]' : 'text-[16px] font-bold text-black')}
          style={block.type === 'h2' ? { fontFamily: 'var(--font-display)' } : undefined}
        >
          {block.content}
        </div>
      ));
    }

    if (block.type === 'text') {
      return shell(block, index, (
        <>
          <div
            {...editableProps(block, 'html')}
            onKeyDown={(event) => handleGeneralEditableKeyDown(event, block)}
            onPaste={(event) => handleTextBlockPaste(event, block.id)}
            className="text-[15px] leading-relaxed text-black outline-none min-h-[1.5em]"
            data-placeholder="Start writing…"
            dangerouslySetInnerHTML={{ __html: block.content || '' }}
          />
          {showBlockPicker === block.id && blockPicker(block.id)}
        </>
      ));
    }

    if (block.type === 'task') {
      const isDone = block.meta?.status === 'done';
      const priority = block.meta?.priority || 'medium';
      const status = block.meta?.status || 'todo';
      return shell(block, index, (
        <div className="flex items-center gap-3 p-2 border-[1.5px] border-[var(--gray-200)] rounded-lg bg-[var(--off-white)]">
          <button
            type="button"
            onClick={() => handleTaskToggle(block.id, block.meta?.taskId)}
            className={cn('w-[18px] h-[18px] rounded-full border-2 cursor-pointer flex items-center justify-center flex-shrink-0 transition-all', isDone ? 'bg-[#22c55e] border-[#22c55e] text-white' : 'border-[var(--gray-400)] bg-white')}
          >
            {isDone && <Check className="w-3 h-3" />}
          </button>
          <div
            {...editableProps(block)}
            onKeyDown={(event) => handleGeneralEditableKeyDown(event, block, 'task')}
            className={cn('flex-1 text-[14px] font-medium outline-none min-h-[1.3em]', isDone && 'line-through text-[var(--gray-400)]')}
          >
            {block.content}
          </div>
          <button type="button" onClick={() => handleTaskPriorityCycle(block.id)} className={cn('text-[9px] px-2 py-0.5 rounded-full border-[1.5px] border-black font-bold uppercase', priority === 'high' && 'bg-[var(--brand-red)] text-white', priority === 'medium' && 'bg-[var(--brand-yellow)] text-black', priority === 'low' && 'bg-[var(--gray-200)] text-[var(--gray-600)]')} style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
            {priority}
          </button>
          <button type="button" onClick={() => handleTaskStatusCycle(block.id)} className={cn('text-[9px] px-2 py-0.5 rounded-full border-[1.5px] border-black font-bold uppercase', status === 'todo' && 'bg-[var(--gray-200)] text-[var(--gray-600)]', status === 'doing' && 'bg-[var(--brand-blue)] text-white', status === 'review' && 'bg-[var(--brand-yellow)] text-black', status === 'done' && 'bg-[#22c55e] text-white')} style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
            {status}
          </button>
        </div>
      ));
    }

    if (block.type === 'divider') {
      return shell(block, index, <hr className="border-t-[2px] border-[var(--gray-200)]" />, 'py-2');
    }

    if (block.type === 'progress') {
      const mode = block.meta?.progressMode || 'manual';
      const color = block.meta?.progressColor || 'blue';
      let progressValue = block.meta?.progressValue || 0;
      if (mode === 'auto') progressValue = getAutoProgress();
      if (mode === 'project') progressValue = getProjectProgress();

      return shell(block, index, (
        <div className="p-3 border-[1.5px] border-[var(--gray-200)] rounded-lg bg-[var(--off-white)]">
          <div className="flex items-center justify-between mb-2 gap-3">
            <div {...editableProps(block)} onKeyDown={(event) => handleGeneralEditableKeyDown(event, block)} className="font-semibold text-[13px] outline-none min-h-[1.2em]">
              {block.content || 'Progress'}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>{progressValue}%</span>
              <button type="button" onClick={() => handleProgressModeCycle(block.id)} className="text-[9px] px-1.5 py-0.5 bg-white border border-[var(--gray-200)] rounded uppercase" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>{mode}</button>
            </div>
          </div>
          <div className="h-2 bg-[var(--gray-200)] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${progressValue}%`, backgroundColor: colorMap[color] }} />
          </div>
          <button type="button" onClick={() => handleProgressColorCycle(block.id)} className="mt-2 text-[9px] px-1.5 py-0.5 border border-[var(--gray-200)] rounded" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>Color: {color}</button>
        </div>
      ));
    }

    if (block.type === 'link') {
      return shell(block, index, (
        <div className="flex items-center gap-3 p-2 border-[1.5px] border-[var(--gray-200)] rounded-lg hover:border-[var(--brand-blue)] transition-colors">
          <Link2 className="w-4 h-4 text-[var(--gray-400)]" />
          <div className="flex-1">
            <div contentEditable suppressContentEditableWarning onFocus={() => handleEditableFocus(block.id)} onBlur={(event) => handleLinkUrlBlur(block, event.currentTarget)} className="text-[11px] text-[var(--gray-500)] outline-none font-mono min-h-[1.2em]">
              {block.meta?.url || 'https://...'}
            </div>
            <div {...editableProps(block)} onKeyDown={(event) => handleGeneralEditableKeyDown(event, block)} className="text-[13px] font-medium outline-none min-h-[1.2em]">
              {block.content || 'Link title'}
            </div>
          </div>
          {block.meta?.url && <a href={block.meta.url} target="_blank" rel="noopener noreferrer" className="p-2 text-[var(--gray-400)] hover:text-[var(--brand-blue)]"><ExternalLink className="w-4 h-4" /></a>}
        </div>
      ));
    }

    if (block.type === 'comment') {
      return shell(block, index, (
        <div className="border-l-[3px] border-[var(--brand-yellow)] bg-[#fff8d6] p-3 rounded-r-lg">
          <div className="text-[9px] text-[var(--gray-500)] uppercase tracking-wider mb-1" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>Note</div>
          <div {...editableProps(block)} onKeyDown={(event) => handleGeneralEditableKeyDown(event, block)} className="text-[13px] italic outline-none leading-relaxed min-h-[1.4em]">
            {block.content}
          </div>
        </div>
      ));
    }

    if (block.type === 'code') {
      return shell(block, index, (
        <div className="bg-[var(--black)] rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/10">
            <span className="text-[10px] text-white/50 uppercase" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>{block.meta?.language || 'code'}</span>
            <button type="button" onClick={() => navigator.clipboard?.writeText(block.content || '')} className="text-[10px] text-white/50 hover:text-white flex items-center gap-1" style={{ fontFamily: 'var(--font-space-mono), monospace' }}><Copy className="w-3 h-3" /> Copy</button>
          </div>
          <textarea
            data-block-editor-id={block.id}
            defaultValue={block.content}
            onFocus={() => handleEditableFocus(block.id)}
            onBlur={(event) => handleCodeBlur(block, event.currentTarget.value)}
            onKeyDown={(event) => handleCodeKeyDown(event, block)}
            className="w-full p-4 bg-transparent text-white font-mono text-[13px] outline-none resize-y min-h-[100px]"
            style={{ fontFamily: 'Space Mono, monospace' }}
            placeholder="Write code here..."
          />
        </div>
      ));
    }

    if (block.type === 'callout') {
      const bgKey = block.meta?.bgColor || 'yellow';
      return shell(block, index, (
        <div className="flex items-start gap-3 p-3 border-[1.5px] border-[var(--gray-200)] rounded-lg" style={{ backgroundColor: bgColorMap[bgKey] }}>
          <button type="button" onClick={() => {
            const emojis = ['💡', '📌', '⚠️', '✅', '❗', '📝', '🎯'];
            const current = block.meta?.emoji || '💡';
            const next = emojis[(emojis.indexOf(current) + 1) % emojis.length];
            updateSingleBlock(block.id, { meta: { ...block.meta, emoji: next } });
          }} className="text-[28px] leading-none hover:scale-110 transition-transform">
            {block.meta?.emoji || '💡'}
          </button>
          <div {...editableProps(block)} onKeyDown={(event) => handleGeneralEditableKeyDown(event, block)} className="flex-1 text-[14px] leading-relaxed outline-none min-h-[1.4em]">
            {block.content}
          </div>
          <button type="button" onClick={() => handleCalloutColorCycle(block.id)} className="w-4 h-4 rounded-full border-2 border-black flex-shrink-0" style={{ backgroundColor: colorMap[bgKey] }} />
        </div>
      ));
    }

    return null;
  };

  return (
    <div className="flex relative">
      <div className="flex-1 max-w-[720px] mx-auto">
        <div className="bg-black sticky top-[60px] z-50 px-3 md:px-4 py-2 border-b-[2px] border-black">
          <div className="flex items-center gap-2 justify-between mb-2">
            <button type="button" onClick={handleBack} className="flex items-center gap-1 text-[10px] px-2 py-1 text-white/80 bg-white/10 rounded hover:text-white transition-colors shrink-0" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
              <ArrowLeft className="w-3 h-3" /> <span className="hidden sm:inline">All Docs</span>
            </button>

            <div className="relative">
              <button type="button" onClick={() => setShowProjectPicker(!showProjectPicker)} className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 rounded border border-white/20 hover:bg-white/20 transition-colors">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: project ? colorMap[project.color] : 'var(--gray-400)' }} />
                <span className="text-[10px] text-white" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>{project?.name || 'No Project'}</span>
                <ChevronDown className="w-3 h-3 text-white/50" />
              </button>
              {showProjectPicker && (
                <div className="absolute left-0 top-full mt-1 bg-white border-[2px] border-black rounded-lg shadow-[4px_4px_0_black] py-1 min-w-[180px] z-50">
                  <button type="button" onClick={() => handleProjectChange(null)} className={cn('w-full px-3 py-2 text-left text-xs hover:bg-[var(--gray-100)] flex items-center gap-2', !project && 'bg-[var(--gray-100)]')} style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
                    <span className="w-2 h-2 rounded-full bg-[var(--gray-400)]" /> No Project
                  </button>
                  <div className="border-t border-[var(--gray-200)] my-1" />
                  {projects.filter((candidate) => !candidate.isArchived).map((candidate) => (
                    <button type="button" key={candidate.id} onClick={() => handleProjectChange(candidate.id)} className={cn('w-full px-3 py-2 text-left text-xs hover:bg-[var(--gray-100)] flex items-center gap-2', project?.id === candidate.id && 'bg-[var(--gray-100)]')} style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colorMap[candidate.color] || 'var(--gray-400)' }} />
                      <span>{candidate.icon}</span>
                      {candidate.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button type="button" onClick={handleUndo} disabled={historyRef.current.length === 0} className="w-7 h-7 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 rounded disabled:opacity-30" title="Undo"><Undo2 className="w-4 h-4" /></button>
              <button type="button" onClick={handleRedo} disabled={redoRef.current.length === 0} className="w-7 h-7 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 rounded disabled:opacity-30" title="Redo"><Redo2 className="w-4 h-4" /></button>
              <span className="sr-only">{historyVersion}</span>
            </div>

            <div className={cn('text-[10px] px-2 py-1 rounded flex items-center gap-1 transition-all', isSaving && 'bg-[var(--brand-yellow)] text-black animate-pulse', isSaved && 'bg-[#22c55e] text-white', !isSaving && !isSaved && 'bg-white/10 text-white/50')} style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
              {isSaving && 'SAVING...'}
              {isSaved && !isSaving && <><Check className="w-3 h-3" /> SAVED</>}
              {!isSaving && !isSaved && 'Ready'}
            </div>

            <div className="relative">
              <button type="button" onClick={() => setShowMenu(!showMenu)} className="w-7 h-7 flex items-center justify-center text-white hover:bg-white/10 rounded"><MoreVertical className="w-4 h-4" /></button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white border-[2px] border-black rounded-lg shadow-[4px_4px_0_black] py-1 min-w-[160px] z-50">
                  <button type="button" onClick={() => { handleTitleChange('Untitled Document'); setShowMenu(false); }} className="w-full px-3 py-2 text-left text-xs hover:bg-[var(--gray-100)]" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>Rename</button>
                  <button type="button" onClick={() => { duplicateDocument(doc.id); setShowMenu(false); }} className="w-full px-3 py-2 text-left text-xs hover:bg-[var(--gray-100)]" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>Duplicate</button>
                  <button type="button" onClick={handleArchive} className="w-full px-3 py-2 text-left text-xs hover:bg-[var(--gray-100)]" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>Archive</button>
                  <div className="border-t border-[var(--gray-200)] my-1" />
                  <button type="button" onClick={handleDelete} className="w-full px-3 py-2 text-left text-xs text-[var(--brand-red)] hover:bg-[var(--gray-100)]" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>Delete</button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap no-scrollbar">
            <span className="text-[9px] text-white/45 pr-1" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>Insert after cursor:</span>
            {BLOCK_TYPES.map((blockType) => (
              <button key={blockType.type} type="button" onClick={() => insertBlock(blockType.type, undefined, true)} className="text-[11px] px-2 py-1 bg-white/10 text-white border border-white/20 rounded cursor-pointer transition-all hover:bg-[var(--brand-yellow)] hover:text-black hover:border-[var(--brand-yellow)] shrink-0" style={{ fontFamily: 'var(--font-space-mono), monospace' }} title={blockType.label}>
                {blockType.icon}
              </button>
            ))}
          </div>
        </div>

        <div ref={editorRef} className="bg-white border-x-[2px] border-b-[2px] border-black rounded-b-lg p-8 min-h-[500px]">
          <input
            type="text"
            value={doc.title}
            onChange={(event) => handleTitleChange(event.target.value)}
            onFocus={handleTitleFocus}
            onPointerDown={handleTitlePointerDown}
            placeholder="Untitled Document"
            className="w-full text-[40px] tracking-wide border-none outline-none bg-transparent mb-2 selection:bg-[var(--brand-yellow)] selection:text-black"
            style={{ fontFamily: 'var(--font-display)' }}
          />

          <div className="text-[10px] text-[var(--gray-500)] mb-4 flex items-center gap-2 flex-wrap" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
            {project?.name && <>{project.name}<span>·</span></>}
            <span>Last edited {formatRelativeTime(doc.updatedAt)}</span>
            <span>·</span>
            <span>{wordCount} words</span>
            <span>·</span>
            <span>{estimateReadTime(wordCount)}</span>
          </div>

          <hr className="border-t border-[var(--gray-200)] mb-6" />

          <div className="space-y-1">
            {doc.blocks.map((block, index) => renderBlock(block, index))}
          </div>

          <button type="button" onClick={() => insertBlock('text', doc.blocks.at(-1)?.id, true)} className="mt-4 w-full py-3 border-[2px] border-dashed border-[var(--gray-200)] rounded-lg text-[var(--gray-400)] text-xs hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)] transition-colors flex items-center justify-center gap-2" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
            <Plus className="w-3.5 h-3.5" /> Add Block To Bottom
          </button>
        </div>
      </div>

      {showToc && (
        <div className="fixed right-[24px] top-[140px] w-[180px] hidden xl:block">
          <div className="text-[9px] text-[var(--gray-500)] uppercase tracking-[1.5px] mb-2" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>On This Page</div>
          <div className="space-y-1">
            {headings.map((heading) => {
              const isActive = activeHeading === `heading-${heading.id}`;
              const indent = heading.type === 'h2' ? 'pl-[10px]' : heading.type === 'h3' ? 'pl-[20px]' : '';
              return (
                <button key={heading.id} type="button" onClick={() => document.getElementById(`heading-${heading.id}`)?.scrollIntoView({ behavior: 'smooth' })} className={cn('block w-full text-left text-[12px] py-0.5 transition-colors', indent, heading.type === 'h3' && 'text-[11px] text-[var(--gray-500)]', heading.type !== 'h3' && isActive && 'text-[var(--brand-blue)] font-semibold', heading.type !== 'h3' && !isActive && 'text-[var(--gray-600)]', heading.type !== 'h3' && 'hover:text-[var(--brand-blue)]')}>
                  {heading.content || 'Untitled'}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
