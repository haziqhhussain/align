export function formatDate(dateString?: string): string {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (e) {
    return dateString;
  }
}

export function formatDateTime(dateString?: string): string {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return dateString;
  }
}

export function isOverdue(dueDateString?: string, status?: string): boolean {
  if (!dueDateString || status === 'Completed') return false;
  const due = new Date(dueDateString);
  const now = new Date();
  return due < now;
}

export function getStatusBadgeColor(status: string): string {
  switch (status) {
    case 'To Do':
      return 'badge-todo';
    case 'In Progress':
      return 'badge-in-progress';
    case 'Review':
      return 'badge-review';
    case 'Completed':
      return 'badge-completed';
    default:
      return 'badge-todo';
  }
}

export function getPriorityBadgeColor(priority: string): string {
  switch (priority) {
    case 'Low':
      return 'bg-slate-100 dark:bg-[#242424] text-slate-600 dark:text-[#D1D5DB] border-slate-200 dark:border-[#343434]';
    case 'Medium':
      return 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30';
    case 'High':
      return 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30';
    case 'Critical':
      return 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30 font-semibold';
    default:
      return 'bg-slate-100 dark:bg-[#242424] text-slate-600 dark:text-[#D1D5DB] border-slate-200 dark:border-[#343434]';
  }
}

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const num = (bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1);
  return `${num} ${sizes[i]}`;
}
