export type UserRole = 'ADMIN' | 'MEMBER';

export type TaskStatus = 'To Do' | 'In Progress' | 'Review' | 'Completed';

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export type ProjectStatus = 'Active' | 'Completed' | 'On Hold' | 'Archived';

export type FriendRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';

export type TeamInvitationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';

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

export interface FriendRequest {
  id: number;
  sender_id: number;
  receiver_id: number;
  status: FriendRequestStatus;
  created_at: string;
  updated_at: string;
  sender: User;
  receiver: User;
}

export interface Friendship {
  id: number;
  user_id: number;
  friend_id: number;
  created_at: string;
  friend: User;
}

export interface UserSearchResult extends User {
  friendship_status: 'NONE' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'FRIENDS' | 'SELF';
  friend_request_id?: number;
  shared_teams_count?: number;
}

export interface SharedTeam {
  team_id: number;
  team_name: string;
}

export interface UserPublicProfile extends User {
  friendship_status: 'NONE' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'FRIENDS' | 'SELF';
  friend_request_id?: number;
  teams_info?: { team_id: number; team_name: string; role?: string; is_lead?: boolean }[];
  shared_teams?: SharedTeam[];
}

export interface TeamMember {
  id: number;
  user_id: number;
  team_id: number;
  role: 'OWNER' | 'LEAD' | 'MEMBER' | string;
  joined_at: string;
  user: User;
}

export interface Team {
  id: number;
  name: string;
  description?: string;
  owner_id?: number;
  lead_id?: number;
  created_at: string;
  updated_at: string;
  owner?: User;
  lead?: User;
  members: TeamMember[];
  member_count?: number;
  project_count?: number;
}

export interface TeamInvitation {
  id: number;
  team_id: number;
  sender_id: number;
  receiver_id: number;
  role: string;
  status: TeamInvitationStatus;
  created_at: string;
  updated_at: string;
  team: Team;
  sender: User;
  receiver: User;
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

export interface Subtask {
  id: number;
  task_id: number;
  title: string;
  description?: string;
  is_completed: boolean;
  position: number;
  assigned_to_id?: number;
  created_by_id?: number;
  completed_by_id?: number;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  assigned_to?: User;
  created_by?: User;
  completed_by?: User;
}

export interface SubtaskCreate {
  title: string;
  description?: string;
  assigned_to_id?: number;
}

export interface SubtaskUpdate {
  title?: string;
  description?: string;
  assigned_to_id?: number;
  is_completed?: boolean;
  position?: number;
}

export interface SubtaskReorderItem {
  id: number;
  position: number;
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
  subtask_count?: number;
  completed_subtask_count?: number;
  subtask_progress?: number;
  project?: Project;
  assigned_to?: User;
  created_by?: User;
  comments?: TaskComment[];
  subtasks?: Subtask[];
}

export type NotificationType =
  | 'FRIEND_REQUEST'
  | 'FRIEND_REQUEST_ACCEPTED'
  | 'TEAM_INVITATION'
  | 'TEAM_INVITATION_ACCEPTED'
  | 'TEAM_ROLE_CHANGED'
  | 'TASK_ASSIGNED'
  | 'TASK_STATUS_CHANGED'
  | 'TASK_COMMENT_ADDED'
  | 'PROJECT_UPDATED'
  | 'TASK_DUE_SOON'
  | 'TASK_OVERDUE';

export interface NotificationItem {
  id: number;
  user_id: number;
  type?: NotificationType | string;
  title: string;
  message: string;
  is_read: boolean;
  link?: string;
  action_url?: string;
  related_entity_type?: string;
  related_entity_id?: number;
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
  pending_friend_requests?: number;
  pending_team_invitations?: number;
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

export type CalendarEventType = 'TASK' | 'PROJECT';

export interface CalendarEvent {
  id: string;
  entity_id: number;
  type: CalendarEventType;
  title: string;
  description?: string;
  start: string;
  end: string;
  status: string;
  priority?: TaskPriority | string;
  team_id?: number;
  team_name?: string;
  project_id?: number;
  project_name?: string;
  assignee_id?: number;
  assignee_name?: string;
  assignee_avatar?: string;
  is_overdue: boolean;
  subtask_count?: number;
  completed_subtask_count?: number;
  subtask_progress?: number;
}

export interface UpcomingDeadline {
  id: string;
  entity_id: number;
  type: CalendarEventType;
  title: string;
  date: string;
  due_date_formatted: string;
  relative_label: string;
  status: string;
  priority?: string;
  project_name?: string;
  assignee_name?: string;
  is_overdue: boolean;
}

export interface CalendarFilters {
  team_id?: number;
  project_id?: number;
  assignee_id?: number;
  event_type?: 'ALL' | 'TASK' | 'PROJECT';
  status?: string;
  my_calendar_only?: boolean;
}

export interface AttachmentUserSummary {
  id: number;
  full_name: string;
  avatar_url?: string;
}

export interface Attachment {
  id: number;
  file_name: string;
  file_size: number;
  mime_type: string;
  uploaded_by: AttachmentUserSummary;
  task_id?: number;
  project_id?: number;
  created_at: string;
}

export interface AttachmentUploadState {
  isUploading: boolean;
  progress: number;
  error?: string;
}

export interface AnalyticsSummary {
  total_members: number;
  total_tasks: number;
  active_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  due_this_week: number;
  high_priority_tasks: number;
  unassigned_tasks: number;
  completion_rate: number;
  average_tasks_per_member: number;
}

export interface MemberWorkload {
  user_id: number;
  full_name: string;
  email: string;
  avatar_url?: string;
  total_assigned: number;
  active_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  due_this_week: number;
  subtask_count: number;
  priority_breakdown: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    CRITICAL: number;
  };
  status_breakdown: {
    TO_DO: number;
    IN_PROGRESS: number;
    REVIEW: number;
    COMPLETED: number;
  };
  workload_score: number;
  workload_level: 'LOW' | 'BALANCED' | 'HIGH' | 'OVERLOADED';
}

export interface TeamWorkload {
  team_id: number;
  team_name: string;
  member_count: number;
  active_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  completion_rate: number;
  average_workload_score: number;
}

export interface ProjectWorkload {
  project_id: number;
  project_name: string;
  team_id: number;
  team_name: string;
  task_count: number;
  active_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  due_soon_count: number;
  completion_rate: number;
}

export interface AnalyticsTrendPoint {
  date: string;
  count: number;
}

export interface AnalyticsTrends {
  period: string;
  completed_tasks: AnalyticsTrendPoint[];
  created_tasks: AnalyticsTrendPoint[];
}

export interface AnalyticsFilters {
  team_id?: number;
  project_id?: number;
  member_id?: number;
  period?: '7d' | '30d' | '90d';
}

export type ActivityType =
  | 'USER_REGISTERED'
  | 'FRIEND_REQUEST_SENT'
  | 'FRIEND_REQUEST_ACCEPTED'
  | 'FRIEND_REMOVED'
  | 'TEAM_CREATED'
  | 'TEAM_UPDATED'
  | 'TEAM_DELETED'
  | 'TEAM_MEMBER_INVITED'
  | 'TEAM_MEMBER_JOINED'
  | 'TEAM_MEMBER_REMOVED'
  | 'TEAM_ROLE_CHANGED'
  | 'PROJECT_CREATED'
  | 'PROJECT_UPDATED'
  | 'PROJECT_STATUS_CHANGED'
  | 'PROJECT_DELETED'
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'TASK_ASSIGNED'
  | 'TASK_REASSIGNED'
  | 'TASK_STATUS_CHANGED'
  | 'TASK_PRIORITY_CHANGED'
  | 'TASK_DUE_DATE_CHANGED'
  | 'TASK_COMPLETED'
  | 'TASK_DELETED'
  | 'COMMENT_ADDED'
  | 'COMMENT_UPDATED'
  | 'COMMENT_DELETED';

export type EntityType =
  | 'USER'
  | 'TEAM'
  | 'PROJECT'
  | 'TASK'
  | 'COMMENT'
  | 'FRIENDSHIP'
  | 'TEAM_INVITATION'
  | 'ROLE';

export interface ActivityActor {
  id: number;
  full_name: string;
  email: string;
  avatar_url?: string;
}

export interface ActivityLog {
  id: number;
  actor_id: number;
  action_type: ActivityType | string;
  entity_type: EntityType | string;
  entity_id?: number;
  team_id?: number;
  project_id?: number;
  task_id?: number;
  target_user_id?: number;
  description: string;
  metadata_json?: Record<string, any>;
  created_at: string;
  actor?: ActivityActor;
  target_user?: ActivityActor;
  team_name?: string;
  project_name?: string;
  task_title?: string;
}

export interface ActivityFilters {
  team_id?: number;
  project_id?: number;
  task_id?: number;
  actor_id?: number;
  action_type?: string;
  entity_type?: string;
  page?: number;
  limit?: number;
}

export interface ActivityListResponse {
  items: ActivityLog[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}
