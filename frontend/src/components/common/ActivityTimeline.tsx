import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Folder,
  CheckSquare,
  MessageSquare,
  Shield,
  UserPlus,
  Activity,
  User as UserIcon,
  ArrowRight
} from 'lucide-react';
import type { ActivityLog } from '../../types';

interface ActivityTimelineProps {
  activities: ActivityLog[];
  loading?: boolean;
  emptyMessage?: string;
  compact?: boolean;
  showLinks?: boolean;
}

function formatRelativeTime(dateString: string): string {
  if (!dateString) return '';
  // Append 'Z' if UTC format missing so Date parses properly
  const utcDateStr = dateString.endsWith('Z') || dateString.includes('+') ? dateString : `${dateString}Z`;
  const date = new Date(utcDateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (isNaN(diffInSeconds) || diffInSeconds < 0) return 'Just now';
  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function getActivityIcon(entityType: string, actionType: string) {
  const et = (entityType || '').toUpperCase();
  const at = (actionType || '').toUpperCase();

  if (at.includes('ROLE') || et === 'ROLE') {
    return <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
  }
  if (et === 'TEAM' || at.startsWith('TEAM_')) {
    return <Users className="w-4 h-4 text-blue-500" />;
  }
  if (et === 'PROJECT' || at.startsWith('PROJECT_')) {
    return <Folder className="w-4 h-4 text-amber-500" />;
  }
  if (et === 'TASK' || at.startsWith('TASK_')) {
    return <CheckSquare className="w-4 h-4 text-emerald-500" />;
  }
  if (et === 'COMMENT' || at.startsWith('COMMENT_')) {
    return <MessageSquare className="w-4 h-4 text-cyan-500" />;
  }
  if (et === 'FRIENDSHIP' || at.startsWith('FRIEND_') || at.startsWith('USER_')) {
    return <UserPlus className="w-4 h-4 text-blue-500" />;
  }
  return <Activity className="w-4 h-4 text-slate-400" />;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  activities,
  loading = false,
  emptyMessage = 'No activity yet.',
  compact = false,
  showLinks = true
}) => {
  if (loading) {
    return (
      <div className="py-8 text-center text-slate-500 dark:text-slate-400">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mb-2"></div>
        <p className="text-sm">Loading activity history...</p>
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="py-12 text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700/60 p-6">
        <Activity className="w-10 h-10 mx-auto mb-3 text-slate-400 dark:text-slate-500 opacity-60" />
        <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">{emptyMessage}</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400">Actions in this workspace will appear here.</p>
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
      {activities.map((item) => {
        const actorName = item.actor?.full_name || 'System';
        const actorAvatar = item.actor?.avatar_url;
        const icon = getActivityIcon(item.entity_type, item.action_type);
        const relTime = formatRelativeTime(item.created_at);
        const exactTime = item.created_at ? new Date(item.created_at.endsWith('Z') || item.created_at.includes('+') ? item.created_at : `${item.created_at}Z`).toLocaleString() : '';

        return (
          <div key={item.id} className="relative group">
            {/* Timeline icon node */}
            <div className="absolute -left-6 top-0.5 transform -translate-x-1/2 w-6 h-6 rounded-full bg-white dark:bg-[#1E1E1E] border border-slate-200 dark:border-[#2F2F2F] flex items-center justify-center shadow-xs">
              {icon}
            </div>

            <div className="bg-theme-surface border border-theme-border rounded-xl p-3.5 shadow-xs hover:border-theme-primary/30 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  {/* Actor Avatar */}
                  {item.actor_id ? (
                    <Link to={`/users/${item.actor_id}`} className="flex-shrink-0 group/avatar">
                      {actorAvatar ? (
                        <img
                          src={actorAvatar}
                          alt={actorName}
                          className="w-7 h-7 rounded-full object-cover ring-2 ring-transparent group-hover/avatar:ring-blue-500 transition-all"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold text-xs flex items-center justify-center ring-2 ring-transparent group-hover/avatar:ring-blue-500 transition-all">
                          {actorName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </Link>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold text-xs flex items-center justify-center">
                      <UserIcon className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div className="min-w-0 text-sm">
                    {item.actor_id ? (
                      <Link
                        to={`/users/${item.actor_id}`}
                        className="font-medium text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mr-1"
                      >
                        {actorName}
                      </Link>
                    ) : (
                      <span className="font-medium text-slate-900 dark:text-slate-100 mr-1">{actorName}</span>
                    )}

                    <span className="text-slate-600 dark:text-slate-300 text-sm font-normal">
                      {item.description ? (
                        item.description.replace(`${actorName} `, '')
                      ) : (
                        item.action_type
                      )}
                    </span>
                  </div>
                </div>

                {/* Relative timestamp */}
                <span
                  title={exactTime}
                  className="flex-shrink-0 text-xs font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap"
                >
                  {relTime}
                </span>
              </div>

              {/* Context Links / Metadata Badges */}
              {showLinks && (item.team_name || item.project_name || item.task_title || item.metadata_json) && (
                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-[#2A2A2A] flex flex-wrap items-center gap-2 text-xs">

                  {item.team_id && item.team_name && (
                    <Link
                      to={`/teams/${item.team_id}`}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      <Users className="w-3 h-3 text-slate-400" />
                      <span>{item.team_name}</span>
                    </Link>
                  )}

                  {item.project_id && item.project_name && (
                    <Link
                      to={`/projects?id=${item.project_id}`}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      <Folder className="w-3 h-3 text-slate-400" />
                      <span>{item.project_name}</span>
                    </Link>
                  )}

                  {item.task_id && item.task_title && (
                    <Link
                      to={`/tasks?id=${item.task_id}`}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      <CheckSquare className="w-3 h-3 text-slate-400" />
                      <span className="truncate max-w-[180px]">{item.task_title}</span>
                    </Link>
                  )}

                  {/* Field diff badge if available */}
                  {item.metadata_json && item.metadata_json.old_value && item.metadata_json.new_value && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40 font-mono text-[11px]">
                      <span>{item.metadata_json.old_value}</span>
                      <ArrowRight className="w-3 h-3 text-amber-500" />
                      <span>{item.metadata_json.new_value}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
