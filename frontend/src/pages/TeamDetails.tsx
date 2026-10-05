import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { teamService } from '../services/teamService';
import { projectService } from '../services/projectService';
import { userService } from '../services/userService';
import type { Team, Project, User } from '../types';
import { Users, Crown, Trash2, ArrowLeft, FolderKanban, UserPlus, ShieldAlert, RefreshCw } from 'lucide-react';
import { formatDate } from '../utils/format';

export const TeamDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const teamId = Number(id);
  const { user, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [team, setTeam] = useState<Team | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add Member Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [adding, setAdding] = useState(false);

  // Remove Member confirmation
  const [removingUserId, setRemovingUserId] = useState<number | null>(null);

  const fetchData = async () => {
    setError(null);
    try {
      const [tData, pData, uData] = await Promise.all([
        teamService.getTeam(teamId),
        projectService.getProjects(teamId),
        userService.getUsers(),
      ]);
      setTeam(tData);
      setProjects(Array.isArray(pData) ? pData : []);
      setAllUsers(Array.isArray(uData) ? uData : []);
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

  const isLead = team?.lead_id === user?.id || isAdmin;

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      showToast('Please select a user to add', 'warning');
      return;
    }
    setAdding(true);
    try {
      const updated = await teamService.addMember(teamId, Number(selectedUserId));
      setTeam(updated);
      showToast('Member added to team', 'success');
      setShowAddModal(false);
      setSelectedUserId('');
    } catch (err: any) {
      showToast(err.message || 'Failed to add member', 'error');
    } finally {
      setAdding(false);
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

  const teamMembers = team.members ?? [];
  const existingMemberIds = teamMembers.map((m) => m?.user_id).filter(Boolean);
  const availableUsers = (allUsers ?? []).filter((u) => !existingMemberIds.includes(u.id));

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link to="/teams" className="inline-flex items-center gap-1 text-xs text-theme-muted hover:text-theme-main transition">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Teams
        </Link>
      </div>

      {/* Team Info Banner */}
      <div className="saas-panel p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-theme-border pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-theme-accent text-theme-main border border-theme-border">
                Team #{team.id}
              </span>
            </div>
            <h1 className="text-xl font-bold text-theme-main">{team.name}</h1>
            <p className="text-xs text-theme-muted mt-0.5 max-w-2xl leading-relaxed">{team.description || 'No description provided.'}</p>
          </div>

          <div className="p-3 rounded-lg bg-theme-bg border border-theme-border flex items-center gap-2.5">
            <Crown className="w-4 h-4 text-amber-500 shrink-0" />
            <div>
              <span className="text-[10px] text-theme-muted font-medium uppercase block">Team Lead</span>
              <span className="text-xs font-bold text-theme-main">{team.lead?.full_name ?? 'Unassigned'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-theme-muted">
          <span>Created on {formatDate(team.created_at)}</span>
          <span className="font-medium text-theme-main">{teamMembers.length} Members &bull; {(projects ?? []).length} Active Projects</span>
        </div>
      </div>

      {/* Team Members List */}
      <div className="saas-panel p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-theme-main flex items-center gap-2">
            <Users className="w-4 h-4 text-theme-primary" /> Team Roster ({teamMembers.length})
          </h2>
          {isLead && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3 py-1.5 rounded-lg bg-theme-primary hover:bg-theme-secondary text-white font-medium text-xs shadow-sm transition flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" /> Add Member
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {teamMembers.length === 0 ? (
            <p className="text-xs text-theme-muted col-span-full py-4 text-center">No members assigned to this team.</p>
          ) : (
            teamMembers.map((tm) => {
              if (!tm || !tm.user) return null;
              const isTeamLead = tm.user_id === team.lead_id;
              return (
                <div key={tm.id} className="p-3 rounded-lg bg-theme-bg border border-theme-border flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {tm.user.avatar_url ? (
                      <img src={tm.user.avatar_url} alt={tm.user.full_name} className="w-8 h-8 rounded-full object-cover border border-theme-border" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-theme-accent flex items-center justify-center text-theme-main font-bold text-xs">
                        {tm.user.full_name?.charAt(0) ?? 'U'}
                      </div>
                    )}
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-theme-main truncate">{tm.user.full_name}</span>
                        {isTeamLead && <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                      </div>
                      <span className="text-[10px] text-theme-muted truncate block">{tm.user.email}</span>
                    </div>
                  </div>

                  {isLead && !isTeamLead && (
                    <button
                      onClick={() => setRemovingUserId(tm.user_id)}
                      className="p-1 text-rose-500 hover:bg-rose-500/10 rounded transition"
                      title="Remove from Team"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Projects of this Team */}
      <div className="saas-panel p-5 space-y-4">
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
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-theme-accent text-theme-main border border-theme-border">
                    {proj.status}
                  </span>
                </div>
                <p className="text-xs text-theme-muted line-clamp-2">{proj.description || 'No description provided.'}</p>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-theme-muted">
                    <span>Progress ({proj.completed_task_count ?? 0} / {proj.task_count ?? 0} tasks)</span>
                    <span className="font-bold text-theme-primary">{proj.progress_percentage ?? 0}%</span>
                  </div>
                  <div className="w-full bg-theme-accent/40 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-theme-primary h-1.5 rounded-full" style={{ width: `${proj.progress_percentage ?? 0}%` }} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="saas-panel w-full max-w-md p-5 space-y-4">
            <h3 className="text-sm font-bold text-theme-main">Add Member to {team.name}</h3>
            <form onSubmit={handleAddMember} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-theme-main mb-1">Select User</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-theme-bg border border-theme-border rounded-lg px-3 py-1.5 text-xs text-theme-main focus:outline-none focus:border-theme-primary"
                  required
                >
                  <option value="">-- Choose Member --</option>
                  {availableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-theme-muted border border-theme-border transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-theme-primary text-white transition disabled:opacity-50"
                >
                  {adding ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
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
