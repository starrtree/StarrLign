// Task types
export interface Subtask {
  id: string;
  text: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  project: string;
  linkedProjects: string[];
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'doing' | 'review' | 'done';
  startDate: string;
  endDate: string;
  due: string;
  durationHours: number;
  durationMinutes: number;
  tags: string[];
  progress: number;
  notes: string;
  subtasks: Subtask[];
  isArchived: boolean;
}

// Project types
export interface Project {
  id: string;
  name: string;
  color: string;
  icon: string;
  tasks: number;
  completed: number;
  startDate: string;
  endDate: string;
  due: string;
  order: number;
  isArchived: boolean;
  category: string | null;
}

// Project Category type
export interface ProjectCategory {
  id: string;
  name: string;
  order: number;
}

// Block types for documents
export type BlockType = 'h1' | 'h2' | 'h3' | 'text' | 'task' | 'divider' | 'progress' | 'link' | 'comment' | 'code' | 'callout';

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  meta?: {
    // For task blocks
    taskId?: string;
    priority?: 'high' | 'medium' | 'low';
    status?: 'todo' | 'doing' | 'review' | 'done';
    // For progress blocks
    progressMode?: 'manual' | 'auto' | 'project';
    progressValue?: number;
    progressColor?: 'blue' | 'yellow' | 'red' | 'green';
    // For link blocks
    url?: string;
    title?: string;
    // For code blocks
    language?: string;
    // For callout blocks
    emoji?: string;
    bgColor?: 'blue' | 'yellow' | 'red' | 'green';
  };
}

// Document types
export interface Document {
  id: string;
  title: string;
  projectId: string | null;
  blocks: Block[];
  createdAt: string;
  updatedAt: string;
  wordCount: number;
  isArchived: boolean;
}

// View types
export type ViewType = 'dashboard' | 'kanban' | 'documents' | 'projects' | 'archive';

// App state
export interface AppState {
  currentView: ViewType;
  selectedProjectId: string | null;
  selectedDocumentId: string | null;
  tasks: Task[];
  projects: Project[];
  projectCategories: ProjectCategory[];
  projectFilter: 'active' | 'archived' | 'all' | string;
  tags: string[];
  documents: Document[];
  editingTaskId: string | null;
  isModalOpen: boolean;
  isDetailMode: boolean;
  searchQuery: string;
  
  // Settings state
  theme: 'light' | 'dark';
  soundEnabled: boolean;
  
  // Actions
  setCurrentView: (view: ViewType) => void;
  setSelectedProjectId: (id: string | null) => void;
  setSelectedDocumentId: (id: string | null) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  reorderTasksInProject: (projectName: string, draggedTaskId: string, targetTaskId: string) => void;
  deleteTask: (id: string) => void;
  archiveTask: (id: string) => void;
  restoreTask: (id: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  addSubtask: (taskId: string, text: string) => void;
  updateSubtask: (taskId: string, subtaskId: string, text: string) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;
  createTag: (tag: string) => void;
  deleteTag: (tag: string) => void;
  setEditingTaskId: (id: string | null) => void;
  setModalOpen: (open: boolean) => void;
  setDetailMode: (mode: boolean) => void;
  setSearchQuery: (query: string) => void;
  
  // Tag filter state
  tagFilter: string[];
  setTagFilter: (tags: string[]) => void;
  toggleTagFilter: (tag: string) => void;
  clearTagFilter: () => void;
  
  // Document actions
  createDocument: (projectId?: string) => void;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  deleteDocument: (id: string) => void;
  archiveDocument: (id: string) => void;
  restoreDocument: (id: string) => void;
  duplicateDocument: (id: string) => void;
  
  // Block actions
  addBlock: (docId: string, block: Block, afterBlockId?: string) => void;
  updateBlock: (docId: string, blockId: string, updates: Partial<Block>) => void;
  deleteBlock: (docId: string, blockId: string) => void;
  moveBlock: (docId: string, blockId: string, newIndex: number) => void;
  
  // Project actions
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  archiveProject: (id: string) => void;
  restoreProject: (id: string) => void;
  reorderProjects: (startIndex: number, endIndex: number) => void;
  
  // Project category actions
  addProjectCategory: (name: string) => void;
  updateProjectCategory: (id: string, name: string) => void;
  deleteProjectCategory: (id: string) => void;
  setProjectFilter: (filter: 'active' | 'archived' | 'all' | string) => void;
  
  // Modal states
  isProjectModalOpen: boolean;
  editingProjectId: string | null;
  setProjectModalOpen: (open: boolean) => void;
  setEditingProjectId: (id: string | null) => void;
  
  // Settings
  isSettingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setSoundEnabled: (enabled: boolean) => void;
  
  // Search
  isSearchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  
  // Auto-set project for new tasks
  autoSetProjectForTask: string | null;
  setAutoSetProjectForTask: (projectId: string | null) => void;
  
  // Journey start date for week tracking
  journeyStartDate: string | null;
  setJourneyStartDate: (date: string | null) => void;
  
  // Database sync
  hydrateFromDatabase: () => Promise<void>;
}
