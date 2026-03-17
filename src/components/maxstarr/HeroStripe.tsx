'use client';

import { cn } from '@/lib/utils';
import { useStore } from '@/lib/store';

export default function HeroStripe() {
  const { journeyStartDate } = useStore();
  
  // Calculate weeks and days from journey start date
  const getJourneyProgress = () => {
    if (!journeyStartDate) {
      return { weeks: 0, days: 0, hasStarted: false };
    }
    
    const start = new Date(journeyStartDate);
    const now = new Date();
    
    // Reset time parts for accurate day calculation
    start.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    
    const diffMs = now.getTime() - start.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(diffDays / 7);
    const remainingDays = diffDays % 7;
    
    return { 
      weeks: weeks + 1, // Week 1 starts from day 0
      days: diffDays + 1, // Day 1 is the first day
      hasStarted: diffDays >= 0 
    };
  };
  
  const { weeks, days, hasStarted } = getJourneyProgress();

  return (
    <div className="bg-[var(--shimmering-opal)] dark:bg-black px-4 md:px-6 py-2.5 md:py-3 flex items-center gap-2 md:gap-3 border-b-[2px] border-black dark:border-[var(--brand-yellow)] border-t-[2px] dark:border-t-[var(--brand-yellow)] flex-wrap">
      <div
        className="text-xs md:text-[15px] tracking-[1px] md:tracking-[2px] text-[var(--brand-blue)]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {journeyStartDate && hasStarted ? (
          <>WEEK {weeks} — DAY {days}</>
        ) : journeyStartDate && !hasStarted ? (
          <>JOURNEY STARTS SOON</>
        ) : (
          <>SET YOUR START DATE</>
        )}
      </div>
      <div className="w-1.5 h-1.5 bg-[var(--brand-red)] rounded-full hidden sm:block" />
      <div
        className="text-[10px] md:text-xs text-[var(--gray-600)] dark:text-white/70 hidden md:block"
        style={{ fontFamily: 'var(--font-space-mono), monospace' }}
      >
        Finish what you start. One thing at a time.
      </div>
      <div className="ml-auto flex gap-1.5 md:gap-2">
        <span
          className={cn(
            "text-[9px] md:text-[10px] font-bold px-1.5 md:px-2 py-0.5 rounded-full border-[1.5px] border-black tracking-wider",
            "bg-[var(--brand-red)] text-white dark:text-black"
          )}
          style={{ fontFamily: 'var(--font-space-mono), monospace' }}
        >
          URGENT
        </span>
        <span
          className={cn(
            "text-[9px] md:text-[10px] font-bold px-1.5 md:px-2 py-0.5 rounded-full border-[1.5px] border-black tracking-wider",
            "bg-[var(--brand-yellow)] text-black dark:text-black"
          )}
          style={{ fontFamily: 'var(--font-space-mono), monospace' }}
        >
          IN PROGRESS
        </span>
      </div>
    </div>
  );
}

