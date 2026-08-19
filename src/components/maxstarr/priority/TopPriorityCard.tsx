'use client';

import type { RankedTask } from '@/lib/priority';
import type { Project } from '@/lib/types';
import { projectHex } from './PriorityFilters';
import { CalendarDays, TriangleAlert } from 'lucide-react';

export function TopPriorityCard({ item, project, onStart, onOpen, onComplete }: { item: RankedTask; project?: Project; onStart: () => void; onOpen: () => void; onComplete: () => void }) {
  const urgent = item.tier === 'overdue' || item.tier === 'due-soon';
  const needsScheduling = item.tier === 'needs-scheduling';
  return <section className="relative rounded-[18px] border-[3px] border-black bg-[var(--dashboard-featured)] p-4 text-[var(--dashboard-text)] shadow-[5px_5px_0_black] md:p-5">
    <span className="absolute -top-3 right-4 rounded bg-black px-3 py-1 text-[10px] font-black text-[#51ff00]">☆ TOP PRIORITY</span>
    <div className="grid grid-cols-[64px_minmax(0,1fr)] gap-4 md:grid-cols-[78px_minmax(0,1fr)_auto] md:gap-7">
      <span className="grid size-16 place-items-center rounded-lg border-[3px] border-black bg-[#ffd100] text-2xl font-black shadow-[3px_3px_0_black] md:size-[78px] md:text-3xl">#1</span>
      <div className="min-w-0"><h2 className="text-lg font-black leading-tight md:text-2xl">{item.task.title}</h2><div className="mt-3 flex flex-wrap gap-2">{project && <span className="rounded-lg border-2 px-3 py-1 text-[11px] font-black" style={{ borderColor: projectHex(project.color), backgroundColor: `${projectHex(project.color)}33` }}>● {project.name}</span>}{item.task.priority === 'high' && <span className="rounded-lg border-2 border-[#ffa19e] bg-[#ffe5e3] px-3 py-1 text-[11px] font-black text-[#ed1c24]">! High Priority</span>}</div><p className={`mt-4 flex items-center gap-2 text-sm font-black md:text-base ${urgent ? 'text-[#ed1c24]' : needsScheduling ? 'text-amber-500' : ''}`}>{needsScheduling ? <><CalendarDays className="size-5" /><TriangleAlert className="size-4 fill-amber-400/20" /></> : '▣'} {item.reason}</p><p className="mt-2 text-xs font-medium text-[var(--dashboard-subtle)] md:text-sm">☆ {needsScheduling ? 'Add the missing details so StarrLign can rank this task accurately.' : `Ranked first because of ${item.tier === 'overdue' ? 'an overdue deadline' : item.tier === 'due-soon' ? 'an urgent deadline' : item.tier === 'high-priority' ? 'its priority level' : 'the next deadline'}`}</p></div>
      <span className="hidden text-2xl md:block">📌</span>
    </div>
    <div className="mt-5 grid grid-cols-[1fr_54px] gap-3 md:grid-cols-[1fr_1fr_.88fr] md:gap-7"><button onClick={onStart} className="h-11 rounded-lg border-2 border-black bg-[#0052b4] font-bold text-white shadow-[2px_2px_0_black] hover:font-black">▶ Start</button><button onClick={onOpen} className="hidden h-11 rounded-lg border-2 border-black bg-white font-bold shadow-[2px_2px_0_black] hover:font-black md:block">▤ Open Details</button><button onClick={onComplete} aria-label="Complete top priority" className="h-11 rounded-lg border-2 border-black bg-[#22c55e] font-bold text-white shadow-[2px_2px_0_black] hover:font-black">✓ <span className="hidden md:inline">Complete</span></button></div>
  </section>;
}
