import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

/**
 * Manual cache revalidation endpoint
 * POST /api/admin/revalidate
 * 
 * Clears Next.js cache for all blog-related pages
 * Use this when posts aren't showing updated content
 */
export async function POST(request: Request) {
  // Protect endpoint - admin only
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { path } = body;

    if (path) {
      // Revalidate specific path
      revalidatePath(path);
      console.log(`✅ Cache revalidated for path: ${path}`);
      
      return NextResponse.json({
        success: true,
        message: `Cache revalidated for ${path}`,
      });
    } else {
      // Revalidate all blog-related pages
      const paths = [
        '/',
        '/blog',
        '/tags',
        '/categories',
        '/archive',
      ];

      paths.forEach(p => revalidatePath(p));
      
      // Also revalidate with layout option for deeper cache clearing
      revalidatePath('/', 'layout');
      revalidatePath('/blog', 'layout');
      
      console.log('✅ Full blog cache revalidation complete');

      return NextResponse.json({
        success: true,
        message: 'All blog cache revalidated successfully',
        revalidatedPaths: paths,
      });
    }
  } catch (error) {
    console.error('Error revalidating cache:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to revalidate cache',
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Allow': 'POST, OPTIONS',
    },
  });
}
