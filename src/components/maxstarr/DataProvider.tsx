'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';

export default function DataProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const hydrateFromDatabase = useStore((state) => state.hydrateFromDatabase);

  useEffect(() => {
    const init = async () => {
      try {
        await hydrateFromDatabase();
      } catch (error) {
        console.error('Failed to hydrate from database:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    init();
  }, [hydrateFromDatabase]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--off-white)] flex items-center justify-center">
        <div className="text-center">
          <div className="text-[40px] mb-4 text-[var(--brand-yellow)]" style={{ animation: 'pulse 2s infinite ease-in-out' }}>
            ★
          </div>
          <div className="text-sm text-[var(--gray-600)]" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
            Loading your workspace...
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
