export type UserRole = 'ADMIN' | 'MEMBER';

export type TaskStatus = 'To Do' | 'In Progress' | 'Review' | 'Completed';

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export type ProjectStatus = 'Active' | 'Completed' | 'On Hold' | 'Archived';

export interface TeamRoleInfo {
  team_id: number;
  team_name: string;
  is_lead: boolean;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  teams_info?: TeamRoleInfo[];
}

export interface TeamMember {
  id: number;
  user_id: number;
  team_id: number;
  joined_at: string;
  user: User;
}

export interface Team {
  id: number;
  name: string;
  description?: string;
  lead_id?: number;
  created_at: string;
  updated_at: string;
  lead?: User;
  members: TeamMember[];
  member_count?: number;
  project_count?: number;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  team_id: number;
  status: ProjectStatus;
  start_date?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
  team?: Team;
  task_count?: number;
  completed_task_count?: number;
  progress_percentage?: number;
}

export interface TaskComment {
  id: number;
  task_id: number;
  user_id: number;
  content: string;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  project_id: number;
  assigned_to_id?: number;
  created_by_id?: number;
  priority: TaskPriority;
  status: TaskStatus;
  start_date?: string;
  due_date?: string;
  completed_date?: string;
  created_at: string;
  updated_at: string;
  is_overdue?: boolean;
  project?: Project;
  assigned_to?: User;
  created_by?: User;
  comments?: TaskComment[];
}

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  is_read: boolean;
  link?: string;
  created_at: string;
}

export interface DashboardMetrics {
  total_teams?: number;
  total_users?: number;
  total_projects?: number;
  total_tasks?: number;
  completed_tasks?: number;
  pending_tasks?: number;
  overdue_tasks?: number;
  teams_managed?: number;
  assigned_projects?: number;
  team_members?: number;
  my_teams_count?: number;
  my_projects_count?: number;
  my_assigned_tasks?: number;
  todo_tasks?: number;
  in_progress_tasks?: number;
  review_tasks?: number;
}

export interface DashboardData {
  view_type: 'ADMIN' | 'LEAD' | 'MEMBER';
  metrics: DashboardMetrics;
  recent_projects?: any[];
  team_progress?: any[];
  member_progress?: any[];
  recent_activity?: any[];
  my_projects?: any[];
  upcoming_deadlines?: any[];
}
