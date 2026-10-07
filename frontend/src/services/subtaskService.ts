import { api } from './api';
import type { Subtask, SubtaskCreate, SubtaskUpdate, SubtaskReorderItem } from '../types';

export const subtaskService = {
  getSubtasks(taskId: number): Promise<Subtask[]> {
    return api.get<Subtask[]>(`/tasks/${taskId}/subtasks`);
  },

  createSubtask(taskId: number, data: SubtaskCreate): Promise<Subtask> {
    return api.post<Subtask>(`/tasks/${taskId}/subtasks`, data);
  },

  updateSubtask(subtaskId: number, data: SubtaskUpdate): Promise<Subtask> {
    return api.patch<Subtask>(`/subtasks/${subtaskId}`, data);
  },

  toggleSubtask(subtaskId: number): Promise<Subtask> {
    return api.patch<Subtask>(`/subtasks/${subtaskId}/toggle`, {});
  },

  assignSubtask(subtaskId: number, assigned_to_id: number | null): Promise<Subtask> {
    return api.patch<Subtask>(`/subtasks/${subtaskId}/assign`, { assigned_to_id });
  },

  deleteSubtask(subtaskId: number): Promise<void> {
    return api.delete(`/subtasks/${subtaskId}`);
  },

  reorderSubtasks(taskId: number, items: SubtaskReorderItem[]): Promise<Subtask[]> {
    return api.patch<Subtask[]>(`/tasks/${taskId}/subtasks/reorder`, { items });
  }
};
