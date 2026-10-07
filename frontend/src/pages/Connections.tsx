import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { socialService } from '../services/socialService';
import type { User, FriendRequest, UserSearchResult } from '../types';
import {
  Users, UserPlus, Check, X, Search, Clock, UserCheck, UserMinus, Sparkles, User as UserIcon
} from 'lucide-react';

export const Connections: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || searchParams.get('search') || '';

  const [activeTab, setActiveTab] = useState<'discover' | 'friends' | 'incoming' | 'outgoing'>(
    initialQuery ? 'discover' : 'friends'
  );
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [friendsData, incomingData, outgoingData] = await Promise.all([
        socialService.getFriends(),
        socialService.getIncomingFriendRequests(),
        socialService.getOutgoingFriendRequests()
      ]);
      setFriends(friendsData);
      setIncomingRequests(incomingData);
      setOutgoingRequests(outgoingData);
    } catch (e: any) {
      showToast(e.message || 'Failed to load connections', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (queryStr: string) => {
    setSearchQuery(queryStr);
    try {
      const results = await socialService.searchUsers(queryStr);
      setSearchResults(results);
    } catch (e: any) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
    handleSearch(initialQuery);
  }, []);

  const handleSendFriendRequest = async (targetUserId: number) => {
    setActionLoadingId(targetUserId);
    try {
      await socialService.sendFriendRequest(targetUserId);
      showToast('Friend request sent!', 'success');
      fetchData();
      handleSearch(searchQuery);
    } catch (e: any) {
      showToast(e.message || 'Failed to send request', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAcceptRequest = async (requestId: number) => {
    setActionLoadingId(requestId);
    try {
      await socialService.acceptFriendRequest(requestId);
      showToast('Friend request accepted!', 'success');
      fetchData();
      handleSearch(searchQuery);
    } catch (e: any) {
      showToast(e.message || 'Failed to accept request', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    setActionLoadingId(requestId);
    try {
      await socialService.rejectFriendRequest(requestId);
      showToast('Friend request rejected', 'info');
      fetchData();
      handleSearch(searchQuery);
    } catch (e: any) {
      showToast(e.message || 'Failed to reject request', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelRequest = async (requestId: number) => {
    setActionLoadingId(requestId);
    try {
      await socialService.cancelFriendRequest(requestId);
      showToast('Request cancelled', 'info');
      fetchData();
      handleSearch(searchQuery);
    } catch (e: any) {
      showToast(e.message || 'Failed to cancel request', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRemoveFriend = async (friendId: number) => {
    if (!window.confirm('Are you sure you want to remove this friend?')) return;
    setActionLoadingId(friendId);
    try {
      await socialService.removeFriend(friendId);
      showToast('Friend removed', 'info');
      fetchData();
      handleSearch(searchQuery);
    } catch (e: any) {
      showToast(e.message || 'Failed to remove friend', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-theme-main flex items-center gap-2">
            <Users className="w-6 h-6 text-theme-primary" />
            Connections & People
          </h1>
          <p className="text-xs text-theme-muted mt-1">
            Discover team members, send friend requests, and manage your network.
          </p>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-theme-border pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('friends')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition ${
            activeTab === 'friends'
              ? 'bg-theme-primary text-white shadow-sm'
              : 'text-theme-muted hover:text-theme-main hover:bg-theme-surface'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          My Friends ({friends.length})
        </button>

        <button
          onClick={() => setActiveTab('incoming')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 relative transition ${
            activeTab === 'incoming'
              ? 'bg-theme-primary text-white shadow-sm'
              : 'text-theme-muted hover:text-theme-main hover:bg-theme-surface'
          }`}
        >
          <Clock className="w-4 h-4" />
          Incoming Requests
          {incomingRequests.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-bold">
              {incomingRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('outgoing')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition ${
            activeTab === 'outgoing'
              ? 'bg-theme-primary text-white shadow-sm'
              : 'text-theme-muted hover:text-theme-main hover:bg-theme-surface'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          Sent Requests ({outgoingRequests.length})
        </button>

        <button
          onClick={() => setActiveTab('discover')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition ${
            activeTab === 'discover'
              ? 'bg-theme-primary text-white shadow-sm'
              : 'text-theme-muted hover:text-theme-main hover:bg-theme-surface'
          }`}
        >
          <Search className="w-4 h-4" />
          Discover People
        </button>
      </div>

      {/* TAB 1: FRIENDS */}
      {activeTab === 'friends' && (
        <div className="space-y-4">
          {friends.length === 0 ? (
            <div className="saas-card p-12 text-center space-y-3 bg-theme-surface">
              <UserCheck className="w-12 h-12 text-theme-muted mx-auto" />
              <h3 className="text-base font-bold text-theme-main">No friends added yet</h3>
              <p className="text-xs text-theme-muted max-w-sm mx-auto">
                Use the Discover People tab to find colleagues and send friend requests.
              </p>
              <button
                onClick={() => setActiveTab('discover')}
                className="bg-theme-primary text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-theme-primary-hover transition"
              >
                Find People to Connect With
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {friends.map((f) => (
                <div key={f.id} className="saas-card p-4 rounded-xl border border-theme-border bg-theme-surface flex flex-col justify-between space-y-3">
                  <Link to={`/users/${f.id}`} className="flex items-center gap-3 group overflow-hidden">
                    {f.avatar_url ? (
                      <img src={f.avatar_url} alt={f.full_name} className="w-10 h-10 rounded-full object-cover shrink-0 group-hover:opacity-90 transition" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-theme-primary text-white font-bold text-sm flex items-center justify-center shrink-0">
                        {f.full_name.charAt(0)}
                      </div>
                    )}
                    <div className="overflow-hidden">
                      <h4 className="text-xs font-bold text-theme-main truncate group-hover:text-theme-primary transition">{f.full_name}</h4>
                      <p className="text-[11px] text-theme-muted truncate">{f.email}</p>
                    </div>
                  </Link>

                  <div className="pt-2 border-t border-theme-border flex items-center justify-between">
                    <Link
                      to={`/users/${f.id}`}
                      className="px-2.5 py-1 rounded-md bg-theme-bg border border-theme-border hover:bg-theme-surface-active text-theme-main text-xs font-medium flex items-center gap-1 transition"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-theme-primary" /> View Profile
                    </Link>

                    <button
                      onClick={() => handleRemoveFriend(f.id)}
                      disabled={actionLoadingId === f.id}
                      className="p-1.5 rounded-lg border border-theme-border hover:border-rose-300 text-theme-muted hover:text-rose-600 transition"
                      title="Remove Friend"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INCOMING REQUESTS */}
      {activeTab === 'incoming' && (
        <div className="space-y-4">
          {incomingRequests.length === 0 ? (
            <div className="saas-card p-12 text-center space-y-2 bg-theme-surface">
              <Clock className="w-12 h-12 text-theme-muted mx-auto" />
              <h3 className="text-base font-bold text-theme-main">No pending friend requests</h3>
              <p className="text-xs text-theme-muted">You're all caught up!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {incomingRequests.map((req) => (
                <div key={req.id} className="saas-card p-4 rounded-xl border border-theme-border bg-theme-surface space-y-3">
                  <Link to={`/users/${req.sender_id}`} className="flex items-center gap-3 group overflow-hidden">
                    {req.sender.avatar_url ? (
                      <img src={req.sender.avatar_url} alt={req.sender.full_name} className="w-10 h-10 rounded-full object-cover shrink-0 group-hover:opacity-90 transition" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-theme-primary text-white font-bold text-sm flex items-center justify-center shrink-0">
                        {req.sender.full_name.charAt(0)}
                      </div>
                    )}
                    <div className="overflow-hidden">
                      <h4 className="text-xs font-bold text-theme-main truncate group-hover:text-theme-primary transition">{req.sender.full_name}</h4>
                      <p className="text-[11px] text-theme-muted truncate">{req.sender.email}</p>
                    </div>
                  </Link>

                  <div className="flex items-center gap-2 pt-2 border-t border-theme-border">
                    <button
                      onClick={() => handleAcceptRequest(req.id)}
                      disabled={actionLoadingId === req.id}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-1.5 rounded-lg flex items-center justify-center gap-1 transition disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" /> Accept
                    </button>
                    <button
                      onClick={() => handleRejectRequest(req.id)}
                      disabled={actionLoadingId === req.id}
                      className="px-2.5 border border-theme-border hover:bg-theme-surface-active text-theme-main text-xs font-semibold py-1.5 rounded-lg flex items-center justify-center gap-1 transition disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                    <Link
                      to={`/users/${req.sender_id}`}
                      className="px-2.5 py-1.5 rounded-lg border border-theme-border hover:bg-theme-surface-active text-theme-muted hover:text-theme-main text-xs font-medium transition"
                      title="View Profile"
                    >
                      <UserIcon className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SENT REQUESTS */}
      {activeTab === 'outgoing' && (
        <div className="space-y-4">
          {outgoingRequests.length === 0 ? (
            <div className="saas-card p-12 text-center space-y-2 bg-theme-surface">
              <UserPlus className="w-12 h-12 text-theme-muted mx-auto" />
              <h3 className="text-base font-bold text-theme-main">No sent requests</h3>
              <p className="text-xs text-theme-muted">Friend requests you send will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {outgoingRequests.map((req) => (
                <div key={req.id} className="saas-card p-4 rounded-xl border border-theme-border bg-theme-surface flex items-center justify-between">
                  <Link to={`/users/${req.receiver_id}`} className="flex items-center gap-3 group overflow-hidden">
                    {req.receiver.avatar_url ? (
                      <img src={req.receiver.avatar_url} alt={req.receiver.full_name} className="w-10 h-10 rounded-full object-cover shrink-0 group-hover:opacity-90 transition" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-theme-primary text-white font-bold text-sm flex items-center justify-center shrink-0">
                        {req.receiver.full_name.charAt(0)}
                      </div>
                    )}
                    <div className="overflow-hidden">
                      <h4 className="text-xs font-bold text-theme-main truncate group-hover:text-theme-primary transition">{req.receiver.full_name}</h4>
                      <p className="text-[11px] text-theme-muted truncate">{req.receiver.email}</p>
                    </div>
                  </Link>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/users/${req.receiver_id}`}
                      className="px-2 py-1 rounded-md border border-theme-border text-theme-muted hover:text-theme-main text-xs font-medium transition"
                    >
                      View Profile
                    </Link>
                    <button
                      onClick={() => handleCancelRequest(req.id)}
                      disabled={actionLoadingId === req.id}
                      className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: DISCOVER PEOPLE */}
      {activeTab === 'discover' && (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-theme-muted absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full bg-theme-surface border border-theme-border rounded-lg pl-9 pr-3 py-2 text-xs text-theme-main placeholder:text-theme-muted focus:outline-none focus:border-theme-primary transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map((u) => (
              <div key={u.id} className="saas-card p-4 rounded-xl border border-theme-border bg-theme-surface space-y-3 flex flex-col justify-between">
                <Link to={`/users/${u.id}`} className="flex items-center gap-3 group overflow-hidden">
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt={u.full_name} className="w-10 h-10 rounded-full object-cover shrink-0 group-hover:opacity-90 transition" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-theme-primary text-white font-bold text-sm flex items-center justify-center shrink-0">
                      {u.full_name.charAt(0)}
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-bold text-theme-main truncate group-hover:text-theme-primary transition">{u.full_name}</h4>
                    <p className="text-[11px] text-theme-muted truncate">{u.email}</p>
                  </div>
                </Link>

                <div className="pt-2 border-t border-theme-border flex items-center justify-between text-xs gap-2">
                  <Link
                    to={`/users/${u.id}`}
                    className="px-2.5 py-1 rounded-md bg-theme-bg border border-theme-border hover:bg-theme-surface-active text-theme-main text-xs font-medium transition shrink-0"
                  >
                    View Profile
                  </Link>

                  {u.friendship_status === 'FRIENDS' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      <UserCheck className="w-3.5 h-3.5" /> Friends
                    </span>
                  )}

                  {u.friendship_status === 'PENDING_SENT' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                      <Clock className="w-3.5 h-3.5" /> Request Sent
                    </span>
                  )}

                  {u.friendship_status === 'PENDING_RECEIVED' && (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => u.friend_request_id && handleAcceptRequest(u.friend_request_id)}
                        className="bg-emerald-600 text-white px-2 py-1 rounded text-xs font-semibold"
                      >
                        Accept
                      </button>
                    </div>
                  )}

                  {u.friendship_status === 'NONE' && (
                    <button
                      onClick={() => handleSendFriendRequest(u.id)}
                      disabled={actionLoadingId === u.id}
                      className="bg-theme-primary hover:bg-theme-primary-hover text-white text-xs font-semibold px-3 py-1 rounded-lg flex items-center gap-1 transition disabled:opacity-50 shrink-0"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Add
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
