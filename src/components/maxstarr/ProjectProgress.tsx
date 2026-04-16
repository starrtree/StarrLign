'use client';

import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';

const projectColors: Record<string, string> = {
  red: 'var(--brand-red)',
  blue: 'var(--brand-blue)',
  yellow: 'var(--brand-yellow)',
  gray: 'var(--gray-400)',
  green: '#22c55e',
  purple: '#a855f7',
  orange: '#f97316',
  pink: '#ec4899',
};

export default function ProjectProgress() {
  const { projects, tasks } = useStore();

  // Calculate actual progress for each project
  const projectProgress = projects
    .filter(p => !p.isArchived)
    .map(project => {
      const projectTasks = tasks.filter(
        (t) =>
          !t.isArchived &&
          (t.project === project.name || (t.linkedProjects || []).includes(project.name))
      );
      const totalTasks = projectTasks.length;
      const completedTasks = projectTasks.filter(t => t.status === 'done').length;
      const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      return {
        ...project,
        totalTasks,
        completedTasks,
        percentage,
      };
    })
    .sort((a, b) => b.percentage - a.percentage);

  return (
    <div className="bg-[var(--brand-red)] border-[3px] border-black rounded-lg overflow-hidden flex flex-col h-full shadow-[6px_6px_0_black] transition-all duration-200 hover:shadow-[8px_8px_0_black]">
      {/* Header - BLACK */}
      <div className="px-4 py-3.5 border-b-[3px] border-black bg-black">
        <h3
          className="text-lg tracking-wide text-[var(--brand-yellow)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          PROJECT PROGRESS
        </h3>
      </div>

      {/* Body */}
      <div className="p-4 flex-1 overflow-y-auto scrollbar-thin max-h-[200px]">
        {projectProgress.length === 0 ? (
          <div className="text-center text-white/50 text-xs py-4" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
            No active projects
          </div>
        ) : (
          projectProgress.map((project) => {
            const bgColor = projectColors[project.color] || projectColors.gray;

            return (
              <div key={project.id} className="mb-4 last:mb-0 group cursor-pointer">
                <div className="flex justify-between text-xs font-semibold mb-1.5 text-white group-hover:text-[var(--brand-yellow)] transition-colors">
                  <div className="flex items-center gap-2">
                    <span>{project.icon}</span>
                    <span className="truncate max-w-[100px]">{project.name}</span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
                    {project.percentage}%
                  </span>
                </div>
                <div className="h-2.5 bg-black/30 rounded-full border-[1.5px] border-black overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 bg-[var(--brand-yellow)]"
                    style={{ width: `${project.percentage}%` }}
                  />
                </div>
                <div className="text-[9px] text-white/50 mt-0.5" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
                  {project.completedTasks} / {project.totalTasks} tasks
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
