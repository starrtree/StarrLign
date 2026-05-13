'use client';

import dynamic from 'next/dynamic';
import UpNextQueue from './UpNextQueue';
import StatsCards from './StatsCards';
import ProjectProgress from './ProjectProgress';
import StatusChart from './StatusChart';

const FocusZone = dynamic(() => import('./FocusZone'), {
  ssr: false,
  loading: () => (
    <div className="border-[3px] border-black rounded-lg p-8 md:p-16 mb-6 md:mb-8 bg-[var(--brand-yellow)] shadow-[4px_4px_0_black] md:shadow-[6px_6px_0_black] text-center">
      <div className="text-[40px] md:text-[50px] leading-none mb-2 star-glow-red">★</div>
      <div className="text-[10px] tracking-[1.5px] uppercase font-bold text-black/60" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
        Loading focus deck...
      </div>
    </div>
  ),
});

export default function DashboardView() {
  return (
    <div>
      {/* Focus Zone */}
      <FocusZone />

      {/* Up Next Queue */}
      <UpNextQueue />

      {/* Stats Row */}
      <StatsCards />

      {/* Main Grid: Projects & Status Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
        <ProjectProgress />
        <StatusChart />
      </div>
    </div>
  );
}
