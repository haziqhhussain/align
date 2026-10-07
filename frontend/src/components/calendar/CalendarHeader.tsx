import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface CalendarHeaderProps {
  currentTitle: string;
  viewMode: 'month' | 'week';
  onViewModeChange: (mode: 'month' | 'week') => void;
  onToday: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentTitle,
  viewMode,
  onViewModeChange,
  onToday,
  onPrev,
  onNext
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-theme-surface border border-theme-border/80 rounded-xl p-4 shadow-xs">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0">
          <CalendarIcon className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-theme-main tracking-tight">Calendar</h1>
          <p className="text-xs text-theme-secondary">Plan deadlines, tasks, and project timelines.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Today & Navigation */}
        <div className="flex items-center gap-1 bg-theme-bg border border-theme-border rounded-lg p-0.5">
          <button
            onClick={onToday}
            className="px-3 py-1 rounded-md text-xs font-semibold text-theme-main hover:bg-theme-surface transition"
            aria-label="Go to Today"
          >
            Today
          </button>
          <div className="h-4 w-px bg-theme-border my-auto" />
          <button
            onClick={onPrev}
            className="p-1 rounded-md text-theme-muted hover:text-theme-main hover:bg-theme-surface transition"
            aria-label="Previous Period"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-theme-main px-2 min-w-[120px] text-center">
            {currentTitle}
          </span>
          <button
            onClick={onNext}
            className="p-1 rounded-md text-theme-muted hover:text-theme-main hover:bg-theme-surface transition"
            aria-label="Next Period"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 p-0.5 bg-theme-bg border border-theme-border rounded-lg">
          <button
            onClick={() => onViewModeChange('month')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition ${
              viewMode === 'month'
                ? 'bg-theme-surface text-blue-600 dark:text-blue-400 shadow-xs border border-theme-border'
                : 'text-theme-muted hover:text-theme-main'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => onViewModeChange('week')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition ${
              viewMode === 'week'
                ? 'bg-theme-surface text-blue-600 dark:text-blue-400 shadow-xs border border-theme-border'
                : 'text-theme-muted hover:text-theme-main'
            }`}
          >
            Week
          </button>
        </div>
      </div>
    </div>
  );
};
