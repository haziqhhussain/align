import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  action?: {
    label: string;
    icon?: React.ReactNode;
    onClick?: () => void;
    to?: string;
    variant?: 'primary' | 'secondary' | 'danger';
  };
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  breadcrumbs,
  action,
  children,
}) => {
  return (
    <div className="space-y-2 mb-6">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-xs text-theme-muted mb-1 overflow-x-auto">
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <React.Fragment key={index}>
                {index > 0 && <ChevronRight className="w-3.5 h-3.5 opacity-40 shrink-0" />}
                {item.path && !isLast ? (
                  <Link
                    to={item.path}
                    className="hover:text-theme-main transition-colors font-medium whitespace-nowrap"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className={`whitespace-nowrap ${isLast ? 'text-theme-main font-semibold' : ''}`}>
                    {item.label}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      )}

      {/* Main Title Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-theme-main tracking-tight">{title}</h1>
          {description && (
            <p className="text-xs text-theme-muted mt-1 max-w-2xl leading-relaxed">{description}</p>
          )}
        </div>

        {/* Action Button */}
        {action && (
          <div className="shrink-0">
            {action.to ? (
              <Link
                to={action.to}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-theme-primary hover:bg-theme-secondary text-white font-medium text-xs shadow-xs transition-colors cursor-pointer"
              >
                {action.icon}
                <span>{action.label}</span>
              </Link>
            ) : (
              <button
                onClick={action.onClick}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-theme-primary hover:bg-theme-secondary text-white font-medium text-xs shadow-xs transition-colors cursor-pointer"
              >
                {action.icon}
                <span>{action.label}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {children}
    </div>
  );
};
