'use client';

import type { Project } from '@/lib/types';

const COLORS: Record<string, string> = { red: '#ed1c24', blue: '#0052b4', yellow: '#ffd100', gray: '#94a3b8', green: '#22c55e', purple: '#a855f7', orange: '#f97316', pink: '#ec4899' };

export function projectHex(color?: string) {
  return COLORS[color || 'blue'] || color || COLORS.blue;
}

export function PriorityFilters({ projects, selected, onChange }: { projects: Project[]; selected: string[]; onChange: (names: string[]) => void }) {
  const toggle = (name: string) => onChange(selected.includes(name) ? selected.filter((item) => item !== name) : [...selected, name]);
  return (
    <div>
      <div className="flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button type="button" aria-pressed={!selected.length} onClick={() => onChange([])} className={`h-10 shrink-0 rounded-xl border-2 px-4 text-sm font-bold ${!selected.length ? 'border-black bg-[#e8f2ff]' : 'border-slate-400 bg-white'}`}>
          <span className="mr-2 inline-grid size-4 place-items-center rounded-full border-2 border-[#0052b4] text-[10px] text-[#0052b4]">{!selected.length ? '✓' : ''}</span>All
        </button>
        {projects.filter((project) => !project.isArchived).map((project) => {
          const active = selected.includes(project.name);
          const color = projectHex(project.color);
          return <button key={project.id} type="button" aria-pressed={active} onClick={() => toggle(project.name)} className={`h-10 shrink-0 rounded-xl border-2 px-4 text-sm font-semibold text-black ${active ? 'border-black font-bold' : 'border-slate-400 bg-white'}`} style={active ? { backgroundColor: `${color}22` } : undefined}>
            <span className="mr-2 inline-grid size-4 place-items-center rounded-full border-2 text-[10px] font-black" style={{ borderColor: color, backgroundColor: active ? color : 'white', color: active ? 'white' : 'transparent' }}>✓</span>{project.name}
          </button>;
        })}
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border-2 border-slate-400 bg-white font-black text-slate-700" aria-label="More project filters">•••</span>
      </div>
      {!!selected.length && <p className="mt-2 text-xs font-medium text-slate-600 md:text-sm">∞ Multi-select is on — showing tasks from <strong className="text-[#0052b4]">{selected.length} categories</strong></p>}
    </div>
  );
}
