import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, FolderKanban, CheckSquare, ListTodo, UserCheck, User, UserCog, Layers } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const mainNavItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    ...(user?.role === 'ADMIN' ? [{ label: 'User Management', path: '/user-management', icon: UserCog }] : []),
    { label: 'Teams', path: '/teams', icon: Users },
    { label: 'Projects', path: '/projects', icon: FolderKanban },
    { label: 'All Tasks', path: '/tasks', icon: CheckSquare },
    { label: 'My Tasks', path: '/my-tasks', icon: ListTodo },
    { label: 'Members', path: '/members', icon: UserCheck },
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
        className={`fixed top-0 bottom-0 left-0 z-50 w-56 bg-theme-bg border-r border-theme-border py-4 px-3 flex flex-col justify-between transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-4">
          {/* Minimal Brand Header */}
          <div className="px-2 py-1 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-6.5 h-6.5 rounded-md bg-theme-primary text-white flex items-center justify-center font-bold text-xs">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-sm tracking-tight text-theme-main">Align</span>
            </Link>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-theme-surface text-theme-muted border border-theme-border">
              {user?.role}
            </span>
          </div>

          {/* Main Navigation Links */}
          <nav className="space-y-0.5">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={() => onClose()}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-theme-surface-active text-theme-primary font-semibold'
                        : 'text-theme-muted hover:text-theme-main hover:bg-theme-surface'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer Section with Separator and Profile */}
        <div className="space-y-3 pt-3 border-t border-theme-border">
          <NavLink
            to="/profile"
            onClick={() => onClose()}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-theme-surface-active text-theme-primary font-semibold'
                  : 'text-theme-muted hover:text-theme-main hover:bg-theme-surface'
              }`
            }
          >
            <User className="w-4 h-4 shrink-0" />
            <span>Profile Settings</span>
          </NavLink>

          <div className="px-2 pt-2 border-t border-theme-border/60 flex items-center gap-2.5">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.full_name} className="w-8 h-8 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-theme-surface-active text-theme-primary font-bold text-xs flex items-center justify-center shrink-0">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
            )}
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-theme-main truncate">{user?.full_name}</p>
              <p className="text-[10px] text-theme-muted truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};




