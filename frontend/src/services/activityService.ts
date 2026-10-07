import { api } from './api';
import type { ActivityFilters, ActivityListResponse, ActivityLog } from '../types';

export const activityService = {
  async getActivity(filters: ActivityFilters = {}): Promise<ActivityListResponse> {
    const params = new URLSearchParams();
    if (filters.team_id) params.append('team_id', filters.team_id.toString());
    if (filters.project_id) params.append('project_id', filters.project_id.toString());
    if (filters.task_id) params.append('task_id', filters.task_id.toString());
    if (filters.actor_id) params.append('actor_id', filters.actor_id.toString());
    if (filters.action_type) params.append('action_type', filters.action_type);
    if (filters.entity_type) params.append('entity_type', filters.entity_type);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const endpoint = `/activity${queryString ? `?${queryString}` : ''}`;
    return api.get<ActivityListResponse>(endpoint);
  },

  async getRecentActivity(limit = 10): Promise<ActivityLog[]> {
    return api.get<ActivityLog[]>(`/activity/recent?limit=${limit}`);
  },

  async getTeamActivity(teamId: number, limit = 20): Promise<ActivityLog[]> {
    const res = await this.getActivity({ team_id: teamId, limit });
    return res.items;
  },

  async getProjectActivity(projectId: number, limit = 20): Promise<ActivityLog[]> {
    const res = await this.getActivity({ project_id: projectId, limit });
    return res.items;
  },

  async getTaskActivity(taskId: number, limit = 20): Promise<ActivityLog[]> {
    const res = await this.getActivity({ task_id: taskId, limit });
    return res.items;
  },
};
