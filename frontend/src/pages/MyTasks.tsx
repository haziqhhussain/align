import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { taskService } from '../services/taskService';
import type { Task, TaskStatus } from '../types';
import { ListTodo, Calendar, AlertTriangle, CheckCircle2, Clock, PlayCircle } from 'lucide-react';
import { formatDate, getPriorityBadgeColor } from '../utils/format';
import { SubtaskProgress } from '../components/subtasks/SubtaskProgress';

export const MyTasks: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyTasks = async () => {
    try {
      const data = await taskService.getTasks({ my_tasks_only: true });
      setTasks(data);
    } catch (err: any) {
      showToast(err.message || 'Error loading assigned tasks', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTasks();
  }, []);

  const handleStatusUpdate = async (taskId: number, newStatus: TaskStatus) => {
    try {
      await taskService.updateTaskStatus(taskId, newStatus);
      showToast(`Task status updated to ${newStatus}`, 'success');
      fetchMyTasks();
    } catch (err: any) {
      showToast(err.message || 'Failed to update task status', 'error');
    }
  };

  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-theme-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const sortedTasksByDate = [...tasks].sort((a, b) => {
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  });

  const todoTasks = tasks.filter((t) => t.status === 'To Do');
  const inProgressTasks = tasks.filter((t) => t.status === 'In Progress');
  const reviewTasks = tasks.filter((t) => t.status === 'Review');
  const completedTasks = tasks.filter((t) => t.status === 'Completed');

  const renderColumn = (title: string, columnTasks: Task[], icon: React.ReactNode) => (
    <div className="saas-panel p-4 flex-1 min-w-[260px] space-y-3">
      <div className="flex items-center justify-between border-b border-theme-border pb-2.5">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-xs font-bold text-theme-main">{title}</h2>
        </div>
        <span className="text-xs font-bold px-2 py-0.5 rounded bg-theme-accent/50 text-theme-main border border-theme-border">
          {columnTasks.length}
        </span>
      </div>

      <div className="space-y-2.5 min-h-[220px]">
        {columnTasks.length === 0 ? (
          <p className="text-xs text-theme-muted text-center py-6">No tasks in {title}</p>
        ) : (
          columnTasks.map((t) => (
            <div
              key={t.id}
              className="p-3.5 rounded-lg border border-theme-border bg-theme-bg space-y-2 hover:border-theme-primary transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getPriorityBadgeColor(t.priority)}`}>
                  {t.priority}
                </span>
                {t.is_overdue && (
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/30">
                    OVERDUE
                  </span>
                )}
              </div>

              <h3 className="text-xs font-bold text-theme-main leading-tight">{t.title}</h3>
              <p className="text-[11px] text-theme-muted line-clamp-2">{t.description}</p>

              <div className="text-[10px] text-theme-muted space-y-1 pt-1 border-t border-theme-border">
                <div className="flex justify-between items-center">
                  <span>Assignee: <strong className="text-theme-main">{t.assigned_to?.full_name || 'You'}</strong></span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-theme-muted" /> {formatDate(t.due_date)}
                  </span>
                </div>

                {t.subtask_count && t.subtask_count > 0 ? (
                  <div className="pt-0.5">
                    <SubtaskProgress
                      completedCount={t.completed_subtask_count || 0}
                      totalCount={t.subtask_count}
                      progressPercentage={t.subtask_progress || 0}
                      compact
                    />
                  </div>
                ) : null}

                <select
                  value={t.status}
                  onChange={(e) => handleStatusUpdate(t.id, e.target.value as TaskStatus)}
                  className="w-full bg-theme-bg border border-theme-border rounded px-2 py-1 text-[10px] text-theme-main font-medium focus:outline-none cursor-pointer mt-1"
                >
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Review">Review</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-theme-main flex items-center gap-2 tracking-tight">
            <ListTodo className="w-5 h-5 text-theme-primary" /> My Assigned Tasks
          </h1>
          <p className="text-xs text-theme-muted mt-0.5">Personal productivity dashboard for your assigned work items</p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 p-1 bg-theme-surface border border-theme-border rounded-lg max-w-fit">
          <button
            onClick={() => setViewMode('board')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition ${
              viewMode === 'board' ? 'bg-theme-bg text-theme-primary shadow-xs border border-theme-border' : 'text-theme-muted hover:text-theme-main'
            }`}
          >
            Board
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition ${
              viewMode === 'list' ? 'bg-theme-bg text-theme-primary shadow-xs border border-theme-border' : 'text-theme-muted hover:text-theme-main'
            }`}
          >
            List
          </button>
        </div>
      </div>

      {viewMode === 'board' ? (
        /* Kanban Board Columns */
        <div className="flex flex-col lg:flex-row gap-4 overflow-x-auto pb-4">
          {renderColumn('To Do', todoTasks, <Clock className="w-4 h-4 text-theme-muted" />)}
          {renderColumn('In Progress', inProgressTasks, <PlayCircle className="w-4 h-4 text-theme-primary" />)}
          {renderColumn('In Review', reviewTasks, <AlertTriangle className="w-4 h-4 text-amber-500" />)}
          {renderColumn('Completed', completedTasks, <CheckCircle2 className="w-4 h-4 text-emerald-500" />)}
        </div>
      ) : (
        /* List View */
        <div className="saas-panel p-4 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-theme-border text-theme-muted text-[11px]">
                <th className="py-2.5 px-3 font-semibold">Task Title</th>
                <th className="py-2.5 px-3 font-semibold">Priority</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
                <th className="py-2.5 px-3 font-semibold">Due Date</th>
                <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-border">
              {sortedTasksByDate.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-theme-muted text-xs">
                    No assigned tasks found.
                  </td>
                </tr>
              ) : (
                sortedTasksByDate.map((t) => (
                  <tr key={t.id} className="hover:bg-theme-surface transition-colors">
                    <td className="py-3 px-3">
                      <span className="font-bold text-theme-main block">{t.title}</span>
                      <span className="text-[10px] text-theme-muted line-clamp-1">{t.description}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getPriorityBadgeColor(t.priority)}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <select
                        value={t.status}
                        onChange={(e) => handleStatusUpdate(t.id, e.target.value as TaskStatus)}
                        className="bg-theme-bg border border-theme-border rounded px-2 py-1 text-xs text-theme-main font-medium focus:outline-none cursor-pointer"
                      >
                        <option value="To Do">To Do</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Review">Review</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </td>
                    <td className="py-3 px-3 text-theme-muted">
                      {formatDate(t.due_date)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="text-[10px] font-bold text-theme-primary">
                        {t.is_overdue ? 'OVERDUE' : 'On Track'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};


