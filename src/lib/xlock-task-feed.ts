import { initializeDatabase, turso } from '@/lib/turso';

type StoredTask = {
  id: string;
  title: string;
  project: string;
  priority: 'high' | 'medium' | 'low' | '';
  status: string;
  due: string;
  durationMinutes: number;
  durationHours: number;
  progress: number;
  dependencyTaskIds: string[];
  subtasks: { id?: string; text?: string; done?: boolean }[];
};

function parseArray<T>(value: unknown): T[] {
  if (typeof value !== 'string') return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch {
    return [];
  }
}

function toTask(row: Record<string, unknown>): StoredTask {
  const rawPriority = String(row.priority || '');
  const priority = rawPriority === 'high' || rawPriority === 'medium' || rawPriority === 'low'
    ? rawPriority : '';
  return {
    id: String(row.id),
    title: String(row.title || ''),
    project: String(row.project || ''),
    priority,
    status: String(row.status || 'todo'),
    due: String(row.due || ''),
    durationMinutes: Math.max(0, Number(row.durationMinutes) || 0),
    durationHours: Math.max(0, Number(row.durationHours) || 0),
    progress: Math.max(0, Math.min(100, Number(row.progress) || 0)),
    dependencyTaskIds: parseArray<string>(row.dependencyTaskIds).filter((id) => typeof id === 'string'),
    subtasks: parseArray<StoredTask['subtasks'][number]>(row.subtasks),
  };
}

function parseDue(value: string): number | null {
  // Legacy free text such as "Now" must never become a fabricated deadline.
  if (!/^\d{4}-\d{2}-\d{2}/.test(value)) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

function rank(task: StoredTask, blocked: boolean, now: number, unlockCount: number): number {
  const priorityScore = task.priority === 'high' ? 24 : task.priority === 'medium' ? 12 : 0;
  const progressScore = task.status === 'doing' ? 28 : task.status === 'review' ? 10 : 0;
  const due = parseDue(task.due);
  const daysLeft = due == null ? null : (due - now) / 86_400_000;
  const urgency = daysLeft == null ? 0
    : daysLeft < 0 ? 40
    : daysLeft <= 1 ? 36
    : daysLeft <= 3 ? 24
    : daysLeft <= 7 ? 13
    : daysLeft <= 14 ? 5 : 0;
  // Blocked tasks can appear in HORIZON, but cannot be the default ready suggestion.
  return priorityScore + progressScore + urgency + Math.min(unlockCount * 5, 20) - (blocked ? 75 : 0);
}

export async function listXLockTaskFeed(limit = 8) {
  if (!turso) throw new Error('StarrLign database unavailable');
  await initializeDatabase();

  const result = await turso.execute(
    'SELECT id, title, project, priority, status, due, durationMinutes, durationHours, ' +
    'progress, dependencyTaskIds, subtasks FROM tasks WHERE COALESCE(isArchived, 0) = 0 LIMIT 2000'
  );

  const all = result.rows.map((row) => toTask(row as unknown as Record<string, unknown>));
  const completed = new Set(all.filter((task) => task.status === 'done').map((task) => task.id));
  const active = all.filter((task) => task.status !== 'done');
  const now = Date.now();

  const ranked = active.map((task) => {
    const blockedByIds = task.dependencyTaskIds.filter((id) => !completed.has(id));
    const unlocksCount = active.filter((item) => item.dependencyTaskIds.includes(task.id)).length;
    const dueMs = parseDue(task.due);
    const reasons = [
      ...(task.status === 'doing' ? ['Already in progress'] : []),
      ...(dueMs != null && dueMs <= now ? ['Deadline passed'] : []),
      ...(dueMs != null && dueMs > now && dueMs - now <= 86_400_000 ? ['Due within 24 hours'] : []),
      ...(unlocksCount > 0 ? ['Unblocks ' + unlocksCount + (unlocksCount === 1 ? ' X' : ' Xs')] : []),
      ...(blockedByIds.length ? ['Waiting on dependencies'] : []),
    ];

    return {
      sourceTaskId: task.id,
      title: task.title,
      project: task.project,
      priority: task.priority,
      status: task.status,
      due: task.due,
      progress: task.progress,
      expectedMinutes: task.durationHours * 60 + task.durationMinutes,
      nextSteps: task.subtasks
        .filter((step) => !step.done && typeof step.text === 'string')
        .slice(0, 3)
        .map((step) => String(step.text)),
      dependencyTaskIds: task.dependencyTaskIds,
      blockedByIds,
      unlocksCount,
      reasons,
      isReady: blockedByIds.length === 0,
      rank: rank(task, blockedByIds.length > 0, now, unlocksCount),
      dueMs,
    };
  });

  ranked.sort((a, b) =>
    b.rank - a.rank ||
    (a.dueMs ?? Infinity) - (b.dueMs ?? Infinity) ||
    a.title.localeCompare(b.title)
  );

  const safeLimit = Math.max(1, Math.min(12, Math.trunc(limit) || 8));
  return {
    source: 'starrlign',
    generatedAt: new Date(now).toISOString(),
    totalActive: active.length,
    tasks: ranked.slice(0, safeLimit).map(({ rank: _rank, dueMs: _dueMs, ...task }) => task),
  };
}
