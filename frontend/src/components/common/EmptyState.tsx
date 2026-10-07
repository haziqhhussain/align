import React from 'react';
import { Layers } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  compact?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No items found',
  description = 'There are no records to display in this view.',
  icon,
  action,
  compact = false,
}) => {
  return (
    <div
      className={`text-center bg-theme-bg rounded-xl border border-dashed border-theme-border flex flex-col items-center justify-center ${
        compact ? 'p-6' : 'p-10'
      }`}
    >
      <div className="w-10 h-10 rounded-full bg-theme-surface text-theme-muted flex items-center justify-center mb-3 border border-theme-border">
        {icon || <Layers className="w-5 h-5 opacity-60" />}
      </div>
      <h3 className="text-sm font-bold text-theme-main mb-1">{title}</h3>
      <p className="text-xs text-theme-muted max-w-sm leading-relaxed mb-4">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-3.5 py-1.5 rounded-lg bg-theme-primary hover:bg-theme-secondary text-white text-xs font-semibold transition-colors cursor-pointer"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
