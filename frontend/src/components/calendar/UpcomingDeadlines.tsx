import React from 'react';
import type { CalendarEvent, UpcomingDeadline } from '../../types';
import { Clock, AlertTriangle, CheckCircle2, ChevronRight, FolderKanban, CheckSquare } from 'lucide-react';
import { formatDateShort } from '../../utils/dateUtils';

interface UpcomingDeadlinesProps {
  deadlines: UpcomingDeadline[];
  events?: CalendarEvent[];
  onSelectTask: (taskId: number) => void;
  onSelectProject: (projectId: number) => void;
  isLoading?: boolean;
}

export const UpcomingDeadlines: React.FC<UpcomingDeadlinesProps> = ({
  deadlines,
  events = [],
  onSelectTask,
  onSelectProject,
  isLoading = false,
}) => {
  // Extract overdue items from deadlines or events
  const overdueItems = events.filter((e) => e.is_overdue && e.status !== 'COMPLETED');
  const upcomingList = deadlines.slice(0, 10);

  return (
    <div className="flex flex-col gap-4">
      {/* Overdue Alert Section */}
      {overdueItems.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Overdue Tasks ({overdueItems.length})</span>
            </div>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {overdueItems.slice(0, 5).map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.type === 'TASK') onSelectTask(item.entity_id);
                  else if (item.type === 'PROJECT') onSelectProject(item.entity_id);
                }}
                className="w-full text-left p-2 rounded-lg bg-white dark:bg-slate-900 border border-red-100 dark:border-red-950 hover:border-red-300 dark:hover:border-red-800 transition flex items-center justify-between group cursor-pointer shadow-2xs"
              >
                <div className="truncate pr-2">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-red-600 dark:group-hover:text-red-400 transition">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-red-600 dark:text-red-400 font-medium">
                    Due {formatDateShort(item.end)}
                  </p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-red-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Deadlines Panel */}
      <div className="bg-theme-surface border border-theme-border/80 rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-theme-border/60 mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-bold text-theme-main">Upcoming Deadlines</h3>
          </div>
          <span className="text-[11px] font-semibold text-theme-muted bg-theme-bg px-2 py-0.5 rounded-full border border-theme-border">
            Next {upcomingList.length}
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-2 py-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-theme-bg animate-pulse rounded-lg" />
            ))}
          </div>
        ) : upcomingList.length === 0 ? (
          <div className="text-center py-6 px-3">
            <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2 opacity-80" />
            <p className="text-xs font-bold text-theme-main">You're all caught up!</p>
            <p className="text-[11px] text-theme-muted mt-0.5">No upcoming deadlines found.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingList.map((item) => {
              const isTask = item.type === 'TASK';
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (isTask) onSelectTask(item.entity_id);
                    else onSelectProject(item.entity_id);
                  }}
                  className="w-full text-left p-2.5 rounded-lg border border-theme-border/60 hover:border-blue-400 dark:hover:border-blue-600 bg-theme-surface hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition flex items-center justify-between group cursor-pointer shadow-2xs"
                >
                  <div className="flex items-start gap-2.5 min-w-0 pr-2">
                    <div
                      className={`p-1.5 rounded-md shrink-0 mt-0.5 ${
                        isTask
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                          : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {isTask ? (
                        <CheckSquare className="w-3.5 h-3.5" />
                      ) : (
                        <FolderKanban className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-theme-main group-hover:text-blue-600 dark:group-hover:text-blue-400 transition truncate">
                        {item.title}
                      </p>
                      {item.project_name && (
                        <p className="text-[11px] text-theme-muted truncate">
                          {item.project_name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-[11px] font-bold block ${
                        item.is_overdue
                          ? 'text-red-600 dark:text-red-400'
                          : item.relative_label === 'Today' || item.relative_label === 'Tomorrow'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-theme-secondary'
                      }`}
                    >
                      {item.relative_label}
                    </span>
                    <span className="text-[10px] text-theme-muted block">
                      {formatDateShort(item.date)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
