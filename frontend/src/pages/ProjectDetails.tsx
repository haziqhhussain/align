import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { projectService } from '../services/projectService';
import { taskService } from '../services/taskService';
import type { Project, Task } from '../types';
import { ArrowLeft, CheckSquare, Plus, Calendar } from 'lucide-react';
import { formatDate, getStatusBadgeColor, getPriorityBadgeColor } from '../utils/format';

export const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);
  const { showToast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const fetchProjectAndTasks = async () => {
    try {
      const [pData, tData] = await Promise.all([
        projectService.getProject(projectId),
        taskService.getTasks({ project_id: projectId }),
      ]);
      setProject(pData);
      setTasks(tData);
    } catch (err: any) {
      showToast(err.message || 'Error fetching project details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) fetchProjectAndTasks();
  }, [projectId]);

  if (loading || !project) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-theme-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const filteredTasks = statusFilter === 'ALL' ? tasks : tasks.filter((t) => t.status === statusFilter);

  return (
    <div className="space-y-6">
      <div>
        <Link to="/projects" className="inline-flex items-center gap-1 text-xs text-theme-muted hover:text-theme-main transition">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Projects
        </Link>
      </div>

      {/* Banner */}
      <div className="saas-panel p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-theme-border pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-theme-accent text-theme-main border border-theme-border">
                Team: {project.team?.name}
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
            <div className="w-full bg-theme-accent/40 rounded-full h-1.5 overflow-hidden">
              <div className="bg-theme-primary h-1.5 rounded-full" style={{ width: `${project.progress_percentage}%` }} />
            </div>
            <span className="text-[10px] text-theme-muted block text-right">
              {project.completed_task_count} / {project.task_count} tasks done
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-theme-muted">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> Start: {formatDate(project.start_date)} &bull; Due: {formatDate(project.due_date)}
          </span>
          <Link
            to={`/tasks?project_id=${project.id}`}
            className="px-3 py-1.5 rounded-lg bg-theme-primary hover:bg-theme-secondary text-white font-medium text-xs transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Add Task
          </Link>
        </div>
      </div>

      {/* Task List Section */}
      <div className="saas-panel p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-sm font-bold text-theme-main flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-theme-primary" /> Project Tasks ({filteredTasks.length})
          </h2>

          {/* Status Filter Tabs */}
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
                    className="px-2.5 py-1.5 rounded bg-theme-accent/40 hover:bg-theme-accent/80 text-theme-main font-medium text-xs transition border border-theme-border"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

