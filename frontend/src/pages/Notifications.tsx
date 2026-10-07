import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../services/userService';
import type { NotificationItem } from '../types';
import { formatDateTime } from '../utils/format';
import {
  Bell,
  Check,
  Trash2,
  UserPlus,
  UserCheck,
  Users,
  ShieldCheck,
  CheckSquare,
  MessageSquare,
  Folder,
  AlertCircle,
  Clock,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';

const getNotificationIcon = (type?: string) => {
  switch (type) {
    case 'FRIEND_REQUEST':
      return <UserPlus className="w-4 h-4 text-blue-500" />;
    case 'FRIEND_REQUEST_ACCEPTED':
      return <UserCheck className="w-4 h-4 text-emerald-500" />;
    case 'TEAM_INVITATION':
      return <Users className="w-4 h-4 text-blue-500" />;
    case 'TEAM_INVITATION_ACCEPTED':
      return <UserCheck className="w-4 h-4 text-teal-500" />;
    case 'TEAM_ROLE_CHANGED':
      return <ShieldCheck className="w-4 h-4 text-amber-500" />;
    case 'TASK_ASSIGNED':
      return <CheckSquare className="w-4 h-4 text-blue-500" />;
    case 'TASK_STATUS_CHANGED':
      return <CheckSquare className="w-4 h-4 text-blue-500" />;
    case 'TASK_COMMENT_ADDED':
      return <MessageSquare className="w-4 h-4 text-amber-500" />;
    case 'PROJECT_UPDATED':
      return <Folder className="w-4 h-4 text-blue-500" />;
    case 'TASK_DUE_SOON':
      return <Clock className="w-4 h-4 text-amber-500" />;
    case 'TASK_OVERDUE':
      return <AlertCircle className="w-4 h-4 text-rose-500" />;
    default:
      return <Bell className="w-4 h-4 text-theme-primary" />;
  }
};

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (e) {
      console.error('Failed to load notifications:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id: number) => {
    try {
      await notificationService.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
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

  const handleDelete = async (id: number) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearRead = async () => {
    try {
      await notificationService.deleteReadNotifications();
      setNotifications((prev) => prev.filter((n) => !n.is_read));
    } catch (e) {
      console.error(e);
    }
  };

  const handleNavigate = (n: NotificationItem) => {
    if (!n.is_read) {
      handleMarkRead(n.id);
    }
    const targetUrl = n.action_url || n.link;
    if (targetUrl) {
      navigate(targetUrl);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const filteredNotifications = notifications.filter((n) =>
    filter === 'unread' ? !n.is_read : true
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-theme-surface p-5 rounded-2xl border border-theme-border shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-theme-main">Notifications</h1>
            {unreadCount > 0 && (
              <span className="bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold px-2 py-0.5 rounded-full border border-rose-500/20">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-xs text-theme-muted mt-1">
            Stay updated with friend requests, team updates, and task assignments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-theme-surface hover:bg-theme-surface-active text-theme-main border border-theme-border rounded-lg transition"
            >
              <Check className="w-3.5 h-3.5 text-emerald-500" /> Mark all read
            </button>
          )}

          {notifications.some((n) => n.is_read) && (
            <button
              onClick={handleClearRead}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-theme-surface hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-theme-border hover:border-rose-500/30 rounded-lg transition"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear read
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-theme-border pb-1">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
              filter === 'all'
                ? 'bg-theme-primary text-white shadow-sm'
                : 'text-theme-muted hover:text-theme-main hover:bg-theme-surface'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
              filter === 'unread'
                ? 'bg-theme-primary text-white shadow-sm'
                : 'text-theme-muted hover:text-theme-main hover:bg-theme-surface'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>
      </div>

      {/* Notification List */}
      {loading ? (
        <div className="text-center py-12 text-theme-muted text-xs">
          Loading notifications...
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="text-center py-16 bg-theme-surface rounded-2xl border border-theme-border">
          <CheckCircle2 className="w-10 h-10 text-theme-muted mx-auto mb-3 opacity-40" />
          <h3 className="text-sm font-semibold text-theme-main">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
          </h3>
          <p className="text-xs text-theme-muted mt-1 max-w-sm mx-auto">
            {filter === 'unread'
              ? "You're all caught up! Check the 'All' tab to review previous notifications."
              : 'Notifications about team invitations, tasks, and friends will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredNotifications.map((n) => {
            const targetUrl = n.action_url || n.link;
            return (
              <div
                key={n.id}
                className={`p-4 rounded-xl border transition flex items-start justify-between gap-4 ${
                  n.is_read
                    ? 'bg-theme-surface/50 border-theme-border/60 text-theme-muted'
                    : 'bg-theme-surface border-theme-border text-theme-main shadow-sm font-medium'
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div className="p-2.5 rounded-xl bg-theme-bg border border-theme-border shrink-0 mt-0.5">
                    {getNotificationIcon(n.type)}
                  </div>

                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-theme-main">
                        {n.title}
                      </h4>
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 inline-block shrink-0" />
                      )}
                      <span className="text-[11px] text-theme-muted ml-auto">
                        {formatDateTime(n.created_at)}
                      </span>
                    </div>

                    <p className="text-xs text-theme-muted leading-relaxed">
                      {n.message}
                    </p>

                    {targetUrl && (
                      <button
                        onClick={() => handleNavigate(n)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-theme-primary hover:underline mt-1"
                      >
                        View Details <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {!n.is_read && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      title="Mark as read"
                      className="p-1.5 text-theme-muted hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(n.id)}
                    title="Delete notification"
                    className="p-1.5 text-theme-muted hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
