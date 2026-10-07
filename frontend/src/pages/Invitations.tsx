import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { socialService } from '../services/socialService';
import type { TeamInvitation } from '../types';
import { Mail, Check, X, Users, ArrowRight } from 'lucide-react';

export const Invitations: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const data = await socialService.getIncomingTeamInvitations();
      setInvitations(data);
    } catch (e: any) {
      showToast(e.message || 'Failed to load invitations', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleAccept = async (inv: TeamInvitation) => {
    setActionLoadingId(inv.id);
    try {
      await socialService.acceptTeamInvitation(inv.id);
      showToast(`Joined team '${inv.team.name}' successfully!`, 'success');
      navigate(`/teams/${inv.team_id}`);
    } catch (e: any) {
      showToast(e.message || 'Failed to accept invitation', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (invId: number) => {
    setActionLoadingId(invId);
    try {
      await socialService.rejectTeamInvitation(invId);
      showToast('Team invitation declined', 'info');
      fetchInvitations();
    } catch (e: any) {
      showToast(e.message || 'Failed to decline invitation', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-theme-main flex items-center gap-2">
          <Mail className="w-6 h-6 text-theme-primary" />
          Team Invitations
        </h1>
        <p className="text-xs text-theme-muted mt-1">
          Review and accept workspace team invitations sent to you.
        </p>
      </div>

      {loading ? (
        <div className="saas-card p-12 text-center text-theme-muted text-xs">
          Loading team invitations...
        </div>
      ) : invitations.length === 0 ? (
        <div className="saas-card p-12 text-center space-y-3 bg-theme-surface">
          <Mail className="w-12 h-12 text-theme-muted mx-auto" />
          <h3 className="text-base font-bold text-theme-main">No pending team invitations</h3>
          <p className="text-xs text-theme-muted max-w-sm mx-auto">
            When team owners or leads invite you to collaborate on a team, invitations will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {invitations.map((inv) => (
            <div key={inv.id} className="saas-card p-5 rounded-xl border border-theme-border bg-theme-surface flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-theme-primary/10 text-theme-primary font-bold text-xs flex items-center justify-center border border-theme-primary/20">
                    <Users className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-extrabold text-theme-main">{inv.team.name}</h3>
                </div>

                {inv.team.description && (
                  <p className="text-xs text-theme-muted leading-relaxed max-w-lg">
                    {inv.team.description}
                  </p>
                )}

                <div className="flex items-center gap-2 text-[11px] text-theme-secondary pt-1">
                  <span>Invited by:</span>
                  <span className="font-semibold text-theme-main flex items-center gap-1.5">
                    {inv.sender.avatar_url ? (
                      <img src={inv.sender.avatar_url} alt={inv.sender.full_name} className="w-4 h-4 rounded-full object-cover" />
                    ) : null}
                    {inv.sender.full_name}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
                <button
                  onClick={() => handleAccept(inv)}
                  disabled={actionLoadingId === inv.id}
                  className="flex-1 sm:flex-none bg-theme-primary hover:bg-theme-primary-hover text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  Accept & Join
                </button>
                <button
                  onClick={() => handleReject(inv.id)}
                  disabled={actionLoadingId === inv.id}
                  className="flex-1 sm:flex-none border border-theme-border hover:bg-theme-surface-active text-theme-main text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
