import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardService } from '../services/userService';
import { activityService } from '../services/activityService';
import type { DashboardData, ActivityLog } from '../types';
import { formatDate } from '../utils/format';
import { ActivityTimeline } from '../components/common/ActivityTimeline';
import {
  Users,
  FolderKanban,
  CheckSquare,
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
  UserCheck,
  UserPlus,
  Mail,
  Activity as ActivityIcon,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

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

    const fetchRecentActivity = async () => {
      try {
        const actData = await activityService.getRecentActivity(5);
        setRecentActivities(actData);
      } catch (err) {
        console.error('Error fetching recent activity:', err);
      } finally {
        setActivitiesLoading(false);
      }
    };

    fetchDashboard();
    fetchRecentActivity();
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
    <div className="space-y-6">
      {/* Top Refined Header Banner */}
      <div className="bg-gradient-to-r from-blue-50/70 via-theme-surface to-theme-surface dark:from-[#1E1E1E] dark:via-[#1E1E1E] dark:to-[#1E1E1E] border border-theme-border/80 dark:border-[#2F2F2F] rounded-xl p-4 sm:p-4.5 shadow-xs dark:shadow-[0_4px_16px_rgba(0,0,0,0.18)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-theme-main tracking-tight">Dashboard</h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-100/70 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full border border-blue-200/80 dark:border-blue-900/80">
              <Sparkles className="w-3 h-3 text-blue-600 dark:text-blue-400" /> Workspace Active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-theme-secondary">
            Welcome back, <span className="font-semibold text-theme-main">{firstName}</span>. Here’s an overview of your workspace today.
          </p>
        </div>
      </div>

      {/* --- ADMIN DASHBOARD VIEW --- */}
      {viewType === 'ADMIN' && (
        <>
          {/* Top Metric Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
            {/* Total Teams */}
            <div className="bg-theme-surface dark:bg-[#1E1E1E] border border-theme-border/80 dark:border-[#2B2B2B] dark:hover:border-[#3A3A3A] rounded-xl p-[18px] sm:p-5 flex flex-col justify-between space-y-3.5 shadow-xs dark:shadow-[0_2px_10px_rgba(0,0,0,0.18)] hover:-translate-y-0.5 hover:shadow-sm hover:border-blue-500/30 transition-all duration-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shrink-0">
                  <Users className="w-4.5 h-4.5" />
                </div>
                <span className="text-[13px] sm:text-sm font-medium text-theme-secondary">Total Teams</span>
              </div>
              <p className="text-2xl sm:text-[28px] font-bold text-theme-main tracking-tight leading-none">{metrics.total_teams || 0}</p>
            </div>

            {/* Projects */}
            <div className="bg-theme-surface dark:bg-[#1E1E1E] border border-theme-border/80 dark:border-[#2B2B2B] dark:hover:border-[#3A3A3A] rounded-xl p-[18px] sm:p-5 flex flex-col justify-between space-y-3.5 shadow-xs dark:shadow-[0_2px_10px_rgba(0,0,0,0.18)] hover:-translate-y-0.5 hover:shadow-sm hover:border-blue-500/30 transition-all duration-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shrink-0">
                  <FolderKanban className="w-4.5 h-4.5" />
                </div>
                <span className="text-[13px] sm:text-sm font-medium text-theme-secondary">Projects</span>
              </div>
              <p className="text-2xl sm:text-[28px] font-bold text-theme-main tracking-tight leading-none">{metrics.total_projects || 0}</p>
            </div>

            {/* Total Tasks */}
            <div className="bg-theme-surface dark:bg-[#1E1E1E] border border-theme-border/80 dark:border-[#2B2B2B] dark:hover:border-[#3A3A3A] rounded-xl p-[18px] sm:p-5 flex flex-col justify-between space-y-3.5 shadow-xs dark:shadow-[0_2px_10px_rgba(0,0,0,0.18)] hover:-translate-y-0.5 hover:shadow-sm hover:border-blue-500/30 transition-all duration-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shrink-0">
                  <CheckSquare className="w-4.5 h-4.5" />
                </div>
                <span className="text-[13px] sm:text-sm font-medium text-theme-secondary">Tasks</span>
              </div>
              <p className="text-2xl sm:text-[28px] font-bold text-theme-main tracking-tight leading-none">{metrics.total_tasks || 0}</p>
            </div>

            {/* Completed */}
            <div className="bg-theme-surface dark:bg-[#1E1E1E] border border-theme-border/80 dark:border-[#2B2B2B] dark:hover:border-[#3A3A3A] rounded-xl p-[18px] sm:p-5 flex flex-col justify-between space-y-3.5 shadow-xs dark:shadow-[0_2px_10px_rgba(0,0,0,0.18)] hover:-translate-y-0.5 hover:shadow-sm hover:border-emerald-500/30 transition-all duration-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-4.5 h-4.5" />
                </div>
                <span className="text-[13px] sm:text-sm font-medium text-theme-secondary">Completed</span>
              </div>
              <p className="text-2xl sm:text-[28px] font-bold text-emerald-600 dark:text-emerald-400 tracking-tight leading-none">{metrics.completed_tasks || 0}</p>
            </div>

            {/* Overdue */}
            <div className="bg-theme-surface dark:bg-[#1E1E1E] border border-theme-border/80 dark:border-[#2B2B2B] dark:hover:border-[#3A3A3A] rounded-xl p-[18px] sm:p-5 flex flex-col justify-between space-y-3.5 col-span-2 sm:col-span-1 shadow-xs dark:shadow-[0_2px_10px_rgba(0,0,0,0.18)] hover:-translate-y-0.5 hover:shadow-sm hover:border-rose-500/30 transition-all duration-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 shrink-0">
                  <AlertTriangle className="w-4.5 h-4.5" />
                </div>
                <span className="text-[13px] sm:text-sm font-medium text-theme-secondary">Overdue</span>
              </div>
              <p className="text-2xl sm:text-[28px] font-bold text-rose-600 dark:text-rose-400 tracking-tight leading-none">{metrics.overdue_tasks || 0}</p>
            </div>
          </div>

          {/* Teams Progress Section */}
          <div className="bg-theme-surface dark:bg-[#1E1E1E] border border-theme-border/80 dark:border-[#2A2A2A] rounded-xl p-5 space-y-4 shadow-xs dark:shadow-[0_4px_16px_rgba(0,0,0,0.16)]">
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] sm:text-[17px] font-semibold text-theme-main flex items-center gap-2">
                <TrendingUp className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" /> Team Progress
              </h2>
              <Link to="/teams" className="text-xs sm:text-[13px] text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition flex items-center gap-1 group hover:underline">
                <span>View All Teams</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {data?.team_progress?.map((tp) => (
                <div key={tp.id} className="p-3.5 sm:p-4 rounded-xl bg-[#FCFDFF] dark:bg-[#202226] border border-theme-border/70 dark:border-[#30343A] space-y-2 hover:border-blue-500/30 dark:hover:border-blue-500/40 transition-all shadow-2xs">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-[14px] font-semibold text-theme-main truncate">{tp.name}</h3>
                    <span className="text-[13px] font-bold text-blue-600 dark:text-blue-400 shrink-0">
                      {tp.progress_percentage}%
                    </span>
                  </div>

                  <p className="text-[12px] text-theme-secondary font-medium -mt-0.5">
                    {tp.lead_name}
                  </p>

                  <div className="flex items-center justify-between text-[12px] text-theme-muted pt-0.5">
                    <span>{tp.member_count} members &bull; {tp.project_count} projects</span>
                    <span className="text-theme-secondary font-medium">{tp.completed_count}/{tp.task_count} done</span>
                  </div>

                  {/* Refined Thin Progress Bar */}
                  <div className="w-full bg-blue-50 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-600 dark:bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${tp.progress_percentage}%` }}
                    />
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
            <div className="bg-theme-surface dark:bg-[#1E1E1E] border border-theme-border/80 dark:border-[#2B2B2B] dark:hover:border-[#3A3A3A] rounded-xl p-[18px] sm:p-5 flex flex-col justify-between space-y-3.5 shadow-xs dark:shadow-[0_2px_10px_rgba(0,0,0,0.18)] hover:-translate-y-0.5 hover:shadow-sm hover:border-blue-500/30 transition-all duration-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shrink-0">
                  <Users className="w-4.5 h-4.5" />
                </div>
                <span className="text-[13px] sm:text-sm font-medium text-theme-secondary">Teams Managed</span>
              </div>
              <p className="text-2xl sm:text-[28px] font-bold text-theme-main tracking-tight leading-none">{metrics.teams_managed || 0}</p>
            </div>

            <div className="bg-theme-surface dark:bg-[#1E1E1E] border border-theme-border/80 dark:border-[#2B2B2B] dark:hover:border-[#3A3A3A] rounded-xl p-[18px] sm:p-5 flex flex-col justify-between space-y-3.5 shadow-xs dark:shadow-[0_2px_10px_rgba(0,0,0,0.18)] hover:-translate-y-0.5 hover:shadow-sm hover:border-blue-500/30 transition-all duration-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shrink-0">
                  <FolderKanban className="w-4.5 h-4.5" />
                </div>
                <span className="text-[13px] sm:text-sm font-medium text-theme-secondary">Assigned Projects</span>
              </div>
              <p className="text-2xl sm:text-[28px] font-bold text-theme-main tracking-tight leading-none">{metrics.assigned_projects || 0}</p>
            </div>

            <div className="bg-theme-surface dark:bg-[#1E1E1E] border border-theme-border/80 dark:border-[#2B2B2B] dark:hover:border-[#3A3A3A] rounded-xl p-[18px] sm:p-5 flex flex-col justify-between space-y-3.5 shadow-xs dark:shadow-[0_2px_10px_rgba(0,0,0,0.18)] hover:-translate-y-0.5 hover:shadow-sm hover:border-emerald-500/30 transition-all duration-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <UserCheck className="w-4.5 h-4.5" />
                </div>
                <span className="text-[13px] sm:text-sm font-medium text-theme-secondary">Team Members</span>
              </div>
              <p className="text-2xl sm:text-[28px] font-bold text-theme-main tracking-tight leading-none">{metrics.team_members || 0}</p>
            </div>

            <div className="bg-theme-surface dark:bg-[#1E1E1E] border border-theme-border/80 dark:border-[#2B2B2B] dark:hover:border-[#3A3A3A] rounded-xl p-[18px] sm:p-5 flex flex-col justify-between space-y-3.5 shadow-xs dark:shadow-[0_2px_10px_rgba(0,0,0,0.18)] hover:-translate-y-0.5 hover:shadow-sm hover:border-rose-500/30 transition-all duration-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 shrink-0">
                  <AlertTriangle className="w-4.5 h-4.5" />
                </div>
                <span className="text-[13px] sm:text-sm font-medium text-theme-secondary">Overdue Tasks</span>
              </div>
              <p className="text-2xl sm:text-[28px] font-bold text-rose-600 dark:text-rose-400 tracking-tight leading-none">{metrics.overdue_tasks || 0}</p>
            </div>
          </div>

          {/* Member Workload Progress */}
          <div className="bg-theme-surface dark:bg-[#1E1E1E] border border-theme-border/80 dark:border-[#2A2A2A] rounded-xl p-5 space-y-4 shadow-xs dark:shadow-[0_4px_16px_rgba(0,0,0,0.16)]">
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] sm:text-[17px] font-semibold text-theme-main flex items-center gap-2">
                <Users className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" /> Member Workload
              </h2>
              <Link to="/analytics" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                <span>View Analytics</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {data?.member_progress?.map((mp) => (
                <div key={mp.id} className="p-3.5 sm:p-4 rounded-xl bg-[#FCFDFF] dark:bg-[#202226] border border-theme-border/70 dark:border-[#30343A] space-y-2 hover:border-blue-500/30 dark:hover:border-blue-500/40 transition-all shadow-2xs">
                  <div className="flex items-center gap-3">
                    {mp.avatar_url ? (
                      <img src={mp.avatar_url} alt={mp.full_name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs border border-blue-100 dark:border-blue-900 shrink-0">
                        {mp.full_name.charAt(0)}
                      </div>
                    )}
                    <div className="overflow-hidden min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="text-[14px] font-semibold text-theme-main truncate">{mp.full_name}</h3>
                        <span className="text-[13px] font-bold text-blue-600 dark:text-blue-400 shrink-0">{mp.progress_percentage}%</span>
                      </div>
                      <p className="text-[11px] text-theme-muted truncate">{mp.email}</p>
                    </div>
                  </div>

                  <div className="flex justify-between text-[12px] text-theme-muted pt-0.5">
                    <span>Tasks: <span className="font-medium text-theme-secondary">{mp.completed_tasks} / {mp.total_tasks}</span></span>
                  </div>

                  <div className="w-full bg-blue-50 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-600 dark:bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${mp.progress_percentage}%` }}
                    />
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
          {/* Quick Social & Team Action Metric Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
            <Link to="/connections" className="bg-theme-surface dark:bg-[#1E1E1E] border border-theme-border/80 dark:border-[#2B2B2B] dark:hover:border-[#3A3A3A] rounded-xl p-[18px] sm:p-5 flex flex-col justify-between space-y-3.5 shadow-xs dark:shadow-[0_2px_10px_rgba(0,0,0,0.18)] hover:-translate-y-0.5 hover:shadow-sm hover:border-blue-500/30 transition-all duration-200 group">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shrink-0">
                  <UserPlus className="w-4.5 h-4.5" />
                </div>
                <span className="text-[13px] sm:text-sm font-medium text-theme-secondary group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Friend Requests</span>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl sm:text-[28px] font-bold text-theme-main tracking-tight leading-none">{metrics.pending_friend_requests || 0}</p>
                <span className="text-[10px] text-theme-muted uppercase font-semibold">pending</span>
              </div>
            </Link>

            <Link to="/invitations" className="bg-theme-surface dark:bg-[#1E1E1E] border border-theme-border/80 dark:border-[#2B2B2B] dark:hover:border-[#3A3A3A] rounded-xl p-[18px] sm:p-5 flex flex-col justify-between space-y-3.5 shadow-xs dark:shadow-[0_2px_10px_rgba(0,0,0,0.18)] hover:-translate-y-0.5 hover:shadow-sm hover:border-blue-500/30 transition-all duration-200 group">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shrink-0">
                  <Mail className="w-4.5 h-4.5" />
                </div>
                <span className="text-[13px] sm:text-sm font-medium text-theme-secondary group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Team Invites</span>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl sm:text-[28px] font-bold text-theme-main tracking-tight leading-none">{metrics.pending_team_invitations || 0}</p>
                <span className="text-[10px] text-theme-muted uppercase font-semibold">pending</span>
              </div>
            </Link>

            <Link to="/teams" className="bg-theme-surface dark:bg-[#1E1E1E] border border-theme-border/80 dark:border-[#2B2B2B] dark:hover:border-[#3A3A3A] rounded-xl p-[18px] sm:p-5 flex flex-col justify-between space-y-3.5 shadow-xs dark:shadow-[0_2px_10px_rgba(0,0,0,0.18)] hover:-translate-y-0.5 hover:shadow-sm hover:border-blue-500/30 transition-all duration-200 group">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Users className="w-4.5 h-4.5" />
                </div>
                <span className="text-[13px] sm:text-sm font-medium text-theme-secondary group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">My Teams</span>
              </div>
              <p className="text-2xl sm:text-[28px] font-bold text-theme-main tracking-tight leading-none">{metrics.my_teams || metrics.total_teams || 0}</p>
            </Link>

            <Link to="/my-tasks" className="bg-theme-surface dark:bg-[#1E1E1E] border border-theme-border/80 dark:border-[#2B2B2B] dark:hover:border-[#3A3A3A] rounded-xl p-[18px] sm:p-5 flex flex-col justify-between space-y-3.5 shadow-xs dark:shadow-[0_2px_10px_rgba(0,0,0,0.18)] hover:-translate-y-0.5 hover:shadow-sm hover:border-blue-500/30 transition-all duration-200 group">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 shrink-0">
                  <CheckSquare className="w-4.5 h-4.5" />
                </div>
                <span className="text-[13px] sm:text-sm font-medium text-theme-secondary group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Active Tasks</span>
              </div>
              <p className="text-2xl sm:text-[28px] font-bold text-theme-main tracking-tight leading-none">{(metrics.todo_tasks || 0) + (metrics.in_progress_tasks || 0)}</p>
            </Link>
          </div>

          {/* Task Status Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-theme-surface dark:bg-[#1E1E1E] border border-theme-border/70 dark:border-[#2B2B2B] rounded-xl p-3.5 space-y-1 shadow-2xs">
              <span className="text-[11px] font-semibold text-theme-muted uppercase tracking-wider">To Do</span>
              <p className="text-xl font-bold text-theme-main">{metrics.todo_tasks || 0}</p>
            </div>
            <div className="bg-theme-surface dark:bg-[#1E1E1E] border border-theme-border/70 dark:border-[#2B2B2B] rounded-xl p-3.5 space-y-1 shadow-2xs">
              <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">In Progress</span>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{metrics.in_progress_tasks || 0}</p>
            </div>
            <div className="bg-theme-surface dark:bg-[#1E1E1E] border border-theme-border/70 dark:border-[#2B2B2B] rounded-xl p-3.5 space-y-1 shadow-2xs">
              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">In Review</span>
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{metrics.review_tasks || 0}</p>
            </div>
            <div className="bg-theme-surface dark:bg-[#1E1E1E] border border-theme-border/70 dark:border-[#2B2B2B] rounded-xl p-3.5 space-y-1 shadow-2xs">
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Completed</span>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{metrics.completed_tasks || 0}</p>
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="bg-theme-surface dark:bg-[#1E1E1E] border border-theme-border/80 dark:border-[#2A2A2A] rounded-xl p-5 space-y-4 shadow-xs dark:shadow-[0_4px_16px_rgba(0,0,0,0.16)]">
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] sm:text-[17px] font-semibold text-theme-main flex items-center gap-2">
                <Clock className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" /> Upcoming Deadlines
              </h2>
              <Link to="/my-tasks" className="text-xs sm:text-[13px] text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition flex items-center gap-1 group hover:underline">
                <span>My Tasks</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            <div className="space-y-2">
              {data?.upcoming_deadlines?.length === 0 ? (
                <p className="text-xs text-theme-muted py-4 text-center">No upcoming deadlines.</p>
              ) : (
                data?.upcoming_deadlines?.map((t) => (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-xl border border-theme-border/70 dark:border-[#30343A] bg-[#FCFDFF] dark:bg-[#202226] flex items-center justify-between text-xs shadow-2xs hover:border-blue-500/30 dark:hover:border-blue-500/40 transition-all"
                  >
                    <div className="space-y-0.5">
                      <h3 className="font-semibold text-theme-main text-[13px]">{t.title}</h3>
                      <p className="text-[11px] text-theme-muted">Project: <span className="font-medium text-theme-secondary">{t.project_name}</span></p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${
                        t.is_overdue
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                          : 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900'
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

      {/* --- RECENT ACTIVITY WIDGET (ALL ROLES) --- */}
      <div className="bg-theme-surface dark:bg-[#1E1E1E] border border-theme-border/80 dark:border-[#2A2A2A] rounded-xl p-5 space-y-4 shadow-xs dark:shadow-[0_4px_16px_rgba(0,0,0,0.16)]">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] sm:text-[17px] font-semibold text-theme-main flex items-center gap-2">
            <ActivityIcon className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" /> Recent Workspace Activity
          </h2>
          <Link to="/activity" className="text-xs sm:text-[13px] text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition flex items-center gap-1 group hover:underline">
            <span>View All Activity</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <ActivityTimeline activities={recentActivities} loading={activitiesLoading} emptyMessage="No recent activity logged in your workspace." />
      </div>
    </div>
  );

};




