import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export const CTA: React.FC = () => {
  return (
    <section className="py-16 sm:py-20 bg-theme-surface-secondary border-b border-theme-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="saas-panel p-8 sm:p-12 lg:p-14 rounded-2xl bg-theme-surface border border-theme-border text-center space-y-6 shadow-sm">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-theme-main">
            Keep your team aligned.
          </h2>

          <p className="text-sm sm:text-base text-theme-muted max-w-xl mx-auto leading-relaxed">
            Plan projects, assign work, and track progress from one place. Get started in minutes.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/register"
              className="bg-theme-primary hover:bg-theme-primary-hover text-white text-xs sm:text-sm font-semibold px-6 py-3 rounded-lg shadow-sm flex items-center gap-2 transition"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/login"
              className="bg-theme-surface hover:bg-theme-surface-active text-theme-main border border-theme-border text-xs sm:text-sm font-semibold px-6 py-3 rounded-lg transition"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
