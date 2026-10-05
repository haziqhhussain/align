import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { teamService } from '../services/teamService';
import { userService } from '../services/userService';
import type { Team, User } from '../types';
import { Users, Plus, Edit2, Trash2, Crown, X, ShieldAlert, Search, RefreshCw } from 'lucide-react';

export const Teams: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { showToast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [formData, setFormData] = useState<{ name: string; description: string; lead_id: number | ''; member_ids: number[] }>({
    name: '',
    description: '',
    lead_id: '',
    member_ids: [],
  });
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState('');
  const [tabFilter, setTabFilter] = useState<'all' | 'my'>('all');

  const fetchTeams = async () => {
    setError(null);
    try {
      const data = await teamService.getTeams();
      setTeams(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error("Failed to load teams:", e);
      setError(e.message || 'Unable to load teams');
      showToast(e.message || 'Error fetching teams', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const users = await userService.getUsers();
      setAllUsers(Array.isArray(users) ? users : []);
    } catch (e) {
      console.error("Failed to load users for teams dropdown:", e);
    }
  };

  useEffect(() => {
    fetchTeams();
    fetchUsers();
  }, []);

  const safeTeams = teams ?? [];

  const filteredTeams = safeTeams.filter((t) => {
    if (!t) return false;
    const teamName = t.name ?? '';
    const teamDesc = t.description ?? '';

    const matchesSearch = teamName.toLowerCase().includes((search ?? '').toLowerCase()) || 
      teamDesc.toLowerCase().includes((search ?? '').toLowerCase());
    
    if (!matchesSearch) return false;

    if (tabFilter === 'my') {
      const membersList = t.members ?? [];
      const isMember = membersList.some((m) => m?.user_id === user?.id);
      const isLead = t.lead_id === user?.id;
      return isMember || isLead;
    }
    return true;
  });

  const handleOpenCreateModal = () => {
    setEditingTeam(null);
    setFormData({ name: '', description: '', lead_id: '', member_ids: [] });
    setShowModal(true);
  };

  const handleOpenEditModal = (team: Team) => {
    setEditingTeam(team);
    const memberList = team.members ?? [];
    setFormData({
      name: team.name ?? '',
      description: team.description || '',
      lead_id: team.lead_id || '',
      member_ids: memberList.map((m) => m?.user_id).filter(Boolean),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Team name is required', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      if (editingTeam) {
        await teamService.updateTeam(editingTeam.id, {
          name: formData.name.trim(),
          description: formData.description.trim(),
          lead_id: formData.lead_id !== '' ? Number(formData.lead_id) : undefined,
        });
        showToast('Team updated successfully', 'success');
      } else {
        await teamService.createTeam({
          name: formData.name.trim(),
          description: formData.description.trim(),
          lead_id: formData.lead_id !== '' ? Number(formData.lead_id) : undefined,
          member_ids: formData.member_ids,
        });
        showToast('Team created successfully', 'success');
      }
      setShowModal(false);
      fetchTeams();
    } catch (err: any) {
      showToast(err.message || 'Failed to save team', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete confirmation state
  const [deletingTeamId, setDeletingTeamId] = useState<number | null>(null);

  const handleDelete = async () => {
    if (!deletingTeamId) return;
    try {
      await teamService.deleteTeam(deletingTeamId);
      showToast('Team deleted successfully', 'success');
      setDeletingTeamId(null);
      fetchTeams();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete team', 'error');
    }
  };

  const toggleMemberSelection = (userId: number) => {
    setFormData((prev) => {
      const exists = prev.member_ids.includes(userId);
      return {
        ...prev,
        member_ids: exists ? prev.member_ids.filter((id) => id !== userId) : [...prev.member_ids, userId],
      };
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-theme-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="saas-panel p-8 text-center space-y-3 max-w-md mx-auto my-10 border-rose-500/30">
        <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-bold text-theme-main">Unable to Load Teams</h3>
        <p className="text-xs text-theme-muted">{error}</p>
        <button
          onClick={() => {
            setLoading(true);
            fetchTeams();
          }}
          className="px-3.5 py-1.5 rounded-lg bg-theme-primary hover:bg-theme-secondary text-white text-xs font-medium transition inline-flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Try Again
        </button>
      </div>
    );
  }

  const myTeamsCount = safeTeams.filter(
    (t) => t.lead_id === user?.id || (t.members ?? []).some((m) => m?.user_id === user?.id)
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-theme-main flex items-center gap-2 tracking-tight">
            <Users className="w-5 h-5 text-theme-primary" /> Teams
          </h1>
          <p className="text-xs text-theme-muted mt-0.5">Manage your teams and members</p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreateModal}
            className="px-3.5 py-2 rounded-lg bg-theme-primary hover:bg-theme-secondary text-white font-medium text-xs shadow-sm flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" /> Create Team
          </button>
        )}
      </div>

      {/* Tabs and Search Toolbar */}
      <div className="saas-panel p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Tab Buttons */}
        <div className="flex items-center gap-1 p-1 bg-theme-bg border border-theme-border rounded-lg w-full sm:w-auto">
          <button
            onClick={() => setTabFilter('all')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
              tabFilter === 'all'
                ? 'bg-theme-surface-active text-theme-primary shadow-xs'
                : 'text-theme-muted hover:text-theme-main'
            }`}
          >
            All Teams ({safeTeams.length})
          </button>
          <button
            onClick={() => setTabFilter('my')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
              tabFilter === 'my'
                ? 'bg-theme-surface-active text-theme-primary shadow-xs'
                : 'text-theme-muted hover:text-theme-main'
            }`}
          >
            My Teams ({myTeamsCount})
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-theme-muted absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teams by name..."
            className="w-full bg-theme-bg border border-theme-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-theme-main placeholder:text-theme-muted focus:outline-none focus:border-theme-primary transition"
          />
        </div>
      </div>

      {/* Team Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeams.length === 0 ? (
          <div className="saas-panel p-10 text-center space-y-2 col-span-full">
            <Users className="w-8 h-8 text-theme-muted mx-auto" />
            <h3 className="text-xs font-semibold text-theme-main">No teams available</h3>
            <p className="text-xs text-theme-muted">
              {tabFilter === 'my'
                ? "You are not currently assigned to or leading any teams."
                : "No team matches your search filter."}
            </p>
          </div>
        ) : (
          filteredTeams.map((team) => {
            const isLead = team.lead_id === user?.id || isAdmin;
            const memberCount = team.member_count ?? (team.members ?? []).length;
            const projectCount = team.project_count ?? 0;

            return (
              <div key={team.id} className="saas-card p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h2 className="text-sm font-bold text-theme-main leading-tight">{team.name}</h2>
                    {isLead && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(team)}
                          className="p-1 rounded text-theme-muted hover:text-theme-main hover:bg-theme-accent/30 transition"
                          title="Edit Team"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => setDeletingTeamId(team.id)}
                            className="p-1 rounded text-rose-500 hover:bg-rose-500/10 transition"
                            title="Delete Team"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-theme-muted line-clamp-2 leading-relaxed">
                    {team.description || 'No description provided.'}
                  </p>

                  {/* Team Lead Badge */}
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-theme-bg border border-theme-border">
                    <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <div className="overflow-hidden">
                      <span className="text-[9px] text-theme-muted block font-medium uppercase">Team Lead</span>
                      <span className="text-xs font-semibold text-theme-main truncate block">
                        {team.lead?.full_name ?? 'No Lead Assigned'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-theme-border flex items-center justify-between text-xs">
                  <span className="text-theme-muted font-medium">
                    {memberCount} Members &bull; {projectCount} Projects
                  </span>
                  <Link
                    to={`/teams/${team.id}`}
                    className="text-theme-primary hover:underline font-medium text-xs"
                  >
                    View Team &rarr;
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Team Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="saas-panel w-full max-w-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-theme-border pb-3">
              <h2 className="text-sm font-bold text-theme-main">
                {editingTeam ? 'Edit Team Details' : 'Create New Team'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-theme-muted hover:text-theme-main p-1 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-theme-main mb-1">Team Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Frontend Core Team"
                  className="w-full bg-theme-bg border border-theme-border rounded-lg px-3 py-1.5 text-xs text-theme-main focus:outline-none focus:border-theme-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-theme-main mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief summary of team responsibilities"
                  className="w-full bg-theme-bg border border-theme-border rounded-lg px-3 py-1.5 text-xs text-theme-main focus:outline-none focus:border-theme-primary h-20"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-theme-main mb-1">Assign Team Lead</label>
                <select
                  value={formData.lead_id}
                  onChange={(e) => setFormData({ ...formData, lead_id: e.target.value ? Number(e.target.value) : '' })}
                  className="w-full bg-theme-bg border border-theme-border rounded-lg px-3 py-1.5 text-xs text-theme-main focus:outline-none focus:border-theme-primary"
                >
                  <option value="">-- Select Team Lead --</option>
                  {allUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              {!editingTeam && (
                <div>
                  <label className="block text-xs font-medium text-theme-main mb-1.5">Initial Team Members</label>
                  <div className="max-h-36 overflow-y-auto space-y-1 p-2 border border-theme-border rounded-lg bg-theme-bg">
                    {allUsers.map((u) => {
                      const isSelected = formData.member_ids.includes(u.id);
                      return (
                        <div
                          key={u.id}
                          onClick={() => toggleMemberSelection(u.id)}
                          className={`p-1.5 rounded text-xs cursor-pointer flex items-center justify-between border transition ${
                            isSelected ? 'bg-theme-accent/50 border-theme-primary text-theme-main font-medium' : 'border-transparent text-theme-muted hover:bg-theme-accent/20'
                          }`}
                        >
                          <span>{u.full_name}</span>
                          <span className="text-[10px] text-theme-muted">{u.email}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-theme-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-theme-muted border border-theme-border transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-theme-primary hover:bg-theme-secondary text-white transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingTeam ? 'Update Team' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingTeamId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="saas-panel w-full max-w-sm p-5 space-y-3 text-center border-rose-500/30">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-theme-main">Delete Team?</h3>
            <p className="text-xs text-theme-muted">
              Are you sure you want to delete this team? All member links and associated projects will be removed.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeletingTeamId(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-theme-muted border border-theme-border transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white transition"
              >
                Delete Team
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
