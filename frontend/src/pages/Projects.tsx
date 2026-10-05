import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { projectService } from '../services/projectService';
import { teamService } from '../services/teamService';
import type { Project, Team, ProjectStatus } from '../types';
import { FolderKanban, Plus, Edit2, Trash2, Calendar, ShieldAlert, X, Search } from 'lucide-react';
import { formatDate } from '../utils/format';

export const Projects: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState<string>('All');

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase())) ||
      (p.team?.name && p.team.name.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;
    if (statusTab !== 'All') {
      return p.status === statusTab;
    }
    return true;
  });

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    team_id: number | '';
    status: ProjectStatus;
    start_date: string;
    due_date: string;
  }>({
    name: '',
    description: '',
    team_id: '',
    status: 'Active',
    start_date: '',
    due_date: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete State
  const [deletingProjectId, setDeletingProjectId] = useState<number | null>(null);

  const fetchProjectsAndTeams = async () => {
    try {
      const [pData, tData] = await Promise.all([
        projectService.getProjects(),
        teamService.getTeams(),
      ]);
      setProjects(pData);
      setTeams(tData);
    } catch (err: any) {
      showToast(err.message || 'Error fetching projects', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectsAndTeams();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingProject(null);
    setFormData({
      name: '',
      description: '',
      team_id: teams.length > 0 ? teams[0].id : '',
      status: 'Active',
      start_date: '',
      due_date: '',
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (proj: Project) => {
    setEditingProject(proj);
    setFormData({
      name: proj.name,
      description: proj.description || '',
      team_id: proj.team_id,
      status: proj.status,
      start_date: proj.start_date ? proj.start_date.substring(0, 10) : '',
      due_date: proj.due_date ? proj.due_date.substring(0, 10) : '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.team_id) {
      showToast('Project name and team selection are required', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      if (editingProject) {
        await projectService.updateProject(editingProject.id, {
          name: formData.name,
          description: formData.description,
          team_id: Number(formData.team_id),
          status: formData.status,
          start_date: formData.start_date || undefined,
          due_date: formData.due_date || undefined,
        });
        showToast('Project updated successfully', 'success');
      } else {
        await projectService.createProject({
          name: formData.name,
          description: formData.description,
          team_id: Number(formData.team_id),
          status: formData.status,
          start_date: formData.start_date || undefined,
          due_date: formData.due_date || undefined,
        });
        showToast('Project created successfully', 'success');
      }
      setShowModal(false);
      fetchProjectsAndTeams();
    } catch (err: any) {
      showToast(err.message || 'Failed to save project', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingProjectId) return;
    try {
      await projectService.deleteProject(deletingProjectId);
      showToast('Project deleted successfully', 'success');
      setDeletingProjectId(null);
      fetchProjectsAndTeams();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete project', 'error');
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-theme-main flex items-center gap-2 tracking-tight">
            <FolderKanban className="w-5 h-5 text-theme-secondary" /> Projects
          </h1>
          <p className="text-xs text-theme-muted mt-0.5">Track project progress, task completions, and timelines</p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-3.5 py-2 rounded-lg bg-theme-primary hover:bg-theme-secondary text-white font-medium text-xs shadow-sm flex items-center gap-1.5 transition"
        >
          <Plus className="w-4 h-4" /> Create Project
        </button>
      </div>

      {/* Filter Tabs and Search Toolbar */}
      <div className="saas-panel p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 p-1 bg-theme-bg border border-theme-border rounded-lg w-full sm:w-auto overflow-x-auto">
          {['All', 'Active', 'Completed', 'On Hold'].map((status) => {
            const count = status === 'All' ? projects.length : projects.filter((p) => p.status === status).length;
            return (
              <button
                key={status}
                onClick={() => setStatusTab(status)}
                className={`px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition ${
                  statusTab === status
                    ? 'bg-theme-surface-active text-theme-primary shadow-xs'
                    : 'text-theme-muted hover:text-theme-main'
                }`}
              >
                {status} ({count})
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-theme-muted absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects or teams..."
            className="w-full bg-theme-bg border border-theme-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-theme-main placeholder:text-theme-muted focus:outline-none focus:border-theme-primary transition"
          />
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProjects.map((proj) => {
          const isLead = proj.team?.lead_id === user?.id || isAdmin;
          return (
            <div key={proj.id} className="saas-card p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-theme-accent text-theme-main border border-theme-border">
                    {proj.team?.name || 'Team Project'}
                  </span>
                  {isLead && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(proj)}
                        className="p-1 rounded text-theme-muted hover:text-theme-main hover:bg-theme-accent/30 transition"
                        title="Edit Project"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingProjectId(proj.id)}
                        className="p-1 rounded text-rose-500 hover:bg-rose-500/10 transition"
                        title="Delete Project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <h2 className="text-sm font-bold text-theme-main leading-tight">{proj.name}</h2>
                <p className="text-xs text-theme-muted line-clamp-2 leading-relaxed">
                  {proj.description || 'No description provided.'}
                </p>

                {/* Progress bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-theme-muted">Progress</span>
                    <span className="font-bold text-theme-primary">{proj.progress_percentage}%</span>
                  </div>
                  <div className="w-full bg-theme-accent/40 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-theme-primary h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${proj.progress_percentage}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-theme-muted text-right">
                    {proj.completed_task_count} of {proj.task_count} tasks done
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-theme-border flex items-center justify-between text-xs">
                <span className="text-theme-muted flex items-center gap-1 text-[11px]">
                  <Calendar className="w-3.5 h-3.5" /> Due {formatDate(proj.due_date)}
                </span>
                <Link to={`/projects/${proj.id}`} className="text-theme-primary hover:underline font-medium text-xs">
                  Details &rarr;
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Project Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="saas-panel w-full max-w-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-theme-border pb-3">
              <h2 className="text-sm font-bold text-theme-main">
                {editingProject ? 'Edit Project Details' : 'Create New Project'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-theme-muted hover:text-theme-main p-1 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-theme-main mb-1">Project Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Align Design System UI"
                  className="w-full bg-theme-bg border border-theme-border rounded-lg px-3 py-1.5 text-xs text-theme-main focus:outline-none focus:border-theme-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-theme-main mb-1">Assign to Team</label>
                <select
                  value={formData.team_id}
                  onChange={(e) => setFormData({ ...formData, team_id: Number(e.target.value) })}
                  className="w-full bg-theme-bg border border-theme-border rounded-lg px-3 py-1.5 text-xs text-theme-main focus:outline-none focus:border-theme-primary"
                  required
                >
                  <option value="">-- Select Team --</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-theme-main mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Project goal and scope"
                  className="w-full bg-theme-bg border border-theme-border rounded-lg px-3 py-1.5 text-xs text-theme-main focus:outline-none focus:border-theme-primary h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-theme-main mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full bg-theme-bg border border-theme-border rounded-lg px-3 py-1.5 text-xs text-theme-main focus:outline-none focus:border-theme-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-theme-main mb-1">Due Date</label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full bg-theme-bg border border-theme-border rounded-lg px-3 py-1.5 text-xs text-theme-main focus:outline-none focus:border-theme-primary"
                  />
                </div>
              </div>

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
                  {submitting ? 'Saving...' : editingProject ? 'Update Project' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProjectId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="saas-panel w-full max-w-sm p-5 space-y-3 text-center border-rose-500/30">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-theme-main">Delete Project?</h3>
            <p className="text-xs text-theme-muted">
              Are you sure you want to delete this project? All associated tasks will be permanently removed.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeletingProjectId(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-theme-muted border border-theme-border transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white transition"
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

