import type { Task } from './types';

export type RankingTier = 'overdue' | 'due-soon' | 'high-priority' | 'chronological' | 'blocked' | 'needs-scheduling';

export type RankedTask = {
  task: Task;
  rank: number | null;
  tier: RankingTier;
  reason: string;
  dueAt: number | null;
  daysUntilDue: number | null;
  blockedBy: Task[];
};

const DAY = 86_400_000;
const TIER_ORDER: Record<RankingTier, number> = {
  overdue: 0,
  'due-soon': 1,
  'high-priority': 2,
  chronological: 3,
  blocked: 4,
  'needs-scheduling': 5,
};

function startOfLocalDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
}

function parseDate(value?: string | null) {
  if (!value || value === 'idk yet' || value === 'Ongoing') return null;
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
}

export function getTaskDueAt(task: Task) {
  return task.scheduleType === 'event'
    ? parseDate(task.eventEnd || task.endDate || task.eventStart || task.startDate)
    : parseDate(task.due);
}

export function getDaysUntilDue(task: Task, now = new Date()) {
  const dueAt = getTaskDueAt(task);
  if (dueAt == null) return null;
  return Math.round((startOfLocalDay(new Date(dueAt)) - startOfLocalDay(now)) / DAY);
}

export function getBlockedBy(task: Task, allTasks: Task[]) {
  const byId = new Map(allTasks.map((candidate) => [candidate.id, candidate]));
  return (task.dependencyTaskIds || [])
    .map((id) => byId.get(id))
    .filter((dependency): dependency is Task => Boolean(dependency && dependency.status !== 'done' && !dependency.isArchived));
}

function classify(task: Task, allTasks: Task[], now: Date): Omit<RankedTask, 'rank' | 'task'> {
  const dueAt = getTaskDueAt(task);
  const daysUntilDue = getDaysUntilDue(task, now);
  const blockedBy = getBlockedBy(task, allTasks);
  if (!task.priority || dueAt == null) {
    const missing = [!task.priority && 'priority', dueAt == null && 'schedule'].filter(Boolean).join(' + ');
    return { tier: 'needs-scheduling', reason: `Needs ${missing}`, dueAt, daysUntilDue, blockedBy };
  }
  if (blockedBy.length) {
    return { tier: 'blocked', reason: `Blocked by ${blockedBy.length} task${blockedBy.length === 1 ? '' : 's'}`, dueAt, daysUntilDue, blockedBy };
  }
  if (daysUntilDue! < 0) {
    const days = Math.abs(daysUntilDue!);
    return { tier: 'overdue', reason: `Overdue by ${days} day${days === 1 ? '' : 's'}`, dueAt, daysUntilDue, blockedBy };
  }
  if (daysUntilDue! <= 3) {
    const reason = daysUntilDue === 0 ? 'Due today' : daysUntilDue === 1 ? 'Due tomorrow · 1 day left' : `Due in ${daysUntilDue} days`;
    return { tier: 'due-soon', reason, dueAt, daysUntilDue, blockedBy };
  }
  if (task.priority === 'high') {
    return { tier: 'high-priority', reason: 'High priority', dueAt, daysUntilDue, blockedBy };
  }
  return { tier: 'chronological', reason: 'Next chronological deadline', dueAt, daysUntilDue, blockedBy };
}

export function rankTasks(tasks: Task[], options: { now?: Date; projectNames?: string[] } = {}): RankedTask[] {
  const now = options.now ?? new Date();
  const selected = options.projectNames ?? [];
  const candidates = tasks.filter((task) => {
    if (task.isArchived || task.status === 'done') return false;
    if (!selected.length) return true;
    return selected.some((project) => task.project === project || task.linkedProjects?.includes(project));
  });

  const classified = candidates.map((task) => ({ task, ...classify(task, tasks, now) }));
  classified.sort((a, b) => {
    const tier = TIER_ORDER[a.tier] - TIER_ORDER[b.tier];
    if (tier) return tier;
    if (a.dueAt != null && b.dueAt != null && a.dueAt !== b.dueAt) return a.dueAt - b.dueAt;
    const priority = { high: 0, medium: 1, low: 2, '': 3 } as const;
    const priorityDiff = priority[a.task.priority] - priority[b.task.priority];
    return priorityDiff || a.task.title.localeCompare(b.task.title);
  });

  let rank = 0;
  return classified.map((item) => ({ ...item, rank: item.tier === 'needs-scheduling' ? null : ++rank }));
}
