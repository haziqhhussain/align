import { api } from './api';
import type { User, UserRole, DashboardData, NotificationItem, UserPublicProfile } from '../types';

export interface CreateUserParams {
  full_name: string;
  email: string;
  password: string;
  role: UserRole;
  avatar_url?: string;
}

export const userService = {
  getUsers(search?: string): Promise<User[]> {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return api.get<User[]>(`/users${query}`);
  },

  getUser(id: number): Promise<UserPublicProfile> {
    return api.get<UserPublicProfile>(`/users/${id}`);
  },

  getUserProfile(id: number): Promise<UserPublicProfile> {
    return api.get<UserPublicProfile>(`/users/${id}`);
  },

  createUser(data: CreateUserParams): Promise<User> {
    return api.post<User>('/users', data);
  },

  updateUserRole(userId: number, role: UserRole): Promise<User> {
    return api.patch<User>(`/users/${userId}/role`, { role });
  },

  updateUser(id: number, data: Partial<User>): Promise<User> {
    return api.put<User>(`/users/${id}`, data);
  },

  deleteUser(id: number): Promise<void> {
    return api.delete(`/users/${id}`);
  }
};

export const dashboardService = {
  getStats(): Promise<DashboardData> {
    return api.get<DashboardData>('/dashboard/stats');
  }
};

export const notificationService = {
  getNotifications(unreadOnly = false): Promise<NotificationItem[]> {
    return api.get<NotificationItem[]>(`/notifications${unreadOnly ? '?unread_only=true' : ''}`);
  },

  getUnreadCount(): Promise<{ unread_count: number }> {
    return api.get<{ unread_count: number }>('/notifications/unread-count');
  },

  markRead(id: number): Promise<NotificationItem> {
    return api.patch<NotificationItem>(`/notifications/${id}/read`);
  },

  markAllRead(): Promise<void> {
    return api.patch('/notifications/read-all');
  },

  deleteNotification(id: number): Promise<void> {
    return api.delete(`/notifications/${id}`);
  },

  deleteReadNotifications(): Promise<void> {
    return api.delete('/notifications/read');
  }
};
