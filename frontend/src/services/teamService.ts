import { api } from './api';
import type { Team } from '../types';

export interface CreateTeamParams {
  name: string;
  description?: string;
  lead_id?: number;
  member_ids?: number[];
}

export interface UpdateTeamParams {
  name?: string;
  description?: string;
  lead_id?: number;
}

export const teamService = {
  getTeams(): Promise<Team[]> {
    return api.get<Team[]>('/teams');
  },

  getTeam(id: number): Promise<Team> {
    return api.get<Team>(`/teams/${id}`);
  },

  createTeam(data: CreateTeamParams): Promise<Team> {
    return api.post<Team>('/teams', data);
  },

  updateTeam(id: number, data: UpdateTeamParams): Promise<Team> {
    return api.put<Team>(`/teams/${id}`, data);
  },

  deleteTeam(id: number): Promise<void> {
    return api.delete(`/teams/${id}`);
  },

  addMember(teamId: number, userId: number): Promise<Team> {
    return api.post<Team>(`/teams/${teamId}/members`, { user_id: userId });
  },

  removeMember(teamId: number, userId: number): Promise<Team> {
    return api.delete<Team>(`/teams/${teamId}/members/${userId}`);
  }
};
