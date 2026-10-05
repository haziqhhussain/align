import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { taskService } from '../services/taskService';
import type { Task, TaskStatus } from '../types';
import { ListTodo, Calendar, AlertTriangle, CheckCircle2, Clock, PlayCircle } from 'lucide-react';
import { formatDate, getPriorityBadgeColor } from '../utils/format';

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-theme-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

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
      <div>
        <h1 className="text-xl font-bold text-theme-main flex items-center gap-2 tracking-tight">
          <ListTodo className="w-5 h-5 text-theme-primary" /> My Tasks Kanban
        </h1>
        <p className="text-xs text-theme-muted mt-0.5">Kanban-style workspace for tasks assigned to you</p>
      </div>

      {/* Kanban Board Columns */}
      <div className="flex flex-col lg:flex-row gap-4 overflow-x-auto pb-4">
        {renderColumn('To Do', todoTasks, <Clock className="w-4 h-4 text-theme-muted" />)}
        {renderColumn('In Progress', inProgressTasks, <PlayCircle className="w-4 h-4 text-theme-primary" />)}
        {renderColumn('In Review', reviewTasks, <AlertTriangle className="w-4 h-4 text-amber-500" />)}
        {renderColumn('Completed', completedTasks, <CheckCircle2 className="w-4 h-4 text-emerald-500" />)}
      </div>
    </div>
  );
};

