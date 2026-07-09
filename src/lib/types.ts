// Task types
export interface Subtask {
  id: string;
  text: string;
  done: boolean;
  completedAt?: string | null;
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
  dependencyTaskIds: string[];
  subtasks: Subtask[];
  timerStartedAt?: string | null;
  lastTimerStartAt?: string | null;
  lastTimerEndAt?: string | null;
  completedAt?: string | null;
  previousStatusBeforeDone?: 'todo' | 'doing' | 'review' | null;
  isArchived: boolean;
}

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

export interface ProjectCategory {
  id: string;
  name: string;
  order: number;
}

export type BlockType = 'h1' | 'h2' | 'h3' | 'text' | 'task' | 'divider' | 'progress' | 'link' | 'comment' | 'code' | 'callout';

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  meta?: {
    taskId?: string;
    priority?: 'high' | 'medium' | 'low';
    status?: 'todo' | 'doing' | 'review' | 'done';
    progressMode?: 'manual' | 'auto' | 'project';
    progressValue?: number;
    progressColor?: 'blue' | 'yellow' | 'red' | 'green';
    url?: string;
    title?: string;
    language?: string;
    emoji?: string;
    bgColor?: 'blue' | 'yellow' | 'red' | 'green';
  };
}

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

export interface Budget {
  id: string;
  name: string;
  limit: number;
}

export type MoneyFrequency = 'one-time' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';

export interface MoneyEntry {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense' | 'investment';
  category: 'work' | 'saving' | 'personal' | string;
  date: string;
  linkedTaskId?: string | null;
  linkedProjectId?: string | null;
  includedInBudget: boolean;
  notes?: string;
  isRecurring?: boolean;
  frequency?: MoneyFrequency;
  annualInterestRate?: number;
  principalBalance?: number;
  dueDay?: number | null;
  active?: boolean;
  isPlannedVariable?: boolean;
  isBalanceSnapshot?: boolean;
}

export interface InvestmentPosition {
  id: string;
  symbol: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
}

export type ViewType = 'dashboard' | 'kanban' | 'documents' | 'projects' | 'archive' | 'money' | 'calendar';

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
  budgets: Budget[];
  moneyEntries: MoneyEntry[];
  investmentPositions: InvestmentPosition[];
  baseIncomeMonthly: number;
  editingTaskId: string | null;
  isModalOpen: boolean;
  isDetailMode: boolean;
  searchQuery: string;

  theme: 'light' | 'dark';
  soundEnabled: boolean;

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

  tagFilter: string[];
  setTagFilter: (tags: string[]) => void;
  toggleTagFilter: (tag: string) => void;
  clearTagFilter: () => void;

  createDocument: (projectId?: string) => void;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  deleteDocument: (id: string) => void;
  archiveDocument: (id: string) => void;
  restoreDocument: (id: string) => void;
  duplicateDocument: (id: string) => void;

  addBudget: (budget: Budget) => void;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  addMoneyEntry: (entry: MoneyEntry) => void;
  updateMoneyEntry: (id: string, updates: Partial<MoneyEntry>) => void;
  deleteMoneyEntry: (id: string) => void;
  setMoneyEntryIncluded: (id: string, includedInBudget: boolean) => void;
  setBaseIncomeMonthly: (amount: number) => void;
  addInvestmentPosition: (position: InvestmentPosition) => void;
  updateInvestmentPosition: (id: string, updates: Partial<InvestmentPosition>) => void;
  deleteInvestmentPosition: (id: string) => void;

  addBlock: (docId: string, block: Block, afterBlockId?: string) => void;
  updateBlock: (docId: string, blockId: string, updates: Partial<Block>) => void;
  deleteBlock: (docId: string, blockId: string) => void;
  moveBlock: (docId: string, blockId: string, newIndex: number) => void;

  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  archiveProject: (id: string) => void;
  restoreProject: (id: string) => void;
  reorderProjects: (startIndex: number, endIndex: number) => void;

  addProjectCategory: (name: string) => void;
  updateProjectCategory: (id: string, name: string) => void;
  deleteProjectCategory: (id: string) => void;
  setProjectFilter: (filter: 'active' | 'archived' | 'all' | string) => void;

  isProjectModalOpen: boolean;
  editingProjectId: string | null;
  setProjectModalOpen: (open: boolean) => void;
  setEditingProjectId: (id: string | null) => void;

  isSettingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setSoundEnabled: (enabled: boolean) => void;

  isSearchOpen: boolean;
  setSearchOpen: (open: boolean) => void;

  autoSetProjectForTask: string | null;
  setAutoSetProjectForTask: (projectId: string | null) => void;

  journeyStartDate: string | null;
  setJourneyStartDate: (date: string | null) => void;

  resetAllData: () => Promise<void>;
  hydrateFromDatabase: () => Promise<void>;
}
