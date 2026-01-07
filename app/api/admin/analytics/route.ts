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
} from '@/lib/supabase-analytics';

export async function GET() {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch all analytics data in parallel
    const [
      postAnalytics,
      dailyAnalytics,
      totalViews,
      uniqueVisitors,
      topPosts,
      deviceStats,
      referrers,
    ] = await Promise.all([
      getAllPostAnalytics(),
      getDailyAnalytics(30), // Last 30 days
      getTotalPageViews(),
      getTotalUniqueVisitors(),
      getTopPostsByViews(10),
      getPageViewsByDevice(),
      getTopReferrers(10),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        postAnalytics,
        dailyAnalytics,
        totalViews,
        uniqueVisitors,
        topPosts,
        deviceStats,
        referrers,
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

