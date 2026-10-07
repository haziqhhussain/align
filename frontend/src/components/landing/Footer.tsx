import React from 'react';
import { Link } from 'react-router-dom';
import { Layers } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-theme-bg py-12 border-t border-theme-border transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-theme-primary text-white flex items-center justify-center font-bold text-xs">
              <Layers className="w-4 h-4" />
            </div>
            <span className="font-bold text-base tracking-tight text-theme-main">Align</span>
            <span className="text-xs text-theme-muted hidden sm:inline-block border-l border-theme-border pl-2.5">
              Team Management Platform
            </span>
          </div>

          {/* Center Links */}
          <nav className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-theme-secondary">
            <a href="#features" className="hover:text-theme-main transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-theme-main transition-colors">
              How It Works
            </a>
            <Link to="/login" className="hover:text-theme-main transition-colors">
              Login
            </Link>
            <Link to="/register" className="hover:text-theme-main transition-colors">
              Register
            </Link>
            <a href="#privacy" className="hover:text-theme-main transition-colors">
              Privacy
            </a>
            <a href="#terms" className="hover:text-theme-main transition-colors">
              Terms
            </a>
          </nav>

          {/* Right Copyright */}
          <div className="text-xs text-theme-muted">
            &copy; 2026 Align. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};
