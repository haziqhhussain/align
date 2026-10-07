import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Shield, Users, Sparkles } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <section className="relative overflow-hidden py-16 sm:py-20 lg:py-24 border-b border-theme-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* LEFT COLUMN: Headline & CTAs */}
          <div className="lg:col-span-6 space-y-6 text-left">
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-theme-surface border border-theme-border text-theme-secondary shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-theme-primary" />
              <span>Enterprise SaaS Team Management</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-theme-main leading-[1.1]">
              Plan. Assign. Track. <span className="text-theme-primary">Align.</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl font-semibold text-theme-secondary leading-snug">
              Bring your teams, projects, and tasks into one clear workspace.
            </p>

            {/* Supporting text */}
            <p className="text-sm sm:text-base text-theme-muted leading-relaxed max-w-xl">
              Align helps admins, team leads, and members manage projects, assign responsibilities, track progress, and stay organized.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/register"
                className="bg-theme-primary hover:bg-theme-primary-hover text-white text-xs sm:text-sm font-semibold px-6 py-3 rounded-lg shadow-sm flex items-center gap-2 transition cursor-pointer"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/login"
                className="bg-theme-surface hover:bg-theme-surface-active text-theme-main border border-theme-border text-xs sm:text-sm font-semibold px-5 py-3 rounded-lg transition"
              >
                Sign In
              </Link>

              <a
                href="#features"
                className="text-xs sm:text-sm font-semibold text-theme-muted hover:text-theme-main px-4 py-3 transition"
              >
                View Features &rarr;
              </a>
            </div>

            {/* Quick Proof Badges */}
            <div className="pt-6 border-t border-theme-border/60 grid grid-cols-3 gap-4 max-w-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-xs font-medium text-theme-secondary">Role-based access</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-theme-primary shrink-0" />
                <span className="text-xs font-medium text-theme-secondary">Secure data</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="text-xs font-medium text-theme-secondary">Team overview</span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Clean Product Preview Visual */}
          <div className="lg:col-span-6">
            <div className="relative mx-auto max-w-xl lg:max-w-none">
              {/* Decorative Subtle Accent Frame */}
              <div className="saas-card overflow-hidden rounded-xl border border-theme-border bg-theme-surface shadow-md">
                {/* Mock Window Header */}
                <div className="px-4 py-3 bg-theme-surface-active/60 border-b border-theme-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-400/80"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-400/80"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-400/80"></div>
                    <span className="ml-2 text-[11px] font-semibold text-theme-muted font-mono">align.app/dashboard</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-theme-primary/10 text-theme-primary border border-theme-primary/20">
                      LIVE WORKSPACE
                    </span>
                  </div>
                </div>

                {/* Dashboard UI Content Preview */}
                <div className="p-5 space-y-4 text-left">
                  {/* Stats Bar */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-theme-bg border border-theme-border">
                      <div className="text-[10px] font-medium text-theme-muted">Active Projects</div>
                      <div className="text-lg font-bold text-theme-main mt-0.5">8</div>
                    </div>
                    <div className="p-3 rounded-lg bg-theme-bg border border-theme-border">
                      <div className="text-[10px] font-medium text-theme-muted">Team Members</div>
                      <div className="text-lg font-bold text-theme-main mt-0.5">24</div>
                    </div>
                    <div className="p-3 rounded-lg bg-theme-bg border border-theme-border">
                      <div className="text-[10px] font-medium text-theme-muted">Task Completion</div>
                      <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">86%</div>
                    </div>
                  </div>

                  {/* Project Progress Card */}
                  <div className="p-3.5 rounded-lg border border-theme-border bg-theme-bg space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-theme-main">Frontend Web Application</span>
                      <span className="text-[11px] font-bold text-theme-primary">75%</span>
                    </div>
                    <div className="w-full bg-theme-border h-2 rounded-full overflow-hidden">
                      <div className="bg-theme-primary h-full rounded-full w-3/4"></div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-theme-muted pt-0.5">
                      <span>12 tasks assigned</span>
                      <span>Due Oct 15</span>
                    </div>
                  </div>

                  {/* Task Kanban Row */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-theme-secondary uppercase tracking-wider">
                      Recent Activity
                    </div>
                    <div className="space-y-2">
                      <div className="p-2.5 rounded-lg border border-theme-border bg-theme-bg flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                          <span className="font-medium text-theme-main">Implement JWT Authentication</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          COMPLETED
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg border border-theme-border bg-theme-bg flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                          <span className="font-medium text-theme-main">Design SaaS Landing Page</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-theme-surface-active text-theme-primary border border-theme-border">
                          IN PROGRESS
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
