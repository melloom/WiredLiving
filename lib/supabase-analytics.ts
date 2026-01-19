import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export interface PostAnalytics {
  post_slug: string;
  total_views: number;
  unique_visitors: number;
  avg_time_on_page: number;
  bounce_rate: number;
  last_viewed: string | null;
}

export interface DailyAnalytics {
  date: string;
  total_views: number;
  unique_visitors: number;
  total_posts_viewed: number;
  avg_time_on_site: number;
}

export interface PageView {
  id: string;
  post_slug: string | null;
  page_path: string;
  page_title: string | null;
  referrer: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  country: string | null;
  created_at: string;
}

/**
 * Get analytics for a specific post
 */
export async function getPostAnalytics(postSlug: string): Promise<PostAnalytics | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('post_analytics')
      .select('*')
      .eq('post_slug', postSlug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No data found - return default
        return {
          post_slug: postSlug,
          total_views: 0,
          unique_visitors: 0,
          avg_time_on_page: 0,
          bounce_rate: 0,
          last_viewed: null,
        };
      }
      throw error;
    }

    return data as PostAnalytics;
  } catch (error) {
    console.error('Error fetching post analytics:', error);
    return null;
  }
}

/**
 * Get analytics for all posts
 */
export async function getAllPostAnalytics(): Promise<PostAnalytics[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('post_analytics')
      .select('*')
      .order('total_views', { ascending: false });

    if (error) throw error;
    return (data || []) as PostAnalytics[];
  } catch (error) {
    console.error('Error fetching all post analytics:', error);
    return [];
  }
}

/**
 * Get daily analytics for the last N days
 */
export async function getDailyAnalytics(days: number = 30): Promise<DailyAnalytics[]> {
  if (!supabase) return [];

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('daily_analytics')
      .select('*')
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (error) throw error;
    return (data || []) as DailyAnalytics[];
  } catch (error) {
    console.error('Error fetching daily analytics:', error);
    return [];
  }
}

/**
 * Get total page views
 */
export async function getTotalPageViews(): Promise<number> {
  if (!supabase) return 0;

  try {
    const { count, error } = await supabase
      .from('page_views')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error fetching total page views:', error);
    return 0;
  }
}

/**
 * Get total unique visitors
 */
export async function getTotalUniqueVisitors(): Promise<number> {
  if (!supabase) return 0;

  try {
    const { count, error } = await supabase
      .from('unique_visitors')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error fetching unique visitors:', error);
    return 0;
  }
}

/**
 * Get page views for a specific date range
 */
export async function getPageViewsByDateRange(
  startDate: Date,
  endDate: Date
): Promise<PageView[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('page_views')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as PageView[];
  } catch (error) {
    console.error('Error fetching page views by date range:', error);
    return [];
  }
}

/**
 * Get top posts by views
 */
export async function getTopPostsByViews(limit: number = 10): Promise<PostAnalytics[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('post_analytics')
      .select('*')
      .order('total_views', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as PostAnalytics[];
  } catch (error) {
    console.error('Error fetching top posts:', error);
    return [];
  }
}

/**
 * Get page views by device type
 */
export async function getPageViewsByDevice(): Promise<Record<string, number>> {
  if (!supabase) return {};

  try {
    const { data, error } = await supabase
      .from('page_views')
      .select('device_type');

    if (error) throw error;

    const deviceCounts: Record<string, number> = {};
    (data || []).forEach((view: { device_type: string | null }) => {
      const device = view.device_type || 'unknown';
      deviceCounts[device] = (deviceCounts[device] || 0) + 1;
    });

    return deviceCounts;
  } catch (error) {
    console.error('Error fetching device stats:', error);
    return {};
  }
}

/**
 * Get page views by referrer
 */
export async function getTopReferrers(limit: number = 10): Promise<Array<{ referrer: string; count: number }>> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('page_views')
      .select('referrer');

    if (error) throw error;

    const referrerCounts: Record<string, number> = {};
    (data || []).forEach((view: { referrer: string | null }) => {
      const referrer = view.referrer || 'direct';
      referrerCounts[referrer] = (referrerCounts[referrer] || 0) + 1;
    });

    return Object.entries(referrerCounts)
      .map(([referrer, count]) => ({ referrer, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching referrer stats:', error);
    return [];
  }
}

/**
 * Get recent page view activity
 */
export async function getRecentActivity(limit: number = 15): Promise<Array<{
  page_path: string;
  page_title: string | null;
  visitor_id: string;
  session_id: string;
  device_type: string;
  referrer: string | null;
  time_on_page: number;
  created_at: string;
}>> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('page_views')
      .select('page_path, page_title, session_id, device_type, referrer, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Transform data to match expected format
    return (data || []).map((view: any) => ({
      page_path: view.page_path,
      page_title: view.page_title || view.page_path,
      visitor_id: view.session_id, // Use session_id as visitor_id
      session_id: view.session_id,
      device_type: view.device_type || 'unknown',
      referrer: view.referrer,
      time_on_page: 0, // Would need session tracking for accurate time
      created_at: view.created_at,
    }));
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return [];
  }
}

/**
 * Get top search terms (if search_terms table exists)
 */
export async function getTopSearchTerms(limit: number = 10): Promise<Array<{
  search_term: string;
  count: number;
  results_clicked: number;
}>> {
  if (!supabase) return [];

  try {
    // Check if search_terms table exists, otherwise return empty array
    const { data, error } = await supabase
      .from('search_terms')
      .select('search_term, count, results_clicked')
      .order('count', { ascending: false })
      .limit(limit);

    if (error) {
      // Table might not exist, return empty array
      if (error.code === '42P01') {
        return [];
      }
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching search terms:', error);
    return [];
  }
}

