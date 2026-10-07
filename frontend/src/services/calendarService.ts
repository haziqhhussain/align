import { api } from './api';
import type { CalendarEvent, UpcomingDeadline, CalendarFilters } from '../types';

export const calendarService = {
  getCalendarEvents(params: CalendarFilters & { start?: string; end?: string } = {}): Promise<CalendarEvent[]> {
    const searchParams = new URLSearchParams();
    if (params.start) searchParams.append('start', params.start);
    if (params.end) searchParams.append('end', params.end);
    if (params.team_id) searchParams.append('team_id', params.team_id.toString());
    if (params.project_id) searchParams.append('project_id', params.project_id.toString());
    if (params.assignee_id) searchParams.append('assignee_id', params.assignee_id.toString());
    if (params.event_type && params.event_type !== 'ALL') searchParams.append('event_type', params.event_type);
    if (params.status) searchParams.append('status', params.status);
    if (params.my_calendar_only) searchParams.append('my_calendar_only', 'true');

    const query = searchParams.toString();
    return api.get<CalendarEvent[]>(`/calendar${query ? `?${query}` : ''}`);
  },

  getUpcomingDeadlines(limit = 10): Promise<UpcomingDeadline[]> {
    return api.get<UpcomingDeadline[]>(`/calendar/upcoming?limit=${limit}`);
  }
};
