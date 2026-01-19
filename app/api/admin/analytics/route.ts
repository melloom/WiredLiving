import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  getAllPostAnalytics,
  getDailyAnalytics,
  getTotalPageViews,
  getTotalUniqueVisitors,
  getTopPostsByViews,
  getPageViewsByDevice,
  getTopReferrers,
  getRecentActivity,
  getTopSearchTerms,
} from '@/lib/supabase-analytics';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get days parameter from query string (default to 30)
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30', 10);

    // Fetch all analytics data in parallel
    const [
      postAnalytics,
      dailyAnalytics,
      totalViews,
      uniqueVisitors,
      topPosts,
      deviceStats,
      referrers,
      recentActivity,
      searchTerms,
    ] = await Promise.all([
      getAllPostAnalytics(),
      getDailyAnalytics(days), // Use dynamic days parameter
      getTotalPageViews(),
      getTotalUniqueVisitors(),
      getTopPostsByViews(10),
      getPageViewsByDevice(),
      getTopReferrers(10),
      getRecentActivity(15),
      getTopSearchTerms(10),
    ]);

    const response = NextResponse.json({
      success: true,
      data: {
        postAnalytics,
        dailyAnalytics,
        totalViews,
        uniqueVisitors,
        topPosts,
        deviceStats,
        referrers,
        recentActivity,
        searchTerms,
      },
    });
    
    // Cache for 30 seconds to reduce load
    response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60');
    
    return response;
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

