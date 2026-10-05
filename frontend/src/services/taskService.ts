import { api } from './api';
import type { Task, TaskPriority, TaskStatus, TaskComment } from '../types';

export interface TaskFilterParams {
  project_id?: number;
  assigned_to_id?: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  search?: string;
  my_tasks_only?: boolean;
}

export interface CreateTaskParams {
  title: string;
  description?: string;
  project_id: number;
  assigned_to_id?: number;
  priority?: TaskPriority;
  status?: TaskStatus;
  start_date?: string;
  due_date?: string;
}

export interface UpdateTaskParams {
  title?: string;
  description?: string;
  project_id?: number;
  assigned_to_id?: number;
  priority?: TaskPriority;
  status?: TaskStatus;
  start_date?: string;
  due_date?: string;
}

export const taskService = {
  getTasks(params: TaskFilterParams = {}): Promise<Task[]> {
    const searchParams = new URLSearchParams();
    if (params.project_id) searchParams.append('project_id', params.project_id.toString());
    if (params.assigned_to_id) searchParams.append('assigned_to_id', params.assigned_to_id.toString());
    if (params.status) searchParams.append('status', params.status);
    if (params.priority) searchParams.append('priority', params.priority);
    if (params.search) searchParams.append('search', params.search);
    if (params.my_tasks_only) searchParams.append('my_tasks_only', 'true');

    const query = searchParams.toString();
    return api.get<Task[]>(`/tasks${query ? `?${query}` : ''}`);
  },

  getTask(id: number): Promise<Task> {
    return api.get<Task>(`/tasks/${id}`);
  },

  createTask(data: CreateTaskParams): Promise<Task> {
    return api.post<Task>('/tasks', data);
  },

  updateTask(id: number, data: UpdateTaskParams): Promise<Task> {
    return api.put<Task>(`/tasks/${id}`, data);
  },

  updateTaskStatus(id: number, status: TaskStatus): Promise<Task> {
    return api.patch<Task>(`/tasks/${id}/status`, { status });
  },

  deleteTask(id: number): Promise<void> {
    return api.delete(`/tasks/${id}`);
  },

  // Comments
  getComments(taskId: number): Promise<TaskComment[]> {
    return api.get<TaskComment[]>(`/tasks/${taskId}/comments`);
  },

  addComment(taskId: number, content: string): Promise<TaskComment> {
    return api.post<TaskComment>(`/tasks/${taskId}/comments`, { content });
  },

  updateComment(commentId: number, content: string): Promise<TaskComment> {
    return api.put<TaskComment>(`/comments/${commentId}`, { content });
  },

  deleteComment(commentId: number): Promise<void> {
    return api.delete(`/comments/${commentId}`);
  }
};
