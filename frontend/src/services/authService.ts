import { api } from './api';
import type { User } from '../types';

export interface LoginParams {
  email: string;
  password: string;
}

export interface RegisterParams {
  email: string;
  password: string;
  full_name: string;
  role?: string;
  avatar_url?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export const authService = {
  async login(params: LoginParams): Promise<AuthResponse> {
    const data = await api.post<AuthResponse>('/auth/login', params);
    localStorage.setItem('align_token', data.access_token);
    localStorage.setItem('align_user', JSON.stringify(data.user));
    return data;
  },

  async register(params: RegisterParams): Promise<User> {
    return api.post<User>('/auth/register', params);
  },

  async getCurrentUser(): Promise<User> {
    const user = await api.get<User>('/auth/me');
    localStorage.setItem('align_user', JSON.stringify(user));
    return user;
  },

  logout() {
    localStorage.removeItem('align_token');
    localStorage.removeItem('align_user');
  },

  getStoredUser(): User | null {
    const str = localStorage.getItem('align_user');
    if (!str) return null;
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  }
};
