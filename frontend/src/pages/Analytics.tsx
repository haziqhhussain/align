import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { analyticsService } from '../services/analyticsService';
import { teamService } from '../services/teamService';
import { projectService } from '../services/projectService';
import { userService } from '../services/userService';
import type {
  AnalyticsSummary,
  MemberWorkload,
  TeamWorkload,
  ProjectWorkload,
  AnalyticsTrends,
  AnalyticsFilters,
  Team,
  Project,
  User,
} from '../types';
import {
  BarChart3,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  Filter,
  X,
  TrendingUp,
  Layers,
  ChevronRight,
  UserCheck,
  FolderKanban,
  CheckSquare,
  RefreshCw
} from 'lucide-react';

export const Analytics: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Dropdown options
  const [teams, setTeams] = useState<Team[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Filter state
  const [filters, setFilters] = useState<AnalyticsFilters>({
    period: '30d',
  });

  // Analytics data
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [membersWorkload, setMembersWorkload] = useState<MemberWorkload[]>([]);
  const [teamWorkloads, setTeamWorkloads] = useState<TeamWorkload[]>([]);
  const [projectWorkloads, setProjectWorkloads] = useState<ProjectWorkload[]>([]);
  const [trends, setTrends] = useState<AnalyticsTrends | null>(null);

  // Selected Member for Detail Modal
  const [selectedMember, setSelectedMember] = useState<MemberWorkload | null>(null);

  // Load dropdown filter options
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [teamsRes, projectsRes, usersRes] = await Promise.all([
          teamService.getTeams(),
          projectService.getProjects(),
          userService.getUsers(),
        ]);
        setTeams(teamsRes);
        setProjects(projectsRes);
        setUsers(usersRes);
      } catch (err) {
        console.error('Failed to load analytics metadata:', err);
      }
    };
    fetchOptions();
  }, []);

  // Filtered projects based on selected team
  const availableProjects = filters.team_id
    ? projects.filter((p) => p.team_id === filters.team_id)
    : projects;

  // Load analytics data
  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, memRes, teamRes, projRes, trendRes] = await Promise.all([
        analyticsService.getAnalyticsSummary(filters),
        analyticsService.getMemberWorkload(filters),
        analyticsService.getTeamWorkload(filters),
        analyticsService.getProjectWorkload(filters),
        analyticsService.getAnalyticsTrends(filters.period || '30d', filters),
      ]);
      setSummary(sumRes);
      setMembersWorkload(memRes);
      setTeamWorkloads(teamRes);
      setProjectWorkloads(projRes);
      setTrends(trendRes);
    } catch (err: any) {
      console.error('Failed to load analytics:', err);
      setError('Unable to load workload analytics. Please check your connection and try again.');
      showToast('Failed to load analytics data', 'error');
    } finally {
      setLoading(false);
    }
  }, [filters, showToast]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleResetFilters = () => {
    setFilters({ period: '30d' });
  };

  // Helper for workload score color badges and progress bars
  const getWorkloadLevelMeta = (level: string) => {
    switch (level) {
      case 'LOW':
        return {
          label: 'Low',
          badge: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900',
          bar: 'bg-emerald-500',
        };
      case 'BALANCED':
        return {
          label: 'Balanced',
          badge: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900',
          bar: 'bg-blue-500',
        };
      case 'HIGH':
        return {
          label: 'High',
          badge: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900',
          bar: 'bg-amber-500',
        };
      case 'OVERLOADED':
        return {
          label: 'Overloaded',
          badge: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900 font-semibold',
          bar: 'bg-rose-500',
        };
      default:
        return {
          label: 'Balanced',
          badge: 'bg-slate-50 dark:bg-slate-950/60 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-900',
          bar: 'bg-blue-500',
        };
    }
  };

  // Workload balance summary counters
  const overloadedCount = membersWorkload.filter((m) => m.workload_level === 'OVERLOADED').length;
  const highCount = membersWorkload.filter((m) => m.workload_level === 'HIGH').length;
  const balancedCount = membersWorkload.filter((m) => m.workload_level === 'BALANCED').length;
  const lowCount = membersWorkload.filter((m) => m.workload_level === 'LOW').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-theme-surface border border-theme-border/80 rounded-xl p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-theme-main tracking-tight">Workload Analytics</h1>
            <p className="text-xs text-theme-secondary">
              Understand team capacity, workload distribution, and delivery risk.
            </p>
          </div>
        </div>

        {/* Period Preset Pills */}
        <div className="flex items-center gap-1 bg-theme-bg border border-theme-border p-1 rounded-lg">
          {(['7d', '30d', '90d'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setFilters({ ...filters, period: p })}
              className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                filters.period === p
                  ? 'bg-theme-surface text-blue-600 dark:text-blue-400 shadow-xs border border-theme-border'
                  : 'text-theme-muted hover:text-theme-main'
              }`}
            >
              {p === '7d' ? 'Last 7 Days' : p === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-theme-surface border border-theme-border/80 rounded-xl p-3.5 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-theme-main mr-1">
          <Filter className="w-3.5 h-3.5 text-theme-primary" />
          <span>Filters:</span>
        </div>

        {/* Team Filter */}
        <select
          value={filters.team_id || ''}
          onChange={(e) =>
            setFilters({
              ...filters,
              team_id: e.target.value ? Number(e.target.value) : undefined,
              project_id: undefined, // Reset project filter if team changes
            })
          }
          className="px-2.5 py-1.5 rounded-lg border border-theme-border bg-theme-bg text-xs font-medium text-theme-main focus:outline-none focus:ring-1 focus:ring-blue-500"
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
            setFilters({
              ...filters,
              project_id: e.target.value ? Number(e.target.value) : undefined,
            })
          }
          className="px-2.5 py-1.5 rounded-lg border border-theme-border bg-theme-bg text-xs font-medium text-theme-main focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All Projects</option>
          {availableProjects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {/* Member Filter */}
        <select
          value={filters.member_id || ''}
          onChange={(e) =>
            setFilters({
              ...filters,
              member_id: e.target.value ? Number(e.target.value) : undefined,
            })
          }
          className="px-2.5 py-1.5 rounded-lg border border-theme-border bg-theme-bg text-xs font-medium text-theme-main focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All Members</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.full_name}
            </option>
          ))}
        </select>

        {(filters.team_id || filters.project_id || filters.member_id) && (
          <button
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
          >
            <X className="w-3.5 h-3.5" />
            Clear Filters
          </button>
        )}
      </div>

      {error ? (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl p-8 text-center shadow-xs">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-red-900 dark:text-red-200 mb-1">
            Unable to load analytics
          </h3>
          <p className="text-xs text-red-600 dark:text-red-400 mb-4 max-w-md mx-auto">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try Again
          </button>
        </div>
      ) : (
        <>
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="saas-card p-3.5 space-y-1">
              <span className="text-[11px] text-theme-muted font-bold uppercase tracking-wider block">
                Active Tasks
              </span>
              <div className="flex items-center justify-between">
                <span className="text-xl font-extrabold text-theme-main">
                  {summary?.active_tasks ?? 0}
                </span>
                <CheckSquare className="w-4 h-4 text-blue-500 opacity-80" />
              </div>
            </div>

            <div className="saas-card p-3.5 space-y-1">
              <span className="text-[11px] text-theme-muted font-bold uppercase tracking-wider block">
                Completed Rate
              </span>
              <div className="flex items-center justify-between">
                <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {summary?.completion_rate ?? 0}%
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500 opacity-80" />
              </div>
            </div>

            <div className="saas-card p-3.5 space-y-1">
              <span className="text-[11px] text-theme-muted font-bold uppercase tracking-wider block">
                Overdue Tasks
              </span>
              <div className="flex items-center justify-between">
                <span
                  className={`text-xl font-extrabold ${
                    (summary?.overdue_tasks ?? 0) > 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-theme-main'
                  }`}
                >
                  {summary?.overdue_tasks ?? 0}
                </span>
                <AlertTriangle className="w-4 h-4 text-red-500 opacity-80" />
              </div>
            </div>

            <div className="saas-card p-3.5 space-y-1">
              <span className="text-[11px] text-theme-muted font-bold uppercase tracking-wider block">
                Due This Week
              </span>
              <div className="flex items-center justify-between">
                <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
                  {summary?.due_this_week ?? 0}
                </span>
                <Clock className="w-4 h-4 text-amber-500 opacity-80" />
              </div>
            </div>

            <div className="saas-card p-3.5 space-y-1">
              <span className="text-[11px] text-theme-muted font-bold uppercase tracking-wider block">
                High / Critical
              </span>
              <div className="flex items-center justify-between">
                <span className="text-xl font-extrabold text-rose-600 dark:text-rose-400">
                  {summary?.high_priority_tasks ?? 0}
                </span>
                <Flame className="w-4 h-4 text-rose-500 opacity-80" />
              </div>
            </div>

            <div className="saas-card p-3.5 space-y-1">
              <span className="text-[11px] text-theme-muted font-bold uppercase tracking-wider block">
                Unassigned
              </span>
              <div className="flex items-center justify-between">
                <span className="text-xl font-extrabold text-theme-main">
                  {summary?.unassigned_tasks ?? 0}
                </span>
                <Users className="w-4 h-4 text-slate-400 opacity-80" />
              </div>
            </div>
          </div>

          {/* Workload Balance Overview Banner */}
          <div className="bg-theme-surface border border-theme-border/80 rounded-xl p-4 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-theme-border/60">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold text-theme-main">Workload Balance Insight</h3>
              </div>
              <span className="text-xs text-theme-muted">
                Based on active task status, priority, and upcoming deadlines
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-rose-700 dark:text-rose-400">
                    {overloadedCount} Overloaded
                  </p>
                  <p className="text-[10px] text-theme-muted">Score &gt; 80%</p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                    {highCount} High Load
                  </p>
                  <p className="text-[10px] text-theme-muted">Score 61–80%</p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-blue-700 dark:text-blue-400">
                    {balancedCount} Balanced
                  </p>
                  <p className="text-[10px] text-theme-muted">Score 31–60%</p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    {lowCount} Low Load
                  </p>
                  <p className="text-[10px] text-theme-muted">Score 0–30%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Grid: Team Workload (Left 2.5/4) + Delivery Risks & Project Health (Right 1.5/4) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
            {/* Left Section: Member Workload List */}
            <div className="lg:col-span-2 space-y-5">
              <div className="bg-theme-surface border border-theme-border/80 rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-theme-border/60 mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-sm font-bold text-theme-main">Team Member Workload</h3>
                  </div>
                  <span className="text-xs text-theme-muted">
                    {membersWorkload.length} member{membersWorkload.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {loading ? (
                  <div className="space-y-3 py-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-14 bg-theme-bg animate-pulse rounded-lg" />
                    ))}
                  </div>
                ) : membersWorkload.length === 0 ? (
                  <div className="text-center py-8">
                    <UserCheck className="w-8 h-8 text-theme-muted mx-auto mb-2 opacity-60" />
                    <p className="text-xs font-bold text-theme-main">No workload data yet.</p>
                    <p className="text-[11px] text-theme-muted mt-0.5">
                      Assign tasks to team members to start seeing workload insights.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {membersWorkload.map((m) => {
                      const levelMeta = getWorkloadLevelMeta(m.workload_level);
                      return (
                        <button
                          key={m.user_id}
                          onClick={() => setSelectedMember(m)}
                          className="w-full text-left p-3 rounded-lg border border-theme-border/60 hover:border-blue-400 dark:hover:border-blue-600 bg-theme-surface hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition group shadow-2xs cursor-pointer"
                        >
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-full bg-theme-primary/10 text-theme-primary font-bold text-xs flex items-center justify-center shrink-0 border border-theme-primary/20">
                                {m.full_name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-theme-main group-hover:text-blue-600 dark:group-hover:text-blue-400 transition truncate">
                                  {m.full_name}
                                </p>
                                <p className="text-[10px] text-theme-muted truncate">
                                  {m.active_tasks} active &bull; {m.overdue_tasks} overdue &bull; {m.due_this_week} due this week
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${levelMeta.badge}`}
                              >
                                {levelMeta.label} ({m.workload_score}%)
                              </span>
                              <ChevronRight className="w-4 h-4 text-theme-muted group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          </div>

                          {/* Workload Progress Bar */}
                          <div className="w-full bg-theme-bg rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full transition-all duration-300 ${levelMeta.bar}`}
                              style={{ width: `${Math.max(4, m.workload_score)}%` }}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Tasks Trend Chart */}
              <div className="bg-theme-surface border border-theme-border/80 rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-theme-border/60 mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="text-sm font-bold text-theme-main">Task Activity Trend</h3>
                  </div>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Completed
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
                      <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Created
                    </span>
                  </div>
                </div>

                {trends && trends.completed_tasks.length > 0 ? (
                  <div className="pt-2">
                    <div className="h-32 flex items-end gap-1 px-1">
                      {trends.completed_tasks.slice(-14).map((pt, idx) => {
                        const createdPt = trends.created_tasks.slice(-14)[idx] || { count: 0 };
                        const maxVal = Math.max(
                          1,
                          ...trends.completed_tasks.map((p) => p.count),
                          ...trends.created_tasks.map((p) => p.count)
                        );
                        const compHeight = Math.round((pt.count / maxVal) * 100);
                        const createHeight = Math.round((createdPt.count / maxVal) * 100);

                        return (
                          <div
                            key={pt.date}
                            className="flex-1 flex flex-col justify-end items-center gap-0.5 h-full group"
                            title={`${pt.date}: ${pt.count} completed, ${createdPt.count} created`}
                          >
                            <div className="w-full flex items-end justify-center gap-0.5 h-full">
                              <div
                                className="w-1.5 bg-emerald-500 rounded-t-sm transition-all"
                                style={{ height: `${Math.max(6, compHeight)}%` }}
                              />
                              <div
                                className="w-1.5 bg-blue-500/80 rounded-t-sm transition-all"
                                style={{ height: `${Math.max(6, createHeight)}%` }}
                              />
                            </div>
                            <span className="text-[9px] text-theme-muted font-mono truncate w-full text-center">
                              {pt.date.substring(8)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-theme-muted text-center py-6">No trend activity data.</p>
                )}
              </div>
            </div>

            {/* Right Section: Delivery Risks & Project Health */}
            <div className="lg:col-span-1 space-y-5">
              {/* Delivery Risks */}
              <div className="bg-theme-surface border border-theme-border/80 rounded-xl p-4 shadow-xs">
                <div className="flex items-center gap-2 pb-3 border-b border-theme-border/60 mb-3">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-bold text-theme-main">Delivery Risks</h3>
                </div>

                <div className="space-y-2.5">
                  <div className="p-3 rounded-lg bg-red-50/60 dark:bg-red-950/30 border border-red-200/70 dark:border-red-900/50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-red-700 dark:text-red-400">
                        Overdue Workload
                      </span>
                      <span className="text-xs font-extrabold text-red-700 dark:text-red-400">
                        {summary?.overdue_tasks ?? 0} tasks
                      </span>
                    </div>
                    <p className="text-[11px] text-red-600/80 dark:text-red-400/80 mt-0.5">
                      Tasks past their due date requiring immediate attention.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                        High Priority Tasks
                      </span>
                      <span className="text-xs font-extrabold text-amber-700 dark:text-amber-400">
                        {summary?.high_priority_tasks ?? 0} active
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-0.5">
                      High or Critical priority tasks currently active.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-700 dark:text-blue-400">
                        Unassigned Backlog
                      </span>
                      <span className="text-xs font-extrabold text-blue-700 dark:text-blue-400">
                        {summary?.unassigned_tasks ?? 0} tasks
                      </span>
                    </div>
                    <p className="text-[11px] text-blue-600/80 dark:text-blue-400/80 mt-0.5">
                      Active tasks without an assigned member.
                    </p>
                  </div>
                </div>
              </div>

              {/* Project Workload Health */}
              <div className="bg-theme-surface border border-theme-border/80 rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-theme-border/60 mb-3">
                  <div className="flex items-center gap-2">
                    <FolderKanban className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="text-sm font-bold text-theme-main">Project Health</h3>
                  </div>
                  <span className="text-xs text-theme-muted">{projectWorkloads.length} projects</span>
                </div>

                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {projectWorkloads.map((p) => (
                    <div
                      key={p.project_id}
                      className="p-2.5 rounded-lg border border-theme-border/60 bg-theme-surface hover:border-theme-border transition shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-xs font-bold text-theme-main truncate">{p.project_name}</p>
                        <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 shrink-0">
                          {p.completion_rate}%
                        </span>
                      </div>
                      <div className="w-full bg-theme-bg rounded-full h-1.5 overflow-hidden mb-1">
                        <div
                          className="bg-emerald-500 h-1.5 rounded-full"
                          style={{ width: `${p.completion_rate}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-theme-muted">
                        {p.active_tasks} active &bull; {p.overdue_tasks} overdue &bull; {p.due_soon_count} due soon
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Selected Member Detail Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="saas-panel w-full max-w-lg p-5 space-y-4 shadow-2xl border-theme-border max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-theme-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-theme-primary/10 text-theme-primary font-bold text-base flex items-center justify-center border border-theme-primary/20">
                  {selectedMember.full_name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-theme-main">{selectedMember.full_name}</h3>
                  <p className="text-xs text-theme-muted">{selectedMember.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                className="text-theme-muted hover:text-theme-main p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Workload Score Banner */}
            <div className="p-3 rounded-xl bg-theme-bg border border-theme-border flex items-center justify-between">
              <div>
                <span className="text-[11px] text-theme-muted font-bold uppercase tracking-wider block">
                  Current Workload Score
                </span>
                <span className="text-lg font-extrabold text-theme-main">
                  {selectedMember.workload_score}%
                </span>
              </div>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full border ${
                  getWorkloadLevelMeta(selectedMember.workload_level).badge
                }`}
              >
                {getWorkloadLevelMeta(selectedMember.workload_level).label}
              </span>
            </div>

            {/* Task Stats */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-lg bg-theme-surface border border-theme-border">
                <span className="text-[10px] text-theme-muted block">Active Tasks</span>
                <span className="text-sm font-bold text-theme-main">{selectedMember.active_tasks}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-theme-surface border border-theme-border">
                <span className="text-[10px] text-theme-muted block">Overdue</span>
                <span className="text-sm font-bold text-red-600 dark:text-red-400">
                  {selectedMember.overdue_tasks}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-theme-surface border border-theme-border">
                <span className="text-[10px] text-theme-muted block">Due This Week</span>
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                  {selectedMember.due_this_week}
                </span>
              </div>
            </div>

            {/* Status Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-theme-main uppercase tracking-wider">
                Status Breakdown
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between p-2 rounded-md bg-theme-bg border border-theme-border/60">
                  <span className="text-theme-muted">To Do</span>
                  <span className="font-bold text-theme-main">
                    {selectedMember.status_breakdown.TO_DO}
                  </span>
                </div>
                <div className="flex justify-between p-2 rounded-md bg-theme-bg border border-theme-border/60">
                  <span className="text-theme-muted">In Progress</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {selectedMember.status_breakdown.IN_PROGRESS}
                  </span>
                </div>
                <div className="flex justify-between p-2 rounded-md bg-theme-bg border border-theme-border/60">
                  <span className="text-theme-muted">In Review</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {selectedMember.status_breakdown.REVIEW}
                  </span>
                </div>
                <div className="flex justify-between p-2 rounded-md bg-theme-bg border border-theme-border/60">
                  <span className="text-theme-muted">Completed</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {selectedMember.status_breakdown.COMPLETED}
                  </span>
                </div>
              </div>
            </div>

            {/* Priority Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-theme-main uppercase tracking-wider">
                Priority Breakdown
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between p-2 rounded-md bg-theme-bg border border-theme-border/60">
                  <span className="text-theme-muted">Low</span>
                  <span className="font-bold text-slate-600 dark:text-slate-400">
                    {selectedMember.priority_breakdown.LOW}
                  </span>
                </div>
                <div className="flex justify-between p-2 rounded-md bg-theme-bg border border-theme-border/60">
                  <span className="text-theme-muted">Medium</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {selectedMember.priority_breakdown.MEDIUM}
                  </span>
                </div>
                <div className="flex justify-between p-2 rounded-md bg-theme-bg border border-theme-border/60">
                  <span className="text-theme-muted">High</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {selectedMember.priority_breakdown.HIGH}
                  </span>
                </div>
                <div className="flex justify-between p-2 rounded-md bg-theme-bg border border-theme-border/60">
                  <span className="text-theme-muted">Critical</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">
                    {selectedMember.priority_breakdown.CRITICAL}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedMember(null)}
                className="px-4 py-1.5 bg-theme-surface border border-theme-border hover:bg-theme-bg text-theme-main rounded-lg text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
