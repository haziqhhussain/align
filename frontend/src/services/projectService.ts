import { api } from './api';
import type { Project, ProjectStatus } from '../types';

export interface CreateProjectParams {
  name: string;
  description?: string;
  team_id: number;
  status?: ProjectStatus;
  start_date?: string;
  due_date?: string;
}

export interface UpdateProjectParams {
  name?: string;
  description?: string;
  team_id?: number;
  status?: ProjectStatus;
  start_date?: string;
  due_date?: string;
}

export const projectService = {
  getProjects(teamId?: number): Promise<Project[]> {
    const query = teamId ? `?team_id=${teamId}` : '';
    return api.get<Project[]>(`/projects${query}`);
  },

  getProject(id: number): Promise<Project> {
    return api.get<Project>(`/projects/${id}`);
  },

  createProject(data: CreateProjectParams): Promise<Project> {
    return api.post<Project>('/projects', data);
  },

  updateProject(id: number, data: UpdateProjectParams): Promise<Project> {
    return api.put<Project>(`/projects/${id}`, data);
  },

  deleteProject(id: number): Promise<void> {
    return api.delete(`/projects/${id}`);
  }
};
