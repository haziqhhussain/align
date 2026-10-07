import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, FolderKanban, CheckSquare, ListTodo, UserCheck, User, UserCog, Layers, UserPlus, Mail, Bell, Activity, Calendar as CalendarIcon, BarChart3 } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const navSections = [
    {
      title: 'WORKSPACE',
      items: [{ label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }],
    },
    {
      title: 'COLLABORATION',
      items: [
        { label: 'Connections', path: '/connections', icon: UserPlus },
        { label: 'Teams', path: '/teams', icon: Users },
        { label: 'Invitations', path: '/invitations', icon: Mail },
        { label: 'Members', path: '/members', icon: UserCheck },
      ],
    },
    {
      title: 'WORK',
      items: [
        { label: 'Projects', path: '/projects', icon: FolderKanban },
        { label: 'All Tasks', path: '/tasks', icon: CheckSquare },
        { label: 'My Tasks', path: '/my-tasks', icon: ListTodo },
        { label: 'Calendar', path: '/calendar', icon: CalendarIcon },
      ],
    },
    {
      title: 'INSIGHTS',
      items: [
        { label: 'Activity Log', path: '/activity', icon: Activity },
        { label: 'Analytics', path: '/analytics', icon: BarChart3 },
        { label: 'Notifications', path: '/notifications', icon: Bell },
      ],
    },
    {
      title: 'ACCOUNT',
      items: [{ label: 'Profile', path: '/profile', icon: User }],
    },
    ...(user?.role === 'ADMIN'
      ? [
          {
            title: 'ADMINISTRATION',
            items: [{ label: 'User Management', path: '/user-management', icon: UserCog }],
          },
        ]
      : []),
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-56 bg-theme-surface border-r border-theme-border py-4 px-3 flex flex-col justify-between transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-4 overflow-y-auto pr-0.5">
          {/* Brand Header */}
          <div className="px-2 py-1 flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-6.5 h-6.5 rounded-md bg-theme-primary text-white flex items-center justify-center font-bold text-xs shadow-xs">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-sm tracking-tight text-theme-main">Align</span>
            </Link>
            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-theme-surface-soft text-theme-primary border border-theme-border-soft">
              {user?.role}
            </span>
          </div>

          {/* Grouped Navigation Links */}
          <nav className="space-y-3.5 pt-1">
            {navSections.map((section) => (
              <div key={section.title} className="space-y-0.5">
                <h4 className="px-2 text-[10px] font-bold text-theme-muted/70 tracking-wider uppercase">
                  {section.title}
                </h4>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => onClose()}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-theme-surface-active text-theme-primary font-semibold'
                            : 'text-theme-secondary hover:text-theme-main hover:bg-theme-surface-soft'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Compact User Footer */}
        <div className="pt-3 border-t border-theme-border">
          <Link
            to="/profile"
            onClick={() => onClose()}
            className="px-2 py-1.5 rounded-md hover:bg-theme-surface flex items-center gap-2.5 transition-colors group"
          >
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.full_name} className="w-7 h-7 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-theme-primary/10 text-theme-primary font-bold text-xs flex items-center justify-center shrink-0 border border-theme-primary/20">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
            )}
            <div className="overflow-hidden min-w-0">
              <p className="text-xs font-bold text-theme-main truncate group-hover:text-theme-primary transition-colors">
                {user?.full_name}
              </p>
              <p className="text-[10px] text-theme-muted truncate">{user?.email}</p>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
};




