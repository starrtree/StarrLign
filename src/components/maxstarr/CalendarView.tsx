'use client';

import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';

const monthName = (date: Date) => date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
const toYmd = (date: Date) => date.toISOString().slice(0, 10);

const projectColorHex: Record<string, string> = {
  red: '#ed1c24',
  blue: '#0052b4',
  yellow: '#ffd100',
  gray: '#9ca3af',
  green: '#22c55e',
  purple: '#a855f7',
  orange: '#f97316',
  pink: '#ec4899',
};
const projectTextColor: Record<string, string> = {
  red: 'text-white',
  blue: 'text-white',
  yellow: 'text-black',
  gray: 'text-black',
  green: 'text-white',
  purple: 'text-white',
  orange: 'text-white',
  pink: 'text-white',
};

export default function CalendarView() {
  const { tasks, projects, projectCategories, tags, tagFilter, toggleTagFilter, clearTagFilter } = useStore();
  const [cursor, setCursor] = useState(() => new Date());
  const [categoryFilter, setCategoryFilter] = useState<'all' | string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'todo' | 'doing' | 'review' | 'done'>('all');

  const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - monthStart.getDay());

  const visibleTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (task.isArchived) return false;
      const hasDate = task.startDate || task.endDate || task.due;
      if (!hasDate) return false;
      if (statusFilter !== 'all' && task.status !== statusFilter) return false;
      if (tagFilter.length > 0 && !tagFilter.every((tag) => task.tags.includes(tag))) return false;
      if (categoryFilter !== 'all') {
        const matchesCategory = projects.some(
          (project) =>
            project.category === categoryFilter &&
            (project.name === task.project || (task.linkedProjects || []).includes(project.name))
        );
        if (!matchesCategory) return false;
      }
      return true;
    });
  }, [tasks, projects, statusFilter, tagFilter, categoryFilter]);

  const taskDates = useMemo(() => {
    const map = new Map<string, typeof visibleTasks>();
    visibleTasks.forEach((task) => {
      const days = [task.startDate, task.endDate, task.due].filter(Boolean) as string[];
      days.forEach((day) => {
        const arr = map.get(day) || [];
        arr.push(task);
        map.set(day, arr);
      });
    });
    return map;
  }, [visibleTasks]);

  const rangedDates = useMemo(() => {
    const set = new Set<string>();
    visibleTasks.forEach((task) => {
      if (!task.startDate || !task.due || task.due === 'idk yet' || task.due === 'Ongoing') return;
      const start = new Date(task.startDate);
      const end = new Date(task.due);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return;
      const cursorDate = new Date(start);
      while (cursorDate <= end) {
        set.add(toYmd(cursorDate));
        cursorDate.setDate(cursorDate.getDate() + 1);
      }
    });
    return set;
  }, [visibleTasks]);

  const days = Array.from({ length: 42 }).map((_, i) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    const key = toYmd(date);
    return { date, key, tasks: taskDates.get(key) || [] };
  });

  const getProjectColorKey = (projectName: string) => {
    const projectColor = projects.find((project) => project.name === projectName)?.color || 'yellow';
    return projectColor;
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-4">
      <div className="border-[2px] border-black rounded-lg bg-[var(--brand-blue)] p-4 shadow-[4px_4px_0_black] text-white">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[2px] text-white/70">Calendar + dated tasks</div>
            <h2 className="text-2xl" style={{ fontFamily: 'var(--font-display)' }}>{monthName(cursor)}</h2>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="px-3 py-1 border-[2px] border-black rounded bg-white text-black">Prev</button>
            <button onClick={() => setCursor(new Date())} className="px-3 py-1 border-[2px] border-black rounded bg-[var(--brand-yellow)] text-black">Today</button>
            <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="px-3 py-1 border-[2px] border-black rounded bg-white text-black">Next</button>
          </div>
        </div>
      </div>

      <div className="border-[2px] border-black rounded-lg bg-white p-3 shadow-[3px_3px_0_black] space-y-3">
        <div className="flex gap-2 flex-wrap items-center">
          <label className="text-xs">Category</label>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="border-[2px] border-black rounded px-2 py-1 text-sm">
            <option value="all">All</option>
            {projectCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <label className="text-xs">Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="border-[2px] border-black rounded px-2 py-1 text-sm">
            <option value="all">All</option>
            <option value="todo">To do</option>
            <option value="doing">Doing</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>
          {tagFilter.length > 0 && (
            <button onClick={clearTagFilter} className="ml-auto px-2 py-1 text-xs border border-black rounded">Clear tags ({tagFilter.length})</button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {tags.slice(0, 18).map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTagFilter(tag)}
              className={cn(
                'text-[10px] px-2 py-1 border border-black rounded',
                tagFilter.includes(tag) ? 'bg-[var(--brand-red)] text-white' : 'bg-white hover:bg-black/5'
              )}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-xs font-bold text-black/70">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="px-2">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2">
        {days.map((day) => {
          const isCurrentMonth = day.date.getMonth() === cursor.getMonth();
          const isToday = day.key === toYmd(new Date());
          return (
            <div key={day.key} className={cn(
              'border-[2px] border-black rounded-lg min-h-[130px] p-2 bg-white shadow-[2px_2px_0_black]',
              !isCurrentMonth && 'opacity-45',
              isToday && 'ring-2 ring-[var(--brand-yellow)]',
              rangedDates.has(day.key) && 'bg-[var(--brand-yellow)]/30'
            )}>
              <div className="text-xs font-bold mb-1">{day.date.getDate()}</div>
              <div className="space-y-1">
                {day.tasks.slice(0, 4).map((task) => (
                  <div
                    key={`${day.key}-${task.id}`}
                    className={cn(
                      "text-[10px] p-1.5 rounded border border-black/25 truncate font-medium shadow-[1px_1px_0_black/15] flex items-center gap-1.5",
                      projectTextColor[getProjectColorKey(task.project)] || 'text-black'
                    )}
                    style={{ backgroundColor: projectColorHex[getProjectColorKey(task.project)] || projectColorHex.yellow }}
                    title={`${task.title} • ${task.project}`}
                  >
                    <span className="truncate flex-1">{task.title}</span>
                    <span
                      className="w-3 h-3 rounded-full border border-black/25 flex-shrink-0"
                      style={{ backgroundColor: 'rgba(255,255,255,0.85)' }}
                    />
                  </div>
                ))}
                {day.tasks.length > 4 && <div className="text-[10px] text-black/60">+{day.tasks.length - 4} more</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
