import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { userService } from '../services/userService';
import { socialService } from '../services/socialService';
import { teamService } from '../services/teamService';
import type { UserPublicProfile, Team } from '../types';
import { formatDate } from '../utils/format';
import {
  User as UserIcon,
  Users,
  UserPlus,
  UserCheck,
  UserMinus,
  Check,
  X,
  Mail,
  Shield,
  Calendar,
  Layers,
  Crown,
  ChevronRight,
  ShieldAlert,
  Clock,
  Send,
  Plus
} from 'lucide-react';

export const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const targetId = Number(userId);
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserPublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Invite to Team state
  const [myManagedTeams, setMyManagedTeams] = useState<Team[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [invitingTeamId, setInvitingTeamId] = useState<number | null>(null);
  const [invitedTeamIds, setInvitedTeamIds] = useState<number[]>([]);

  const fetchProfile = async () => {
    if (!targetId || isNaN(targetId)) {
      setError('Invalid user ID');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await userService.getUserProfile(targetId);
      setProfile(data);
    } catch (err: any) {
      console.error('Error fetching user profile:', err);
      setError(err.message || 'User not found or unable to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchManagedTeams = async () => {
    if (!currentUser) return;
    try {
      const allTeams = await teamService.getTeams();
      const managed = allTeams.filter(
        (t) => t.owner_id === currentUser.id || t.lead_id === currentUser.id
      );
      setMyManagedTeams(managed);
    } catch (e) {
      console.error('Error loading managed teams:', e);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchManagedTeams();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-3 border-theme-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-theme-muted font-medium">Loading user profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="saas-panel p-8 text-center space-y-4 max-w-md mx-auto my-10 border-rose-500/30">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-theme-main">User Profile Not Found</h3>
          <p className="text-xs text-theme-muted">{error || 'The requested profile does not exist.'}</p>
        </div>
        <Link
          to="/connections"
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-theme-primary text-white text-xs font-medium hover:bg-theme-primary-hover transition"
        >
          Back to Connections
        </Link>
      </div>
    );
  }

  const isSelf = profile.id === currentUser?.id || profile.friendship_status === 'SELF';
  const friendshipStatus = profile.friendship_status;

  // Social Friend Actions
  const handleSendRequest = async () => {
    setActionLoading(true);
    try {
      await socialService.sendFriendRequest(profile.id);
      showToast(`Friend request sent to ${profile.full_name}`, 'success');
      fetchProfile();
    } catch (e: any) {
      showToast(e.message || 'Failed to send friend request', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!profile.friend_request_id) return;
    setActionLoading(true);
    try {
      await socialService.acceptFriendRequest(profile.friend_request_id);
      showToast(`Accepted friend request from ${profile.full_name}`, 'success');
      fetchProfile();
    } catch (e: any) {
      showToast(e.message || 'Failed to accept friend request', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectRequest = async () => {
    if (!profile.friend_request_id) return;
    setActionLoading(true);
    try {
      await socialService.rejectFriendRequest(profile.friend_request_id);
      showToast(`Rejected friend request`, 'info');
      fetchProfile();
    } catch (e: any) {
      showToast(e.message || 'Failed to reject friend request', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!profile.friend_request_id) return;
    setActionLoading(true);
    try {
      await socialService.cancelFriendRequest(profile.friend_request_id);
      showToast(`Cancelled friend request`, 'info');
      fetchProfile();
    } catch (e: any) {
      showToast(e.message || 'Failed to cancel request', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveFriend = async () => {
    setActionLoading(true);
    try {
      await socialService.removeFriend(profile.id);
      showToast(`Removed ${profile.full_name} from friends`, 'info');
      fetchProfile();
    } catch (e: any) {
      showToast(e.message || 'Failed to remove friend', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleInviteToTeam = async (teamId: number) => {
    setInvitingTeamId(teamId);
    try {
      await socialService.inviteUserToTeam(teamId, profile.id);
      showToast(`Invitation sent to ${profile.full_name}`, 'success');
      setInvitedTeamIds((prev) => [...prev, teamId]);
    } catch (e: any) {
      showToast(e.message || 'Failed to send team invitation', 'error');
    } finally {
      setInvitingTeamId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner & Main Info */}
      <div className="saas-panel p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border-2 border-theme-border shadow-xs shrink-0"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-theme-primary/10 text-theme-primary border-2 border-theme-border flex items-center justify-center font-extrabold text-xl sm:text-2xl shrink-0">
                {profile.full_name?.charAt(0) || 'U'}
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-theme-main tracking-tight">{profile.full_name}</h1>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    profile.role === 'ADMIN'
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                      : 'bg-theme-bg text-theme-primary border-theme-border'
                  }`}
                >
                  {profile.role}
                </span>
              </div>
              <p className="text-xs text-theme-muted flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 shrink-0" /> {profile.email}
              </p>
              <p className="text-[11px] text-theme-muted flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 shrink-0" /> Member since {formatDate(profile.created_at)}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {isSelf ? (
              <Link
                to="/profile"
                className="px-3.5 py-2 rounded-lg bg-theme-surface border border-theme-border text-xs font-semibold text-theme-main hover:bg-theme-surface-active transition text-center w-full sm:w-auto"
              >
                Edit Own Profile
              </Link>
            ) : (
              <>
                {/* Friendship status actions */}
                {friendshipStatus === 'NONE' && (
                  <button
                    onClick={handleSendRequest}
                    disabled={actionLoading}
                    className="px-3.5 py-2 rounded-lg bg-theme-primary hover:bg-theme-primary-hover text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                  >
                    <UserPlus className="w-4 h-4" /> Add Friend
                  </button>
                )}

                {friendshipStatus === 'PENDING_SENT' && (
                  <div className="flex items-center gap-1.5">
                    <span className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-semibold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Request Sent
                    </span>
                    <button
                      onClick={handleCancelRequest}
                      disabled={actionLoading}
                      className="px-3 py-1.5 rounded-lg border border-theme-border text-theme-muted hover:text-rose-500 text-xs font-medium transition"
                      title="Cancel Request"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {friendshipStatus === 'PENDING_RECEIVED' && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleAcceptRequest}
                      disabled={actionLoading}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <Check className="w-3.5 h-3.5" /> Accept
                    </button>
                    <button
                      onClick={handleRejectRequest}
                      disabled={actionLoading}
                      className="px-3 py-1.5 rounded-lg bg-theme-bg border border-theme-border text-theme-muted hover:text-rose-500 text-xs font-medium transition"
                    >
                      Reject
                    </button>
                  </div>
                )}

                {friendshipStatus === 'FRIENDS' && (
                  <div className="flex items-center gap-1.5">
                    <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5" /> Friends
                    </span>
                    <button
                      onClick={handleRemoveFriend}
                      disabled={actionLoading}
                      className="p-1.5 rounded-lg border border-theme-border text-theme-muted hover:text-rose-500 transition"
                      title="Remove Friend"
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Invite to Team Modal Button */}
                {myManagedTeams.length > 0 && (
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="px-3.5 py-2 rounded-lg bg-theme-surface border border-theme-border text-theme-main hover:bg-theme-surface-active text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    <Users className="w-4 h-4 text-theme-primary" /> Invite to Team
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Shared Teams & User Teams */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Shared Teams Panel */}
        <div className="saas-panel p-5 space-y-3.5">
          <h2 className="text-xs font-bold text-theme-main uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-theme-primary" /> Shared Teams ({(profile.shared_teams ?? []).length})
          </h2>

          <div className="space-y-2">
            {(profile.shared_teams ?? []).length === 0 ? (
              <p className="text-xs text-theme-muted py-4 text-center">No shared teams with this user.</p>
            ) : (
              (profile.shared_teams ?? []).map((st) => (
                <div
                  key={st.team_id}
                  className="p-3 rounded-lg bg-theme-surface border border-theme-border flex items-center justify-between transition hover:border-theme-primary/40"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-theme-primary/10 text-theme-primary flex items-center justify-center font-bold text-xs">
                      <Layers className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-theme-main">{st.team_name}</span>
                  </div>
                  <Link
                    to={`/teams/${st.team_id}`}
                    className="text-xs text-theme-primary hover:underline font-medium flex items-center gap-0.5"
                  >
                    View <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* User's Teams & Roles Panel */}
        <div className="saas-panel p-5 space-y-3.5">
          <h2 className="text-xs font-bold text-theme-main uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-theme-secondary" /> Teams & Memberships ({(profile.teams_info ?? []).length})
          </h2>

          <div className="space-y-2">
            {(profile.teams_info ?? []).length === 0 ? (
              <p className="text-xs text-theme-muted py-4 text-center">User is not in any public teams yet.</p>
            ) : (
              (profile.teams_info ?? []).map((ti: any, idx: number) => {
                const isOwnerOrLead = ti.role === 'OWNER' || ti.role === 'LEAD' || ti.is_lead;
                return (
                  <div
                    key={ti.team_id || idx}
                    className="p-3 rounded-lg bg-theme-surface border border-theme-border flex items-center justify-between transition hover:border-theme-primary/40"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-md bg-theme-bg text-theme-muted flex items-center justify-center font-bold text-xs border border-theme-border">
                        {isOwnerOrLead ? <Crown className="w-3.5 h-3.5 text-amber-500" /> : <Users className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-theme-main block">{ti.team_name}</span>
                        <span className="text-[10px] text-theme-muted font-medium">Role: {ti.role || (ti.is_lead ? 'LEAD' : 'MEMBER')}</span>
                      </div>
                    </div>
                    <Link
                      to={`/teams/${ti.team_id}`}
                      className="text-xs text-theme-primary hover:underline font-medium flex items-center gap-0.5"
                    >
                      View <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Modal: Invite User to Team */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="saas-panel w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-theme-border pb-3">
              <h2 className="text-sm font-bold text-theme-main flex items-center gap-2">
                <Send className="w-4 h-4 text-theme-primary" /> Invite {profile.full_name} to Team
              </h2>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-theme-muted hover:text-theme-main p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {myManagedTeams.length === 0 ? (
                <p className="text-xs text-theme-muted text-center py-4">You have no teams to invite members to.</p>
              ) : (
                myManagedTeams.map((team) => {
                  const isInvited = invitedTeamIds.includes(team.id);
                  const isInviting = invitingTeamId === team.id;
                  return (
                    <div
                      key={team.id}
                      className="p-3 rounded-lg border border-theme-border bg-theme-surface flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-theme-main block">{team.name}</span>
                        <span className="text-[10px] text-theme-muted">{team.member_count ?? 0} Members</span>
                      </div>
                      <button
                        onClick={() => handleInviteToTeam(team.id)}
                        disabled={isInvited || isInviting}
                        className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition ${
                          isInvited
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : 'bg-theme-primary hover:bg-theme-primary-hover text-white'
                        }`}
                      >
                        {isInviting ? 'Sending...' : isInvited ? 'Invited ✓' : 'Invite'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-theme-border">
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-3.5 py-1.5 rounded-lg border border-theme-border text-xs font-medium text-theme-muted hover:text-theme-main transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
