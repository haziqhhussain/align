import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { userService } from '../services/userService';
import { User as UserIcon, Save, Shield, Bell, Key, Sparkles } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications'>('profile');
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await userService.updateUser(user.id, {
        full_name: fullName,
        avatar_url: avatarUrl || undefined,
      });
      await refreshUser();
      showToast('Profile updated successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-theme-main flex items-center gap-2 tracking-tight">
          <UserIcon className="w-5 h-5 text-theme-primary" /> Profile & Settings
        </h1>
        <p className="text-xs text-theme-muted mt-0.5">Manage your personal account details, global permissions, and preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left Section Navigation Tabs */}
        <div className="md:col-span-1 space-y-1">
          <div className="saas-panel p-2 space-y-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'profile'
                  ? 'bg-theme-surface-active text-theme-primary'
                  : 'text-theme-muted hover:text-theme-main hover:bg-theme-bg'
              }`}
            >
              <UserIcon className="w-4 h-4 shrink-0" />
              <span>General Profile</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'security'
                  ? 'bg-theme-surface-active text-theme-primary'
                  : 'text-theme-muted hover:text-theme-main hover:bg-theme-bg'
              }`}
            >
              <Key className="w-4 h-4 shrink-0" />
              <span>Security & Password</span>
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'notifications'
                  ? 'bg-theme-surface-active text-theme-primary'
                  : 'text-theme-muted hover:text-theme-main hover:bg-theme-bg'
              }`}
            >
              <Bell className="w-4 h-4 shrink-0" />
              <span>Notifications</span>
            </button>
          </div>
        </div>

        {/* Right Details Panel */}
        <div className="md:col-span-3 space-y-6">
          {activeTab === 'profile' && (
            <div className="saas-card p-6 space-y-6">
              {/* Profile Header Banner */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b border-theme-border pb-6">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={user.full_name} className="w-16 h-16 rounded-xl object-cover border border-theme-border" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-theme-surface-active text-theme-primary border border-theme-border flex items-center justify-center font-bold text-xl">
                    {user?.full_name?.charAt(0) || 'U'}
                  </div>
                )}
                <div>
                  <h2 className="text-base font-bold text-theme-main">{user?.full_name}</h2>
                  <p className="text-xs text-theme-muted">{user?.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-theme-accent text-theme-main border border-theme-border flex items-center gap-1">
                      <Shield className="w-3 h-3 text-theme-primary" /> {user?.role} Role
                    </span>
                  </div>
                </div>
              </div>

              {/* Editable Profile Form */}
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-theme-main mb-1">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-theme-bg border border-theme-border rounded-lg px-3 py-2 text-xs text-theme-main focus:outline-none focus:border-theme-primary transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-theme-main mb-1">Avatar Image URL</label>
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-theme-bg border border-theme-border rounded-lg px-3 py-2 text-xs text-theme-main focus:outline-none focus:border-theme-primary transition placeholder:text-theme-muted"
                  />
                  <p className="text-[10px] text-theme-muted mt-1">Provide a public image link for your workspace avatar</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-theme-muted mb-1">Email Address (Managed by Organization)</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full bg-theme-bg/50 border border-theme-border rounded-lg px-3 py-2 text-xs text-theme-muted cursor-not-allowed opacity-75"
                  />
                </div>

                <div className="pt-3 border-t border-theme-border flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 rounded-lg bg-theme-primary hover:bg-theme-secondary text-white font-medium text-xs flex items-center gap-1.5 transition disabled:opacity-50 shadow-sm"
                  >
                    <Save className="w-4 h-4" /> {saving ? 'Saving Changes...' : 'Save Profile'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="saas-card p-6 space-y-4">
              <h2 className="text-sm font-bold text-theme-main flex items-center gap-2">
                <Key className="w-4 h-4 text-theme-primary" /> Security & Password
              </h2>
              <p className="text-xs text-theme-muted">
                Your password and authentication are managed securely with bcrypt hashing. Contact your organization administrator to update authentication credentials.
              </p>
              <div className="p-4 rounded-lg bg-theme-bg border border-theme-border text-xs space-y-2">
                <div className="flex items-center gap-2 text-theme-main font-semibold">
                  <Shield className="w-4 h-4 text-emerald-500" /> Account Security Status: Verified
                </div>
                <p className="text-theme-muted">Role: <strong className="text-theme-main">{user?.role}</strong> &bull; Authenticated via JWT Session Tokens.</p>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="saas-card p-6 space-y-4">
              <h2 className="text-sm font-bold text-theme-main flex items-center gap-2">
                <Bell className="w-4 h-4 text-theme-primary" /> Notification Preferences
              </h2>
              <p className="text-xs text-theme-muted">
                Configure your real-time notification alerts for task assignments, project comments, and team updates.
              </p>
              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-3 text-xs text-theme-main cursor-pointer p-2.5 rounded-lg border border-theme-border bg-theme-bg">
                  <input type="checkbox" defaultChecked className="rounded text-theme-primary focus:ring-0" />
                  <div>
                    <span className="font-semibold block">Task Assignment Alerts</span>
                    <span className="text-[11px] text-theme-muted">Receive in-app alerts when tasks are assigned to you</span>
                  </div>
                </label>
                <label className="flex items-center gap-3 text-xs text-theme-main cursor-pointer p-2.5 rounded-lg border border-theme-border bg-theme-bg">
                  <input type="checkbox" defaultChecked className="rounded text-theme-primary focus:ring-0" />
                  <div>
                    <span className="font-semibold block">Discussion Comments</span>
                    <span className="text-[11px] text-theme-muted">Notify me when members comment on tasks I lead or participate in</span>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
