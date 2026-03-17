'use client';

import FocusZone from './FocusZone';
import UpNextQueue from './UpNextQueue';
import StatsCards from './StatsCards';
import ProjectProgress from './ProjectProgress';
import StatusChart from './StatusChart';

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
