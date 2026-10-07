import React from 'react';
import { ShieldCheck, UserCheck, Check } from 'lucide-react';

export const Roles: React.FC = () => {
  const roleCards = [
    {
      title: 'Admin',
      badge: 'System Administrator',
      badgeStyle: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
      description: 'Full workspace authority and organizational control.',
      items: [
        'Create users & manage accounts',
        'Create teams & manage rosters',
        'Assign team leads',
        'Manage high-level projects',
        'View organization progress & metrics',
      ],
    },
    {
      title: 'Team Lead',
      badge: 'Team Leader',
      badgeStyle: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      description: 'Project coordination and team execution oversight.',
      items: [
        'Manage assigned teams',
        'Create and assign tasks',
        'Track member workload',
        'Monitor project progress & status',
      ],
    },
    {
      title: 'Member',
      badge: 'Individual Contributor',
      badgeStyle: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      description: 'Focused execution on assigned deliverables.',
      items: [
        'View assigned work',
        'Update task status & progress',
        'Add comments & feedback',
        'Track personal due dates & deadlines',
      ],
    },
  ];

  return (
    <section id="roles" className="py-16 sm:py-20 bg-theme-bg border-b border-theme-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-theme-main">
            Tailored experiences for every role
          </h2>
          <p className="text-sm sm:text-base text-theme-muted leading-relaxed">
            Role-based permissions ensure everyone sees exactly what they need to get work done.
          </p>
        </div>

        {/* 3 Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {roleCards.map((role, idx) => (
            <div
              key={idx}
              className="saas-card p-6 rounded-xl border border-theme-border bg-theme-surface flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-extrabold text-theme-main tracking-tight">
                    {role.title}
                  </h3>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${role.badgeStyle}`}>
                    {role.badge}
                  </span>
                </div>

                <p className="text-xs text-theme-muted leading-snug">
                  {role.description}
                </p>

                <div className="pt-3 border-t border-theme-border/60 space-y-2.5">
                  {role.items.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-theme-secondary">
                      <div className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
