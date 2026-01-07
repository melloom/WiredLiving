import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createPost, logAdminAction } from '@/lib/vercel-db';
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
    const { title, description, content, author, tags, published, date } = body;

    // Validate required fields
    if (!title || !content || !author) {
      return NextResponse.json(
        { success: false, error: 'Title, content, and author are required' },
        { status: 400 }
      );
    }

    // Check if database is available
    if (!process.env.POSTGRES_URL) {
      return NextResponse.json(
        {
          success: false,
          error: 'Database not configured. Please set up Vercel Postgres first.',
        },
        { status: 500 }
      );
    }

    // Create post
    const post: Omit<BlogPost, 'slug'> & { slug?: string } = {
      title,
      description: description || '',
      content,
      author,
      tags: tags || [],
      published: published || false,
      date: date || new Date().toISOString(),
    };

    const createdPost = await createPost(post);

    if (!createdPost) {
      return NextResponse.json(
        { success: false, error: 'Failed to create post' },
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

    return NextResponse.json({
      success: true,
      post: createdPost,
    });
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

