import React from 'react';
import { UserPlus, ShieldAlert, ListChecks, TrendingUp } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'Create a Team',
      description: 'Admin creates the team and adds workspace members.',
      icon: UserPlus,
    },
    {
      step: '02',
      title: 'Assign a Team Lead',
      description: 'Select a qualified member to manage and lead the team.',
      icon: ShieldAlert,
    },
    {
      step: '03',
      title: 'Create Projects & Tasks',
      description: 'Break projects into clear tasks and assign responsibilities.',
      icon: ListChecks,
    },
    {
      step: '04',
      title: 'Track Progress',
      description: 'Members update work and leads/admins monitor progress.',
      icon: TrendingUp,
    },
  ];

  return (
    <section id="how-it-works" className="py-16 sm:py-20 bg-theme-surface-secondary border-b border-theme-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-theme-main">
            How Align works
          </h2>
          <p className="text-sm sm:text-base text-theme-muted leading-relaxed">
            A simple 4-step workflow to get your teams up and running efficiently.
          </p>
        </div>

        {/* 4 Steps Horizontal / Vertical Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 relative">
          {steps.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="saas-card p-6 rounded-xl border border-theme-border bg-theme-surface relative flex flex-col justify-between space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-extrabold text-theme-primary/80 font-mono">
                    {item.step}
                  </span>
                  <div className="w-9 h-9 rounded-lg bg-theme-surface border border-theme-border flex items-center justify-center text-theme-main">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-base font-bold text-theme-main tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-theme-muted leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
