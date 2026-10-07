import React from 'react';
import { Layers, LayoutDashboard, Users, FolderKanban, CheckSquare, MessageSquare, Clock, ArrowUpRight } from 'lucide-react';

export const ProductPreview: React.FC = () => {
  return (
    <section className="py-16 sm:py-20 bg-theme-surface-secondary border-b border-theme-border overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-theme-main">
            One workspace for your entire team.
          </h2>
          <p className="text-sm sm:text-base text-theme-muted leading-relaxed">
            Gain full visibility into active projects, pending deliverables, and team workloads.
          </p>
        </div>

        {/* Polished Mockup Container */}
        <div className="saas-card rounded-2xl border border-theme-border bg-theme-bg shadow-xl overflow-hidden max-w-5xl mx-auto">
          {/* Top Bar Mockup */}
          <div className="px-5 py-3.5 bg-theme-surface border-b border-theme-border flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-theme-primary text-white flex items-center justify-center font-bold text-xs">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-theme-main">Align Workspace</div>
                <div className="text-[10px] text-theme-muted">Engineering & Design Teams</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] font-semibold text-theme-muted hidden sm:inline-block">
                Logged in as <strong className="text-theme-main">Admin</strong>
              </span>
              <div className="w-7 h-7 rounded-full bg-theme-primary text-white font-bold text-xs flex items-center justify-center">
                A
              </div>
            </div>
          </div>

          {/* Body Dashboard Layout Mockup */}
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
            {/* Left Column: Team & Projects Overview (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Project Card 1 */}
              <div className="p-4 rounded-xl border border-theme-border bg-theme-surface space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FolderKanban className="w-4 h-4 text-theme-primary" />
                    <span className="text-xs font-bold text-theme-main">Platform V2 Migration</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    ON TRACK
                  </span>
                </div>
                <p className="text-[11px] text-theme-muted">
                  Migrating backend database schemas and building new React Vite micro-frontend architecture.
                </p>
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-theme-secondary font-medium">Progress</span>
                    <span className="font-bold text-theme-primary">82%</span>
                  </div>
                  <div className="w-full bg-theme-border h-2 rounded-full overflow-hidden">
                    <div className="bg-theme-primary h-full rounded-full w-[82%]"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-theme-muted pt-1">
                  <span>14 Tasks Total</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Due 5 days</span>
                </div>
              </div>

              {/* Project Card 2 */}
              <div className="p-4 rounded-xl border border-theme-border bg-theme-surface space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FolderKanban className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs font-bold text-theme-main">Mobile App Redesign</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    IN REVIEW
                  </span>
                </div>
                <p className="text-[11px] text-theme-muted">
                  Updating mobile layouts and integrating dark theme system compatibility.
                </p>
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-theme-secondary font-medium">Progress</span>
                    <span className="font-bold text-indigo-500">60%</span>
                  </div>
                  <div className="w-full bg-theme-border h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full w-[60%]"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Active Task Stream & Comments (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-4 rounded-xl border border-theme-border bg-theme-surface space-y-3">
                <div className="flex items-center justify-between border-b border-theme-border pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-theme-main">
                    <CheckSquare className="w-4 h-4 text-theme-primary" />
                    Task Status Board
                  </div>
                  <span className="text-[10px] text-theme-muted font-mono">4 ACTIVE</span>
                </div>

                <div className="space-y-2.5">
                  <div className="p-2.5 rounded-lg border border-theme-border bg-theme-bg text-xs space-y-1">
                    <div className="flex items-center justify-between font-semibold text-theme-main">
                      <span>Setup PostgreSQL Docker Container</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400">HIGH</span>
                    </div>
                    <div className="text-[10px] text-theme-muted flex items-center justify-between">
                      <span>Assigned to Marcus</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">Done</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg border border-theme-border bg-theme-bg text-xs space-y-1">
                    <div className="flex items-center justify-between font-semibold text-theme-main">
                      <span>Implement User Management API</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600">MEDIUM</span>
                    </div>
                    <div className="text-[10px] text-theme-muted flex items-center justify-between">
                      <span>Assigned to Sarah</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold">In Progress</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Team Comments Mock */}
              <div className="p-3.5 rounded-xl border border-theme-border bg-theme-surface space-y-2 text-xs">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-theme-main">
                  <MessageSquare className="w-3.5 h-3.5 text-theme-primary" />
                  Recent Discussion
                </div>
                <div className="p-2 rounded bg-theme-bg border border-theme-border text-[11px] space-y-1">
                  <div className="flex justify-between font-semibold text-theme-main">
                    <span>Sarah Jenkins (Lead)</span>
                    <span className="text-[9px] text-theme-muted">10m ago</span>
                  </div>
                  <p className="text-[10px] text-theme-muted">
                    "All JWT auth endpoints are verified and ready for frontend integration."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
