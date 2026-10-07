import React from 'react';
import { Users, FolderKanban, CheckSquare, ShieldCheck, BarChart3, MessageSquare } from 'lucide-react';

export const Features: React.FC = () => {
  const featuresList = [
    {
      icon: Users,
      title: 'Team Management',
      description: 'Create teams, add members, and assign team leads with clear structural ownership.',
    },
    {
      icon: FolderKanban,
      title: 'Project Tracking',
      description: 'Create projects, track deadlines, and monitor real-time milestone progress.',
    },
    {
      icon: CheckSquare,
      title: 'Task Assignment',
      description: 'Assign tasks to members with priority levels, status tags, and due dates.',
    },
    {
      icon: ShieldCheck,
      title: 'Role-Based Access',
      description: 'Admins, Team Leads, and Members see only the data and actions relevant to them.',
    },
    {
      icon: BarChart3,
      title: 'Progress Monitoring',
      description: 'View team workload, completed tasks, overdue work, and overall project completion.',
    },
    {
      icon: MessageSquare,
      title: 'Collaboration',
      description: 'Discuss work directly on tasks using real-time comments and shared team updates.',
    },
  ];

  return (
    <section id="features" className="py-16 sm:py-20 bg-theme-bg border-b border-theme-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-theme-main">
            Everything your team needs to stay aligned.
          </h2>
          <p className="text-sm sm:text-base text-theme-muted leading-relaxed">
            Purpose-built tools designed for maximum clarity, accountability, and project visibility.
          </p>
        </div>

        {/* 6 Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {featuresList.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="saas-card p-6 rounded-xl border border-theme-border bg-theme-surface hover:border-theme-primary/50 transition duration-200 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-lg bg-theme-primary/10 text-theme-primary flex items-center justify-center border border-theme-primary/20">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-theme-main tracking-tight">
                    {feat.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-theme-muted leading-relaxed">
                    {feat.description}
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
