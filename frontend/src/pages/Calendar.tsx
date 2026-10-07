import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { calendarService } from '../services/calendarService';
import { projectService } from '../services/projectService';
import { teamService } from '../services/teamService';
import { userService } from '../services/userService';
import type {
  CalendarEvent,
  UpcomingDeadline,
  CalendarFilters,
  Team,
  Project,
  User,
} from '../types';
import { CalendarHeader } from '../components/calendar/CalendarHeader';
import { CalendarFiltersBar } from '../components/calendar/CalendarFiltersBar';
import { MonthCalendar } from '../components/calendar/MonthCalendar';
import { WeekCalendar } from '../components/calendar/WeekCalendar';
import { UpcomingDeadlines } from '../components/calendar/UpcomingDeadlines';
import { toISODateString } from '../utils/dateUtils';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const Calendar: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<UpcomingDeadline[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter options
  const [teams, setTeams] = useState<Team[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Filters state
  const [filters, setFilters] = useState<CalendarFilters>({
    event_type: 'ALL',
    status: '',
    my_calendar_only: false,
  });

  // Fetch dropdown filter options on mount
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [teamsRes, projectsRes, usersRes] = await Promise.all([
          teamService.getTeams(),
          projectService.getProjects(),
          userService.getUsers(),
        ]);
        setTeams(teamsRes);
        setProjects(projectsRes);
        setUsers(usersRes);
      } catch (err) {
        console.error('Failed to load filter metadata:', err);
      }
    };
    fetchOptions();
  }, []);

  // Compute start & end dates for backend fetch based on currentDate & viewMode
  const getDateRange = useCallback(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    if (viewMode === 'month') {
      // 1st of month
      const firstOfMonth = new Date(year, month, 1);
      const dayOfWeek = (firstOfMonth.getDay() + 6) % 7; // Mon=0 .. Sun=6
      const startDate = new Date(year, month, 1 - dayOfWeek);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 41); // 6 full weeks (42 days)

      return {
        start: toISODateString(startDate),
        end: toISODateString(endDate),
      };
    } else {
      // Week view: Monday to Sunday
      const curr = new Date(currentDate);
      const day = (curr.getDay() + 6) % 7;
      const startDate = new Date(curr);
      startDate.setDate(curr.getDate() - day);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);

      return {
        start: toISODateString(startDate),
        end: toISODateString(endDate),
      };
    }
  }, [currentDate, viewMode]);

  // Load calendar events
  const fetchCalendarData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { start, end } = getDateRange();
      const [eventsRes, upcomingRes] = await Promise.all([
        calendarService.getCalendarEvents(start, end, filters),
        calendarService.getUpcomingDeadlines(10),
      ]);
      setEvents(eventsRes);
      setUpcomingDeadlines(upcomingRes);
    } catch (err: any) {
      console.error('Error fetching calendar events:', err);
      setError('Unable to load calendar. Please check your network and try again.');
      showToast('Failed to load calendar events', 'error');
    } finally {
      setLoading(false);
    }
  }, [getDateRange, filters, showToast]);

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  // Navigation handlers
  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  // Click event handlers
  const handleSelectTask = (taskId: number) => {
    navigate(`/tasks?id=${taskId}`);
  };

  const handleSelectProject = (projectId: number) => {
    navigate(`/projects/${projectId}`);
  };

  // Header Title
  const getHeaderTitle = () => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    if (viewMode === 'month') {
      return `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    } else {
      const { start, end } = getDateRange();
      return `${start} - ${end}`;
    }
  };

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <CalendarHeader
        currentTitle={getHeaderTitle()}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onToday={handleToday}
        onPrev={handlePrev}
        onNext={handleNext}
      />

      {/* Filters Bar */}
      <CalendarFiltersBar
        filters={filters}
        onFilterChange={setFilters}
        teams={teams}
        projects={projects}
        users={users}
        currentUserId={user?.id}
      />

      {/* Main Content Layout */}
      {error ? (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl p-8 text-center shadow-xs">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-red-900 dark:text-red-200 mb-1">
            Unable to load calendar
          </h3>
          <p className="text-xs text-red-600 dark:text-red-400 mb-4 max-w-md mx-auto">
            {error}
          </p>
          <button
            onClick={fetchCalendarData}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try Again
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 items-start">
          {/* Calendar Grid (Takes 3 columns on large screens) */}
          <div className="lg:col-span-3">
            {viewMode === 'month' ? (
              <MonthCalendar
                currentDate={currentDate}
                events={events}
                onSelectTask={handleSelectTask}
                onSelectProject={handleSelectProject}
                isLoading={loading}
              />
            ) : (
              <WeekCalendar
                currentDate={currentDate}
                events={events}
                onSelectTask={handleSelectTask}
                onSelectProject={handleSelectProject}
                isLoading={loading}
              />
            )}
          </div>

          {/* Upcoming Deadlines & Overdue Panel (Takes 1 column on large screens) */}
          <div className="lg:col-span-1 space-y-5">
            <UpcomingDeadlines
              deadlines={upcomingDeadlines}
              events={events}
              onSelectTask={handleSelectTask}
              onSelectProject={handleSelectProject}
              isLoading={loading}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
