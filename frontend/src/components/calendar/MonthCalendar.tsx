import React, { useState } from 'react';
import type { CalendarEvent } from '../../types';
import { isSameDay, toISODateString } from '../../utils/dateUtils';
import { Layers } from 'lucide-react';

interface MonthCalendarProps {
  currentDate: Date;
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
}

export const MonthCalendar: React.FC<MonthCalendarProps> = ({
  currentDate,
  events,
  onSelectEvent
}) => {
  const [selectedDayEvents, setSelectedDayEvents] = useState<{ dateStr: string; events: CalendarEvent[] } | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Calculate first day of month and total days
  const firstDayOfMonth = new Date(year, month, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Create grid cells (42 cells: 6 rows of 7 days)
  const calendarDays: { date: Date; isCurrentMonth: boolean; isoStr: string }[] = [];

  // Previous month padding
  const prevMonthLastDate = new Date(year, month, 0).getDate();
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevMonthLastDate - i);
    calendarDays.push({ date: d, isCurrentMonth: false, isoStr: toISODateString(d) });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    calendarDays.push({ date: d, isCurrentMonth: true, isoStr: toISODateString(d) });
  }

  // Next month padding to fill grid
  const remainingCells = 42 - calendarDays.length;
  for (let day = 1; day <= remainingCells; day++) {
    const d = new Date(year, month + 1, day);
    calendarDays.push({ date: d, isCurrentMonth: false, isoStr: toISODateString(d) });
  }

  const today = new Date();

  // Map events by date ISO string
  const eventsByDate: Record<string, CalendarEvent[]> = {};
  events.forEach((e) => {
    if (!eventsByDate[e.start]) eventsByDate[e.start] = [];
    eventsByDate[e.start].push(e);
  });

  const getEventPillStyle = (event: CalendarEvent) => {
    if (event.type === 'PROJECT') {
      return 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
    }
    if (event.is_overdue) {
      return 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 font-semibold';
    }
    if (event.status === 'Completed') {
      return 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 line-through opacity-80';
    }
    if (event.status === 'Review') {
      return 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    }
    return 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-theme-surface border border-theme-border/80 rounded-xl overflow-hidden shadow-xs">
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b border-theme-border bg-theme-bg text-center text-xs font-semibold text-theme-secondary py-2">
        {dayNames.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Month Days Grid */}
      <div className="grid grid-cols-7 divide-x divide-y divide-theme-border/60">
        {calendarDays.map((cell, idx) => {
          const isToday = isSameDay(cell.date, today);
          const dayEvents = eventsByDate[cell.isoStr] || [];
          const maxVisible = 3;
          const visibleEvents = dayEvents.slice(0, maxVisible);
          const overflowCount = dayEvents.length - maxVisible;

          return (
            <div
              key={idx}
              className={`min-h-[100px] sm:min-h-[115px] p-1.5 flex flex-col justify-between transition-colors ${
                cell.isCurrentMonth ? 'bg-theme-surface' : 'bg-theme-bg/40 opacity-40'
              } ${isToday ? 'bg-blue-50/40 dark:bg-blue-950/20 ring-1 ring-blue-500/50 inset-0' : ''}`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                    isToday
                      ? 'bg-blue-600 text-white shadow-xs'
                      : cell.isCurrentMonth
                      ? 'text-theme-main'
                      : 'text-theme-muted'
                  }`}
                >
                  {cell.date.getDate()}
                </span>
                {dayEvents.length > 0 && (
                  <span className="text-[10px] font-semibold text-theme-muted sm:hidden">
                    {dayEvents.length} •
                  </span>
                )}
              </div>

              {/* Event Pills */}
              <div className="space-y-1 mt-1 flex-1">
                {visibleEvents.map((e) => (
                  <div
                    key={e.id}
                    onClick={() => onSelectEvent(e)}
                    className={`px-1.5 py-0.5 rounded border text-[11px] font-medium truncate cursor-pointer transition hover:opacity-90 hover:shadow-xs flex items-center gap-1 ${getEventPillStyle(
                      e
                    )}`}
                    title={`${e.title} (${e.type})`}
                  >
                    {e.type === 'TASK' && e.priority === 'Critical' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                    )}
                    <span className="truncate">{e.title}</span>
                  </div>
                ))}
              </div>

              {/* Overflow pill */}
              {overflowCount > 0 && (
                <button
                  onClick={() => setSelectedDayEvents({ dateStr: cell.isoStr, events: dayEvents })}
                  className="mt-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline text-left"
                >
                  +{overflowCount} more
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Day Overflow Modal */}
      {selectedDayEvents && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="saas-panel w-full max-w-sm p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-theme-border pb-2">
              <h3 className="text-sm font-bold text-theme-main flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-600" /> Events for {selectedDayEvents.dateStr}
              </h3>
              <button
                onClick={() => setSelectedDayEvents(null)}
                className="text-xs text-theme-muted hover:text-theme-main"
              >
                Close
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {selectedDayEvents.events.map((e) => (
                <div
                  key={e.id}
                  onClick={() => {
                    setSelectedDayEvents(null);
                    onSelectEvent(e);
                  }}
                  className={`p-2 rounded border text-xs font-semibold cursor-pointer transition ${getEventPillStyle(
                    e
                  )}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{e.title}</span>
                    <span className="text-[10px] font-bold uppercase">{e.type}</span>
                  </div>
                  {e.project_name && (
                    <p className="text-[10px] opacity-75 font-normal truncate mt-0.5">Project: {e.project_name}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
