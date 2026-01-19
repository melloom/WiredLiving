import { redirect } from 'next/navigation';
import { getPostBySlug } from '@/lib/supabase-db';

export const dynamic = 'force-dynamic';

/**
 * Redirect route for canonical URLs
 * Usage: /go/your-slug or /go/canonical-url
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const slug = resolvedParams.slug;

    // First try to find a post with this slug
    const post = await getPostBySlug(slug);
    
    if (post) {
      // Redirect to the actual blog post
      redirect(`/blog/${post.slug}`);
    }

    // If no post found, try to use it as a canonical URL identifier
    // You can extend this to handle external canonical URLs
    
    // Fall back to blog home if nothing found
    redirect('/blog');
  } catch (error) {
    console.error('Error in canonical redirect:', error);
    redirect('/blog');
  }
}
