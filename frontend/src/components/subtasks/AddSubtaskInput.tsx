import React, { useState } from 'react';
import type { User } from '../../types';
import { Plus, X } from 'lucide-react';

interface AddSubtaskInputProps {
  teamUsers: User[];
  onAdd: (data: { title: string; description?: string; assigned_to_id?: number }) => Promise<void>;
  onCancel?: () => void;
}

export const AddSubtaskInput: React.FC<AddSubtaskInputProps> = ({
  teamUsers,
  onAdd,
  onCancel
}) => {
  const [title, setTitle] = useState('');
  const [assigneeId, setAssigneeId] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || submitting) return;

    try {
      setSubmitting(true);
      await onAdd({
        title: title.trim(),
        assigned_to_id: assigneeId ? Number(assigneeId) : undefined
      });
      setTitle('');
      setAssigneeId('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && onCancel) {
      onCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 rounded-lg bg-theme-bg border border-theme-border/80">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add checklist item..."
        className="flex-1 bg-theme-surface border border-theme-border rounded-md px-3 py-1.5 text-xs text-theme-main focus:outline-none focus:border-blue-500 font-medium"
        autoFocus
      />
      <div className="flex items-center gap-1.5">
        <select
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value ? Number(e.target.value) : '')}
          className="bg-theme-surface border border-theme-border rounded-md px-2 py-1.5 text-xs text-theme-main focus:outline-none shrink-0"
        >
          <option value="">Unassigned</option>
          {teamUsers.map((u) => (
            <option key={u.id} value={u.id}>{u.full_name}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={submitting || !title.trim()}
          className="px-3 py-1.5 rounded-md text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50 flex items-center gap-1 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 text-theme-muted hover:text-theme-main rounded-md border border-theme-border shrink-0"
            title="Cancel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </form>
  );
};
