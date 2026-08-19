'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { rankTasks } from '@/lib/priority';
import { useStore } from '@/lib/store';
import { PriorityFilters } from './PriorityFilters';
import { TopPriorityCard } from './TopPriorityCard';
import { PriorityTaskRow } from './PriorityTaskRow';
import { RankingRules } from './RankingRules';

export default function PriorityStack() {
  const { tasks, projects, updateTask, openTaskDetails } = useStore();
  const [selected, setSelected] = useState<string[]>([]);
  const ranked = useMemo(() => rankTasks(tasks, { projectNames: selected }), [tasks, selected]);
  const stackItems = ranked.filter((item) => item.tier !== 'blocked');
  const blocked = ranked.filter((item) => item.tier === 'blocked');
  const projectFor = (name: string) => projects.find((project) => project.name === name);
  const top = stackItems[0];

  return <section className="mb-8 text-[var(--dashboard-text)]"><div className="mb-6"><h1 className="text-3xl font-black tracking-tight md:text-[40px]">Priority Stack</h1><p className="mt-1 text-sm font-medium text-[var(--dashboard-subtle)] md:text-base">Work top-down. StarrLign ranks what needs your attention first.</p></div><PriorityFilters projects={projects} selected={selected} onChange={setSelected} />
    <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_200px]"><div className="min-w-0"><LayoutGroup><AnimatePresence mode="popLayout" initial={false}>{top ? <motion.div key={top.task.id} layout initial={{ opacity: 0, y: 24, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -18, scale: .98 }} transition={{ duration: .24 }}><TopPriorityCard item={top} project={projectFor(top.task.project)} onStart={() => updateTask(top.task.id, { status: 'doing' })} onOpen={() => openTaskDetails(top.task.id)} onComplete={() => updateTask(top.task.id, { status: 'done', progress: 100 })} /></motion.div> : <motion.div key="empty" className="rounded-2xl border-2 border-dashed border-[var(--dashboard-border)] bg-[var(--dashboard-surface)] p-8 text-center"><strong>No active tasks in this view</strong><p className="mt-1 text-sm text-[var(--dashboard-subtle)]">Choose another project filter or add a task.</p></motion.div>}</AnimatePresence><motion.div layout className="mt-7 space-y-2.5">{stackItems.slice(1).map((item) => <motion.div layout key={item.task.id} transition={{ duration: .22 }}><PriorityTaskRow item={item} project={projectFor(item.task.project)} onOpen={() => openTaskDetails(item.task.id)} /></motion.div>)}</motion.div></LayoutGroup>
      {!!blocked.length && <details className="mt-5 rounded-xl border-2 border-[var(--dashboard-border)] bg-[var(--dashboard-surface-muted)] p-3"><summary className="cursor-pointer text-sm font-black">🔒 Blocked ({blocked.length})</summary><div className="mt-3 space-y-2">{blocked.map((item) => <PriorityTaskRow key={item.task.id} item={item} project={projectFor(item.task.project)} onOpen={() => openTaskDetails(item.task.id)} />)}</div></details>}
      </div><RankingRules /></div>
  </section>;
}
