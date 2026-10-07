import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { teamService } from '../services/teamService';
import { projectService } from '../services/projectService';
import { socialService } from '../services/socialService';
import { activityService } from '../services/activityService';
import type { Team, Project, User, TeamInvitation, UserSearchResult, ActivityLog } from '../types';
import { Users, Crown, Trash2, ArrowLeft, FolderKanban, UserPlus, ShieldAlert, RefreshCw, Mail, Search, Clock, Check, X, Activity as ActivityIcon } from 'lucide-react';
import { ActivityTimeline } from '../components/common/ActivityTimeline';
import { formatDate } from '../utils/format';

export const TeamDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const teamId = Number(id);
  const { user, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [team, setTeam] = useState<Team | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [pendingInvites, setPendingInvites] = useState<TeamInvitation[]>([]);
  const [teamActivities, setTeamActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Invite Member Modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [modalTab, setModalTab] = useState<'friends' | 'search'>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [invitingUserId, setInvitingUserId] = useState<number | null>(null);

  // Remove Member confirmation
  const [removingUserId, setRemovingUserId] = useState<number | null>(null);

  const fetchData = async () => {
    setError(null);
    try {
      const [tData, pData, friendsData, actData] = await Promise.all([
        teamService.getTeam(teamId),
        projectService.getProjects(teamId),
        socialService.getFriends(),
        activityService.getTeamActivity(teamId)
      ]);
      setTeam(tData);
      setProjects(Array.isArray(pData) ? pData : []);
      setFriends(Array.isArray(friendsData) ? friendsData : []);
      setTeamActivities(Array.isArray(actData) ? actData : []);

      // If user is lead/owner, also fetch pending team invitations
      if (tData.owner_id === user?.id || tData.lead_id === user?.id || isAdmin) {
        const invData = await socialService.getTeamInvitationsForTeam(teamId);
        setPendingInvites(Array.isArray(invData) ? invData : []);
      }
    } catch (err: any) {
      console.error("Error loading team details:", err);
      setError(err.message || 'Unable to load team details');
      showToast(err.message || 'Error loading team details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (teamId) fetchData();
  }, [teamId]);

  const handleSearchUsers = async (q: string) => {
    setSearchQuery(q);
    try {
      const results = await socialService.searchUsers(q);
      setSearchResults(results);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenInviteModal = () => {
    setShowInviteModal(true);
    setModalTab('friends');
    handleSearchUsers('');
  };

  const handleSendInvite = async (targetUserId: number) => {
    setInvitingUserId(targetUserId);
    try {
      await socialService.inviteUserToTeam(teamId, targetUserId);
      showToast('Team invitation sent!', 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to send invitation', 'error');
    } finally {
      setInvitingUserId(null);
    }
  };

  const handleCancelInvite = async (inviteId: number) => {
    try {
      await socialService.cancelTeamInvitation(inviteId);
      showToast('Team invitation cancelled', 'info');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel invitation', 'error');
    }
  };

  const handleRemoveMember = async () => {
    if (!removingUserId) return;
    try {
      const updated = await teamService.removeMember(teamId, removingUserId);
      setTeam(updated);
      showToast('Member removed from team', 'success');
      setRemovingUserId(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to remove member', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-theme-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="saas-panel p-8 text-center space-y-3 max-w-md mx-auto my-10 border-rose-500/30">
        <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-bold text-theme-main">Unable to Load Team Details</h3>
        <p className="text-xs text-theme-muted">{error || 'Team not found or not authorized.'}</p>
        <div className="flex items-center justify-center gap-2 pt-2">
          <Link
            to="/teams"
            className="px-3.5 py-1.5 rounded-lg border border-theme-border text-theme-main text-xs font-medium"
          >
            Back to Teams
          </Link>
          <button
            onClick={() => {
              setLoading(true);
              fetchData();
            }}
            className="px-3.5 py-1.5 rounded-lg bg-theme-primary text-white text-xs font-medium transition inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'projects' | 'activity' | 'settings'>('overview');

  // Edit team form state
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (team) {
      setEditName(team.name);
      setEditDescription(team.description || '');
    }
  }, [team]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    setSavingSettings(true);
    try {
      const updated = await teamService.updateTeam(teamId, {
        name: editName.trim(),
        description: editDescription.trim(),
      });
      setTeam(updated);
      showToast('Team updated successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update team', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-theme-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="saas-panel p-8 text-center space-y-3 max-w-md mx-auto my-10 border-rose-500/30">
        <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-bold text-theme-main">Unable to Load Team Details</h3>
        <p className="text-xs text-theme-muted">{error || 'Team not found or not authorized.'}</p>
        <div className="flex items-center justify-center gap-2 pt-2">
          <Link
            to="/teams"
            className="px-3.5 py-1.5 rounded-lg border border-theme-border text-theme-main text-xs font-medium"
          >
            Back to Teams
          </Link>
          <button
            onClick={() => {
              setLoading(true);
              fetchData();
            }}
            className="px-3.5 py-1.5 rounded-lg bg-theme-primary text-white text-xs font-medium transition inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      </div>
    );
  }

  const isOwnerOrLead = team.owner_id === user?.id || team.lead_id === user?.id || isAdmin;
  const isOwner = team.owner_id === user?.id || isAdmin;

  const teamMembers = team.members ?? [];
  const memberUserIds = new Set(teamMembers.map((m) => m?.user_id));
  const invitedUserIds = new Set(pendingInvites.map((inv) => inv.receiver_id));

  const tabItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'members', label: 'Members', badge: teamMembers.length },
    { id: 'projects', label: 'Projects', badge: (projects ?? []).length },
    { id: 'activity', label: 'Activity' },
    ...(isOwnerOrLead ? [{ id: 'settings', label: 'Settings' }] : []),
  ];

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link to="/teams" className="inline-flex items-center gap-1 text-xs text-theme-muted hover:text-theme-main transition font-medium">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Teams
        </Link>
      </div>

      {/* Team Header Summary */}
      <div className="saas-panel p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-theme-surface-active text-theme-primary border border-theme-border">
                Team #{team.id}
              </span>
            </div>
            <h1 className="text-xl font-bold text-theme-main">{team.name}</h1>
            <p className="text-xs text-theme-muted mt-0.5 max-w-2xl leading-relaxed">{team.description || 'No description provided.'}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-theme-bg border border-theme-border flex items-center gap-2.5">
              <Crown className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <span className="text-[10px] text-theme-muted font-medium uppercase block">Owner / Lead</span>
                <span className="text-xs font-bold text-theme-main">{team.owner?.full_name || team.lead?.full_name || 'Unassigned'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="pt-2 border-t border-theme-border flex items-center justify-between">
          <div className="flex items-center gap-6 border-b border-theme-border w-full">
            {tabItems.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-2.5 text-xs font-bold whitespace-nowrap flex items-center gap-2 relative transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'text-theme-primary border-b-2 border-theme-primary -mb-px'
                    : 'text-theme-muted hover:text-theme-main'
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-theme-bg border border-theme-border text-theme-muted">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="saas-card p-4 space-y-1">
              <span className="text-[11px] text-theme-muted font-medium uppercase">Team Members</span>
              <p className="text-xl font-bold text-theme-main">{teamMembers.length}</p>
            </div>
            <div className="saas-card p-4 space-y-1">
              <span className="text-[11px] text-theme-muted font-medium uppercase">Active Projects</span>
              <p className="text-xl font-bold text-theme-main">{(projects ?? []).length}</p>
            </div>
            <div className="saas-card p-4 space-y-1">
              <span className="text-[11px] text-theme-muted font-medium uppercase">Created Date</span>
              <p className="text-sm font-bold text-theme-main">{formatDate(team.created_at)}</p>
            </div>
          </div>

          <div className="saas-panel p-5 space-y-4">
            <h3 className="text-sm font-bold text-theme-main">Recent Projects Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(projects ?? []).length === 0 ? (
                <p className="text-xs text-theme-muted col-span-full py-4 text-center">No active projects assigned to this team.</p>
              ) : (
                (projects ?? []).slice(0, 4).map((proj) => (
                  <div key={proj.id} className="p-3.5 rounded-lg bg-theme-bg border border-theme-border space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-theme-main">{proj.name}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-theme-surface-active text-theme-primary border border-theme-border">
                        {proj.status}
                      </span>
                    </div>
                    <p className="text-xs text-theme-muted line-clamp-1">{proj.description || 'No description'}</p>
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[10px] text-theme-muted">
                        <span>Progress</span>
                        <span className="font-bold text-theme-primary">{proj.progress_percentage ?? 0}%</span>
                      </div>
                      <div className="w-full bg-theme-border rounded-full h-1.5 overflow-hidden">
                        <div className="bg-theme-primary h-1.5 rounded-full" style={{ width: `${proj.progress_percentage ?? 0}%` }} />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MEMBERS */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-theme-main flex items-center gap-2">
              <Users className="w-4 h-4 text-theme-primary" /> Team Roster ({teamMembers.length})
            </h2>
            {isOwnerOrLead && (
              <button
                onClick={handleOpenInviteModal}
                className="px-3.5 py-1.5 rounded-lg bg-theme-primary hover:bg-theme-primary-hover text-white font-medium text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" /> Invite Member
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {teamMembers.length === 0 ? (
              <p className="text-xs text-theme-muted col-span-full py-4 text-center">No members assigned to this team.</p>
            ) : (
              teamMembers.map((tm) => {
                if (!tm || !tm.user) return null;
                const isOwnerMember = tm.user_id === team.owner_id;
                const isLeadMember = tm.user_id === team.lead_id;
                const memberRole = tm.role || (isOwnerMember ? 'OWNER' : isLeadMember ? 'LEAD' : 'MEMBER');

                return (
                  <div key={tm.id} className="p-3 rounded-lg bg-theme-bg border border-theme-border flex items-center justify-between">
                    <Link to={`/users/${tm.user_id}`} className="flex items-center gap-2.5 group overflow-hidden">
                      {tm.user.avatar_url ? (
                        <img src={tm.user.avatar_url} alt={tm.user.full_name} className="w-8 h-8 rounded-full object-cover border border-theme-border shrink-0 group-hover:opacity-90 transition" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-theme-primary text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {tm.user.full_name?.charAt(0) ?? 'U'}
                        </div>
                      )}
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-theme-main truncate group-hover:text-theme-primary transition">{tm.user.full_name}</span>
                          {(isOwnerMember || isLeadMember) && <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                        </div>
                        <span className="text-[10px] text-theme-muted truncate block">{tm.user.email}</span>
                        <span className="inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-theme-surface border border-theme-border text-theme-primary">
                          {memberRole}
                        </span>
                      </div>
                    </Link>

                    <div className="flex items-center gap-1.5">
                      <Link
                        to={`/users/${tm.user_id}`}
                        className="px-2 py-1 rounded bg-theme-surface border border-theme-border hover:bg-theme-surface-active text-theme-main text-[11px] font-medium transition"
                      >
                        Profile
                      </Link>

                      {isOwnerOrLead && !isOwnerMember && (
                        <button
                          onClick={() => setRemovingUserId(tm.user_id)}
                          className="p-1 text-rose-500 hover:bg-rose-500/10 rounded transition"
                          title="Remove from Team"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pending Invitations Section */}
          {isOwnerOrLead && pendingInvites.length > 0 && (
            <div className="saas-panel p-5 space-y-3 mt-6">
              <h2 className="text-sm font-bold text-theme-main flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" /> Pending Invitations ({pendingInvites.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {pendingInvites.map((inv) => (
                  <div key={inv.id} className="p-3 rounded-lg bg-theme-bg border border-theme-border flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      {inv.receiver.avatar_url ? (
                        <img src={inv.receiver.avatar_url} alt={inv.receiver.full_name} className="w-7 h-7 rounded-full object-cover" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-600 font-bold text-xs flex items-center justify-center">
                          {inv.receiver.full_name.charAt(0)}
                        </div>
                      )}
                      <div className="overflow-hidden">
                        <span className="font-bold text-theme-main truncate block">{inv.receiver.full_name}</span>
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">Pending Invite</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCancelInvite(inv.id)}
                      className="text-[11px] text-rose-600 hover:underline font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PROJECTS */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-theme-main flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-theme-secondary" /> Assigned Projects ({(projects ?? []).length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(projects ?? []).length === 0 ? (
              <p className="text-xs text-theme-muted col-span-full py-4 text-center">No active projects assigned to this team.</p>
            ) : (
              projects.map((proj) => (
                <div key={proj.id} className="p-3.5 rounded-lg bg-theme-bg border border-theme-border space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-theme-main">{proj.name}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-theme-surface-active text-theme-primary border border-theme-border">
                      {proj.status}
                    </span>
                  </div>
                  <p className="text-xs text-theme-muted line-clamp-2">{proj.description || 'No description provided.'}</p>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-theme-muted">
                      <span>Progress ({proj.completed_task_count ?? 0} / {proj.task_count ?? 0} tasks)</span>
                      <span className="font-bold text-theme-primary">{proj.progress_percentage ?? 0}%</span>
                    </div>
                    <div className="w-full bg-theme-border rounded-full h-1.5 overflow-hidden">
                      <div className="bg-theme-primary h-1.5 rounded-full" style={{ width: `${proj.progress_percentage ?? 0}%` }} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: ACTIVITY */}
      {activeTab === 'activity' && (
        <div className="saas-panel p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-theme-main flex items-center gap-2">
              <ActivityIcon className="w-4 h-4 text-indigo-500" /> Team Activity Log
            </h2>
            <Link to={`/activity?team_id=${team.id}`} className="text-xs font-semibold text-theme-primary hover:underline">
              Full Activity View
            </Link>
          </div>

          <ActivityTimeline activities={teamActivities} emptyMessage="No activity recorded for this team yet." />
        </div>
      )}

      {/* TAB 5: SETTINGS */}
      {activeTab === 'settings' && isOwnerOrLead && (
        <div className="saas-panel p-6 space-y-6 max-w-2xl">
          <h2 className="text-base font-bold text-theme-main">Team Settings</h2>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-theme-main">Team Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                className="w-full bg-theme-bg border border-theme-border rounded-lg px-3 py-2 text-xs text-theme-main focus:outline-none focus:border-theme-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-theme-main">Description</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                className="w-full bg-theme-bg border border-theme-border rounded-lg px-3 py-2 text-xs text-theme-main focus:outline-none focus:border-theme-primary"
              />
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="bg-theme-primary hover:bg-theme-primary-hover text-white text-xs font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50"
            >
              {savingSettings ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="saas-panel w-full max-w-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-theme-border pb-3">
              <h3 className="text-sm font-bold text-theme-main">Invite Member to {team.name}</h3>
              <button onClick={() => setShowInviteModal(false)} className="text-theme-muted hover:text-theme-main p-1 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-2 border-b border-theme-border pb-2">
              <button
                onClick={() => setModalTab('friends')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                  modalTab === 'friends' ? 'bg-theme-primary text-white' : 'text-theme-muted hover:bg-theme-surface-active'
                }`}
              >
                My Friends ({friends.length})
              </button>
              <button
                onClick={() => setModalTab('search')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                  modalTab === 'search' ? 'bg-theme-primary text-white' : 'text-theme-muted hover:bg-theme-surface-active'
                }`}
              >
                Search Workspace Users
              </button>
            </div>

            {/* TAB: MY FRIENDS */}
            {modalTab === 'friends' && (
              <div className="max-h-64 overflow-y-auto space-y-2">
                {friends.length === 0 ? (
                  <p className="text-xs text-theme-muted text-center py-6">
                    You have no friends added yet. Use Connections to find and add friends.
                  </p>
                ) : (
                  friends.map((f) => {
                    const isMember = memberUserIds.has(f.id);
                    const isInvited = invitedUserIds.has(f.id);

                    return (
                      <div key={f.id} className="p-2.5 rounded-lg border border-theme-border bg-theme-bg flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          {f.avatar_url ? (
                            <img src={f.avatar_url} alt={f.full_name} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-theme-primary text-white flex items-center justify-center font-bold text-xs">
                              {f.full_name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-theme-main block">{f.full_name}</span>
                            <span className="text-[10px] text-theme-muted block">{f.email}</span>
                          </div>
                        </div>

                        <div>
                          {isMember ? (
                            <span className="text-[11px] font-bold text-theme-muted">Member</span>
                          ) : isInvited ? (
                            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">Pending Invite</span>
                          ) : (
                            <button
                              onClick={() => handleSendInvite(f.id)}
                              disabled={invitingUserId === f.id}
                              className="bg-theme-primary hover:bg-theme-primary-hover text-white text-xs font-semibold px-3 py-1 rounded-lg transition disabled:opacity-50"
                            >
                              Invite
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB: SEARCH WORKSPACE */}
            {modalTab === 'search' && (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-theme-muted absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchUsers(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full bg-theme-bg border border-theme-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-theme-main focus:outline-none focus:border-theme-primary"
                  />
                </div>

                <div className="max-h-56 overflow-y-auto space-y-2">
                  {searchResults.map((u) => {
                    const isMember = memberUserIds.has(u.id);
                    const isInvited = invitedUserIds.has(u.id);

                    return (
                      <div key={u.id} className="p-2.5 rounded-lg border border-theme-border bg-theme-bg flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt={u.full_name} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-theme-primary text-white flex items-center justify-center font-bold text-xs">
                              {u.full_name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-theme-main block">{u.full_name}</span>
                            <span className="text-[10px] text-theme-muted block">{u.email}</span>
                          </div>
                        </div>

                        <div>
                          {isMember ? (
                            <span className="text-[11px] font-bold text-theme-muted">Member</span>
                          ) : isInvited ? (
                            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">Pending Invite</span>
                          ) : (
                            <button
                              onClick={() => handleSendInvite(u.id)}
                              disabled={invitingUserId === u.id}
                              className="bg-theme-primary hover:bg-theme-primary-hover text-white text-xs font-semibold px-3 py-1 rounded-lg transition disabled:opacity-50"
                            >
                              Invite
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Remove Member Modal */}
      {removingUserId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="saas-panel w-full max-w-sm p-5 space-y-3 text-center border-rose-500/30">
            <h3 className="text-sm font-bold text-theme-main">Remove Team Member?</h3>
            <p className="text-xs text-theme-muted">
              Are you sure you want to remove this member from the team?
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setRemovingUserId(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-theme-muted border border-theme-border transition"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveMember}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white transition"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

