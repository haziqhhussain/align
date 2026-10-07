import React from 'react';
import type { CalendarEvent } from '../../types';
import { formatDateSafe, getRelativeDeadline } from '../../utils/dateUtils';
import { getPriorityBadgeColor, getStatusBadgeColor } from '../../utils/format';
import { X, ExternalLink, Calendar, Folder, Users, User, CheckSquare } from 'lucide-react';

interface CalendarEventPopoverProps {
  event: CalendarEvent;
  onClose: () => void;
  onOpenDetails: (event: CalendarEvent) => void;
}

export const CalendarEventPopover: React.FC<CalendarEventPopoverProps> = ({
  event,
  onClose,
  onOpenDetails
}) => {
  const isTask = event.type === 'TASK';
  const relDeadline = getRelativeDeadline(event.end, event.status);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="saas-panel w-full max-w-sm p-4 space-y-3.5 shadow-lg border border-theme-border animate-in fade-in zoom-in duration-150">
        <div className="flex items-start justify-between gap-2 border-b border-theme-border pb-2.5">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                isTask ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
              }`}>
                {event.type}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getStatusBadgeColor(event.status)}`}>
                {event.status}
              </span>
              {isTask && event.priority && (
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getPriorityBadgeColor(event.priority)}`}>
                  {event.priority}
                </span>
              )}
            </div>
            <h3 className="text-sm font-bold text-theme-main leading-tight truncate">{event.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-theme-muted hover:text-theme-main p-1 rounded-md"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {event.description && (
          <p className="text-xs text-theme-muted line-clamp-2 leading-relaxed bg-theme-bg p-2 rounded border border-theme-border/60">
            {event.description}
          </p>
        )}

        <div className="space-y-2 text-xs text-theme-secondary">
          {event.project_name && (
            <div className="flex items-center gap-2">
              <Folder className="w-3.5 h-3.5 text-theme-muted shrink-0" />
              <span className="truncate">Project: <strong className="text-theme-main">{event.project_name}</strong></span>
            </div>
          )}

          {event.team_name && (
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-theme-muted shrink-0" />
              <span className="truncate">Team: <strong className="text-theme-main">{event.team_name}</strong></span>
            </div>
          )}

          {isTask && event.assignee_name && (
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-theme-muted shrink-0" />
              <span className="truncate">Assignee: <strong className="text-theme-main">{event.assignee_name}</strong></span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-theme-muted shrink-0" />
            <span>
              {isTask ? 'Due:' : 'Timeline:'} <strong className="text-theme-main">{formatDateSafe(event.end)}</strong>
            </span>
            <span className={`text-[11px] font-semibold ml-auto ${event.is_overdue ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'}`}>
              {relDeadline}
            </span>
          </div>

          {isTask && event.subtask_count && event.subtask_count > 0 ? (
            <div className="flex items-center gap-2 pt-1 border-t border-theme-border/50">
              <CheckSquare className="w-3.5 h-3.5 text-theme-muted shrink-0" />
              <span>Checklist: <strong className="text-theme-main">{event.completed_subtask_count}/{event.subtask_count}</strong> ({event.subtask_progress}%)</span>
            </div>
          ) : null}
        </div>

        <div className="pt-2 border-t border-theme-border flex justify-end gap-2">
          <button
            onClick={() => onOpenDetails(event)}
            className="w-full py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" /> View Details
          </button>
        </div>
      </div>
    </div>
  );
};
