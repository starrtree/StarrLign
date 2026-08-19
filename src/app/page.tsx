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
import MoneyView from '@/components/maxstarr/MoneyView';
import CalendarView from '@/components/maxstarr/CalendarView';
import DataProvider from '@/components/maxstarr/DataProvider';
import IntroVideoGate from '@/components/maxstarr/IntroVideoGate';
import { useStore } from '@/lib/store';
import type { CSSProperties } from 'react';

const DASHBOARD_BACKGROUND_COLORS = {
  neutral: '#f5f5f0',
  mint: '#b9e3cc',
  'powder-blue': '#b8d0e3',
  lavender: '#dfb4df',
} as const;

function hexToHsl(hex: string) {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16) / 255;
  const g = parseInt(value.slice(2, 4), 16) / 255;
  const b = parseInt(value.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let hue = 0;
  if (delta) {
    if (max === r) hue = ((g - b) / delta) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
  }
  hue = Math.round(hue * 60);
  if (hue < 0) hue += 360;
  const lightness = (max + min) / 2;
  const saturation = delta ? delta / (1 - Math.abs(2 * lightness - 1)) : 0;
  return { hue, saturation: Math.round(saturation * 100), lightness: Math.round(lightness * 100) };
}

function dashboardTheme(seed: string, isDark: boolean): CSSProperties {
  const hex = seed.startsWith('#') ? seed : DASHBOARD_BACKGROUND_COLORS[seed as keyof typeof DASHBOARD_BACKGROUND_COLORS] ?? DASHBOARD_BACKGROUND_COLORS.neutral;
  const { hue, saturation, lightness } = hexToHsl(hex);
  const chroma = Math.max(10, saturation);
  const canvas = isDark ? `hsl(${hue} ${Math.min(chroma, 38)}% 10%)` : `hsl(${hue} ${chroma}% ${Math.min(91, Math.max(78, lightness))}%)`;
  return {
    backgroundColor: canvas,
    '--dashboard-canvas': canvas,
    '--dashboard-surface': isDark ? `hsl(${hue} ${Math.min(chroma, 32)}% 15%)` : 'rgba(255,255,255,.92)',
    '--dashboard-surface-muted': isDark ? `hsl(${hue} ${Math.min(chroma, 28)}% 19%)` : 'rgba(248,250,252,.94)',
    '--dashboard-featured': isDark ? `hsl(${hue} ${Math.min(chroma + 5, 42)}% 18%)` : '#fff8da',
    '--dashboard-text': isDark ? '#f8fafc' : '#0f172a',
    '--dashboard-subtle': isDark ? '#cbd5e1' : '#475569',
    '--dashboard-border': isDark ? `hsl(${hue} ${Math.min(chroma, 34)}% 32%)` : '#cbd5e1',
  } as CSSProperties;
}

function AppContent() {
  const { currentView, isDetailMode, dashboardBackground, theme } = useStore();

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
      case 'money':
        return <MoneyView />;
      case 'calendar':
        return <CalendarView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--off-white)]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main
        className="min-h-screen flex flex-col lg:ml-[260px] transition-colors duration-300"
        style={currentView === 'dashboard' ? dashboardTheme(dashboardBackground, theme === 'dark') : undefined}
      >
        {/* Topbar */}
        <Topbar />

        {/* Hero Stripe - only show on dashboard and kanban */}
        {(currentView === 'dashboard' || currentView === 'kanban' || currentView === 'money' || currentView === 'calendar') && <HeroStripe />}

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
    <IntroVideoGate>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </IntroVideoGate>
  );
}
