'use client';

import type { RankedTask } from '@/lib/priority';
import type { Project } from '@/lib/types';
import { projectHex } from './PriorityFilters';

export function PriorityTaskRow({ item, project, onOpen }: { item: RankedTask; project?: Project; onOpen: () => void }) {
  return <button type="button" onClick={onOpen} className="group relative grid min-h-14 w-full grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-3 overflow-hidden rounded-xl border-[1.5px] border-slate-200 bg-white px-4 py-2 text-left transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md">
    <span className="absolute inset-y-0 left-0 w-1.5" style={{ backgroundColor: projectHex(project?.color) }} />
    <span className="grid h-8 w-11 place-items-center rounded-lg border-2 border-black bg-white text-sm font-black text-black">#{item.rank}</span>
    <span className="min-w-0"><span className="block truncate text-sm font-bold text-black group-hover:font-black md:text-[15px]">{item.task.title}</span><span className="mt-1 block truncate text-[10px] font-semibold text-slate-600 md:hidden">{project ? `● ${project.name} · ` : ''}{item.reason}</span></span>
    <span className="hidden items-center gap-4 md:flex">{project && <span className="min-w-28 rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-800"><span style={{ color: projectHex(project.color) }}>●</span> {project.name}</span>}<span className="w-32 text-[11px] font-semibold text-slate-600">{item.reason}</span><span className="text-2xl text-slate-400">›</span></span>
    <span className="text-slate-400 md:hidden">›</span>
  </button>;
}
