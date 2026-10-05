import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/userService';
import type { NotificationItem } from '../../types';
import { ThemeToggle } from './ThemeToggle';
import { Bell, LogOut, User as UserIcon, Menu, Layers, Check, ChevronRight, Search } from 'lucide-react';
import { formatDateTime } from '../../utils/format';

interface NavbarProps {
  onToggleSidebar: () => void;
}

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/user-management': 'User Management',
  '/teams': 'Teams',
  '/projects': 'Projects',
  '/tasks': 'Tasks',
  '/my-tasks': 'My Assigned Tasks',
  '/members': 'Members Directory',
  '/profile': 'User Profile',
};

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Compute breadcrumb title
  const currentPath = location.pathname;
  const pageTitle = pageTitles[currentPath] || (currentPath.startsWith('/teams/') ? 'Team Details' : currentPath.startsWith('/projects/') ? 'Project Details' : 'Align');

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkRead = async (id: number, link?: string) => {
    try {
      await notificationService.markRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      if (link) {
        setShowNotifications(false);
        navigate(link);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-theme-bg border-b border-theme-border px-4 lg:px-6 h-14 flex items-center justify-between transition-colors">
      {/* Left Branding & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-1.5 text-theme-muted hover:text-theme-main rounded-md hover:bg-theme-surface transition"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link to="/" className="flex items-center gap-2 font-bold text-sm text-theme-main">
          <div className="w-6.5 h-6.5 rounded-md bg-theme-primary text-white flex items-center justify-center font-extrabold text-xs">
            <Layers className="w-4 h-4" />
          </div>
          <span className="hidden sm:inline-block tracking-tight text-theme-main">Align</span>
        </Link>

        <ChevronRight className="w-3.5 h-3.5 text-theme-muted hidden sm:inline-block" />

        <span className="text-xs font-semibold text-theme-main truncate max-w-[140px] sm:max-w-none">
          {pageTitle}
        </span>
      </div>

      {/* Center Search Box */}
      <div className="hidden md:flex items-center relative w-64 lg:w-80">
        <Search className="w-3.5 h-3.5 text-theme-muted absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="Search workspace tasks, projects, members..."
          className="w-full bg-theme-surface border border-theme-border rounded-md pl-9 pr-3 py-1.5 text-xs text-theme-main placeholder:text-theme-muted focus:outline-none focus:border-theme-primary transition"
        />
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Theme Switcher Toggle */}
        <ThemeToggle />

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-1.5 rounded-md text-theme-muted hover:text-theme-main hover:bg-theme-surface transition"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>



          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-88 rounded-xl bg-theme-surface border border-theme-border shadow-lg p-3 z-50 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-theme-border pb-2.5 mb-2">
                <h3 className="text-xs font-semibold text-theme-main flex items-center gap-1.5">
                  Notifications {unreadCount > 0 && <span className="text-[10px] bg-rose-500/10 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded font-bold">{unreadCount} new</span>}
                </h3>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-theme-primary hover:underline flex items-center gap-1 font-medium"
                  >
                    <Check className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
                {notifications.length === 0 ? (
                  <div className="text-center py-6 text-theme-muted text-xs">No notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleMarkRead(n.id, n.link)}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                        n.is_read
                          ? 'bg-theme-bg/60 border-theme-border text-theme-muted'
                          : 'bg-theme-surface border-theme-border text-theme-main font-medium'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-semibold text-theme-main">{n.title}</span>
                        <span className="text-[10px] text-theme-muted">{formatDateTime(n.created_at)}</span>
                      </div>
                      <p className="text-[11px] text-theme-muted leading-snug">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-theme-surface-active border border-theme-border transition"
          >
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.full_name} className="w-7 h-7 rounded-md object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-md bg-theme-primary text-white flex items-center justify-center text-xs font-bold">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
            )}
            <span className="hidden md:inline-block text-xs font-semibold text-theme-main pr-1">
              {user?.full_name}
            </span>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-52 rounded-xl bg-theme-surface border border-theme-border shadow-lg p-1.5 z-50">
              <div className="px-3 py-2 border-b border-theme-border mb-1">
                <p className="text-xs font-semibold text-theme-main">{user?.full_name}</p>
                <p className="text-[11px] text-theme-muted truncate">{user?.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold bg-theme-bg text-theme-primary border border-theme-border">
                  {user?.role}
                </span>
              </div>

              <Link
                to="/profile"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-theme-main hover:bg-theme-surface-active rounded-lg transition"
              >
                <UserIcon className="w-3.5 h-3.5 text-theme-muted" /> Profile Settings
              </Link>

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  logout();
                  navigate('/login');
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition mt-1"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
