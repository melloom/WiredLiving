import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { createPost, logAdminAction, getAllPostsAdmin } from '@/lib/supabase-db';
import { BlogPost } from '@/types';
import { validateRequestBody, postSchema, draftPostSchema } from '@/lib/validation';
import { loggers } from '@/lib/logger';
import { trackApiCall, trackError } from '@/lib/monitoring';
import { auditLog, getClientIp, validateInput } from '@/lib/security';

export const dynamic = 'force-dynamic';

/**
 * Get all posts (admin)
 * GET /api/admin/posts
 */
export async function GET(request: Request) {
  const startTime = Date.now();
  
  // Check authentication with NextAuth
  const session = await auth();
  
  if (!session?.user?.email) {
    await trackApiCall('/api/admin/posts', 'GET', 401, Date.now() - startTime, undefined, 'Unauthorized');
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const posts = await getAllPostsAdmin();
    
    await trackApiCall('/api/admin/posts', 'GET', 200, Date.now() - startTime, session.user.email);
    loggers.logResponse('GET', '/api/admin/posts', 200, Date.now() - startTime);
    
    return NextResponse.json({
      success: true,
      posts,
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching posts:', error);
    await trackError(error as Error, 'get_posts', 'error', session.user.email);
    await trackApiCall('/api/admin/posts', 'GET', 500, Date.now() - startTime, session.user.email, error instanceof Error ? error.message : 'Unknown error');
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch posts',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const startTime = Date.now();
  const clientIp = getClientIp(request.headers);
  
  // Check authentication with NextAuth
  const session = await auth();
  
  if (!session?.user?.email) {
    loggers.logAuth('failed_login', undefined, { endpoint: '/api/admin/posts', ip: clientIp });
    await trackApiCall('/api/admin/posts', 'POST', 401, Date.now() - startTime, undefined, 'Unauthorized');
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Parse and validate request body
    const body = await request.json();
    
    // Determine if it's a draft
    const isDraft = body.status === 'draft' || !body.published;
    
    // Validate with appropriate schema
    const schema = isDraft ? draftPostSchema : postSchema;
    const validationResult = schema.safeParse(body);
    
    if (!validationResult.success) {
      const errorMessage = validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      
      loggers.logError(`Validation failed: ${errorMessage}`, { 
        endpoint: '/api/admin/posts',
        userId: session.user.email,
      });
      await trackApiCall('/api/admin/posts', 'POST', 400, Date.now() - startTime, session.user.email, errorMessage);
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;
    
    // Skip XSS validation for authenticated admin users creating blog posts
    // Blog content legitimately contains HTML, code examples, and markdown
    // The content will be properly sanitized when rendered to end users
    // XSS validation is still applied to user-submitted forms (contact, comments, etc.)
    
    // Use defaults for drafts if fields are missing
    const finalTitle = validatedData.title;
    const finalAuthor = validatedData.author;
    const finalContent = validatedData.content;

    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase not configured');
      loggers.logError('Supabase not configured', { endpoint: '/api/admin/posts' });
      await trackApiCall('/api/admin/posts', 'POST', 500, Date.now() - startTime, session.user.email, 'Supabase not configured');
      return NextResponse.json(
        {
          success: false,
          error: 'Database not configured. Please set up Supabase first. Add NEXT_PUBLIC_SUPABASE_URL and SERVICE_ROLE_KEY to your .env.local file.',
        },
        { status: 500 }
      );
    }

    loggers.logRequest('POST', '/api/admin/posts', session.user.email, { action: 'create_post' });

    // Create post with validated data, ensuring proper types
    const postDate = validatedData.date 
      ? (validatedData.date instanceof Date ? validatedData.date.toISOString() : validatedData.date)
      : new Date().toISOString();
    const postScheduledAt = validatedData.scheduledAt
      ? (validatedData.scheduledAt instanceof Date ? validatedData.scheduledAt.toISOString() : validatedData.scheduledAt)
      : null;

    // Destructure fields we're overriding to avoid type conflicts
    const { date: _date, scheduledAt: _scheduledAt, title: _title, author: _author, content: _content, sidebarMusicPlayer, ...restValidatedData } = validatedData;

    const post: Omit<BlogPost, 'slug'> & { slug?: string } = {
      ...restValidatedData,
      title: finalTitle,
      author: finalAuthor,
      content: finalContent,
      date: postDate,
      scheduledAt: postScheduledAt,
      // Convert null to undefined to match BlogPost type
      sidebarMusicPlayer: sidebarMusicPlayer || undefined,
    };

    console.log('Creating post with data:', { 
      title: post.title, 
      status: post.status, 
      published: post.published,
      hasContent: !!post.content 
    });

    let createdPost;
    try {
      createdPost = await createPost(post);
      loggers.logDbOperation('create', 'posts', true, { slug: createdPost?.slug });
    } catch (dbError) {
      console.error('createPost threw an error:', dbError);
      const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
      await trackError(dbError as Error, 'create_post', 'error', session.user.email);
      await trackApiCall('/api/admin/posts', 'POST', 500, Date.now() - startTime, session.user.email, errorMessage);
      return NextResponse.json(
        { success: false, error: `Database error: ${errorMessage}` },
        { status: 500 }
      );
    }

    if (!createdPost) {
      console.error('createPost returned null - this should not happen with new error handling');
      await trackError('Post creation returned null', 'create_post', 'error', session.user.email);
      await trackApiCall('/api/admin/posts', 'POST', 500, Date.now() - startTime, session.user.email, 'Post creation failed');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to create post. The database operation returned null. This might mean:\n1. The database table does not exist - visit /api/init-db to initialize it\n2. The database connection failed\n3. Check server logs for more details' 
        },
        { status: 500 }
      );
    }

    // Audit log for admin action
    await auditLog({
      userId: session.user.email,
      action: 'create_post',
      resource: 'post',
      resourceId: createdPost.slug,
      changes: { title: createdPost.title, tags: createdPost.tags, published: createdPost.published },
      ipAddress: clientIp,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    console.log('Returning success response with post:', { 
      slug: createdPost.slug, 
      title: createdPost.title,
      hasPost: !!createdPost 
    });

    // Track successful API call
    await trackApiCall('/api/admin/posts', 'POST', 200, Date.now() - startTime, session.user.email);
    loggers.logResponse('POST', '/api/admin/posts', 200, Date.now() - startTime);

    // Revalidate cache for blog pages when a new post is created
    revalidatePath('/blog');
    revalidatePath('/');
    
    if (createdPost.category) {
      revalidatePath(`/blog/category/${createdPost.category}`);
    }
    if (createdPost.tags && Array.isArray(createdPost.tags)) {
      createdPost.tags.forEach((tag: string) => {
        revalidatePath(`/blog/tag/${tag}`);
      });
    }
    
    console.log(`✅ Cache revalidated after creating post: ${createdPost.slug}`);

    return NextResponse.json({
      success: true,
      post: createdPost,
    }, { status: 200 });
  } catch (error) {
    console.error('Error creating post:', error);
    await trackError(error as Error, 'create_post', 'error', session?.user?.email);
    await trackApiCall('/api/admin/posts', 'POST', 500, Date.now() - startTime, session?.user?.email, error instanceof Error ? error.message : 'Unknown error');
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create post',
      },
      { status: 500 }
    );
  }
}

// Respond to preflight OPTIONS requests to avoid 405 when the client
// sends `Content-Type: application/json` or other non-simple headers.
export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Allow': 'GET, POST, OPTIONS',
    },
  });
}

