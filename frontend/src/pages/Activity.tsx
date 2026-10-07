import React, { useEffect, useState } from 'react';
import { Activity, Filter, RefreshCw, Layers, Users, Folder, CheckSquare } from 'lucide-react';
import { activityService } from '../services/activityService';
import type { ActivityLog, EntityType } from '../types';
import { ActivityTimeline } from '../components/common/ActivityTimeline';

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ALL' | 'TEAM' | 'PROJECT' | 'TASK'>('ALL');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchActivities = async (currentPage = 1, append = false) => {
    try {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);

      const filterEntityType = activeTab === 'ALL' ? undefined : activeTab;
      const response = await activityService.getActivity({
        entity_type: filterEntityType,
        page: currentPage,
        limit: 20
      });

      if (append) {
        setActivities((prev) => [...prev, ...response.items]);
      } else {
        setActivities(response.items);
      }
      setHasMore(response.has_more);
      setPage(currentPage);
    } catch (err: any) {
      setError(err.message || 'Failed to load activity logs.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchActivities(1, false);
  }, [activeTab]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchActivities(page + 1, true);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-theme-main tracking-tight">Activity Log</h1>
              <p className="text-xs text-theme-muted mt-0.5">
                Audit trail and historical actions performed across your workspace
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => fetchActivities(1, false)}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-theme-surface border border-theme-border text-theme-main hover:bg-theme-surface-active text-xs font-medium transition-colors shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-theme-surface rounded-xl border border-theme-border max-w-fit">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'ALL'
              ? 'bg-theme-bg text-theme-primary shadow-xs border border-theme-border'
              : 'text-theme-muted hover:text-theme-main'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>All Activity</span>
        </button>

        <button
          onClick={() => setActiveTab('TEAM')}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'TEAM'
              ? 'bg-theme-bg text-theme-primary shadow-xs border border-theme-border'
              : 'text-theme-muted hover:text-theme-main'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Teams</span>
        </button>

        <button
          onClick={() => setActiveTab('PROJECT')}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'PROJECT'
              ? 'bg-theme-bg text-theme-primary shadow-xs border border-theme-border'
              : 'text-theme-muted hover:text-theme-main'
          }`}
        >
          <Folder className="w-4 h-4" />
          <span>Projects</span>
        </button>

        <button
          onClick={() => setActiveTab('TASK')}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'TASK'
              ? 'bg-theme-bg text-theme-primary shadow-xs border border-theme-border'
              : 'text-theme-muted hover:text-theme-main'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Tasks</span>
        </button>
      </div>

      {/* Main Content Area */}
      {error ? (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs">
          <ActivityTimeline
            activities={activities}
            loading={loading}
            emptyMessage={
              activeTab === 'ALL'
                ? 'No activity logs recorded yet.'
                : `No ${activeTab.toLowerCase()} activities recorded yet.`
            }
          />

          {hasMore && (
            <div className="mt-8 text-center pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium text-sm transition-colors"
              >
                {loadingMore ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading more...</span>
                  </>
                ) : (
                  <span>Load More Activity</span>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
