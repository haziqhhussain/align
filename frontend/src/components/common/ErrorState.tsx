import React from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Unable to load data',
  message = 'An unexpected error occurred while fetching information from the server.',
  onRetry,
}) => {
  return (
    <div className="saas-panel p-6 text-center space-y-3 max-w-md mx-auto my-8 border-rose-500/30">
      <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
        <ShieldAlert className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-bold text-theme-main">{title}</h3>
      <p className="text-xs text-theme-muted">{message}</p>
      {onRetry && (
        <div className="pt-2">
          <button
            onClick={onRetry}
            className="px-3.5 py-1.5 rounded-lg bg-theme-primary text-white text-xs font-medium transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Try Again
          </button>
        </div>
      )}
    </div>
  );
};
