'use client';

import { useStore } from '@/lib/store';

const statusColors: Record<string, string> = {
  done: '#22c55e',
  doing: '#ffd100',
  review: '#ed1c24',
  todo: '#0052b4',
};

const statusLabels: Record<string, string> = {
  done: 'Done',
  doing: 'In Progress',
  review: 'Review',
  todo: 'To Do',
};

export default function StatusChart() {
  const { tasks } = useStore();

  // Filter out archived tasks
  const activeTasks = tasks.filter(t => !t.isArchived);
  const total = activeTasks.length;

  if (total === 0) {
    return (
      <div className="bg-[var(--brand-red)] border-[3px] border-black rounded-lg overflow-hidden flex flex-col h-full shadow-[6px_6px_0_black]">
        <div className="px-4 py-3.5 border-b-[3px] border-black bg-black">
          <h3
            className="text-lg tracking-wide text-[var(--brand-yellow)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            TASK STATUS
          </h3>
        </div>
        <div className="p-4 flex-1 flex items-center justify-center">
          <div
            className="text-xs text-white/50 text-center"
            style={{ fontFamily: 'var(--font-space-mono), monospace' }}
          >
            NO DATA
          </div>
        </div>
      </div>
    );
  }

  const counts = {
    done: activeTasks.filter(t => t.status === 'done').length,
    doing: activeTasks.filter(t => t.status === 'doing').length,
    todo: activeTasks.filter(t => t.status === 'todo').length,
    review: activeTasks.filter(t => t.status === 'review').length,
  };

  const radius = 35;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const circles: { color: string; dashArray: number; dashOffset: number; status: string; count: number }[] = [];

  Object.entries(counts).forEach(([status, count]) => {
    if (count > 0) {
      const pct = count / total;
      const dashArray = pct * circumference;
      circles.push({
        color: statusColors[status],
        dashArray,
        dashOffset: -offset,
        status,
        count,
      });
      offset += dashArray;
    }
  });

  return (
    <div className="bg-[var(--brand-red)] border-[3px] border-black rounded-lg overflow-hidden flex flex-col h-full shadow-[6px_6px_0_black] transition-all duration-200 hover:shadow-[8px_8px_0_black]">
      {/* Header */}
      <div className="px-4 py-3.5 border-b-[3px] border-black bg-black">
        <h3
          className="text-lg tracking-wide text-[var(--brand-yellow)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          TASK STATUS
        </h3>
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex items-center justify-center">
        <div className="flex items-center gap-5">
          {/* Donut Chart */}
          <svg viewBox="0 0 100 100" className="w-[100px] h-[100px] border-[2px] border-black rounded-full -rotate-90 transition-transform duration-300 hover:scale-105">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="16" />
            {circles.map((circle, i) => (
              <circle
                key={i}
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={circle.color}
                strokeWidth="16"
                strokeDasharray={`${circle.dashArray} ${circumference}`}
                strokeDashoffset={circle.dashOffset}
                strokeLinecap="butt"
                className="transition-all duration-500"
              />
            ))}
            <text
              x="50"
              y="55"
              textAnchor="middle"
              className="text-[18px] font-bold fill-white"
              style={{ fontFamily: 'var(--font-display)' }}
              transform="rotate(90 50 50)"
            >
              {total}
            </text>
          </svg>

          {/* Legend */}
          <div className="flex-1">
            {Object.entries(counts).map(([status, count]) => (
              <div 
                key={status} 
                className="flex items-center gap-2 text-xs mb-1.5 last:mb-0 cursor-pointer hover:translate-x-1 transition-transform duration-150 text-white/80" 
                style={{ fontFamily: 'var(--font-space-mono), monospace' }}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full border-[1.5px] border-black flex-shrink-0"
                  style={{ backgroundColor: statusColors[status] }}
                />
                <span className="capitalize">{statusLabels[status]} ({count})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

