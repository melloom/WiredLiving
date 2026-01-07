import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY;

// Create Supabase client with service role key for admin operations
const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Helper to detect device type from user agent
function getDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

// Helper to get browser from user agent
function getBrowser(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (ua.includes('chrome') && !ua.includes('edg')) return 'Chrome';
  if (ua.includes('firefox')) return 'Firefox';
  if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
  if (ua.includes('edg')) return 'Edge';
  if (ua.includes('opera') || ua.includes('opr')) return 'Opera';
  return 'Unknown';
}

// Helper to get OS from user agent
function getOS(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (ua.includes('windows')) return 'Windows';
  if (ua.includes('mac os')) return 'macOS';
  if (ua.includes('linux')) return 'Linux';
  if (ua.includes('android')) return 'Android';
  if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) return 'iOS';
  return 'Unknown';
}

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Analytics not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const {
      pagePath,
      pageTitle,
      postSlug,
      referrer,
      screenWidth,
      screenHeight,
      sessionId,
      visitorId,
    } = body;

    if (!pagePath || !sessionId || !visitorId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get request metadata
    const userAgent = request.headers.get('user-agent') || '';
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     request.headers.get('x-real-ip') ||
                     'unknown';

    // Extract device info
    const deviceType = getDeviceType(userAgent);
    const browser = getBrowser(userAgent);
    const os = getOS(userAgent);

    // Get or create visitor
    if (visitorId) {
      await supabase.rpc('get_or_create_visitor', {
        visitor_id_param: visitorId,
      });
    }

    // Insert page view
    const { error: insertError } = await supabase
      .from('page_views')
      .insert({
        post_slug: postSlug || null,
        page_path: pagePath,
        page_title: pageTitle || null,
        referrer: referrer || null,
        user_agent: userAgent,
        ip_address: ipAddress,
        device_type: deviceType,
        browser: browser,
        os: os,
        screen_width: screenWidth || null,
        screen_height: screenHeight || null,
        session_id: sessionId,
      });

    if (insertError) {
      console.error('Error inserting page view:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to track page view' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Allow GET for health check
export async function GET() {
  return NextResponse.json({ 
    success: true, 
    message: 'Analytics tracking endpoint is active' 
  });
}

