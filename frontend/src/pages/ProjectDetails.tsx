import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { projectService } from '../services/projectService';
import { taskService } from '../services/taskService';
import { activityService } from '../services/activityService';
import type { Project, Task, ActivityLog } from '../types';
import { ArrowLeft, CheckSquare, Plus, Calendar, Activity as ActivityIcon } from 'lucide-react';
import { ActivityTimeline } from '../components/common/ActivityTimeline';
import { AttachmentList } from '../components/attachments/AttachmentList';
import { formatDate, getStatusBadgeColor, getPriorityBadgeColor } from '../utils/format';

export const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);
  const { showToast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectActivities, setProjectActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const fetchProjectAndTasks = async () => {
    try {
      const [pData, tData, actData] = await Promise.all([
        projectService.getProject(projectId),
        taskService.getTasks({ project_id: projectId }),
        activityService.getProjectActivity(projectId)
      ]);
      setProject(pData);
      setTasks(tData);
      setProjectActivities(Array.isArray(actData) ? actData : []);
    } catch (err: any) {
      showToast(err.message || 'Error fetching project details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) fetchProjectAndTasks();
  }, [projectId]);

  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'members' | 'activity' | 'settings'>('overview');

  // Edit project state
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (project) {
      setEditName(project.name);
      setEditDescription(project.description || '');
      setEditStatus(project.status || 'Active');
    }
  }, [project]);

  const handleSaveProjectSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    setSavingSettings(true);
    try {
      const updated = await projectService.updateProject(projectId, {
        name: editName.trim(),
        description: editDescription.trim(),
        status: editStatus,
      });
      setProject(updated);
      showToast('Project updated successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update project', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading || !project) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-theme-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const filteredTasks = statusFilter === 'ALL' ? tasks : tasks.filter((t) => t.status === statusFilter);

  const tabItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'tasks', label: 'Tasks', badge: tasks.length },
    { id: 'members', label: 'Contributors', badge: project.team?.members?.length ?? 0 },
    { id: 'files', label: 'Files' },
    { id: 'activity', label: 'Activity' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link to="/projects" className="inline-flex items-center gap-1 text-xs text-theme-muted hover:text-theme-main font-medium transition">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Projects
        </Link>
      </div>

      {/* Project Banner Header */}
      <div className="saas-panel p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-theme-surface-active text-theme-primary border border-theme-border">
                Team: {project.team?.name || 'Unassigned'}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-theme-primary/10 text-theme-primary border border-theme-primary/20">
                {project.status}
              </span>
            </div>
            <h1 className="text-xl font-bold text-theme-main">{project.name}</h1>
            <p className="text-xs text-theme-muted mt-0.5 max-w-2xl leading-relaxed">{project.description}</p>
          </div>

          <div className="p-3 rounded-lg bg-theme-bg border border-theme-border space-y-1.5 min-w-[180px]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-theme-muted">Completion</span>
              <span className="font-bold text-theme-primary">{project.progress_percentage}%</span>
            </div>
            <div className="w-full bg-theme-border rounded-full h-1.5 overflow-hidden">
              <div className="bg-theme-primary h-1.5 rounded-full" style={{ width: `${project.progress_percentage}%` }} />
            </div>
            <span className="text-[10px] text-theme-muted block text-right">
              {project.completed_task_count} / {project.task_count} tasks done
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="pt-2 border-t border-theme-border flex items-center justify-between">
          <div className="flex items-center gap-6 border-b border-theme-border w-full">
            {tabItems.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-2.5 text-xs font-bold whitespace-nowrap flex items-center gap-2 relative transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'text-theme-primary border-b-2 border-theme-primary -mb-px'
                    : 'text-theme-muted hover:text-theme-main'
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-theme-bg border border-theme-border text-theme-muted">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="saas-card p-4 space-y-1">
              <span className="text-[11px] text-theme-muted font-medium uppercase">Total Tasks</span>
              <p className="text-xl font-bold text-theme-main">{project.task_count ?? tasks.length}</p>
            </div>
            <div className="saas-card p-4 space-y-1">
              <span className="text-[11px] text-theme-muted font-medium uppercase">Completed Tasks</span>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{project.completed_task_count ?? 0}</p>
            </div>
            <div className="saas-card p-4 space-y-1">
              <span className="text-[11px] text-theme-muted font-medium uppercase">Start / Due Date</span>
              <p className="text-xs font-bold text-theme-main">{formatDate(project.start_date)} &bull; {formatDate(project.due_date)}</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TASKS */}
      {activeTab === 'tasks' && (
        <div className="saas-panel p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-sm font-bold text-theme-main flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-theme-primary" /> Project Tasks ({filteredTasks.length})
            </h2>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {['ALL', 'To Do', 'In Progress', 'Review', 'Completed'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition ${
                      statusFilter === st
                        ? 'bg-theme-primary text-white'
                        : 'bg-theme-bg text-theme-muted hover:text-theme-main border border-theme-border'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <Link
                to={`/tasks?project_id=${project.id}`}
                className="px-3 py-1.5 rounded-lg bg-theme-primary hover:bg-theme-primary-hover text-white font-medium text-xs transition flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Add Task
              </Link>
            </div>
          </div>

          <div className="space-y-2">
            {filteredTasks.length === 0 ? (
              <p className="text-xs text-theme-muted text-center py-6">No tasks matching the selected filter.</p>
            ) : (
              filteredTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-lg border border-theme-border bg-theme-bg flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getStatusBadgeColor(t.status)}`}>
                        {t.status}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getPriorityBadgeColor(t.priority)}`}>
                        {t.priority}
                      </span>
                      {t.is_overdue && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/30">
                          OVERDUE
                        </span>
                      )}
                    </div>
                    <h3 className="text-xs font-bold text-theme-main">{t.title}</h3>
                    <p className="text-xs text-theme-muted line-clamp-1">{t.description}</p>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-theme-muted shrink-0">
                    <div className="text-right">
                      <span className="block text-theme-main font-medium text-[11px]">
                        {t.assigned_to?.full_name || 'Unassigned'}
                      </span>
                      <span className="block text-[10px] text-theme-muted">Due {formatDate(t.due_date)}</span>
                    </div>
                    <Link
                      to={`/tasks?id=${t.id}`}
                      className="px-2.5 py-1.5 rounded bg-theme-surface hover:bg-theme-surface-active text-theme-main font-medium text-xs transition border border-theme-border"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: MEMBERS / CONTRIBUTORS */}
      {activeTab === 'members' && (
        <div className="saas-panel p-5 space-y-4">
          <h2 className="text-sm font-bold text-theme-main">Project Contributors ({project.team?.members?.length ?? 0})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {(project.team?.members ?? []).map((m) => (
              <div key={m.id} className="p-3 rounded-lg bg-theme-bg border border-theme-border flex items-center justify-between">
                <Link to={`/users/${m.user_id}`} className="flex items-center gap-2.5 group overflow-hidden">
                  {m.user?.avatar_url ? (
                    <img src={m.user.avatar_url} alt={m.user.full_name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-theme-primary text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {m.user?.full_name?.charAt(0) ?? 'U'}
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <span className="text-xs font-bold text-theme-main truncate block group-hover:text-theme-primary transition">{m.user?.full_name}</span>
                    <span className="text-[10px] text-theme-muted truncate block">{m.user?.email}</span>
                  </div>
                </Link>
                <Link
                  to={`/users/${m.user_id}`}
                  className="px-2 py-1 rounded bg-theme-surface border border-theme-border text-theme-main text-[11px] font-medium"
                >
                  Profile
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: FILES */}
      {activeTab === 'files' && (
        <div className="saas-panel p-5 space-y-4">
          <AttachmentList projectId={project.id} />
        </div>
      )}

      {/* TAB 5: ACTIVITY */}
      {activeTab === 'activity' && (
        <div className="saas-panel p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-theme-main flex items-center gap-2">
              <ActivityIcon className="w-4 h-4 text-amber-500" /> Project Activity Log
            </h2>
            <Link to={`/activity?project_id=${project.id}`} className="text-xs font-semibold text-theme-primary hover:underline">
              View All
            </Link>
          </div>

          <ActivityTimeline activities={projectActivities} emptyMessage="No activity recorded for this project yet." />
        </div>
      )}

      {/* TAB 5: SETTINGS */}
      {activeTab === 'settings' && (
        <div className="saas-panel p-6 space-y-6 max-w-2xl">
          <h2 className="text-base font-bold text-theme-main">Project Settings</h2>

          <form onSubmit={handleSaveProjectSettings} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-theme-main">Project Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                className="w-full bg-theme-bg border border-theme-border rounded-lg px-3 py-2 text-xs text-theme-main focus:outline-none focus:border-theme-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-theme-main">Description</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                className="w-full bg-theme-bg border border-theme-border rounded-lg px-3 py-2 text-xs text-theme-main focus:outline-none focus:border-theme-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-theme-main">Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full bg-theme-bg border border-theme-border rounded-lg px-3 py-2 text-xs text-theme-main focus:outline-none focus:border-theme-primary"
              >
                <option value="Active">Active</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="bg-theme-primary hover:bg-theme-primary-hover text-white text-xs font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50"
            >
              {savingSettings ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};


