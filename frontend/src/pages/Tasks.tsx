import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { taskService } from '../services/taskService';
import { projectService } from '../services/projectService';
import { userService } from '../services/userService';
import { activityService } from '../services/activityService';
import type { Task, Project, User, TaskPriority, TaskStatus, TaskComment, ActivityLog } from '../types';
import { ActivityTimeline } from '../components/common/ActivityTimeline';
import { SubtaskList } from '../components/subtasks/SubtaskList';
import { SubtaskProgress } from '../components/subtasks/SubtaskProgress';
import { AttachmentList } from '../components/attachments/AttachmentList';
import {
  CheckSquare,
  Plus,
  Search,
  Calendar,
  MessageSquare,
  Edit2,
  Trash2,
  X,
  Send,
  History,
  Activity as ActivityIcon,
  ListChecks
} from 'lucide-react';
import { formatDate, formatDateTime, getStatusBadgeColor, getPriorityBadgeColor } from '../utils/format';

export const Tasks: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialProjectId = searchParams.get('project_id') ? Number(searchParams.get('project_id')) : undefined;
  const initialTaskId = searchParams.get('id') ? Number(searchParams.get('id')) : undefined;

  const { user, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [projectFilter, setProjectFilter] = useState<number | ''>(initialProjectId || '');
  const [memberFilter, setMemberFilter] = useState<number | ''>('');

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Task Create / Edit Modal
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskForm, setTaskForm] = useState<{
    title: string;
    description: string;
    project_id: number | '';
    assigned_to_id: number | '';
    priority: TaskPriority;
    status: TaskStatus;
    start_date: string;
    due_date: string;
  }>({
    title: '',
    description: '',
    project_id: initialProjectId || '',
    assigned_to_id: '',
    priority: 'Medium',
    status: 'To Do',
    start_date: '',
    due_date: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Task Details & Comment Drawer/Modal
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [taskActivities, setTaskActivities] = useState<ActivityLog[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commenting, setCommenting] = useState(false);

  // Delete State
  const [deletingTaskId, setDeletingTaskId] = useState<number | null>(null);

  const fetchTasks = async () => {
    try {
      const data = await taskService.getTasks({
        search: search || undefined,
        status: statusFilter ? (statusFilter as TaskStatus) : undefined,
        priority: priorityFilter ? (priorityFilter as TaskPriority) : undefined,
        project_id: projectFilter ? Number(projectFilter) : undefined,
        assigned_to_id: memberFilter ? Number(memberFilter) : undefined,
      });
      setTasks(data);

      if (initialTaskId) {
        const found = data.find((t) => t.id === initialTaskId);
        if (found) handleOpenTaskDetails(found);
      }
    } catch (err: any) {
      showToast(err.message || 'Error loading tasks', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [pData, uData] = await Promise.all([projectService.getProjects(), userService.getUsers()]);
      setProjects(pData);
      setUsers(uData);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [search, statusFilter, priorityFilter, projectFilter, memberFilter]);

  const handleOpenCreateModal = () => {
    setEditingTask(null);
    setTaskForm({
      title: '',
      description: '',
      project_id: projects.length > 0 ? projects[0].id : '',
      assigned_to_id: '',
      priority: 'Medium',
      status: 'To Do',
      start_date: '',
      due_date: '',
    });
    setShowTaskModal(true);
  };

  const handleOpenEditModal = (t: Task) => {
    setEditingTask(t);
    setTaskForm({
      title: t.title,
      description: t.description || '',
      project_id: t.project_id,
      assigned_to_id: t.assigned_to_id || '',
      priority: t.priority,
      status: t.status,
      start_date: t.start_date ? t.start_date.substring(0, 10) : '',
      due_date: t.due_date ? t.due_date.substring(0, 10) : '',
    });
    setShowTaskModal(true);
  };

  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title || !taskForm.project_id) {
      showToast('Title and project selection are required', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      if (editingTask) {
        await taskService.updateTask(editingTask.id, {
          title: taskForm.title,
          description: taskForm.description,
          project_id: Number(taskForm.project_id),
          assigned_to_id: taskForm.assigned_to_id !== '' ? Number(taskForm.assigned_to_id) : undefined,
          priority: taskForm.priority,
          status: taskForm.status,
          start_date: taskForm.start_date || undefined,
          due_date: taskForm.due_date || undefined,
        });
        showToast('Task updated successfully', 'success');
      } else {
        await taskService.createTask({
          title: taskForm.title,
          description: taskForm.description,
          project_id: Number(taskForm.project_id),
          assigned_to_id: taskForm.assigned_to_id !== '' ? Number(taskForm.assigned_to_id) : undefined,
          priority: taskForm.priority,
          status: taskForm.status,
          start_date: taskForm.start_date || undefined,
          due_date: taskForm.due_date || undefined,
        });
        showToast('Task created successfully', 'success');
      }
      setShowTaskModal(false);
      fetchTasks();
    } catch (err: any) {
      showToast(err.message || 'Failed to save task', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (taskId: number, newStatus: TaskStatus) => {
    try {
      await taskService.updateTaskStatus(taskId, newStatus);
      showToast(`Task status updated to ${newStatus}`, 'success');
      fetchTasks();
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  const handleDeleteTask = async () => {
    if (!deletingTaskId) return;
    try {
      await taskService.deleteTask(deletingTaskId);
      showToast('Task deleted successfully', 'success');
      setDeletingTaskId(null);
      if (selectedTask?.id === deletingTaskId) setSelectedTask(null);
      fetchTasks();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete task', 'error');
    }
  };

  const handleOpenTaskDetails = async (t: Task) => {
    setSelectedTask(t);
    try {
      const [cList, actList] = await Promise.all([
        taskService.getComments(t.id),
        activityService.getTaskActivity(t.id)
      ]);
      setComments(cList);
      setTaskActivities(Array.isArray(actList) ? actList : []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !newComment.trim()) return;
    setCommenting(true);
    try {
      const added = await taskService.addComment(selectedTask.id, newComment.trim());
      setComments((prev) => [...prev, added]);
      setNewComment('');
      showToast('Comment posted', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to add comment', 'error');
    } finally {
      setCommenting(false);
    }
  };

  // Pagination slicing
  const totalPages = Math.ceil(tasks.length / pageSize) || 1;
  const paginatedTasks = tasks.slice((page - 1) * pageSize, page * pageSize);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-theme-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-theme-main flex items-center gap-2 tracking-tight">
            <CheckSquare className="w-5 h-5 text-theme-primary" /> Tasks
          </h1>
          <p className="text-xs text-theme-muted mt-0.5">Assign tasks, track due dates, discuss progress, and update status</p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-3.5 py-2 rounded-lg bg-theme-primary hover:bg-theme-secondary text-white font-medium text-xs shadow-sm flex items-center gap-1.5 transition"
        >
          <Plus className="w-4 h-4" /> Create Task
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="saas-panel p-3.5 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-theme-muted absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search task title or description..."
            className="w-full bg-theme-bg border border-theme-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-theme-main placeholder-theme-muted/50 focus:outline-none focus:border-theme-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-theme-bg border border-theme-border rounded-lg px-2.5 py-1.5 text-xs text-theme-main focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Review">Review</option>
            <option value="Completed">Completed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-theme-bg border border-theme-border rounded-lg px-2.5 py-1.5 text-xs text-theme-main focus:outline-none"
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>

          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value ? Number(e.target.value) : '')}
            className="bg-theme-bg border border-theme-border rounded-lg px-2.5 py-1.5 text-xs text-theme-main focus:outline-none"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <select
            value={memberFilter}
            onChange={(e) => setMemberFilter(e.target.value ? Number(e.target.value) : '')}
            className="bg-theme-bg border border-theme-border rounded-lg px-2.5 py-1.5 text-xs text-theme-main focus:outline-none"
          >
            <option value="">All Assignees</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.full_name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Task List Cards */}
      <div className="space-y-3">
        {paginatedTasks.length === 0 ? (
          <div className="saas-panel p-10 text-center space-y-2">
            <CheckSquare className="w-8 h-8 text-theme-muted mx-auto" />
            <h3 className="text-xs font-semibold text-theme-main">No tasks found</h3>
            <p className="text-xs text-theme-muted">Try adjusting your search query or filter dropdowns.</p>
          </div>
        ) : (
          paginatedTasks.map((task) => {
            const isLeadOrCreator = task.project?.team?.lead_id === user?.id || task.created_by_id === user?.id || isAdmin;
            return (
              <div
                key={task.id}
                className="saas-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getStatusBadgeColor(task.status)}`}>
                      {task.status}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getPriorityBadgeColor(task.priority)}`}>
                      {task.priority} Priority
                    </span>
                    {task.is_overdue && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/30">
                        OVERDUE
                      </span>
                    )}
                    <span className="text-[11px] text-theme-muted font-medium">
                      Project: {task.project?.name}
                    </span>
                  </div>

                  <h3
                    onClick={() => handleOpenTaskDetails(task)}
                    className="text-sm font-bold text-theme-main hover:text-theme-primary cursor-pointer transition-colors"
                  >
                    {task.title}
                  </h3>
                  <p className="text-xs text-theme-muted line-clamp-1">{task.description}</p>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-theme-muted pt-0.5">
                    <span>Assignee: <strong className="text-theme-main">{task.assigned_to?.full_name || 'Unassigned'}</strong></span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Due {formatDate(task.due_date)}
                    </span>
                    {task.subtask_count && task.subtask_count > 0 ? (
                      <SubtaskProgress
                        completedCount={task.completed_subtask_count || 0}
                        totalCount={task.subtask_count}
                        progressPercentage={task.subtask_progress || 0}
                        compact
                      />
                    ) : null}
                  </div>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-theme-border">
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                    className="bg-theme-bg border border-theme-border rounded px-2.5 py-1 text-xs text-theme-main font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Review">Review</option>
                    <option value="Completed">Completed</option>
                  </select>

                  <button
                    onClick={() => handleOpenTaskDetails(task)}
                    className="p-1.5 rounded bg-theme-bg border border-theme-border hover:bg-theme-accent/30 text-theme-main transition relative"
                    title="Comments & Discussion"
                  >
                    <MessageSquare className="w-4 h-4" />
                    {task.comments && task.comments.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-theme-primary text-white font-bold rounded-full w-3.5 h-3.5 text-[9px] flex items-center justify-center">
                        {task.comments.length}
                      </span>
                    )}
                  </button>

                  {isLeadOrCreator && (
                    <>
                      <button
                        onClick={() => handleOpenEditModal(task)}
                        className="p-1.5 rounded bg-theme-bg border border-theme-border hover:bg-theme-accent/30 text-theme-main transition"
                        title="Edit Task"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingTaskId(task.id)}
                        className="p-1.5 rounded bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-500 transition"
                        title="Delete Task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-theme-muted">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1 rounded bg-theme-bg border border-theme-border text-xs font-medium text-theme-main disabled:opacity-40"
            >
              Previous
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 rounded bg-theme-bg border border-theme-border text-xs font-medium text-theme-main disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create / Edit Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="saas-panel w-full max-w-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-theme-border pb-3">
              <h2 className="text-sm font-bold text-theme-main">
                {editingTask ? 'Edit Task Details' : 'Create New Task'}
              </h2>
              <button onClick={() => setShowTaskModal(false)} className="text-theme-muted hover:text-theme-main p-1 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitTask} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-theme-main mb-1">Task Title</label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="e.g. Implement JWT verification in FastAPI"
                  className="w-full bg-theme-bg border border-theme-border rounded-lg px-3 py-1.5 text-xs text-theme-main focus:outline-none focus:border-theme-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-theme-main mb-1">Target Project</label>
                  <select
                    value={taskForm.project_id}
                    onChange={(e) => setTaskForm({ ...taskForm, project_id: Number(e.target.value) })}
                    className="w-full bg-theme-bg border border-theme-border rounded-lg px-3 py-1.5 text-xs text-theme-main focus:outline-none focus:border-theme-primary"
                    required
                  >
                    <option value="">-- Select Project --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-theme-main mb-1">Assign Member</label>
                  <select
                    value={taskForm.assigned_to_id}
                    onChange={(e) => setTaskForm({ ...taskForm, assigned_to_id: e.target.value ? Number(e.target.value) : '' })}
                    className="w-full bg-theme-bg border border-theme-border rounded-lg px-3 py-1.5 text-xs text-theme-main focus:outline-none focus:border-theme-primary"
                  >
                    <option value="">-- Unassigned --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.full_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-theme-main mb-1">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as TaskPriority })}
                    className="w-full bg-theme-bg border border-theme-border rounded-lg px-3 py-1.5 text-xs text-theme-main focus:outline-none focus:border-theme-primary"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-theme-main mb-1">Status</label>
                  <select
                    value={taskForm.status}
                    onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value as TaskStatus })}
                    className="w-full bg-theme-bg border border-theme-border rounded-lg px-3 py-1.5 text-xs text-theme-main focus:outline-none focus:border-theme-primary"
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Review">Review</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-theme-main mb-1">Description</label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  placeholder="Task requirements and details"
                  className="w-full bg-theme-bg border border-theme-border rounded-lg px-3 py-1.5 text-xs text-theme-main focus:outline-none focus:border-theme-primary h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-theme-main mb-1">Start Date</label>
                  <input
                    type="date"
                    value={taskForm.start_date}
                    onChange={(e) => setTaskForm({ ...taskForm, start_date: e.target.value })}
                    className="w-full bg-theme-bg border border-theme-border rounded-lg px-3 py-1.5 text-xs text-theme-main focus:outline-none focus:border-theme-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-theme-main mb-1">Due Date</label>
                  <input
                    type="date"
                    value={taskForm.due_date}
                    onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                    className="w-full bg-theme-bg border border-theme-border rounded-lg px-3 py-1.5 text-xs text-theme-main focus:outline-none focus:border-theme-primary"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-theme-border">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-theme-muted border border-theme-border transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-theme-primary hover:bg-theme-secondary text-white transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingTask ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Details & Discussion Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="saas-panel w-full max-w-2xl p-5 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between border-b border-theme-border pb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getStatusBadgeColor(selectedTask.status)}`}>
                    {selectedTask.status}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getPriorityBadgeColor(selectedTask.priority)}`}>
                    {selectedTask.priority}
                  </span>
                </div>
                <h2 className="text-base font-bold text-theme-main">{selectedTask.title}</h2>
                <p className="text-xs text-theme-muted">Project: {selectedTask.project?.name}</p>
              </div>
              <button onClick={() => setSelectedTask(null)} className="text-theme-muted hover:text-theme-main p-1 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs overflow-y-auto pr-1">
              <div className="p-3 rounded-lg bg-theme-bg border border-theme-border text-theme-main leading-relaxed">
                {selectedTask.description || 'No detailed description provided.'}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-theme-muted">
                <div>Assigned To: <strong className="text-theme-main">{selectedTask.assigned_to?.full_name || 'Unassigned'}</strong></div>
                <div>Created By: <strong className="text-theme-main">{selectedTask.created_by?.full_name || 'Admin'}</strong></div>
                <div>Start Date: <strong className="text-theme-main">{formatDate(selectedTask.start_date)}</strong></div>
                <div>Due Date: <strong className="text-theme-main">{formatDate(selectedTask.due_date)}</strong></div>
              </div>

              {/* Subtasks / Checklist Section */}
              <SubtaskList
                taskId={selectedTask.id}
                teamUsers={users}
                parentTaskStatus={selectedTask.status}
                onSubtaskChange={() => {
                  fetchTasks();
                  fetchTaskActivities(selectedTask.id);
                }}
                onCompleteParentTask={async () => {
                  try {
                    await taskService.updateTaskStatus(selectedTask.id, 'Completed');
                    setSelectedTask({ ...selectedTask, status: 'Completed' });
                    fetchTasks();
                    showToast('Parent task marked as Completed', 'success');
                  } catch (err: any) {
                    showToast(err.message || 'Failed to update task status', 'error');
                  }
                }}
              />

              {/* Attachments Section */}
              <div className="border-t border-theme-border pt-3">
                <AttachmentList
                  taskId={selectedTask.id}
                  onAttachmentChange={() => fetchTaskActivities(selectedTask.id)}
                />
              </div>

              <div className="border-t border-theme-border pt-3 space-y-3">
                <h3 className="text-xs font-bold text-theme-main flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-theme-primary" /> Discussion Thread ({comments.length})
                </h3>

                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {comments.length === 0 ? (
                    <p className="text-[11px] text-theme-muted text-center py-3">No comments yet.</p>
                  ) : (
                    comments.map((c) => (
                      <div key={c.id} className="p-2.5 rounded-lg bg-theme-bg border border-theme-border space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-theme-main">{c.user?.full_name}</span>
                          <span className="text-[10px] text-theme-muted">{formatDateTime(c.created_at)}</span>
                        </div>
                        <p className="text-xs text-theme-main">{c.content}</p>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleAddComment} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 bg-theme-bg border border-theme-border rounded-lg px-3 py-1.5 text-xs text-theme-main focus:outline-none focus:border-theme-primary"
                  />
                  <button
                    type="submit"
                    disabled={commenting || !newComment.trim()}
                    className="px-3 py-1.5 rounded-lg bg-theme-primary hover:bg-theme-secondary text-white font-medium text-xs transition disabled:opacity-50 flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" /> Post
                  </button>
                </form>
              </div>

              {/* Task History Section */}
              <div className="border-t border-theme-border pt-3 space-y-3">
                <h3 className="text-xs font-bold text-theme-main flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-emerald-500" /> Task History & Activity
                </h3>
                <div className="max-h-56 overflow-y-auto pr-1">
                  <ActivityTimeline activities={taskActivities} emptyMessage="No history logged for this task yet." compact />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingTaskId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="saas-panel w-full max-w-sm p-5 space-y-3 text-center border-rose-500/30">
            <h3 className="text-sm font-bold text-theme-main">Delete Task?</h3>
            <p className="text-xs text-theme-muted">
              Are you sure you want to delete this task?
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeletingTaskId(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-theme-muted border border-theme-border transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTask}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

