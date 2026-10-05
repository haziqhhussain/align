import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import type { ThemePreference } from '../../context/ThemeContext';
import { Sun, Moon, Monitor, Check } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const options: { id: ThemePreference; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
  ];

  // Button icon based on current selected theme preference
  const CurrentIcon = theme === 'system' ? Monitor : theme === 'dark' ? Moon : Sun;

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg bg-theme-surface border border-theme-border text-theme-muted hover:text-theme-main hover:bg-theme-surface-active transition text-xs flex items-center justify-center focus:outline-none focus:ring-1 focus:ring-theme-primary"
        title={`Appearance: ${theme.charAt(0).toUpperCase() + theme.slice(1)} (Currently ${resolvedTheme})`}
        aria-label="Appearance"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <CurrentIcon className="w-4 h-4 text-theme-main" />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-48 rounded-xl bg-theme-surface border border-theme-border shadow-lg p-1.5 z-50 animate-in fade-in focus:outline-none"
          role="menu"
          aria-orientation="vertical"
          aria-label="Appearance theme options"
        >
          <div className="px-2.5 py-1.5 border-b border-theme-border mb-1 text-[10px] font-bold uppercase tracking-wider text-theme-muted flex items-center justify-between">
            <span>Appearance</span>
            <span className="font-normal lowercase text-[9px] text-theme-muted">
              ({resolvedTheme})
            </span>
          </div>

          <div className="space-y-0.5">
            {options.map((opt) => {
              const Icon = opt.icon;
              const isSelected = theme === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    setTheme(opt.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-theme-surface-active text-theme-primary font-semibold'
                      : 'text-theme-main hover:bg-theme-bg'
                  }`}
                  role="menuitem"
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-theme-primary' : 'text-theme-muted'}`} />
                    <span>{opt.label}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-theme-primary shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
