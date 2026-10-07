import React from 'react';
import type { CalendarEvent } from '../../types';
import { isSameDay, toISODateString } from '../../utils/dateUtils';

interface WeekCalendarProps {
  currentDate: Date;
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
}

export const WeekCalendar: React.FC<WeekCalendarProps> = ({
  currentDate,
  events,
  onSelectEvent
}) => {
  // Get Monday or Sunday of current week
  const curr = new Date(currentDate);
  const day = curr.getDay(); // 0 = Sun
  const firstDayOfWeek = new Date(curr);
  firstDayOfWeek.setDate(curr.getDate() - day); // Sunday start

  const weekDays: { date: Date; isoStr: string; dayName: string }[] = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 0; i < 7; i++) {
    const d = new Date(firstDayOfWeek);
    d.setDate(firstDayOfWeek.getDate() + i);
    weekDays.push({
      date: d,
      isoStr: toISODateString(d),
      dayName: dayNames[i]
    });
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
    return 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
  };

  return (
    <div className="bg-theme-surface border border-theme-border/80 rounded-xl overflow-hidden shadow-xs">
      <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-theme-border">
        {weekDays.map((wd) => {
          const isToday = isSameDay(wd.date, today);
          const dayEvents = eventsByDate[wd.isoStr] || [];

          return (
            <div key={wd.isoStr} className={`min-h-[220px] p-3 flex flex-col space-y-2 ${isToday ? 'bg-blue-50/30 dark:bg-blue-950/20' : ''}`}>
              <div className="flex items-center justify-between border-b border-theme-border/60 pb-2">
                <span className="text-xs font-semibold text-theme-muted">{wd.dayName}</span>
                <span
                  className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                    isToday ? 'bg-blue-600 text-white' : 'text-theme-main'
                  }`}
                >
                  {wd.date.getDate()}
                </span>
              </div>

              <div className="space-y-1.5 flex-1">
                {dayEvents.length === 0 ? (
                  <p className="text-[11px] text-theme-muted text-center py-4 opacity-60">No deadlines</p>
                ) : (
                  dayEvents.map((e) => (
                    <div
                      key={e.id}
                      onClick={() => onSelectEvent(e)}
                      className={`p-2 rounded border text-xs font-medium cursor-pointer transition hover:opacity-90 space-y-0.5 ${getEventPillStyle(
                        e
                      )}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate font-semibold">{e.title}</span>
                      </div>
                      {e.project_name && (
                        <p className="text-[10px] opacity-75 truncate">{e.project_name}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
