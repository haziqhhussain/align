import React from 'react';
import { CheckCircle2, Target, Eye, Zap, Users, BarChart } from 'lucide-react';

export const Benefits: React.FC = () => {
  const benefitPoints = [
    {
      title: 'Clear ownership',
      description: 'Every project and task has a dedicated owner and assigned team lead.',
      icon: Target,
    },
    {
      title: 'Better visibility',
      description: 'Real-time dashboards provide complete transparency into team workload.',
      icon: Eye,
    },
    {
      title: 'Less task confusion',
      description: 'Defined priorities, statuses, and due dates keep everyone focused.',
      icon: CheckCircle2,
    },
    {
      title: 'Faster collaboration',
      description: 'Contextual task discussions reduce endless chat threads and email chains.',
      icon: Zap,
    },
    {
      title: 'Easier progress tracking',
      description: 'Visual progress bars automatically aggregate task completion metrics.',
      icon: BarChart,
    },
    {
      title: 'Centralized project management',
      description: 'Bring teams, tasks, members, and documentation under one roof.',
      icon: Users,
    },
  ];

  return (
    <section id="why-align" className="py-16 sm:py-20 bg-theme-bg border-b border-theme-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-theme-main">
            Why teams use Align
          </h2>
          <p className="text-sm sm:text-base text-theme-muted leading-relaxed">
            Engineered to eliminate project friction and streamline daily execution.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {benefitPoints.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="saas-card p-6 rounded-xl border border-theme-border bg-theme-surface flex items-start gap-4 hover:border-theme-primary/40 transition duration-200"
              >
                <div className="w-10 h-10 rounded-lg bg-theme-primary/10 text-theme-primary flex items-center justify-center shrink-0 border border-theme-primary/20">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="space-y-1 text-left">
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
