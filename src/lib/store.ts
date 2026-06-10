import { create } from 'zustand';
import { Task, Project, Block, ViewType, AppState, Subtask, Document, BlockType, ProjectCategory, Budget, MoneyEntry, InvestmentPosition } from './types';

// UUID generator
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

// Initial tasks data - motivational templates
const initialTasks: Task[] = [
  {
    id: 't1',
    title: 'Define Your North Star',
    project: 'Your Journey',
    linkedProjects: ['Your Journey'],
    priority: 'high',
    status: 'doing',
    startDate: '',
    endDate: '',
    due: '',
    durationHours: 0,
    durationMinutes: 30,
    tags: ['Focus', 'Vision'],
    progress: 0,
    notes: "What is the one thing that, if accomplished, would make everything else easier? Write your North Star here and let it guide your focus.",
    dependencyTaskIds: [],
    subtasks: [
      { id: uuid(), text: "Clarify your #1 priority", done: false },
      { id: uuid(), text: "Break it into actionable steps", done: false },
      { id: uuid(), text: "Commit to showing up daily", done: false }
    ],
    isArchived: false
  },
];

// Initial projects data - single template project
const initialProjects: Project[] = [
  { id: 'p1', name: 'Your Journey', color: 'yellow', icon: '⭐', tasks: 1, completed: 0, startDate: '', endDate: '', due: 'Now', order: 0, isArchived: false, category: null },
];

// Initial project categories
const initialProjectCategories: ProjectCategory[] = [
  { id: 'cat-work', name: 'Work', order: 0 },
  { id: 'cat-hobby1', name: 'Hobby 1', order: 1 },
  { id: 'cat-hobby2', name: 'Hobby 2', order: 2 },
  { id: 'cat-entrepreneurship', name: 'Entrepreneurship', order: 3 },
  { id: 'cat-home', name: 'Home', order: 4 },
];

// Initial tags - thematic and motivational
const initialTags = ['Focus', 'Vision', 'Energy', 'Momentum', 'Breakthrough', 'Daily', 'Priority', 'Flow', 'Power'];

// Helper to create a block
const createBlock = (type: BlockType, content: string = '', meta: Block['meta'] = {}): Block => ({
  id: uuid(),
  type,
  content,
  meta,
});

// Initial documents - single template document
const initialDocuments: Document[] = [
  {
    id: 'd1',
    title: '✨ Your Vision Board',
    projectId: 'p1',
    blocks: [
      createBlock('h1', '✨ Your Vision Board'),
      createBlock('text', 'This is your space to dream, plan, and manifest. Use this document to capture your vision, track your energy, and stay aligned with your North Star.'),
      createBlock('divider'),
      createBlock('h2', '🌟 What drives you?'),
      createBlock('text', 'Write about your core motivations and what success means to you...'),
      createBlock('h2', '⚡ Energy Audit'),
      createBlock('text', 'What gives you energy? What drains it? List them here...'),
      createBlock('h2', '🧲 Your Magnet Goals'),
      createBlock('text', 'The goals that pull you forward effortlessly...'),
      createBlock('divider'),
      createBlock('callout', 'Remember: You are the architect of your reality. Every small action compounds into something magnificent.', { emoji: '⭐', bgColor: 'yellow' }),
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
  tasks: snapshot.tasks.map((task) => ({
    ...task,
    linkedProjects:
      task.linkedProjects && task.linkedProjects.length > 0
        ? [...task.linkedProjects]
        : [task.project].filter(Boolean),
    dependencyTaskIds: task.dependencyTaskIds ? [...task.dependencyTaskIds] : [],
    tags: [...task.tags],
    subtasks: task.subtasks.map((subtask) => ({ ...subtask })),
  })),
  projects: snapshot.projects.map((project) => ({ ...project })),
  projectCategories: snapshot.projectCategories.map((category) => ({ ...category })),
  documents: snapshot.documents.map((document) => ({
    ...document,
    blocks: document.blocks.map((block) => ({
      ...block,
      meta: block.meta ? { ...block.meta } : undefined,
    })),
  })),
  tags: [...snapshot.tags],
  budgets: (snapshot.budgets || []).map((budget) => ({ ...budget })),
  moneyEntries: (snapshot.moneyEntries || []).map((entry) => ({ ...entry })),
  investmentPositions: (snapshot.investmentPositions || []).map((position) => ({ ...position })),
  baseIncomeMonthly: snapshot.baseIncomeMonthly || 0,
});

const createDefaultSnapshot = (): DatabaseSnapshot => cloneDatabaseSnapshot(initialDatabaseSnapshot);

const isDatabaseSnapshotEmpty = (snapshot: DatabaseSnapshot): boolean => {
  return (
    snapshot.tasks.length === 0 &&
    snapshot.projects.length === 0 &&
    snapshot.projectCategories.length === 0 &&
    snapshot.documents.length === 0 &&
    snapshot.tags.length === 0 &&
    (snapshot.budgets?.length || 0) === 0 &&
    (snapshot.moneyEntries?.length || 0) === 0 &&
    (snapshot.investmentPositions?.length || 0) === 0
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

const saveToDatabase = async (state: AppState) => {
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
      console.log('Data saved to database');
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
      console.log('Data loaded from database');
      return result.data as DatabaseSnapshot;
    }
    return null;
  } catch (error) {
    console.error('Failed to load from database:', error);
    return null;
  }
};

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

  // Actions
  setCurrentView: (view) => set({ currentView: view }),
  setSelectedProjectId: (id) => set({ selectedProjectId: id }),
  setSelectedDocumentId: (id) => set({ selectedDocumentId: id }),

  addTask: (task) => {
    const linkedProjects =
      task.linkedProjects && task.linkedProjects.length > 0
        ? Array.from(new Set([task.project, ...task.linkedProjects]))
        : [task.project];
    const dependencyTaskIds = task.dependencyTaskIds ? [...new Set(task.dependencyTaskIds.filter(Boolean))] : [];
    set((state) => ({ tasks: [...state.tasks, { ...task, linkedProjects, dependencyTaskIds }] }));
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
      const reorderedProjectTasks = reorderedIds
        .map((id) => taskById.get(id))
        .filter((task): task is Task => Boolean(task));

      const nonProjectTasks = state.tasks.filter(
        (task) => !(task.project === projectName && !task.isArchived)
      );

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
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, isArchived: true } : task
      ),
    }));
    saveToDatabase(get());
  },

  restoreTask: (id) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, isArchived: false } : task
      ),
    }));
    saveToDatabase(get());
  },

  toggleSubtask: (taskId, subtaskId) => {
    set((state) => ({
      tasks: state.tasks.map((task) => {
        if (task.id !== taskId) return task;
        const updatedSubtasks = task.subtasks.map((subtask) =>
          subtask.id === subtaskId ? { ...subtask, done: !subtask.done } : subtask
        );
        return { ...task, subtasks: updatedSubtasks };
      }),
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

    set((state) => {
      if (state.tags.includes(normalizedTag)) return state;
      return { tags: [...state.tags, normalizedTag] };
    });
    saveToDatabase(get());
  },

  deleteTag: (tag) => {
    set((state) => ({
      tags: state.tags.filter((existingTag) => existingTag !== tag),
      tasks: state.tasks.map((task) => ({
        ...task,
        tags: task.tags.filter((taskTag) => taskTag !== tag),
      })),
    }));
    saveToDatabase(get());
  },

  setEditingTaskId: (id) => set({ editingTaskId: id }),

  setModalOpen: (open) => set({ isModalOpen: open }),
  setDetailMode: (mode) => set({ isDetailMode: mode }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  setTagFilter: (tags) => set({ tagFilter: tags }),
  toggleTagFilter: (tag) => {
    set((state) => ({
      tagFilter: state.tagFilter.includes(tag)
        ? state.tagFilter.filter(t => t !== tag)
        : [...state.tagFilter, tag]
    }));
  },
  clearTagFilter: () => set({ tagFilter: [] }),

  // Document actions
  createDocument: (projectId) => {
    const newDoc: Document = {
      id: uuid(),
      title: 'Untitled Document',
      projectId: projectId || null,
      blocks: [createBlock('text', '')],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      wordCount: 0,
      isArchived: false,
    };
    set((state) => ({
      documents: [...state.documents, newDoc],
      selectedDocumentId: newDoc.id,
    }));
    saveToDatabase(get());
  },

  updateDocument: (id, updates) => {
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === id ? { ...doc, ...updates, updatedAt: new Date().toISOString() } : doc
      ),
    }));
    saveToDatabase(get());
  },

  deleteDocument: (id) => {
    set((state) => ({
      documents: state.documents.filter(doc => doc.id !== id),
      selectedDocumentId: state.selectedDocumentId === id ? null : state.selectedDocumentId,
    }));
    saveToDatabase(get());
  },

  archiveDocument: (id) => {
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === id ? { ...doc, isArchived: true, updatedAt: new Date().toISOString() } : doc
      ),
    }));
    saveToDatabase(get());
  },

  restoreDocument: (id) => {
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === id ? { ...doc, isArchived: false, updatedAt: new Date().toISOString() } : doc
      ),
    }));
    saveToDatabase(get());
  },

  duplicateDocument: (id) => {
    set((state) => {
      const original = state.documents.find(d => d.id === id);
      if (!original) return state;
      
      const newDoc: Document = {
        ...original,
        id: uuid(),
        title: `${original.title} (Copy)`,
        blocks: original.blocks.map(b => ({ ...b, id: uuid() })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return { 
        documents: [...state.documents, newDoc],
        selectedDocumentId: newDoc.id,
      };
    });
    saveToDatabase(get());
  },

  // Money actions
  addBudget: (budget) => {
    set((state) => ({ budgets: [...state.budgets, budget] }));
    saveToDatabase(get());
  },

  updateBudget: (id, updates) => {
    set((state) => ({
      budgets: state.budgets.map((budget) => (budget.id === id ? { ...budget, ...updates } : budget)),
    }));
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
    set((state) => ({
      moneyEntries: state.moneyEntries.map((entry) => (entry.id === id ? { ...entry, ...updates } : entry)),
    }));
    saveToDatabase(get());
  },

  deleteMoneyEntry: (id) => {
    set((state) => ({ moneyEntries: state.moneyEntries.filter((entry) => entry.id !== id) }));
    saveToDatabase(get());
  },

  setMoneyEntryIncluded: (id, includedInBudget) => {
    set((state) => ({
      moneyEntries: state.moneyEntries.map((entry) => (entry.id === id ? { ...entry, includedInBudget } : entry)),
    }));
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
    set((state) => ({
      investmentPositions: state.investmentPositions.map((position) =>
        position.id === id ? { ...position, ...updates } : position
      ),
    }));
    saveToDatabase(get());
  },

  deleteInvestmentPosition: (id) => {
    set((state) => ({ investmentPositions: state.investmentPositions.filter((position) => position.id !== id) }));
    saveToDatabase(get());
  },

  // Block actions
  addBlock: (docId, block, afterBlockId) => {
    set((state) => ({
      documents: state.documents.map((doc) => {
        if (doc.id !== docId) return doc;
        
        if (afterBlockId) {
          const index = doc.blocks.findIndex(b => b.id === afterBlockId);
          const newBlocks = [...doc.blocks];
          newBlocks.splice(index + 1, 0, block);
          return { ...doc, blocks: newBlocks, updatedAt: new Date().toISOString() };
        }
        return { ...doc, blocks: [...doc.blocks, block], updatedAt: new Date().toISOString() };
      }),
    }));
    saveToDatabase(get());
  },

  updateBlock: (docId, blockId, updates) => {
    set((state) => ({
      documents: state.documents.map((doc) => {
        if (doc.id !== docId) return doc;
        return {
          ...doc,
          blocks: doc.blocks.map(b => 
            b.id === blockId ? { ...b, ...updates } : b
          ),
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
    saveToDatabase(get());
  },

  deleteBlock: (docId, blockId) => {
    set((state) => ({
      documents: state.documents.map((doc) => {
        if (doc.id !== docId) return doc;
        return {
          ...doc,
          blocks: doc.blocks.filter(b => b.id !== blockId),
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
    saveToDatabase(get());
  },

  moveBlock: (docId, blockId, newIndex) => {
    set((state) => ({
      documents: state.documents.map((doc) => {
        if (doc.id !== docId) return doc;
        
        const blocks = [...doc.blocks];
        const currentIndex = blocks.findIndex(b => b.id === blockId);
        if (currentIndex === -1) return doc;
        
        const [block] = blocks.splice(currentIndex, 1);
        blocks.splice(newIndex, 0, block);
        
        return { ...doc, blocks, updatedAt: new Date().toISOString() };
      }),
    }));
    saveToDatabase(get());
  },

  // Project actions
  addProject: (project) => {
    set((state) => ({ 
      projects: [...state.projects, project] 
    }));
    saveToDatabase(get());
  },

  updateProject: (id, updates) => {
    set((state) => {
      const currentProject = state.projects.find((project) => project.id === id);
      const updatedProjects = state.projects.map((project) =>
        project.id === id ? { ...project, ...updates } : project
      );

      if (!currentProject || !updates.name || updates.name === currentProject.name) {
        return { projects: updatedProjects };
      }

      return {
        projects: updatedProjects,
        tasks: state.tasks.map((task) =>
          task.project === currentProject.name || task.linkedProjects?.includes(currentProject.name)
            ? {
                ...task,
                project: task.project === currentProject.name ? (updates.name as string) : task.project,
                linkedProjects: (task.linkedProjects || [task.project]).map((projectName) =>
                  projectName === currentProject.name ? (updates.name as string) : projectName
                ),
              }
            : task
        ),
      };
    });
    saveToDatabase(get());
  },

  deleteProject: (id) => {
    set((state) => ({
      projects: state.projects.filter((project) => project.id !== id),
      selectedProjectId: state.selectedProjectId === id ? null : state.selectedProjectId,
    }));
    saveToDatabase(get());
  },

  archiveProject: (id) => {
    set((state) => ({
      projects: state.projects.map((project) =>
        project.id === id ? { ...project, isArchived: true } : project
      ),
      selectedProjectId: state.selectedProjectId === id ? null : state.selectedProjectId,
    }));
    saveToDatabase(get());
  },

  restoreProject: (id) => {
    set((state) => ({
      projects: state.projects.map((project) =>
        project.id === id ? { ...project, isArchived: false } : project
      ),
    }));
    saveToDatabase(get());
  },

  reorderProjects: (startIndex, endIndex) => {
    set((state) => {
      const projects = [...state.projects];
      const [removed] = projects.splice(startIndex, 1);
      projects.splice(endIndex, 0, removed);
      const reordered = projects.map((p, i) => ({ ...p, order: i }));
      return { projects: reordered };
    });
    saveToDatabase(get());
  },

  // Modal setters
  setProjectModalOpen: (open) => set({ isProjectModalOpen: open }),
  setEditingProjectId: (id) => set({ editingProjectId: id }),
  
  // Settings
  setSettingsOpen: (open) => set({ isSettingsOpen: open }),
  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
  },
  setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
  
  // Search
  setSearchOpen: (open) => set({ isSearchOpen: open }),
  
  // Project category actions
  addProjectCategory: (name) => {
    set((state) => ({
      projectCategories: [...state.projectCategories, {
        id: `cat-${uuid()}`,
        name,
        order: state.projectCategories.length,
      }],
    }));
    saveToDatabase(get());
  },
  
  updateProjectCategory: (id, name) => {
    set((state) => ({
      projectCategories: state.projectCategories.map(cat =>
        cat.id === id ? { ...cat, name } : cat
      ),
    }));
    saveToDatabase(get());
  },
  
  deleteProjectCategory: (id) => {
    set((state) => ({
      projectCategories: state.projectCategories.filter(cat => cat.id !== id),
      projects: state.projects.map(p => 
        p.category === id ? { ...p, category: null } : p
      ),
    }));
    saveToDatabase(get());
  },
  
  setProjectFilter: (filter) => set({ projectFilter: filter }),
  
  // Auto-set project for new tasks
  setAutoSetProjectForTask: (projectId) => set({ autoSetProjectForTask: projectId }),
  
  // Journey start date
  journeyStartDate: null,
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
      selectedProjectId: null,
      selectedDocumentId: null,
      searchQuery: '',
      tagFilter: [],
      isProjectModalOpen: false,
      editingProjectId: null,
      autoSetProjectForTask: null,
    });
  },
}));

// Helper functions
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
      return count + block.content.split(/\s+/).filter(word => word.length > 0).length;
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
