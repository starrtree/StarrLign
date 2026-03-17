'use client';

import Sidebar from '@/components/maxstarr/Sidebar';
import Topbar from '@/components/maxstarr/Topbar';
import HeroStripe from '@/components/maxstarr/HeroStripe';
import TaskModal from '@/components/maxstarr/TaskModal';
import TaskDetailModal from '@/components/maxstarr/TaskDetailModal';
import ProjectModal from '@/components/maxstarr/ProjectModal';
import SettingsModal from '@/components/maxstarr/SettingsModal';
import SearchModal from '@/components/maxstarr/SearchModal';
import DashboardView from '@/components/maxstarr/DashboardView';
import KanbanView from '@/components/maxstarr/KanbanView';
import DocumentsView from '@/components/documents/DocumentsView';
import ProjectView from '@/components/maxstarr/ProjectView';
import ArchiveView from '@/components/maxstarr/ArchiveView';
import DataProvider from '@/components/maxstarr/DataProvider';
import { useStore } from '@/lib/store';

function AppContent() {
  const { currentView, isDetailMode } = useStore();

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'kanban':
        return <KanbanView />;
      case 'documents':
        return <DocumentsView />;
      case 'projects':
        return <ProjectView />;
      case 'archive':
        return <ArchiveView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--off-white)]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="min-h-screen flex flex-col lg:ml-[260px]">
        {/* Topbar */}
        <Topbar />

        {/* Hero Stripe - only show on dashboard and kanban */}
        {(currentView === 'dashboard' || currentView === 'kanban') && <HeroStripe />}

        {/* Content Area */}
        <div className="flex-1 p-4 md:p-6">
          {renderView()}
        </div>
      </main>

      {/* Modals */}
      {isDetailMode ? <TaskDetailModal /> : <TaskModal />}
      <ProjectModal />
      <SettingsModal />
      <SearchModal />
    </div>
  );
}

export default function Home() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}
