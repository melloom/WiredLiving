'use client';

import { useState, useEffect } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AnalyticsData {
  postAnalytics: Array<{
    post_slug: string;
    post_title?: string;
    total_views: number;
    unique_visitors: number;
    avg_time_on_page: number;
    bounce_rate: number;
    last_viewed: string | null;
  }>;
  dailyAnalytics: Array<{
    date: string;
    total_views: number;
    unique_visitors: number;
    total_posts_viewed: number;
    avg_time_on_site: number;
  }>;
  totalViews: number;
  uniqueVisitors: number;
  topPosts: Array<{
    post_slug: string;
    post_title?: string;
    total_views: number;
    unique_visitors: number;
  }>;
  deviceStats: Record<string, number>;
  referrers: Array<{
    referrer: string;
    count: number;
  }>;
  recentActivity: Array<{
    page_path: string;
    page_title: string;
    visitor_id: string;
    session_id: string;
    device_type: string;
    referrer: string | null;
    time_on_page: number;
    created_at: string;
  }>;
  searchTerms: Array<{
    search_term: string;
    count: number;
    results_clicked: number;
  }>;
}

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  
  // Slug migration state
  const [showSlugMigration, setShowSlugMigration] = useState(false);
  const [oldSlug, setOldSlug] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [migrationLoading, setMigrationLoading] = useState(false);
  const [migrationMessage, setMigrationMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]); // Refetch when time range changes

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get number of days based on time range
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const response = await fetch(`/api/admin/analytics?days=${days}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch analytics');
      }
      
      setData(result.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleMigrateSlug = async () => {
    if (!oldSlug || !newSlug) {
      setMigrationMessage({ type: 'error', text: 'Both old and new slugs are required' });
      return;
    }

    setMigrationLoading(true);
    setMigrationMessage(null);

    try {
      const response = await fetch('/api/admin/analytics/migrate-slug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ oldSlug, newSlug }),
      });

      const result = await response.json();

      if (result.success) {
        setMigrationMessage({ 
          type: 'success', 
          text: `Successfully migrated! ${result.details.pageViewsUpdated} page views updated.` 
        });
        setOldSlug('');
        setNewSlug('');
        // Refresh analytics data
        fetchAnalytics();
      } else {
        setMigrationMessage({ type: 'error', text: result.error || 'Migration failed' });
      }
    } catch (err) {
      setMigrationMessage({ 
        type: 'error', 
        text: err instanceof Error ? err.message : 'Migration failed' 
      });
    } finally {
      setMigrationLoading(false);
    }
  };

  const handleDeleteSlug = async (slug: string) => {
    if (!slug) {
      setMigrationMessage({ type: 'error', text: 'Slug is required' });
      return;
    }

    if (!confirm(`Are you sure you want to delete all analytics data for "${slug}"? This cannot be undone.`)) {
      return;
    }

    setMigrationLoading(true);
    setMigrationMessage(null);

    try {
      const response = await fetch(`/api/admin/analytics/migrate-slug?slug=${encodeURIComponent(slug)}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setMigrationMessage({ 
          type: 'success', 
          text: `Successfully deleted analytics for "${slug}"` 
        });
        // Refresh analytics data
        fetchAnalytics();
      } else {
        setMigrationMessage({ type: 'error', text: result.error || 'Deletion failed' });
      }
    } catch (err) {
      setMigrationMessage({ 
        type: 'error', 
        text: err instanceof Error ? err.message : 'Deletion failed' 
      });
    } finally {
      setMigrationLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6">
        <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
          Failed to Load Analytics
        </h3>
        <p className="text-red-600 dark:text-red-300">{error || 'Unknown error'}</p>
        <button
          onClick={fetchAnalytics}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // Data is already filtered by the API based on time range
  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  const filteredDaily = [...data.dailyAnalytics].reverse(); // Reverse for chronological order in charts

  // Chart data with safe data handling
  const pageViewsChartData = {
    labels: filteredDaily.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Page Views',
        data: filteredDaily.map(d => d.total_views || 0),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Unique Visitors',
        data: filteredDaily.map(d => d.unique_visitors || 0),
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const deviceChartData = {
    labels: Object.keys(data.deviceStats).length > 0 
      ? Object.keys(data.deviceStats).map(key => {
          // Map device types to friendly names
          const deviceMap: Record<string, string> = {
            'desktop': '🖥️ Desktop',
            'mobile': '📱 Mobile',
            'tablet': '📱 Tablet',
            'unknown': '❓ Unknown'
          };
          return deviceMap[key.toLowerCase()] || key.charAt(0).toUpperCase() + key.slice(1);
        })
      : ['No Data'],
    datasets: [
      {
        data: Object.keys(data.deviceStats).length > 0 
          ? Object.values(data.deviceStats)
          : [1],
        backgroundColor: Object.keys(data.deviceStats).length > 0
          ? [
              'rgba(59, 130, 246, 0.8)',   // Desktop - Blue
              'rgba(168, 85, 247, 0.8)',   // Mobile - Purple
              'rgba(34, 197, 94, 0.8)',    // Tablet - Green
              'rgba(251, 146, 60, 0.8)',   // Unknown - Orange
            ]
          : ['rgba(156, 163, 175, 0.3)'], // Gray for no data
        borderColor: Object.keys(data.deviceStats).length > 0
          ? [
              'rgb(59, 130, 246)',
              'rgb(168, 85, 247)',
              'rgb(34, 197, 94)',
              'rgb(251, 146, 60)',
            ]
          : ['rgb(156, 163, 175)'],
        borderWidth: 2,
      },
    ],
  };

  const topPostsChartData = {
    labels: data.topPosts.slice(0, 10).map(p => {
      const slug = p.post_slug || 'Homepage';
      // Truncate long slugs for better display
      return slug.length > 40 ? slug.substring(0, 37) + '...' : slug;
    }),
    datasets: [
      {
        label: 'Total Views',
        data: data.topPosts.slice(0, 10).map(p => p.total_views || 0),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: 'rgb(156, 163, 175)',
        },
      },
    },
    scales: {
      y: {
        ticks: {
          color: 'rgb(156, 163, 175)',
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.1)',
        },
      },
      x: {
        ticks: {
          color: 'rgb(156, 163, 175)',
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.1)',
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: 'rgb(156, 163, 175)',
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
  };

  const avgViewsPerVisitor = data.uniqueVisitors > 0 
    ? (data.totalViews / data.uniqueVisitors).toFixed(1) 
    : '0';

  // Calculate stats from filtered daily data
  const totalPostsViewed = filteredDaily.reduce((sum, d) => sum + (d.total_posts_viewed || 0), 0);
  const avgTimeOnSite = filteredDaily.length > 0
    ? Math.round(filteredDaily.reduce((sum, d) => sum + (d.avg_time_on_site || 0), 0) / filteredDaily.length)
    : 0;

  // Calculate views and visitors for the selected time period
  const periodViews = filteredDaily.reduce((sum, d) => sum + (d.total_views || 0), 0);
  const periodVisitors = filteredDaily.reduce((sum, d) => sum + (d.unique_visitors || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          📈 Analytics Overview
        </h2>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              disabled={loading}
              className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {loading && timeRange === range ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
                </span>
              ) : (
                range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Slug Migration Tool */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden">
        <button
          onClick={() => setShowSlugMigration(!showSlugMigration)}
          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔧</span>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100">
                Slug Migration Tool
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Update or delete analytics data when you change a post's slug
              </p>
            </div>
          </div>
          <span className="text-gray-400 dark:text-gray-600">
            {showSlugMigration ? '▼' : '▶'}
          </span>
        </button>
        
        {showSlugMigration && (
          <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-800">
            {migrationMessage && (
              <div className={`mt-4 p-4 rounded-lg ${
                migrationMessage.type === 'success' 
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
              }`}>
                {migrationMessage.text}
              </div>
            )}
            
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Old Slug (to migrate from)
                </label>
                <input
                  type="text"
                  value={oldSlug}
                  onChange={(e) => setOldSlug(e.target.value)}
                  placeholder="e.g., old-post-slug"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={migrationLoading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Slug (to migrate to)
                </label>
                <input
                  type="text"
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  placeholder="e.g., new-post-slug"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={migrationLoading}
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleMigrateSlug}
                  disabled={migrationLoading || !oldSlug || !newSlug}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {migrationLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Migrating...
                    </span>
                  ) : (
                    'Migrate Analytics Data'
                  )}
                </button>
                
                <button
                  onClick={() => oldSlug && handleDeleteSlug(oldSlug)}
                  disabled={migrationLoading || !oldSlug}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Delete Old Slug Data
                </button>
              </div>
              
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>💡 Tip:</strong> If you changed a post's slug, use this tool to migrate the analytics data from the old slug to the new one. 
                  This preserves view counts and visitor statistics.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="text-3xl">👁️</div>
            <div className="text-right">
              <div className="text-3xl font-bold">{periodViews.toLocaleString()}</div>
              <div className="text-blue-100 text-sm mt-1">Total Views</div>
            </div>
          </div>
          <div className="text-xs text-blue-200 mt-3">
            Last {days} days ({data.totalViews.toLocaleString()} all-time)
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="text-3xl">👥</div>
            <div className="text-right">
              <div className="text-3xl font-bold">{periodVisitors.toLocaleString()}</div>
              <div className="text-purple-100 text-sm mt-1">Unique Visitors</div>
            </div>
          </div>
          <div className="text-xs text-purple-200 mt-3">
            Last {days} days ({data.uniqueVisitors.toLocaleString()} all-time)
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="text-3xl">📄</div>
            <div className="text-right">
              <div className="text-3xl font-bold">{totalPostsViewed.toLocaleString()}</div>
              <div className="text-green-100 text-sm mt-1">Posts Viewed</div>
            </div>
          </div>
          <div className="text-xs text-green-200 mt-3">
            Last {days} days
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="text-3xl">⏱️</div>
            <div className="text-right">
              <div className="text-3xl font-bold">{avgTimeOnSite}s</div>
              <div className="text-amber-100 text-sm mt-1">Avg. Time on Site</div>
            </div>
          </div>
          <div className="text-xs text-amber-200 mt-3">
            Per session
          </div>
        </div>
      </div>

      {/* Page Views Chart */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-lg">
        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">
          📊 Traffic Overview
        </h3>
        {filteredDaily.length === 0 ? (
          <div className="h-80 flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">No traffic data for this period</p>
          </div>
        ) : (
          <div className="h-80">
            <Line data={pageViewsChartData} options={chartOptions} />
          </div>
        )}
      </div>

      {/* Two Column Layout */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Device Stats */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-lg">
          <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">
            📱 Device Breakdown
          </h3>
          {Object.keys(data.deviceStats).length === 0 ? (
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">No device data yet</p>
            </div>
          ) : (
            <div className="h-64">
              <Doughnut data={deviceChartData} options={doughnutOptions} />
            </div>
          )}
        </div>

        {/* Top Referrers */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-lg">
          <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">
            🔗 Top Referrers
          </h3>
          <div className="space-y-3">
            {data.referrers.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">
                No referrer data yet
              </p>
            ) : (
              data.referrers.slice(0, 8).map((ref, idx) => {
                const maxCount = data.referrers[0]?.count || 1;
                const percentage = ((ref.count / maxCount) * 100).toFixed(0);
                const displayReferrer = ref.referrer === 'direct' ? '🔗 Direct' : ref.referrer;
                return (
                  <div key={idx}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400 truncate flex-1" title={displayReferrer}>
                        {displayReferrer.length > 50 ? displayReferrer.substring(0, 47) + '...' : displayReferrer}
                      </span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 ml-2">
                        {ref.count}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Top Posts */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-lg">
        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">
          🔥 Top Performing Posts
        </h3>
        {data.topPosts.length === 0 ? (
          <div className="h-80 flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">No post views yet</p>
          </div>
        ) : (
          <div className="h-80">
            <Bar 
              data={topPostsChartData} 
              options={{
                ...chartOptions,
                indexAxis: 'y' as const,
              }} 
            />
          </div>
        )}
      </div>

      {/* Two Column Layout - Search Terms and Recent Activity */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Search Terms */}
        {data.searchTerms && data.searchTerms.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-lg">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">
              🔍 Top Search Terms
            </h3>
            <div className="space-y-3">
              {data.searchTerms.slice(0, 10).map((term, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {term.search_term}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {term.count} searches • {term.results_clicked} clicks
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {term.results_clicked > 0 ? `${((term.results_clicked / term.count) * 100).toFixed(0)}% CTR` : '0% CTR'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {data.recentActivity && data.recentActivity.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-lg">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">
              🕐 Recent Activity
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {data.recentActivity.slice(0, 15).map((activity, idx) => {
                const timeAgo = getTimeAgo(new Date(activity.created_at));
                const deviceIcon = activity.device_type === 'mobile' ? '📱' : activity.device_type === 'tablet' ? '📲' : '💻';
                return (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="text-xl">{deviceIcon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {activity.page_title || activity.page_path}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {timeAgo} • {Math.round(activity.time_on_page)}s on page
                      </div>
                      {activity.referrer && activity.referrer !== 'direct' && (
                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 truncate" title={activity.referrer}>
                          from {activity.referrer}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Detailed Post Analytics Table */}
      {data.postAnalytics.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-lg">
          <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">
            📝 Detailed Post Analytics
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                    Post / Slug
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                    Views
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                    Visitors
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                    Avg. Time
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                    Bounce Rate
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                    Last Viewed
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.postAnalytics.slice(0, 20).map((post, idx) => (
                  <tr 
                    key={idx}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="py-3 px-4">
                      <div className="text-gray-900 dark:text-gray-100 font-medium">
                        {post.post_title || post.post_slug || 'Homepage'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {post.post_slug && post.post_slug !== post.post_title && `/blog/${post.post_slug}`}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                      {post.total_views.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                      {post.unique_visitors.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                      {Math.round(post.avg_time_on_page)}s
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                      {(post.bounce_rate * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400 text-sm">
                      {post.last_viewed 
                        ? new Date(post.last_viewed).toLocaleDateString()
                        : 'Never'
                      }
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => {
                          setOldSlug(post.post_slug);
                          setShowSlugMigration(true);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium mr-3"
                        title="Set as old slug for migration"
                      >
                        Migrate
                      </button>
                      <button
                        onClick={() => handleDeleteSlug(post.post_slug)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                        title="Delete analytics for this slug"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to get time ago string
function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  
  return date.toLocaleDateString();
}
