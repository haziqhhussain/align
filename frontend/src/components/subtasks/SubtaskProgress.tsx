import React from 'react';

interface SubtaskProgressProps {
  completedCount: number;
  totalCount: number;
  progressPercentage: number;
  compact?: boolean;
}

export const SubtaskProgress: React.FC<SubtaskProgressProps> = ({
  completedCount,
  totalCount,
  progressPercentage,
  compact = false
}) => {
  if (totalCount === 0) return null;

  const isComplete = progressPercentage === 100;

  if (compact) {
    return (
      <div className="inline-flex items-center gap-1.5 text-[11px] text-theme-muted" title={`Checklist: ${completedCount}/${totalCount} completed`}>
        <span className={`font-semibold ${isComplete ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}`}>
          {completedCount}/{totalCount}
        </span>
        <div className="w-10 bg-blue-50 dark:bg-slate-800 rounded-full h-1 overflow-hidden">
          <div
            className={`h-1 rounded-full transition-all duration-300 ${isComplete ? 'bg-emerald-500' : 'bg-blue-600 dark:bg-blue-500'}`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-theme-muted">Checklist Progress</span>
        <div className="flex items-center gap-2">
          <span className="text-theme-muted font-medium">{completedCount} / {totalCount} completed</span>
          <span className={`font-bold text-xs ${isComplete ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}`}>
            {progressPercentage}%
          </span>
        </div>
      </div>
      <div className="w-full bg-blue-50 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-1.5 rounded-full transition-all duration-300 ${isComplete ? 'bg-emerald-500' : 'bg-blue-600 dark:bg-blue-500'}`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
};
