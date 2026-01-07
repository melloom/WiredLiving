import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createPost, logAdminAction } from '@/lib/supabase-db';
import { BlogPost } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  // Check authentication with NextAuth
  const session = await auth();
  
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const {
      title,
      description,
      content,
      author,
      tags,
      published,
      date,
      excerpt,
      coverImage,
      featured,
      seoTitle,
      seoDescription,
      galleryImages,
      category,
      series,
      seriesOrder,
      slugOverride,
      slugLocked,
      status,
      scheduledAt,
      visibility,
      isPremium,
      requiresLogin,
      canonicalUrl,
      ogImageOverride,
      twitterTitle,
      twitterDescription,
      structuredDataType,
    } = body;

    // Validate required fields - be lenient for drafts
    const isDraft = status === 'draft' || !published;
    if (!isDraft && (!title || !content || !author)) {
      return NextResponse.json(
        { success: false, error: 'Title, content, and author are required for published posts' },
        { status: 400 }
      );
    }
    
    // For drafts, at least title or content should be present
    if (isDraft && !title && !content) {
      return NextResponse.json(
        { success: false, error: 'Please provide at least a title or content for the draft' },
        { status: 400 }
      );
    }
    
    // Use defaults for drafts if fields are missing
    const finalTitle = title || 'Untitled Draft';
    const finalAuthor = author || 'Admin';
    const finalContent = content || '';

    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase not configured');
      return NextResponse.json(
        {
          success: false,
          error: 'Database not configured. Please set up Supabase first. Add NEXT_PUBLIC_SUPABASE_URL and SERVICE_ROLE_KEY to your .env.local file.',
        },
        { status: 500 }
      );
    }

    console.log('Supabase configured, proceeding with post creation...');

    // Create post
    const post: Omit<BlogPost, 'slug'> & { slug?: string } = {
      title: finalTitle,
      description: description || '',
      content: finalContent,
      author: finalAuthor,
      tags: tags || [],
      published: published || false,
      date: date || new Date().toISOString(),
      excerpt: excerpt || '',
      coverImage: coverImage || '',
      featured: !!featured,
      seoTitle: seoTitle || '',
      seoDescription: seoDescription || '',
      galleryImages: Array.isArray(galleryImages) ? galleryImages : [],
      category: category || undefined,
      series: series || undefined,
      seriesOrder: seriesOrder ?? null,
      slugOverride: slugOverride || undefined,
      slugLocked: slugLocked ?? false,
      status: status || (published ? 'published' : 'draft'),
      scheduledAt: scheduledAt || null,
      visibility: visibility || 'public',
      isPremium: isPremium ?? false,
      requiresLogin: requiresLogin ?? false,
      canonicalUrl: canonicalUrl || undefined,
      ogImageOverride: ogImageOverride || undefined,
      twitterTitle: twitterTitle || undefined,
      twitterDescription: twitterDescription || undefined,
      structuredDataType: structuredDataType || undefined,
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
      console.log('Post creation result:', createdPost ? { slug: createdPost.slug, title: createdPost.title } : 'null');
    } catch (dbError) {
      console.error('createPost threw an error:', dbError);
      const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
      return NextResponse.json(
        { success: false, error: `Database error: ${errorMessage}` },
        { status: 500 }
      );
    }

    if (!createdPost) {
      console.error('createPost returned null - this should not happen with new error handling');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to create post. The database operation returned null. This might mean:\n1. The database table does not exist - visit /api/init-db to initialize it\n2. The database connection failed\n3. Check server logs for more details' 
        },
        { status: 500 }
      );
    }

    // Audit log for admin action
    if (session.user?.email) {
      const ip =
        (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
        request.headers.get('x-real-ip') ||
        null;
      const userAgent = request.headers.get('user-agent') || null;

      await logAdminAction({
        userEmail: session.user.email,
        action: 'create_post',
        targetType: 'post',
        targetId: createdPost.slug,
        ip,
        userAgent,
        meta: {
          title: createdPost.title,
          tags: createdPost.tags,
          published: createdPost.published,
        },
      });
    }

    console.log('Returning success response with post:', { 
      slug: createdPost.slug, 
      title: createdPost.title,
      hasPost: !!createdPost 
    });

    return NextResponse.json({
      success: true,
      post: createdPost,
    }, { status: 200 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create post',
      },
      { status: 500 }
    );
  }
}

