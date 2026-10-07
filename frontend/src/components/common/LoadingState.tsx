import React from 'react';

interface LoadingStateProps {
  message?: string;
  minHeight?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading workspace data...',
  minHeight = 'min-h-[40vh]',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center ${minHeight} space-y-3`}>
      <div className="w-8 h-8 border-3 border-theme-primary border-t-transparent rounded-full animate-spin"></div>
      {message && <p className="text-xs text-theme-muted font-medium">{message}</p>}
    </div>
  );
};
