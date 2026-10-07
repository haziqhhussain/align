import React, { useEffect, useState, useCallback } from 'react';
import type { Subtask, User, TaskStatus } from '../../types';
import { subtaskService } from '../../services/subtaskService';
import { SubtaskProgress } from './SubtaskProgress';
import { SubtaskItem } from './SubtaskItem';
import { AddSubtaskInput } from './AddSubtaskInput';
import { useToast } from '../../context/ToastContext';
import {
  ListChecks,
  Plus,
  CheckCircle2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface SubtaskListProps {
  taskId: number;
  teamUsers?: User[];
  parentTaskStatus?: TaskStatus;
  onSubtaskChange?: () => void;
  onCompleteParentTask?: () => void;
}

export const SubtaskList: React.FC<SubtaskListProps> = ({
  taskId,
  teamUsers = [],
  parentTaskStatus,
  onSubtaskChange,
  onCompleteParentTask
}) => {
  const { showToast } = useToast();
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const fetchSubtasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await subtaskService.getSubtasks(taskId);
      setSubtasks(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load checklist items');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchSubtasks();
  }, [fetchSubtasks]);

  const totalCount = subtasks.length;
  const completedCount = subtasks.filter((s) => s.is_completed).length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allCompleted = totalCount > 0 && completedCount === totalCount;

  const handleCreateSubtask = async (data: { title: string; description?: string; assigned_to_id?: number }) => {
    try {
      const created = await subtaskService.createSubtask(taskId, data);
      setSubtasks((prev) => [...prev, created]);
      if (onSubtaskChange) onSubtaskChange();
      showToast('Checklist item added', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to create subtask', 'error');
    }
  };

  const handleToggleSubtask = async (id: number) => {
    // Optimistic toggle
    setSubtasks((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_completed: !s.is_completed } : s))
    );

    try {
      const updated = await subtaskService.toggleSubtask(id);
      setSubtasks((prev) => prev.map((s) => (s.id === id ? updated : s)));
      if (onSubtaskChange) onSubtaskChange();
    } catch (err: any) {
      // Rollback on error
      setSubtasks((prev) =>
        prev.map((s) => (s.id === id ? { ...s, is_completed: !s.is_completed } : s))
      );
      showToast(err.message || 'Failed to update subtask', 'error');
    }
  };

  const handleUpdateSubtask = async (id: number, data: { title?: string; description?: string; assigned_to_id?: number | null }) => {
    try {
      const updated = await subtaskService.updateSubtask(id, data);
      setSubtasks((prev) => prev.map((s) => (s.id === id ? updated : s)));
      if (onSubtaskChange) onSubtaskChange();
      showToast('Checklist item updated', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update subtask', 'error');
    }
  };

  const handleDeleteSubtask = async (id: number) => {
    const prevSubtasks = [...subtasks];
    setSubtasks((prev) => prev.filter((s) => s.id !== id));

    try {
      await subtaskService.deleteSubtask(id);
      if (onSubtaskChange) onSubtaskChange();
      showToast('Checklist item deleted', 'info');
    } catch (err: any) {
      setSubtasks(prevSubtasks);
      showToast(err.message || 'Failed to delete subtask', 'error');
    }
  };

  const handleMove = async (id: number, direction: 'up' | 'down') => {
    const index = subtasks.findIndex((s) => s.id === id);
    if (index === -1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= subtasks.length) return;

    const newSubtasks = [...subtasks];
    const temp = newSubtasks[index];
    newSubtasks[index] = newSubtasks[targetIndex];
    newSubtasks[targetIndex] = temp;

    // Re-assign position numbers
    const reorderItems = newSubtasks.map((s, idx) => ({ id: s.id, position: idx }));
    setSubtasks(newSubtasks.map((s, idx) => ({ ...s, position: idx })));

    try {
      await subtaskService.reorderSubtasks(taskId, reorderItems);
      if (onSubtaskChange) onSubtaskChange();
    } catch (err: any) {
      showToast(err.message || 'Failed to reorder subtasks', 'error');
      fetchSubtasks();
    }
  };

  return (
    <div className="border-t border-theme-border pt-3.5 space-y-3">
      {/* Checklist Section Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-theme-main flex items-center gap-1.5">
          <ListChecks className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Checklist
          {totalCount > 0 && (
            <span className="text-[11px] font-semibold text-theme-muted ml-1">
              ({completedCount}/{totalCount})
            </span>
          )}
        </h3>

        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold transition flex items-center gap-1 hover:underline"
          >
            <Plus className="w-3.5 h-3.5" /> Add item
          </button>
        )}
      </div>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <SubtaskProgress
          completedCount={completedCount}
          totalCount={totalCount}
          progressPercentage={progressPercentage}
        />
      )}

      {/* All Subtasks Completed Suggestion Banner */}
      {allCompleted && parentTaskStatus !== 'Completed' && (
        <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>All checklist items completed</span>
          </div>
          {onCompleteParentTask && (
            <button
              onClick={onCompleteParentTask}
              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] transition shrink-0"
            >
              Mark task complete
            </button>
          )}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="py-4 text-center text-xs text-theme-muted flex items-center justify-center gap-2">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
          <span>Loading checklist items...</span>
        </div>
      ) : error ? (
        /* Error State with Retry */
        <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center justify-between text-xs text-rose-700 dark:text-rose-300">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchSubtasks}
            className="px-2 py-1 rounded border border-rose-300 dark:border-rose-800 text-[11px] font-medium hover:bg-rose-100 dark:hover:bg-rose-900"
          >
            Retry
          </button>
        </div>
      ) : (
        /* Subtask List Items / Empty State */
        <div className="space-y-2">
          {subtasks.length === 0 && !isAdding ? (
            <div className="p-4 rounded-lg bg-theme-bg border border-dashed border-theme-border text-center space-y-1">
              <p className="text-xs font-semibold text-theme-main">No checklist items yet.</p>
              <p className="text-[11px] text-theme-muted">Break this task into smaller steps.</p>
              <button
                onClick={() => setIsAdding(true)}
                className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add item
              </button>
            </div>
          ) : (
            subtasks.map((st, idx) => (
              <SubtaskItem
                key={st.id}
                subtask={st}
                teamUsers={teamUsers}
                isFirst={idx === 0}
                isLast={idx === subtasks.length - 1}
                onToggle={handleToggleSubtask}
                onUpdate={handleUpdateSubtask}
                onDelete={handleDeleteSubtask}
                onMoveUp={(id) => handleMove(id, 'up')}
                onMoveDown={(id) => handleMove(id, 'down')}
              />
            ))
          )}

          {/* Inline Add Input */}
          {isAdding && (
            <AddSubtaskInput
              teamUsers={teamUsers}
              onAdd={handleCreateSubtask}
              onCancel={() => setIsAdding(false)}
            />
          )}
        </div>
      )}
    </div>
  );
};
