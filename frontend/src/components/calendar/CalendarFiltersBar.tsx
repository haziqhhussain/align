import React from 'react';
import type { Team, Project, User, CalendarFilters } from '../../types';
import { Filter, UserCheck, RotateCcw } from 'lucide-react';

interface CalendarFiltersBarProps {
  teams: Team[];
  projects: Project[];
  users: User[];
  filters: CalendarFilters;
  onFilterChange: (filters: CalendarFilters) => void;
  onResetFilters: () => void;
}

export const CalendarFiltersBar: React.FC<CalendarFiltersBarProps> = ({
  teams,
  projects,
  users,
  filters,
  onFilterChange,
  onResetFilters
}) => {
  const filteredProjects = filters.team_id
    ? projects.filter((p) => p.team_id === filters.team_id)
    : projects;

  const hasActiveFilters =
    Boolean(filters.team_id) ||
    Boolean(filters.project_id) ||
    Boolean(filters.assignee_id) ||
    (filters.event_type && filters.event_type !== 'ALL') ||
    Boolean(filters.status) ||
    Boolean(filters.my_calendar_only);

  return (
    <div className="bg-theme-surface border border-theme-border/80 rounded-xl p-3.5 shadow-xs space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-theme-main mr-1">
            <Filter className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Filters:
          </div>

          {/* My Calendar toggle */}
          <button
            onClick={() => onFilterChange({ ...filters, my_calendar_only: !filters.my_calendar_only })}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              filters.my_calendar_only
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-theme-bg text-theme-secondary border-theme-border hover:bg-theme-surface'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" /> My Calendar
          </button>

          {/* Team Filter */}
          <select
            value={filters.team_id || ''}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                team_id: e.target.value ? Number(e.target.value) : undefined,
                project_id: undefined
              })
            }
            className="bg-theme-bg border border-theme-border rounded-lg px-2.5 py-1.5 text-xs text-theme-main font-medium focus:outline-none cursor-pointer"
          >
            <option value="">All Teams</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Project Filter */}
          <select
            value={filters.project_id || ''}
            onChange={(e) =>
              onFilterChange({ ...filters, project_id: e.target.value ? Number(e.target.value) : undefined })
            }
            className="bg-theme-bg border border-theme-border rounded-lg px-2.5 py-1.5 text-xs text-theme-main font-medium focus:outline-none cursor-pointer"
          >
            <option value="">All Projects</option>
            {filteredProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Assignee Filter */}
          <select
            value={filters.assignee_id || ''}
            onChange={(e) =>
              onFilterChange({ ...filters, assignee_id: e.target.value ? Number(e.target.value) : undefined })
            }
            className="bg-theme-bg border border-theme-border rounded-lg px-2.5 py-1.5 text-xs text-theme-main font-medium focus:outline-none cursor-pointer"
          >
            <option value="">All Assignees</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name}
              </option>
            ))}
          </select>

          {/* Event Type Filter */}
          <select
            value={filters.event_type || 'ALL'}
            onChange={(e) =>
              onFilterChange({ ...filters, event_type: e.target.value as any })
            }
            className="bg-theme-bg border border-theme-border rounded-lg px-2.5 py-1.5 text-xs text-theme-main font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Event Types</option>
            <option value="TASK">Tasks Only</option>
            <option value="PROJECT">Projects Only</option>
          </select>

          {/* Status Filter */}
          <select
            value={filters.status || ''}
            onChange={(e) =>
              onFilterChange({ ...filters, status: e.target.value || undefined })
            }
            className="bg-theme-bg border border-theme-border rounded-lg px-2.5 py-1.5 text-xs text-theme-main font-medium focus:outline-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Review">Review</option>
            <option value="Completed">Completed</option>
            <option value="Active">Active (Projects)</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 text-xs text-theme-muted hover:text-rose-500 font-medium transition"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
          </button>
        )}
      </div>
    </div>
  );
};
