export function parseLocalDate(dateStr?: string): Date | null {
  if (!dateStr) return null;
  if (dateStr.length === 10 && dateStr.includes('-')) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(dateStr);
}

export function formatDateSafe(dateStr?: string): string {
  if (!dateStr) return 'N/A';
  const d = parseLocalDate(dateStr);
  if (!d || isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function formatDateShort(dateStr?: string): string {
  if (!dateStr) return 'N/A';
  const d = parseLocalDate(dateStr);
  if (!d || isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

export function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null;
  const target = parseLocalDate(dateStr);
  if (!target || isNaN(target.getTime())) return null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  
  const diffTime = target.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export function getRelativeDeadline(dateStr?: string, status?: string): string {
  if (!dateStr) return 'No due date';
  if (status === 'Completed') return 'Completed';

  const diff = daysUntil(dateStr);
  if (diff === null) return dateStr;

  if (diff < 0) {
    const absDiff = Math.abs(diff);
    return `Overdue by ${absDiff} day${absDiff > 1 ? 's' : ''}`;
  }
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff < 7) return `In ${diff} days`;
  return formatDateShort(dateStr);
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function toISODateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
