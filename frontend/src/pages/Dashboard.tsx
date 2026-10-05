import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardService } from '../services/userService';
import type { DashboardData } from '../types';
import { formatDate } from '../utils/format';
import {
  Users,
  FolderKanban,
  CheckSquare,
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
  UserCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await dashboardService.getStats();
        setData(res);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-7 h-7 border-2 border-theme-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-theme-muted font-medium">Loading workspace metrics...</p>
        </div>
      </div>
    );
  }

  const viewType = data?.view_type || 'MEMBER';
  const metrics = data?.metrics || {};
  const firstName = user?.full_name?.split(' ')[0] || user?.full_name || 'User';

  return (
    <div className="space-y-5">
      {/* Simple Page Header */}
      <div>
        <h1 className="text-xl font-bold text-theme-main tracking-tight">Dashboard</h1>
        <p className="text-xs text-theme-muted mt-0.5">
          Welcome back, {firstName}. Here's what's happening today in your workspace.
        </p>
      </div>

      {/* --- ADMIN DASHBOARD VIEW --- */}
      {viewType === 'ADMIN' && (
        <>
          {/* Compact Metric Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <div className="saas-card p-3.5 space-y-1.5">
              <div className="flex items-center justify-between text-theme-muted">
                <span className="text-xs font-medium">Total Teams</span>
                <Users className="w-3.5 h-3.5 text-theme-primary" />
              </div>
              <p className="text-xl font-bold text-theme-main">{metrics.total_teams || 0}</p>
            </div>

            <div className="saas-card p-3.5 space-y-1.5">
              <div className="flex items-center justify-between text-theme-muted">
                <span className="text-xs font-medium">Projects</span>
                <FolderKanban className="w-3.5 h-3.5 text-theme-secondary" />
              </div>
              <p className="text-xl font-bold text-theme-main">{metrics.total_projects || 0}</p>
            </div>

            <div className="saas-card p-3.5 space-y-1.5">
              <div className="flex items-center justify-between text-theme-muted">
                <span className="text-xs font-medium">Tasks</span>
                <CheckSquare className="w-3.5 h-3.5 text-theme-primary" />
              </div>
              <p className="text-xl font-bold text-theme-main">{metrics.total_tasks || 0}</p>
            </div>

            <div className="saas-card p-3.5 space-y-1.5">
              <div className="flex items-center justify-between text-theme-muted">
                <span className="text-xs font-medium">Completed</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{metrics.completed_tasks || 0}</p>
            </div>

            <div className="saas-card p-3.5 space-y-1.5 col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between text-theme-muted">
                <span className="text-xs font-medium">Overdue</span>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              </div>
              <p className="text-xl font-bold text-rose-600 dark:text-rose-400">{metrics.overdue_tasks || 0}</p>
            </div>
          </div>

          {/* Teams Progress Section */}
          <div className="saas-panel p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-theme-main flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-theme-primary" /> Team Progress
              </h2>
              <Link to="/teams" className="text-xs text-theme-primary hover:underline font-medium">View All Teams &rarr;</Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data?.team_progress?.map((tp) => (
                <div key={tp.id} className="p-3.5 rounded-md bg-theme-surface border border-theme-border space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-semibold text-theme-main">{tp.name}</h3>
                      <p className="text-[11px] text-theme-muted">Lead: {tp.lead_name}</p>
                    </div>
                    <span className="text-xs font-semibold text-theme-primary bg-theme-primary-light px-2 py-0.5 rounded">
                      {tp.progress_percentage}%
                    </span>
                  </div>

                  {/* Thin Progress bar */}
                  <div className="w-full bg-theme-border/60 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-theme-primary h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${tp.progress_percentage}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-theme-muted">
                    <span>{tp.member_count} Members &bull; {tp.project_count} Projects</span>
                    <span>{tp.completed_count} / {tp.task_count} Done</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* --- TEAM LEAD DASHBOARD VIEW --- */}
      {viewType === 'LEAD' && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="saas-card p-3.5 space-y-1.5">
              <div className="flex items-center justify-between text-theme-muted">
                <span className="text-xs font-medium">Teams Managed</span>
                <Users className="w-3.5 h-3.5 text-theme-primary" />
              </div>
              <p className="text-xl font-bold text-theme-main">{metrics.teams_managed || 0}</p>
            </div>

            <div className="saas-card p-3.5 space-y-1.5">
              <div className="flex items-center justify-between text-theme-muted">
                <span className="text-xs font-medium">Assigned Projects</span>
                <FolderKanban className="w-3.5 h-3.5 text-theme-secondary" />
              </div>
              <p className="text-xl font-bold text-theme-main">{metrics.assigned_projects || 0}</p>
            </div>

            <div className="saas-card p-3.5 space-y-1.5">
              <div className="flex items-center justify-between text-theme-muted">
                <span className="text-xs font-medium">Team Members</span>
                <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-xl font-bold text-theme-main">{metrics.team_members || 0}</p>
            </div>

            <div className="saas-card p-3.5 space-y-1.5">
              <div className="flex items-center justify-between text-theme-muted">
                <span className="text-xs font-medium">Overdue Tasks</span>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              </div>
              <p className="text-xl font-bold text-rose-600 dark:text-rose-400">{metrics.overdue_tasks || 0}</p>
            </div>
          </div>

          {/* Member Workload Progress */}
          <div className="saas-panel p-4 space-y-3.5">
            <h2 className="text-sm font-semibold text-theme-main flex items-center gap-2">
              <Users className="w-4 h-4 text-theme-primary" /> Member Workload
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {data?.member_progress?.map((mp) => (
                <div key={mp.id} className="p-3.5 rounded-md bg-theme-surface border border-theme-border space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    {mp.avatar_url ? (
                      <img src={mp.avatar_url} alt={mp.full_name} className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-theme-primary-light flex items-center justify-center text-theme-primary font-bold text-xs">
                        {mp.full_name.charAt(0)}
                      </div>
                    )}
                    <div className="overflow-hidden">
                      <h3 className="text-xs font-semibold text-theme-main truncate">{mp.full_name}</h3>
                      <p className="text-[10px] text-theme-muted truncate">{mp.email}</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-theme-muted">Tasks: {mp.completed_tasks} / {mp.total_tasks}</span>
                      <span className="font-semibold text-theme-primary">{mp.progress_percentage}%</span>
                    </div>
                    <div className="w-full bg-theme-border/60 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-theme-primary h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${mp.progress_percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* --- MEMBER DASHBOARD VIEW --- */}
      {viewType === 'MEMBER' && (
        <>
          {/* Status Counter Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="saas-card p-3.5 space-y-1">
              <span className="text-xs font-medium text-theme-muted">To Do</span>
              <p className="text-xl font-bold text-theme-main">{metrics.todo_tasks || 0}</p>
            </div>
            <div className="saas-card p-3.5 space-y-1">
              <span className="text-xs font-medium text-theme-primary">In Progress</span>
              <p className="text-xl font-bold text-theme-primary">{metrics.in_progress_tasks || 0}</p>
            </div>
            <div className="saas-card p-3.5 space-y-1">
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">In Review</span>
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{metrics.review_tasks || 0}</p>
            </div>
            <div className="saas-card p-3.5 space-y-1">
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Completed</span>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{metrics.completed_tasks || 0}</p>
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="saas-panel p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-theme-main flex items-center gap-2">
                <Clock className="w-4 h-4 text-theme-primary" /> Upcoming Deadlines
              </h2>
              <Link to="/my-tasks" className="text-xs text-theme-primary hover:underline font-medium">My Tasks &rarr;</Link>
            </div>

            <div className="space-y-2">
              {data?.upcoming_deadlines?.length === 0 ? (
                <p className="text-xs text-theme-muted py-3 text-center">No upcoming deadlines.</p>
              ) : (
                data?.upcoming_deadlines?.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-md border border-theme-border bg-theme-surface flex items-center justify-between text-xs transition"
                  >
                    <div className="space-y-0.5">
                      <h3 className="font-semibold text-theme-main">{t.title}</h3>
                      <p className="text-[11px] text-theme-muted">Project: {t.project_name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                        t.is_overdue
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                          : 'bg-theme-surface-subtle text-theme-muted border-theme-border'
                      }`}>
                        {t.is_overdue ? 'OVERDUE' : formatDate(t.due_date)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};



