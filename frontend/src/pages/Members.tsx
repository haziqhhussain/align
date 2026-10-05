import React, { useEffect, useState } from 'react';
import { userService } from '../services/userService';
import { teamService } from '../services/teamService';
import type { User, Team } from '../types';
import { UserCheck, Search, Crown, Mail, CheckCircle2 } from 'lucide-react';
import { formatDate } from '../utils/format';

export const Members: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchMembers = async () => {
    try {
      const [uData, tData] = await Promise.all([
        userService.getUsers(search || undefined),
        teamService.getTeams(),
      ]);
      setUsers(uData);
      setTeams(tData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-7 h-7 border-2 border-theme-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-theme-main flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-theme-primary" /> Member Directory
          </h1>
          <p className="text-xs text-theme-muted mt-1">Browse all organization members, global roles, and team leadership</p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-theme-muted absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full bg-theme-bg border border-theme-border rounded-lg pl-9 pr-3 py-2 text-xs text-theme-main focus:outline-none focus:border-theme-primary transition placeholder:text-theme-muted"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {users.map((member) => {
          const ledTeams = teams.filter((t) => t.lead_id === member.id);
          return (
            <div key={member.id} className="saas-card p-5 space-y-4">
              <div className="flex items-center gap-3">
                {member.avatar_url ? (
                  <img src={member.avatar_url} alt={member.full_name} className="w-10 h-10 rounded-lg object-cover ring-1 ring-theme-border" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-theme-accent border border-theme-border flex items-center justify-center text-theme-primary font-bold text-sm">
                    {member.full_name.charAt(0)}
                  </div>
                )}
                <div className="overflow-hidden">
                  <h2 className="text-sm font-semibold text-theme-main truncate">{member.full_name}</h2>
                  <p className="text-xs text-theme-muted truncate flex items-center gap-1">
                    <Mail className="w-3 h-3 text-theme-muted shrink-0" /> {member.email}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-theme-border/60 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-theme-muted">Global Role</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                    member.role === 'ADMIN' 
                      ? 'bg-amber-500/10 text-amber-500 dark:text-amber-300 border-amber-500/20' 
                      : 'bg-theme-accent text-theme-primary border-theme-border'
                  }`}>
                    {member.role}
                  </span>
                </div>

                {ledTeams.length > 0 && (
                  <div className="p-2 rounded bg-theme-bg border border-theme-border text-[11px] space-y-1">
                    <span className="text-amber-500 dark:text-amber-400 font-medium flex items-center gap-1">
                      <Crown className="w-3 h-3" /> Team Lead of:
                    </span>
                    <p className="text-theme-main font-medium truncate">
                      {ledTeams.map((t) => t.name).join(', ')}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-between text-[11px] text-theme-muted border-t border-theme-border/60">
                <span>Joined {formatDate(member.created_at)}</span>
                <span className="text-emerald-500 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3 h-3" /> Active
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

