import { create } from 'zustand';
import {
  AppState,
  Block,
  BlockType,
  Budget,
  Document,
  InvestmentPosition,
  MoneyEntry,
  Project,
  ProjectCategory,
  Task,
} from './types';

const uuid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

function getInitialTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  const stored = window.localStorage.getItem('starrlign-theme');
  return stored === 'dark' ? 'dark' : 'light';
}

function applyTheme(theme: 'light' | 'dark') {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', theme === 'dark');
  window.localStorage.setItem('starrlign-theme', theme);
}

export const createNewBlock = (type: BlockType, content = '', meta: Block['meta'] = {}): Block => ({
  id: uuid(),
  type,
  content,
  meta,
});

export const createNewTask = (data: Partial<Task> = {}): Task => ({
  title: '',
  project: 'General',
  linkedProjects: data.project ? [data.project] : ['General'],
  priority: 'medium',
  status: 'todo',
  startDate: '',
  endDate: '',
  due: '',
  durationHours: 0,
  durationMinutes: 30,
  tags: [],
  progress: 0,
  notes: '',
  dependencyTaskIds: [],
  subtasks: [],
  timerStartedAt: null,
  lastTimerStartAt: null,
  lastTimerEndAt: null,
  isArchived: false,
  ...data,
  id: data.id || uuid(),
  linkedProjects:
    data.linkedProjects && data.linkedProjects.length > 0
      ? Array.from(new Set(data.linkedProjects))
      : [data.project || 'General'],
  dependencyTaskIds: data.dependencyTaskIds ? Array.from(new Set(data.dependencyTaskIds.filter(Boolean))) : [],
  tags: data.tags ? Array.from(new Set(data.tags.filter(Boolean))) : [],
  subtasks: data.subtasks ? data.subtasks.map((subtask) => ({ id: subtask.id || uuid(), text: subtask.text, done: Boolean(subtask.done) })) : [],
});

export const createNewProject = (data: Partial<Project> = {}): Project => ({
  name: '',
  color: 'blue',
  icon: '📁',
  tasks: 0,
  completed: 0,
  startDate: '',
  endDate: '',
  due: '',
  order: 0,
  isArchived: false,
  category: null,
  ...data,
  id: data.id || uuid(),
});

const initialTasks: Task[] = [
  createNewTask({
    id: 't1',
    title: 'Define Your North Star',
    project: 'Your Journey',
    linkedProjects: ['Your Journey'],
    priority: 'high',
    status: 'doing',
    durationMinutes: 30,
    tags: ['Focus', 'Vision'],
    notes: 'What is the one thing that, if accomplished, would make everything else easier? Write your North Star here and let it guide your focus.',
    subtasks: [
      { id: uuid(), text: 'Clarify your #1 priority', done: false },
      { id: uuid(), text: 'Break it into actionable steps', done: false },
      { id: uuid(), text: 'Commit to showing up daily', done: false },
    ],
  }),
];

const initialProjects: Project[] = [
  createNewProject({
    id: 'p1',
    name: 'Your Journey',
    color: 'yellow',
    icon: '⭐',
    tasks: 1,
    completed: 0,
    due: 'Now',
    order: 0,
  }),
];

const initialProjectCategories: ProjectCategory[] = [
  { id: 'cat-work', name: 'Work', order: 0 },
  { id: 'cat-hobby1', name: 'Hobby 1', order: 1 },
  { id: 'cat-hobby2', name: 'Hobby 2', order: 2 },
  { id: 'cat-entrepreneurship', name: 'Entrepreneurship', order: 3 },
  { id: 'cat-home', name: 'Home', order: 4 },
];

const initialTags = ['Focus', 'Vision', 'Energy', 'Momentum', 'Breakthrough', 'Daily', 'Priority', 'Flow', 'Power'];

const initialDocuments: Document[] = [
  {
    id: 'd1',
    title: '✨ Your Vision Board',
    projectId: 'p1',
    blocks: [
      createNewBlock('h1', '✨ Your Vision Board'),
      createNewBlock('text', 'This is your space to dream, plan, and manifest. Use this document to capture your vision, track your energy, and stay aligned with your North Star.'),
      createNewBlock('divider'),
      createNewBlock('h2', '🌟 What drives you?'),
      createNewBlock('text', 'Write about your core motivations and what success means to you...'),
      createNewBlock('h2', '⚡ Energy Audit'),
      createNewBlock('text', 'What gives you energy? What drains it? List them here...'),
      createNewBlock('h2', '🧲 Your Magnet Goals'),
      createNewBlock('text', 'The goals that pull you forward effortlessly...'),
      createNewBlock('divider'),
      createNewBlock('callout', 'Remember: You are the architect of your reality. Every small action compounds into something magnificent.', { emoji: '⭐', bgColor: 'yellow' }),
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    wordCount: 60,
    isArchived: false,
  },
];

const initialBudgets: Budget[] = [
  { id: 'b-work', name: 'Work', limit: 3000 },
  { id: 'b-saving', name: 'Saving', limit: 1200 },
  { id: 'b-personal', name: 'Personal', limit: 900 },
];

const initialMoneyEntries: MoneyEntry[] = [];
const initialInvestmentPositions: InvestmentPosition[] = [];

type DatabaseSnapshot = {
  tasks: Task[];
  projects: Project[];
  projectCategories: ProjectCategory[];
  documents: Document[];
  tags: string[];
  budgets: Budget[];
  moneyEntries: MoneyEntry[];
  investmentPositions: InvestmentPosition[];
  baseIncomeMonthly: number;
};

const initialDatabaseSnapshot: DatabaseSnapshot = {
  tasks: initialTasks,
  projects: initialProjects,
  projectCategories: initialProjectCategories,
  documents: initialDocuments,
  tags: initialTags,
  budgets: initialBudgets,
  moneyEntries: initialMoneyEntries,
  investmentPositions: initialInvestmentPositions,
  baseIncomeMonthly: 0,
};

const cloneDatabaseSnapshot = (snapshot: DatabaseSnapshot): DatabaseSnapshot => ({
  tasks: (snapshot.tasks || []).map((task) => createNewTask(task)),
  projects: (snapshot.projects || []).map((project) => createNewProject(project)),
  projectCategories: (snapshot.projectCategories || []).map((category) => ({ ...category })),
  documents: (snapshot.documents || []).map((document) => ({
    ...document,
    blocks: (document.blocks || []).map((block) => ({ ...block, meta: block.meta ? { ...block.meta } : undefined })),
  })),
  tags: [...(snapshot.tags || [])],
  budgets: (snapshot.budgets || []).map((budget) => ({ ...budget })),
  moneyEntries: (snapshot.moneyEntries || []).map((entry) => ({ ...entry })),
  investmentPositions: (snapshot.investmentPositions || []).map((position) => ({ ...position })),
  baseIncomeMonthly: snapshot.baseIncomeMonthly || 0,
});

const createDefaultSnapshot = (): DatabaseSnapshot => cloneDatabaseSnapshot(initialDatabaseSnapshot);

const isDatabaseSnapshotEmpty = (snapshot: DatabaseSnapshot): boolean => {
  return (
    (snapshot.tasks || []).length === 0 &&
    (snapshot.projects || []).length === 0 &&
    (snapshot.projectCategories || []).length === 0 &&
    (snapshot.documents || []).length === 0 &&
    (snapshot.tags || []).length === 0 &&
    (snapshot.budgets || []).length === 0 &&
    (snapshot.moneyEntries || []).length === 0 &&
    (snapshot.investmentPositions || []).length === 0
  );
};

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

const persistSnapshot = async (snapshot: DatabaseSnapshot) => {
  const response = await fetch('/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(snapshot),
  });

  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to save database snapshot');
  }
};

const saveToDatabase = (state: AppState) => {
  if (saveTimeout) clearTimeout(saveTimeout);

  saveTimeout = setTimeout(async () => {
    try {
      await persistSnapshot({
        tasks: state.tasks,
        projects: state.projects,
        projectCategories: state.projectCategories,
        documents: state.documents,
        tags: state.tags,
        budgets: state.budgets,
        moneyEntries: state.moneyEntries,
        investmentPositions: state.investmentPositions,
        baseIncomeMonthly: state.baseIncomeMonthly,
      });
    } catch (error) {
      console.error('Failed to save to database:', error);
    }
  }, 1000);
};

export const loadFromDatabase = async (): Promise<DatabaseSnapshot | null> => {
  try {
    const response = await fetch('/api/db');
    const result = await response.json();
    if (response.ok && result.success && result.data) {
      return result.data as DatabaseSnapshot;
    }
    return null;
  } catch (error) {
    console.error('Failed to load from database:', error);
    return null;
  }
};

const updateDocumentWordCount = (document: Document) => ({
  ...document,
  wordCount: calculateWordCount(document.blocks),
  updatedAt: new Date().toISOString(),
});

export const useStore = create<AppState>((set, get) => ({
  currentView: 'dashboard',
  selectedProjectId: null,
  selectedDocumentId: null,
  tasks: initialTasks,
  projects: initialProjects,
  projectCategories: initialProjectCategories,
  projectFilter: 'active',
  tags: initialTags,
  documents: initialDocuments,
  budgets: initialBudgets,
  moneyEntries: initialMoneyEntries,
  investmentPositions: initialInvestmentPositions,
  baseIncomeMonthly: 0,
  editingTaskId: null,
  isModalOpen: false,
  isDetailMode: false,
  searchQuery: '',
  tagFilter: [],
  isProjectModalOpen: false,
  editingProjectId: null,
  isSettingsOpen: false,
  isSearchOpen: false,
  theme: getInitialTheme(),
  soundEnabled: true,
  autoSetProjectForTask: null,
  journeyStartDate: null,

  setCurrentView: (view) => set({ currentView: view }),
  setSelectedProjectId: (id) => set({ selectedProjectId: id }),
  setSelectedDocumentId: (id) => set({ selectedDocumentId: id }),

  addTask: (task) => {
    set((state) => ({ tasks: [...state.tasks, createNewTask(task)] }));
    saveToDatabase(get());
  },

  updateTask: (id, updates) => {
    let completedProjects: string[] = [];
    set((state) => {
      let previousTask: Task | null = null;
      let updatedTask: Task | null = null;
      const updatedTasks = state.tasks.map((task) => {
        if (task.id !== id) return task;
        previousTask = task;
        updatedTask = { ...task, ...updates };
        return updatedTask;
      });

      if (updatedTask && previousTask?.status !== 'done' && updatedTask.status === 'done' && typeof window !== 'undefined') {
        window.dispatchEvent(new Event('starrlign:task-complete'));
      }

      const affectedProjectNames = new Set<string>();
      if (updatedTask) {
        [updatedTask.project, ...(updatedTask.linkedProjects || [])].filter(Boolean).forEach((name) => affectedProjectNames.add(name));
      }

      completedProjects = Array.from(affectedProjectNames).filter((projectName) => {
        const projectTasks = updatedTasks.filter(
          (task) => !task.isArchived && (task.project === projectName || (task.linkedProjects || []).includes(projectName))
        );
        return projectTasks.length > 0 && projectTasks.every((task) => task.status === 'done');
      });

      return { tasks: updatedTasks };
    });

    if (completedProjects.length > 0 && typeof window !== 'undefined') {
      completedProjects.forEach((projectName) => {
        window.dispatchEvent(new CustomEvent('starrlign:project-complete', { detail: { projectName } }));
      });
    }
    saveToDatabase(get());
  },

  reorderTasksInProject: (projectName, draggedTaskId, targetTaskId) => {
    if (draggedTaskId === targetTaskId) return;
    set((state) => {
      const projectTaskIds = state.tasks
        .filter((task) => task.project === projectName && !task.isArchived)
        .map((task) => task.id);
      const sourceIndex = projectTaskIds.indexOf(draggedTaskId);
      const targetIndex = projectTaskIds.indexOf(targetTaskId);
      if (sourceIndex === -1 || targetIndex === -1) return state;

      const reorderedIds = [...projectTaskIds];
      const [moved] = reorderedIds.splice(sourceIndex, 1);
      reorderedIds.splice(targetIndex, 0, moved);
      const taskById = new Map(state.tasks.map((task) => [task.id, task]));
      const reorderedProjectTasks = reorderedIds.map((id) => taskById.get(id)).filter((task): task is Task => Boolean(task));
      const nonProjectTasks = state.tasks.filter((task) => !(task.project === projectName && !task.isArchived));
      return { tasks: [...nonProjectTasks, ...reorderedProjectTasks] };
    });
    saveToDatabase(get());
  },

  deleteTask: (id) => {
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id),
      editingTaskId: state.editingTaskId === id ? null : state.editingTaskId,
    }));
    saveToDatabase(get());
  },

  archiveTask: (id) => {
    set((state) => ({ tasks: state.tasks.map((task) => (task.id === id ? { ...task, isArchived: true } : task)) }));
    saveToDatabase(get());
  },

  restoreTask: (id) => {
    set((state) => ({ tasks: state.tasks.map((task) => (task.id === id ? { ...task, isArchived: false } : task)) }));
    saveToDatabase(get());
  },

  toggleSubtask: (taskId, subtaskId) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? { ...task, subtasks: task.subtasks.map((subtask) => (subtask.id === subtaskId ? { ...subtask, done: !subtask.done } : subtask)) }
          : task
      ),
    }));
    saveToDatabase(get());
  },

  addSubtask: (taskId, text) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, subtasks: [...task.subtasks, { id: uuid(), text, done: false }] } : task
      ),
    }));
    saveToDatabase(get());
  },

  updateSubtask: (taskId, subtaskId, text) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? { ...task, subtasks: task.subtasks.map((subtask) => (subtask.id === subtaskId ? { ...subtask, text } : subtask)) }
          : task
      ),
    }));
    saveToDatabase(get());
  },

  deleteSubtask: (taskId, subtaskId) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, subtasks: task.subtasks.filter((subtask) => subtask.id !== subtaskId) } : task
      ),
    }));
    saveToDatabase(get());
  },

  createTag: (tag) => {
    const normalizedTag = tag.trim();
    if (!normalizedTag) return;
    set((state) => (state.tags.includes(normalizedTag) ? state : { tags: [...state.tags, normalizedTag] }));
    saveToDatabase(get());
  },

  deleteTag: (tag) => {
    set((state) => ({
      tags: state.tags.filter((existingTag) => existingTag !== tag),
      tasks: state.tasks.map((task) => ({ ...task, tags: task.tags.filter((taskTag) => taskTag !== tag) })),
    }));
    saveToDatabase(get());
  },

  setEditingTaskId: (id) => set({ editingTaskId: id }),
  setModalOpen: (open) => set({ isModalOpen: open }),
  setDetailMode: (mode) => set({ isDetailMode: mode }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setTagFilter: (tags) => set({ tagFilter: tags }),
  toggleTagFilter: (tag) => set((state) => ({ tagFilter: state.tagFilter.includes(tag) ? state.tagFilter.filter((t) => t !== tag) : [...state.tagFilter, tag] })),
  clearTagFilter: () => set({ tagFilter: [] }),

  createDocument: (projectId) => {
    const newDoc: Document = {
      id: uuid(),
      title: 'Untitled Document',
      projectId: projectId || null,
      blocks: [createNewBlock('text', '')],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      wordCount: 0,
      isArchived: false,
    };
    set((state) => ({ documents: [...state.documents, newDoc], selectedDocumentId: newDoc.id }));
    saveToDatabase(get());
  },

  updateDocument: (id, updates) => {
    set((state) => ({
      documents: state.documents.map((doc) => (doc.id === id ? updateDocumentWordCount({ ...doc, ...updates }) : doc)),
    }));
    saveToDatabase(get());
  },

  deleteDocument: (id) => {
    set((state) => ({ documents: state.documents.filter((doc) => doc.id !== id), selectedDocumentId: state.selectedDocumentId === id ? null : state.selectedDocumentId }));
    saveToDatabase(get());
  },

  archiveDocument: (id) => {
    set((state) => ({ documents: state.documents.map((doc) => (doc.id === id ? { ...doc, isArchived: true, updatedAt: new Date().toISOString() } : doc)) }));
    saveToDatabase(get());
  },

  restoreDocument: (id) => {
    set((state) => ({ documents: state.documents.map((doc) => (doc.id === id ? { ...doc, isArchived: false, updatedAt: new Date().toISOString() } : doc)) }));
    saveToDatabase(get());
  },

  duplicateDocument: (id) => {
    set((state) => {
      const original = state.documents.find((doc) => doc.id === id);
      if (!original) return state;
      const newDoc: Document = {
        ...original,
        id: uuid(),
        title: `${original.title} (Copy)`,
        blocks: original.blocks.map((block) => ({ ...block, id: uuid() })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return { documents: [...state.documents, newDoc], selectedDocumentId: newDoc.id };
    });
    saveToDatabase(get());
  },

  addBudget: (budget) => {
    set((state) => ({ budgets: [...state.budgets, budget] }));
    saveToDatabase(get());
  },
  updateBudget: (id, updates) => {
    set((state) => ({ budgets: state.budgets.map((budget) => (budget.id === id ? { ...budget, ...updates } : budget)) }));
    saveToDatabase(get());
  },
  deleteBudget: (id) => {
    set((state) => ({ budgets: state.budgets.filter((budget) => budget.id !== id) }));
    saveToDatabase(get());
  },
  addMoneyEntry: (entry) => {
    set((state) => ({ moneyEntries: [...state.moneyEntries, entry] }));
    saveToDatabase(get());
  },
  updateMoneyEntry: (id, updates) => {
    set((state) => ({ moneyEntries: state.moneyEntries.map((entry) => (entry.id === id ? { ...entry, ...updates } : entry)) }));
    saveToDatabase(get());
  },
  deleteMoneyEntry: (id) => {
    set((state) => ({ moneyEntries: state.moneyEntries.filter((entry) => entry.id !== id) }));
    saveToDatabase(get());
  },
  setMoneyEntryIncluded: (id, includedInBudget) => {
    set((state) => ({ moneyEntries: state.moneyEntries.map((entry) => (entry.id === id ? { ...entry, includedInBudget } : entry)) }));
    saveToDatabase(get());
  },
  setBaseIncomeMonthly: (amount) => {
    set({ baseIncomeMonthly: Math.max(0, amount || 0) });
    saveToDatabase(get());
  },
  addInvestmentPosition: (position) => {
    set((state) => ({ investmentPositions: [...state.investmentPositions, position] }));
    saveToDatabase(get());
  },
  updateInvestmentPosition: (id, updates) => {
    set((state) => ({ investmentPositions: state.investmentPositions.map((position) => (position.id === id ? { ...position, ...updates } : position)) }));
    saveToDatabase(get());
  },
  deleteInvestmentPosition: (id) => {
    set((state) => ({ investmentPositions: state.investmentPositions.filter((position) => position.id !== id) }));
    saveToDatabase(get());
  },

  addBlock: (docId, block, afterBlockId) => {
    set((state) => ({
      documents: state.documents.map((doc) => {
        if (doc.id !== docId) return doc;
        const blocks = [...doc.blocks];
        if (afterBlockId) {
          const index = blocks.findIndex((candidate) => candidate.id === afterBlockId);
          blocks.splice(index === -1 ? blocks.length : index + 1, 0, block);
        } else {
          blocks.push(block);
        }
        return updateDocumentWordCount({ ...doc, blocks });
      }),
    }));
    saveToDatabase(get());
  },

  updateBlock: (docId, blockId, updates) => {
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === docId
          ? updateDocumentWordCount({ ...doc, blocks: doc.blocks.map((block) => (block.id === blockId ? { ...block, ...updates } : block)) })
          : doc
      ),
    }));
    saveToDatabase(get());
  },

  deleteBlock: (docId, blockId) => {
    set((state) => ({
      documents: state.documents.map((doc) => (doc.id === docId ? updateDocumentWordCount({ ...doc, blocks: doc.blocks.filter((block) => block.id !== blockId) }) : doc)),
    }));
    saveToDatabase(get());
  },

  moveBlock: (docId, blockId, newIndex) => {
    set((state) => ({
      documents: state.documents.map((doc) => {
        if (doc.id !== docId) return doc;
        const blocks = [...doc.blocks];
        const currentIndex = blocks.findIndex((block) => block.id === blockId);
        if (currentIndex === -1) return doc;
        const [block] = blocks.splice(currentIndex, 1);
        blocks.splice(newIndex, 0, block);
        return updateDocumentWordCount({ ...doc, blocks });
      }),
    }));
    saveToDatabase(get());
  },

  addProject: (project) => {
    set((state) => ({ projects: [...state.projects, createNewProject(project)] }));
    saveToDatabase(get());
  },

  updateProject: (id, updates) => {
    set((state) => {
      const currentProject = state.projects.find((project) => project.id === id);
      const updatedProjects = state.projects.map((project) => (project.id === id ? { ...project, ...updates } : project));
      if (!currentProject || !updates.name || updates.name === currentProject.name) return { projects: updatedProjects };

      return {
        projects: updatedProjects,
        tasks: state.tasks.map((task) =>
          task.project === currentProject.name || task.linkedProjects?.includes(currentProject.name)
            ? {
                ...task,
                project: task.project === currentProject.name ? (updates.name as string) : task.project,
                linkedProjects: (task.linkedProjects || [task.project]).map((projectName) => (projectName === currentProject.name ? (updates.name as string) : projectName)),
              }
            : task
        ),
      };
    });
    saveToDatabase(get());
  },

  deleteProject: (id) => {
    set((state) => ({ projects: state.projects.filter((project) => project.id !== id), selectedProjectId: state.selectedProjectId === id ? null : state.selectedProjectId }));
    saveToDatabase(get());
  },
  archiveProject: (id) => {
    set((state) => ({ projects: state.projects.map((project) => (project.id === id ? { ...project, isArchived: true } : project)), selectedProjectId: state.selectedProjectId === id ? null : state.selectedProjectId }));
    saveToDatabase(get());
  },
  restoreProject: (id) => {
    set((state) => ({ projects: state.projects.map((project) => (project.id === id ? { ...project, isArchived: false } : project)) }));
    saveToDatabase(get());
  },
  reorderProjects: (startIndex, endIndex) => {
    set((state) => {
      const projects = [...state.projects];
      const [removed] = projects.splice(startIndex, 1);
      projects.splice(endIndex, 0, removed);
      return { projects: projects.map((project, order) => ({ ...project, order })) };
    });
    saveToDatabase(get());
  },

  setProjectModalOpen: (open) => set({ isProjectModalOpen: open }),
  setEditingProjectId: (id) => set({ editingProjectId: id }),
  setSettingsOpen: (open) => set({ isSettingsOpen: open }),
  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
  },
  setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
  setSearchOpen: (open) => set({ isSearchOpen: open }),

  addProjectCategory: (name) => {
    set((state) => ({ projectCategories: [...state.projectCategories, { id: `cat-${uuid()}`, name, order: state.projectCategories.length }] }));
    saveToDatabase(get());
  },
  updateProjectCategory: (id, name) => {
    set((state) => ({ projectCategories: state.projectCategories.map((category) => (category.id === id ? { ...category, name } : category)) }));
    saveToDatabase(get());
  },
  deleteProjectCategory: (id) => {
    set((state) => ({
      projectCategories: state.projectCategories.filter((category) => category.id !== id),
      projects: state.projects.map((project) => (project.category === id ? { ...project, category: null } : project)),
    }));
    saveToDatabase(get());
  },
  setProjectFilter: (filter) => set({ projectFilter: filter }),
  setAutoSetProjectForTask: (projectId) => set({ autoSetProjectForTask: projectId }),
  setJourneyStartDate: (date) => {
    set({ journeyStartDate: date });
    saveToDatabase(get());
  },

  resetAllData: async () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      saveTimeout = null;
    }
    const defaultSnapshot = createDefaultSnapshot();
    await persistSnapshot(defaultSnapshot);
    set({
      currentView: 'dashboard',
      selectedProjectId: null,
      selectedDocumentId: null,
      tasks: defaultSnapshot.tasks,
      projects: defaultSnapshot.projects,
      projectCategories: defaultSnapshot.projectCategories,
      projectFilter: 'active',
      tags: defaultSnapshot.tags,
      documents: defaultSnapshot.documents,
      budgets: defaultSnapshot.budgets,
      moneyEntries: defaultSnapshot.moneyEntries,
      investmentPositions: defaultSnapshot.investmentPositions,
      baseIncomeMonthly: defaultSnapshot.baseIncomeMonthly,
      editingTaskId: null,
      isModalOpen: false,
      isDetailMode: false,
      searchQuery: '',
      tagFilter: [],
      isProjectModalOpen: false,
      editingProjectId: null,
      autoSetProjectForTask: null,
      journeyStartDate: null,
    });
  },

  hydrateFromDatabase: async () => {
    const loaded = await loadFromDatabase();
    const snapshot = loaded && !isDatabaseSnapshotEmpty(loaded) ? cloneDatabaseSnapshot(loaded) : createDefaultSnapshot();
    set({
      tasks: snapshot.tasks,
      projects: snapshot.projects,
      projectCategories: snapshot.projectCategories,
      documents: snapshot.documents,
      tags: snapshot.tags,
      budgets: snapshot.budgets,
      moneyEntries: snapshot.moneyEntries,
      investmentPositions: snapshot.investmentPositions,
      baseIncomeMonthly: snapshot.baseIncomeMonthly,
    });
  },
}));

export const formatDate = (dateStr: string): string => {
  if (!dateStr || dateStr === 'idk yet' || dateStr === 'Ongoing') return dateStr;
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const formatDuration = (hours: number, minutes: number): string => {
  if (hours === 0 && minutes === 0) return '0m';
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};

export const calculateWordCount = (blocks: Block[]): number => {
  return blocks.reduce((count, block) => {
    if (['text', 'h1', 'h2', 'h3', 'callout'].includes(block.type)) {
      return count + block.content.split(/\s+/).filter((word) => word.length > 0).length;
    }
    return count;
  }, 0);
};

export const formatRelativeTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
};

export const estimateReadTime = (wordCount: number): string => {
  const mins = Math.ceil(wordCount / 200);
  return `~${mins} min read`;
};

if (typeof window !== 'undefined') {
  applyTheme(getInitialTheme());
}
