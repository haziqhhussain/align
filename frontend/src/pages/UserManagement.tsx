import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { userService } from '../services/userService';
import { teamService } from '../services/teamService';
import type { User, UserRole, Team } from '../types';
import {
  Users,
  UserPlus,
  Search,
  Shield,
  ShieldAlert,
  Crown,
  Mail,
  Trash2,
  X,
  Plus
} from 'lucide-react';
import { formatDate } from '../utils/format';

export const UserManagement: React.FC = () => {
  const { user: currentUser, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Add Member Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    role: 'MEMBER' as UserRole,
  });
  const [addErrors, setAddErrors] = useState<Record<string, string>>({});
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // Edit Role Confirmation Modal State
  const [roleChangeTarget, setRoleChangeTarget] = useState<{ user: User; newRole: UserRole } | null>(null);
  const [submittingRole, setSubmittingRole] = useState(false);

  // Add to Team Modal State
  const [addToTeamTarget, setAddToTeamTarget] = useState<User | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<number | ''>('');
  const [submittingTeam, setSubmittingTeam] = useState(false);

  // Delete User Confirmation State
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);

  const fetchUsersAndTeams = async () => {
    try {
      const [uData, tData] = await Promise.all([
        userService.getUsers(search || undefined),
        teamService.getTeams(),
      ]);
      setUsers(uData);
      setTeams(tData);
    } catch (e: any) {
      showToast(e.message || 'Error fetching user data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndTeams();
  }, [search]);

  // Client-side validation for Add Member form
  const validateAddForm = () => {
    const errors: Record<string, string> = {};
    if (!addForm.full_name.trim()) errors.full_name = 'Full name is required';
    if (!addForm.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addForm.email)) {
      errors.email = 'Enter a valid email address';
    }

    if (!addForm.password) {
      errors.password = 'Password is required';
    } else if (addForm.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (addForm.password !== addForm.confirm_password) {
      errors.confirm_password = 'Passwords do not match';
    }

    setAddErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAddForm()) return;

    setSubmittingAdd(true);
    try {
      await userService.createUser({
        full_name: addForm.full_name.trim(),
        email: addForm.email.trim().toLowerCase(),
        password: addForm.password,
        role: addForm.role,
      });
      showToast(`User ${addForm.full_name} created successfully!`, 'success');
      setShowAddModal(false);
      setAddForm({
        full_name: '',
        email: '',
        password: '',
        confirm_password: '',
        role: 'MEMBER',
      });
      setAddErrors({});
      fetchUsersAndTeams();
    } catch (err: any) {
      showToast(err.message || 'Failed to create user', 'error');
    } finally {
      setSubmittingAdd(false);
    }
  };

  const handleConfirmRoleChange = async () => {
    if (!roleChangeTarget) return;
    const { user: targetUser, newRole } = roleChangeTarget;
    setSubmittingRole(true);

    try {
      await userService.updateUserRole(targetUser.id, newRole);
      showToast(`Updated ${targetUser.full_name}'s global role to ${newRole}`, 'success');

      if (targetUser.id === currentUser?.id) {
        await refreshUser();
      }

      setRoleChangeTarget(null);
      fetchUsersAndTeams();
    } catch (err: any) {
      showToast(err.message || 'Failed to update user role', 'error');
    } finally {
      setSubmittingRole(false);
    }
  };

  const handleAddToTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addToTeamTarget || !selectedTeamId) return;

    setSubmittingTeam(true);
    try {
      await teamService.addMember(Number(selectedTeamId), addToTeamTarget.id);
      showToast(`Added ${addToTeamTarget.full_name} to team`, 'success');
      setAddToTeamTarget(null);
      setSelectedTeamId('');
      fetchUsersAndTeams();
    } catch (err: any) {
      showToast(err.message || 'Failed to add to team', 'error');
    } finally {
      setSubmittingTeam(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUserId) return;
    try {
      await userService.deleteUser(deletingUserId);
      showToast('User deleted successfully', 'success');
      setDeletingUserId(null);
      fetchUsersAndTeams();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete user', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-theme-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-theme-main flex items-center gap-2 tracking-tight">
            <Users className="w-5 h-5 text-theme-primary" /> User Management
          </h1>
          <p className="text-xs text-theme-muted mt-0.5">
            Create members, assign global roles, and manage team assignments
          </p>
        </div>

        <button
          onClick={() => {
            setAddErrors({});
            setShowAddModal(true);
          }}
          className="px-3.5 py-2 rounded-lg bg-theme-primary hover:bg-theme-secondary text-white font-medium text-xs shadow-sm flex items-center gap-1.5 transition"
        >
          <UserPlus className="w-4 h-4" /> Add Member
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="saas-panel p-3.5 flex items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-theme-muted absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name or email..."
            className="w-full bg-theme-bg border border-theme-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-theme-main placeholder-theme-muted/50 focus:outline-none focus:border-theme-primary"
          />
        </div>
        <span className="text-xs text-theme-muted font-medium whitespace-nowrap">
          Total Users: {users.length}
        </span>
      </div>

      {/* User Management Table */}
      <div className="saas-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-theme-main">
            <thead className="bg-theme-accent/30 border-b border-theme-border uppercase text-[10px] font-bold text-theme-muted tracking-wider">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Teams</th>
                <th className="py-3 px-4">Joined</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-border">
              {users.map((u) => {
                const isSelf = u.id === currentUser?.id;
                return (
                  <tr key={u.id} className="hover:bg-theme-accent/20 transition-colors">
                    {/* User info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt={u.full_name} className="w-8 h-8 rounded-full object-cover border border-theme-border" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-theme-accent flex items-center justify-center text-theme-main font-bold text-xs">
                            {u.full_name.charAt(0)}
                          </div>
                        )}
                        <div className="font-bold text-theme-main flex items-center gap-1.5">
                          {u.full_name}
                          {isSelf && (
                            <span className="text-[9px] bg-theme-primary/10 text-theme-primary px-1.5 py-0.2 rounded border border-theme-primary/20 font-medium">
                              You
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-3 px-4 text-theme-muted text-[11px]">
                      {u.email}
                    </td>

                    {/* Global Role */}
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border inline-flex items-center gap-1 ${
                        u.role === 'ADMIN'
                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                          : 'bg-theme-accent/50 text-theme-main border-theme-border'
                      }`}>
                        <Shield className="w-3 h-3" /> {u.role}
                      </span>
                    </td>

                    {/* Team Memberships */}
                    <td className="py-3 px-4">
                      <div className="space-y-1 max-w-xs">
                        {(!u.teams_info || u.teams_info.length === 0) ? (
                          <span className="text-theme-muted text-[11px] italic">No teams</span>
                        ) : (
                          u.teams_info.map((ti) => (
                            <div key={ti.team_id} className="flex items-center gap-1.5 text-[11px]">
                              <span className="font-medium text-theme-main">{ti.team_name}</span>
                              {ti.is_lead && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] font-bold inline-flex items-center gap-0.5">
                                  <Crown className="w-2.5 h-2.5" /> Lead
                                </span>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </td>

                    {/* Joined Date */}
                    <td className="py-3 px-4 text-theme-muted text-[11px]">
                      {formatDate(u.created_at)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/users/${u.id}`}
                          className="px-2 py-1 rounded bg-theme-bg border border-theme-border hover:bg-theme-accent/30 text-theme-main text-[11px] font-medium transition"
                        >
                          Profile
                        </Link>

                        <button
                          onClick={() => {
                            setAddToTeamTarget(u);
                            setSelectedTeamId('');
                          }}
                          className="px-2 py-1 rounded bg-theme-bg border border-theme-border hover:bg-theme-accent/30 text-theme-main text-[11px] font-medium transition flex items-center gap-1"
                          title="Add user to a team"
                        >
                          <Plus className="w-3 h-3" /> Team
                        </button>

                        <select
                          value={u.role}
                          onChange={(e) => {
                            const newRole = e.target.value as UserRole;
                            if (newRole !== u.role) {
                              setRoleChangeTarget({ user: u, newRole });
                            }
                          }}
                          className="bg-theme-bg border border-theme-border rounded px-2 py-1 text-xs text-theme-main font-medium focus:outline-none cursor-pointer"
                        >
                          <option value="MEMBER">Member</option>
                          <option value="ADMIN">Admin</option>
                        </select>

                        {!isSelf && (
                          <button
                            onClick={() => setDeletingUserId(u.id)}
                            className="p-1 rounded bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-500 transition"
                            title="Delete user"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ADD MEMBER MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="saas-panel w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-theme-border pb-3">
              <h2 className="text-sm font-bold text-theme-main flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-theme-primary" /> Add New Member
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-theme-muted hover:text-theme-main p-1 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-theme-main mb-1">Full Name *</label>
                <input
                  type="text"
                  value={addForm.full_name}
                  onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })}
                  placeholder="e.g. Alex Rivera"
                  className="w-full bg-theme-bg border border-theme-border rounded-lg px-3 py-1.5 text-xs text-theme-main focus:outline-none focus:border-theme-primary"
                />
                {addErrors.full_name && <p className="text-[10px] text-rose-500 mt-1">{addErrors.full_name}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-theme-main mb-1">Email Address *</label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  placeholder="alex@align.com"
                  className="w-full bg-theme-bg border border-theme-border rounded-lg px-3 py-1.5 text-xs text-theme-main focus:outline-none focus:border-theme-primary"
                />
                {addErrors.email && <p className="text-[10px] text-rose-500 mt-1">{addErrors.email}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-theme-main mb-1">Password *</label>
                  <input
                    type="password"
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-theme-bg border border-theme-border rounded-lg px-3 py-1.5 text-xs text-theme-main focus:outline-none focus:border-theme-primary"
                  />
                  {addErrors.password && <p className="text-[10px] text-rose-500 mt-1">{addErrors.password}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-theme-main mb-1">Confirm Password *</label>
                  <input
                    type="password"
                    value={addForm.confirm_password}
                    onChange={(e) => setAddForm({ ...addForm, confirm_password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-theme-bg border border-theme-border rounded-lg px-3 py-1.5 text-xs text-theme-main focus:outline-none focus:border-theme-primary"
                  />
                  {addErrors.confirm_password && <p className="text-[10px] text-rose-500 mt-1">{addErrors.confirm_password}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-theme-main mb-1">Global Role</label>
                <select
                  value={addForm.role}
                  onChange={(e) => setAddForm({ ...addForm, role: e.target.value as UserRole })}
                  className="w-full bg-theme-bg border border-theme-border rounded-lg px-3 py-1.5 text-xs text-theme-main focus:outline-none focus:border-theme-primary"
                >
                  <option value="MEMBER">Member (Standard User)</option>
                  <option value="ADMIN">Admin (Full Control)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-theme-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-theme-muted hover:text-theme-main border border-theme-border transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAdd}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-theme-primary hover:bg-theme-secondary text-white transition disabled:opacity-50"
                >
                  {submittingAdd ? 'Creating...' : 'Create Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT ROLE CONFIRMATION MODAL --- */}
      {roleChangeTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="saas-panel w-full max-w-sm p-5 space-y-3 text-center">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-theme-main">Change Global Role?</h3>
            <p className="text-xs text-theme-muted">
              Change <strong>{roleChangeTarget.user.full_name}</strong>'s role from{' '}
              <span className="font-bold text-amber-500">{roleChangeTarget.user.role}</span> to{' '}
              <span className="font-bold text-theme-primary">{roleChangeTarget.newRole}</span>?
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setRoleChangeTarget(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-theme-muted border border-theme-border transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRoleChange}
                disabled={submittingRole}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-theme-primary text-white transition disabled:opacity-50"
              >
                {submittingRole ? 'Updating...' : 'Confirm Change'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD TO TEAM MODAL --- */}
      {addToTeamTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="saas-panel w-full max-w-sm p-5 space-y-4">
            <h3 className="text-sm font-bold text-theme-main">Add {addToTeamTarget.full_name} to Team</h3>
            <form onSubmit={handleAddToTeam} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-theme-main mb-1">Select Target Team</label>
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-theme-bg border border-theme-border rounded-lg px-3 py-1.5 text-xs text-theme-main focus:outline-none focus:border-theme-primary"
                  required
                >
                  <option value="">-- Choose Team --</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddToTeamTarget(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-theme-muted border border-theme-border transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTeam}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-theme-primary text-white transition disabled:opacity-50"
                >
                  {submittingTeam ? 'Adding...' : 'Add to Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DELETE USER CONFIRMATION MODAL --- */}
      {deletingUserId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="saas-panel w-full max-w-sm p-5 space-y-3 text-center border-rose-500/30">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-theme-main">Delete User Account?</h3>
            <p className="text-xs text-theme-muted">
              Are you sure you want to delete this user? Their team memberships and assigned tasks will be unlinked.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeletingUserId(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-theme-muted border border-theme-border transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white transition"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

