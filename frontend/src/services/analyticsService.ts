import { api } from './api';
import type {
  AnalyticsSummary,
  MemberWorkload,
  TeamWorkload,
  ProjectWorkload,
  AnalyticsTrends,
  AnalyticsFilters,
} from '../types';

function buildQuery(filters?: AnalyticsFilters): string {
  if (!filters) return '';
  const params = new URLSearchParams();
  if (filters.team_id) params.append('team_id', filters.team_id.toString());
  if (filters.project_id) params.append('project_id', filters.project_id.toString());
  if (filters.member_id) params.append('member_id', filters.member_id.toString());
  if (filters.period) params.append('period', filters.period);
  const q = params.toString();
  return q ? `?${q}` : '';
}

export const analyticsService = {
  getAnalyticsSummary(filters?: AnalyticsFilters): Promise<AnalyticsSummary> {
    return api.get<AnalyticsSummary>(`/analytics/summary${buildQuery(filters)}`);
  },

  async getMemberWorkload(filters?: AnalyticsFilters): Promise<MemberWorkload[]> {
    const res = await api.get<{ members: MemberWorkload[] }>(`/analytics/workload${buildQuery(filters)}`);
    return res.members || [];
  },

  getTeamWorkload(filters?: AnalyticsFilters): Promise<TeamWorkload[]> {
    return api.get<TeamWorkload[]>(`/analytics/teams${buildQuery(filters)}`);
  },

  getProjectWorkload(filters?: AnalyticsFilters): Promise<ProjectWorkload[]> {
    return api.get<ProjectWorkload[]>(`/analytics/projects${buildQuery(filters)}`);
  },

  getAnalyticsTrends(period: string = '30d', filters?: AnalyticsFilters): Promise<AnalyticsTrends> {
    const queryFilters = { ...(filters || {}), period: period as any };
    return api.get<AnalyticsTrends>(`/analytics/trends${buildQuery(queryFilters)}`);
  },
};
