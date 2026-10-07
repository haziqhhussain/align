import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const getConfirmBtnColor = () => {
    if (variant === 'danger') return 'bg-rose-600 hover:bg-rose-500 text-white';
    if (variant === 'warning') return 'bg-amber-600 hover:bg-amber-500 text-white';
    return 'bg-theme-primary hover:bg-theme-secondary text-white';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="saas-panel w-full max-w-sm p-5 space-y-4 shadow-xl border-theme-border">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                variant === 'danger'
                  ? 'bg-rose-500/10 text-rose-500'
                  : 'bg-amber-500/10 text-amber-500'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-theme-main">{title}</h3>
          </div>
          <button onClick={onCancel} className="text-theme-muted hover:text-theme-main p-1 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-theme-muted leading-relaxed">{message}</p>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-theme-border">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-theme-muted hover:text-theme-main border border-theme-border transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${getConfirmBtnColor()}`}
          >
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
