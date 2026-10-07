import React, { useState } from 'react';
import type { Subtask, User } from '../../types';
import {
  Check,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  User as UserIcon,
  X,
  Save,
  UserCheck
} from 'lucide-react';

interface SubtaskItemProps {
  subtask: Subtask;
  teamUsers: User[];
  isFirst: boolean;
  isLast: boolean;
  onToggle: (id: number) => void;
  onUpdate: (id: number, data: { title?: string; description?: string; assigned_to_id?: number | null }) => void;
  onDelete: (id: number) => void;
  onMoveUp: (id: number) => void;
  onMoveDown: (id: number) => void;
}

export const SubtaskItem: React.FC<SubtaskItemProps> = ({
  subtask,
  teamUsers,
  isFirst,
  isLast,
  onToggle,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(subtask.title);
  const [editDesc, setEditDesc] = useState(subtask.description || '');
  const [editAssignee, setEditAssignee] = useState<number | ''>(subtask.assigned_to_id || '');

  const handleSave = () => {
    if (!editTitle.trim()) return;
    onUpdate(subtask.id, {
      title: editTitle.trim(),
      description: editDesc.trim() || undefined,
      assigned_to_id: editAssignee ? Number(editAssignee) : null
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(subtask.title);
    setEditDesc(subtask.description || '');
    setEditAssignee(subtask.assigned_to_id || '');
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="p-3 rounded-lg border border-blue-500/40 bg-blue-50/40 dark:bg-slate-800/60 space-y-2.5">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          placeholder="Subtask title"
          className="w-full bg-theme-surface border border-theme-border rounded px-2.5 py-1.5 text-xs text-theme-main focus:outline-none focus:border-blue-500 font-medium"
          autoFocus
        />
        <input
          type="text"
          value={editDesc}
          onChange={(e) => setEditDesc(e.target.value)}
          placeholder="Optional description"
          className="w-full bg-theme-surface border border-theme-border rounded px-2.5 py-1 text-[11px] text-theme-muted focus:outline-none focus:border-blue-500"
        />
        <div className="flex items-center justify-between gap-2">
          <select
            value={editAssignee}
            onChange={(e) => setEditAssignee(e.target.value ? Number(e.target.value) : '')}
            className="bg-theme-surface border border-theme-border rounded px-2 py-1 text-[11px] text-theme-main focus:outline-none"
          >
            <option value="">Unassigned</option>
            {teamUsers.map((u) => (
              <option key={u.id} value={u.id}>{u.full_name}</option>
            ))}
          </select>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCancel}
              className="px-2 py-1 rounded text-[11px] text-theme-muted border border-theme-border hover:bg-theme-bg"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-2.5 py-1 rounded text-[11px] font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1"
            >
              <Save className="w-3 h-3" /> Save
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`group flex items-center justify-between gap-2 p-2.5 rounded-lg border border-theme-border/60 bg-theme-surface hover:border-theme-border transition-all ${subtask.is_completed ? 'bg-slate-50/50 dark:bg-slate-900/20' : ''}`}>
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {/* Checkbox button */}
        <button
          type="button"
          onClick={() => onToggle(subtask.id)}
          aria-label={`Mark "${subtask.title}" as ${subtask.is_completed ? 'uncompleted' : 'completed'}`}
          className={`w-4 h-4 rounded border flex items-center justify-center transition shrink-0 ${
            subtask.is_completed
              ? 'bg-blue-600 border-blue-600 text-white'
              : 'border-theme-border hover:border-blue-500 bg-theme-surface'
          }`}
        >
          {subtask.is_completed && <Check className="w-3 h-3 stroke-[3]" />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span
              onClick={() => setIsEditing(true)}
              className={`text-xs font-medium cursor-pointer transition truncate ${
                subtask.is_completed
                  ? 'line-through text-theme-muted'
                  : 'text-theme-main hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              {subtask.title}
            </span>
          </div>
          {subtask.description && (
            <p className={`text-[11px] truncate mt-0.5 ${subtask.is_completed ? 'text-theme-muted/60' : 'text-theme-muted'}`}>
              {subtask.description}
            </p>
          )}
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Assignee Avatar / Badge */}
        {subtask.assigned_to ? (
          <div
            title={`Assigned to ${subtask.assigned_to.full_name}`}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900 text-[10px] font-semibold text-blue-600 dark:text-blue-400"
          >
            {subtask.assigned_to.avatar_url ? (
              <img src={subtask.assigned_to.avatar_url} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />
            ) : (
              <span className="w-3.5 h-3.5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[8px]">
                {subtask.assigned_to.full_name.charAt(0)}
              </span>
            )}
            <span className="hidden sm:inline truncate max-w-[70px]">{subtask.assigned_to.full_name.split(' ')[0]}</span>
          </div>
        ) : null}

        {/* Reorder Arrows */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
          <button
            onClick={() => onMoveUp(subtask.id)}
            disabled={isFirst}
            className="p-1 text-theme-muted hover:text-theme-main disabled:opacity-20 rounded"
            title="Move Up"
            aria-label="Move Up"
          >
            <ArrowUp className="w-3 h-3" />
          </button>
          <button
            onClick={() => onMoveDown(subtask.id)}
            disabled={isLast}
            className="p-1 text-theme-muted hover:text-theme-main disabled:opacity-20 rounded"
            title="Move Down"
            aria-label="Move Down"
          >
            <ArrowDown className="w-3 h-3" />
          </button>
        </div>

        {/* Edit & Delete Action Buttons */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
          <button
            onClick={() => setIsEditing(true)}
            className="p-1 text-theme-muted hover:text-blue-600 dark:hover:text-blue-400 rounded"
            title="Edit Subtask"
            aria-label="Edit Subtask"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <button
            onClick={() => onDelete(subtask.id)}
            className="p-1 text-theme-muted hover:text-rose-500 rounded"
            title="Delete Subtask"
            aria-label="Delete Subtask"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
