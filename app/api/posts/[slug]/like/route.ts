import { NextRequest, NextResponse } from 'next/server';
import { getPostBySlug, togglePostLike, getPostLikesCount, hasUserLikedPost } from '@/lib/supabase-db';
import { loggers } from '@/lib/logger';
import { trackApiCall, trackError } from '@/lib/monitoring';
import { getClientIp, validateInput } from '@/lib/security';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Validation schema for like action
const likeSchema = z.object({
  userIdentifier: z.string().min(1, 'User identifier required'),
  reactionType: z.enum(['like', 'love', 'helpful']).default('like'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  const startTime = Date.now();
  const clientIp = getClientIp(request.headers);
  
  try {
    const resolvedParams = await Promise.resolve(params);
    
    // Validate slug
    const slugValidation = validateInput(resolvedParams.slug, 'text');
    if (!slugValidation.valid) {
      loggers.logSecurityEvent('Invalid slug in like request', 'medium', {
        slug: resolvedParams.slug,
        threats: slugValidation.threats,
        ip: clientIp,
      });
      await trackApiCall(`/api/posts/${resolvedParams.slug}/like`, 'POST', 400, Date.now() - startTime, undefined, 'Invalid slug');
      return NextResponse.json({ error: 'Invalid post identifier' }, { status: 400 });
    }
    
    const post = await getPostBySlug(resolvedParams.slug);

    if (!post) {
      await trackApiCall(`/api/posts/${resolvedParams.slug}/like`, 'POST', 404, Date.now() - startTime);
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Validate request body
    const body = await request.json();
    const validation = likeSchema.safeParse(body);
    
    if (!validation.success) {
      loggers.logError(`Like validation failed: ${validation.error.message}`, {
        endpoint: '/api/posts/[slug]/like',
        slug: resolvedParams.slug,
      });
      await trackApiCall(`/api/posts/${resolvedParams.slug}/like`, 'POST', 400, Date.now() - startTime, undefined, 'Validation failed');
      return NextResponse.json({ 
        error: 'Invalid request',
        details: validation.error.issues,
      }, { status: 400 });
    }

    const { userIdentifier, reactionType } = validation.data;

    // Get post ID from database
    const { supabase } = await import('@/lib/supabase');
    const { data: postData, error: postError } = await supabase!
      .from('posts')
      .select('id')
      .eq('slug', resolvedParams.slug)
      .single();

    if (postError || !postData) {
      await trackApiCall(`/api/posts/${resolvedParams.slug}/like`, 'POST', 404, Date.now() - startTime);
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const isLiked = await togglePostLike(postData.id, userIdentifier, reactionType);
    const likesCount = await getPostLikesCount(postData.id, reactionType);

    loggers.logRequest('POST', `/api/posts/${resolvedParams.slug}/like`, userIdentifier, {
      reactionType,
      isLiked,
    });
    
    await trackApiCall(`/api/posts/${resolvedParams.slug}/like`, 'POST', 200, Date.now() - startTime, userIdentifier);

    return NextResponse.json({ 
      isLiked, 
      likesCount,
      success: true 
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    await trackError(error as Error, 'toggle_like', 'error');
    await trackApiCall(`/api/posts/${(await params).slug}/like`, 'POST', 500, Date.now() - startTime, undefined, 'Internal error');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  const startTime = Date.now();
  
  try {
    const resolvedParams = await Promise.resolve(params);
    
    // Validate slug
    const slugValidation = validateInput(resolvedParams.slug, 'text');
    if (!slugValidation.valid) {
      await trackApiCall(`/api/posts/${resolvedParams.slug}/like`, 'GET', 400, Date.now() - startTime);
      return NextResponse.json({ error: 'Invalid post identifier' }, { status: 400 });
    }
    
    const post = await getPostBySlug(resolvedParams.slug);

    if (!post) {
      await trackApiCall(`/api/posts/${resolvedParams.slug}/like`, 'GET', 404, Date.now() - startTime);
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const userIdentifier = searchParams.get('userIdentifier');
    const reactionType = searchParams.get('reactionType') || 'like';

    // Get post ID from database
    const { supabase } = await import('@/lib/supabase');
    const { data: postData, error: postError } = await supabase!
      .from('posts')
      .select('id')
      .eq('slug', resolvedParams.slug)
      .single();

    if (postError || !postData) {
      await trackApiCall(`/api/posts/${resolvedParams.slug}/like`, 'GET', 404, Date.now() - startTime);
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const likesCount = await getPostLikesCount(postData.id, reactionType);
    const hasLiked = userIdentifier ? await hasUserLikedPost(postData.id, userIdentifier, reactionType) : false;

    await trackApiCall(`/api/posts/${resolvedParams.slug}/like`, 'GET', 200, Date.now() - startTime, userIdentifier || undefined);

    return NextResponse.json({ 
      likesCount,
      hasLiked,
    });
  } catch (error) {
    console.error('Error fetching likes:', error);
    await trackError(error as Error, 'fetch_likes', 'error');
    await trackApiCall(`/api/posts/${(await params).slug}/like`, 'GET', 500, Date.now() - startTime, undefined, 'Internal error');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

