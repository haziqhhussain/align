import { api } from './api';
import type { User, FriendRequest, UserSearchResult, TeamInvitation } from '../types';

export const socialService = {
  // User Search & Discovery
  searchUsers: (query?: string): Promise<UserSearchResult[]> => {
    const qParam = query ? `?q=${encodeURIComponent(query)}` : '';
    return api.get<UserSearchResult[]>(`/users/search${qParam}`);
  },

  // Friends & Requests
  getFriends: (): Promise<User[]> => {
    return api.get<User[]>('/friends');
  },

  removeFriend: (userId: number): Promise<void> => {
    return api.delete<void>(`/friends/${userId}`);
  },

  getFriendRequests: (): Promise<FriendRequest[]> => {
    return api.get<FriendRequest[]>('/friend-requests');
  },

  getIncomingFriendRequests: (): Promise<FriendRequest[]> => {
    return api.get<FriendRequest[]>('/friend-requests/incoming');
  },

  getOutgoingFriendRequests: (): Promise<FriendRequest[]> => {
    return api.get<FriendRequest[]>('/friend-requests/outgoing');
  },

  sendFriendRequest: (userId: number): Promise<FriendRequest> => {
    return api.post<FriendRequest>(`/friend-requests/${userId}`);
  },

  acceptFriendRequest: (requestId: number): Promise<FriendRequest> => {
    return api.patch<FriendRequest>(`/friend-requests/${requestId}/accept`);
  },

  rejectFriendRequest: (requestId: number): Promise<FriendRequest> => {
    return api.patch<FriendRequest>(`/friend-requests/${requestId}/reject`);
  },

  cancelFriendRequest: (requestId: number): Promise<void> => {
    return api.delete<void>(`/friend-requests/${requestId}`);
  },

  // Team Invitations
  getIncomingTeamInvitations: (): Promise<TeamInvitation[]> => {
    return api.get<TeamInvitation[]>('/team-invitations');
  },

  getTeamInvitationsForTeam: (teamId: number): Promise<TeamInvitation[]> => {
    return api.get<TeamInvitation[]>(`/teams/${teamId}/invitations`);
  },

  inviteUserToTeam: (teamId: number, userId: number): Promise<TeamInvitation> => {
    return api.post<TeamInvitation>(`/teams/${teamId}/invitations/${userId}`);
  },

  acceptTeamInvitation: (invitationId: number): Promise<TeamInvitation> => {
    return api.patch<TeamInvitation>(`/team-invitations/${invitationId}/accept`);
  },

  rejectTeamInvitation: (invitationId: number): Promise<TeamInvitation> => {
    return api.patch<TeamInvitation>(`/team-invitations/${invitationId}/reject`);
  },

  cancelTeamInvitation: (invitationId: number): Promise<void> => {
    return api.delete<void>(`/team-invitations/${invitationId}`);
  },
};
