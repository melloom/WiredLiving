import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { logAdminAction } from '@/lib/supabase-db';
import readingTime from 'reading-time';

// Simple slugifier to keep URL-safe slugs consistent with create flow
const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Get a single post by slug
 * GET /api/admin/posts/[slug]
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  // Protect endpoint
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const resolvedParams = await Promise.resolve(params);
  const slug = resolvedParams.slug;

  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Supabase not configured',
        },
        { status: 500 }
      );
    }

    // Get the post with tags
    const { data: post, error: postError } = await supabase!
      .from('posts')
      .select('*')
      .eq('slug', slug)
      .single();

    if (postError || !post) {
      return NextResponse.json(
        {
          success: false,
          error: postError?.message || 'Post not found',
        },
        { status: 404 }
      );
    }

    // Get tags for this post
    const { data: postTags } = await supabase!
      .from('post_tags')
      .select('tag_id, tags(name)')
      .eq('post_id', post.id);

    const tags = postTags?.map((pt: any) => pt.tags.name) || [];

    return NextResponse.json({
      success: true,
      post: {
        ...post,
        tags,
      },
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch post',
      },
      { status: 500 }
    );
  }
}

/**
 * Update an existing post
 * PUT /api/admin/posts/[slug]
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  // Protect endpoint
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const resolvedParams = await Promise.resolve(params);
  const slug = resolvedParams.slug;

  try {
    const body = await request.json();
    const {
      title,
      description,
      content,
      author,
      tags,
      published,
      status,
      scheduledAt,
      visibility,
      isPremium,
      requiresLogin,
      excerpt,
      coverImage,
      coverImageCrop,
      featured,
      seoTitle,
      seoDescription,
      ogImageOverride,
      twitterTitle,
      twitterDescription,
      galleryImages,
      category,
      series,
      seriesOrder,
      canonicalUrl,
      structuredDataType,
      slugOverride,
      slugLocked,
      relatedLinks,
      sidebarMusicPlayer,
    } = body;

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Supabase not configured',
        },
        { status: 500 }
      );
    }

    // Get the current post to check if slug will change
    const { data: currentPost, error: fetchError } = await supabase!
      .from('posts')
      .select('id, slug')
      .eq('slug', slug)
      .single();

    if (fetchError || !currentPost) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    // Calculate reading stats
    const readingStats = readingTime(content || '');
    const readingTimeMinutes = Math.ceil(readingStats.minutes);
    const wordCount = content ? content.split(/\s+/).filter(Boolean).length : null;

    console.log('Updating post cover image:', { slug, coverImage });

    // Prepare update data
    const updateData: any = {
      title,
      description: description || '',
      content: content || '',
      author,
      date: body.date || new Date().toISOString(), // Keep original date or update
      published: published ?? false,
      status: status || (published ? 'published' : 'draft'),
      scheduled_at: scheduledAt || null,
      visibility: visibility || 'public',
      is_premium: isPremium ?? false,
      requires_login: requiresLogin ?? false,
      reading_time: readingTimeMinutes,
      word_count: wordCount,
      excerpt: excerpt || null,
      cover_image: coverImage || null,
      cover_image_crop: coverImageCrop || null,
      featured: featured ?? false,
      seo_title: seoTitle || null,
      seo_description: seoDescription || null,
      og_image_override: ogImageOverride || null,
      twitter_title: twitterTitle || null,
      twitter_description: twitterDescription || null,
      gallery_images: galleryImages || [],
      category: category || null,
      series: series || null,
      series_order: seriesOrder ?? null,
      canonical_url: canonicalUrl || null,
      structured_data_type: structuredDataType || null,
      related_links: relatedLinks || [],
      sidebar_music_player: sidebarMusicPlayer || null,
      updated_at: new Date().toISOString(),
    };

    // Only update slug-related fields if provided
    const sanitizedSlugOverride = slugOverride ? slugify(slugOverride) : null;
    if (slugOverride !== undefined) {
      updateData.slug_override = sanitizedSlugOverride || null;
    }
    if (slugLocked !== undefined) {
      updateData.slug_locked = slugLocked;
    }

    // On update: only change slug when user explicitly sets a custom slug.
    // Re-deriving from title would cause "duplicate slug" if another post has the same title.
    const desiredSlug = sanitizedSlugOverride || currentPost.slug;

    // If slug changes, ensure uniqueness and include in update payload
    if (desiredSlug !== currentPost.slug) {
      const { data: conflict } = await supabase!
        .from('posts')
        .select('id')
        .eq('slug', desiredSlug)
        .neq('id', currentPost.id)
        .maybeSingle();

      if (conflict) {
        return NextResponse.json(
          { success: false, error: 'Slug already exists. Please choose another.' },
          { status: 400 }
        );
      }

      updateData.slug = desiredSlug;
    }

    // Update the post
    const { data: updatedPost, error: updateError } = await supabase!
      .from('posts')
      .update(updateData)
      .eq('slug', slug)
      .select()
      .single();

    if (updateError || !updatedPost) {
      console.error('Error updating post:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: updateError?.message || 'Failed to update post',
        },
        { status: 500 }
      );
    }

    console.log('Post updated successfully, cover_image in DB:', updatedPost.cover_image);

    // Auto-migrate analytics if slug changed
    const oldSlug = currentPost.slug;
    const newSlug = updatedPost.slug;
    
    if (oldSlug !== newSlug) {
      console.log(`Slug changed from ${oldSlug} to ${newSlug}, migrating analytics...`);
      
      try {
        // Update page_views table
        await supabase!
          .from('page_views')
          .update({ post_slug: newSlug })
          .eq('post_slug', oldSlug);

        // Get old analytics
        const { data: oldAnalytics } = await supabase!
          .from('post_analytics')
          .select('*')
          .eq('post_slug', oldSlug)
          .single();

        // Get new slug analytics if exists
        const { data: newAnalytics } = await supabase!
          .from('post_analytics')
          .select('*')
          .eq('post_slug', newSlug)
          .single();

        if (oldAnalytics) {
          if (newAnalytics) {
            // Merge analytics
            await supabase!
              .from('post_analytics')
              .update({
                total_views: newAnalytics.total_views + oldAnalytics.total_views,
                unique_visitors: newAnalytics.unique_visitors + oldAnalytics.unique_visitors,
                last_viewed: new Date(
                  Math.max(
                    new Date(newAnalytics.last_viewed || 0).getTime(),
                    new Date(oldAnalytics.last_viewed || 0).getTime()
                  )
                ).toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('post_slug', newSlug);

            // Delete old analytics
            await supabase!
              .from('post_analytics')
              .delete()
              .eq('post_slug', oldSlug);
          } else {
            // Just update slug
            await supabase!
              .from('post_analytics')
              .update({ 
                post_slug: newSlug,
                updated_at: new Date().toISOString() 
              })
              .eq('post_slug', oldSlug);
          }
          
          console.log(`Analytics migrated from ${oldSlug} to ${newSlug}`);
        }
      } catch (analyticsError) {
        console.error('Error migrating analytics:', analyticsError);
        // Don't fail the whole update if analytics migration fails
      }
    }

    // Sync tags
    if (tags && Array.isArray(tags) && tags.length > 0) {
      // Get post ID
      const postId = updatedPost.id;

      // Get existing tags
      const { data: existingTags } = await supabase!
        .from('post_tags')
        .select('tag_id')
        .eq('post_id', postId);

      const existingTagIds = existingTags?.map(t => t.tag_id) || [];

      // Get or create tags
      const tagIds: string[] = [];
      for (const tagName of tags) {
        const { data: tagData } = await supabase!
          .from('tags')
          .select('id')
          .eq('name', tagName)
          .single();

        let tagId: string;
        if (tagData) {
          tagId = tagData.id;
        } else {
          const { data: newTag, error: tagError } = await supabase!
            .from('tags')
            .insert({ name: tagName })
            .select('id')
            .single();

          if (tagError || !newTag) {
            console.error('Error creating tag:', tagError);
            continue;
          }
          tagId = newTag.id;
        }
        tagIds.push(tagId);
      }

      // Delete old post_tags
      await supabase!
        .from('post_tags')
        .delete()
        .eq('post_id', postId);

      // Insert new post_tags
      if (tagIds.length > 0) {
        const postTagInserts = tagIds.map(tagId => ({
          post_id: postId,
          tag_id: tagId,
        }));

        await supabase!
          .from('post_tags')
          .insert(postTagInserts);
      }
    }

    // Log admin action
    await logAdminAction({
      userEmail: session.user?.email || 'unknown',
      action: 'update_post',
      targetType: 'post',
      targetId: updatedPost.id,
      meta: { slug, title },
    });

    // CRITICAL: Revalidate cache for blog pages
    // Revalidate the specific post page
    revalidatePath(`/blog/${oldSlug}`);
    if (oldSlug !== newSlug) {
      revalidatePath(`/blog/${newSlug}`);
    }
    
    // Revalidate all blog listing pages
    revalidatePath('/blog');
    revalidatePath('/');
    
    // Revalidate category and tag pages if applicable
    if (updateData.category) {
      revalidatePath(`/blog/category/${updateData.category}`);
    }
    if (tags && Array.isArray(tags)) {
      tags.forEach(tag => {
        revalidatePath(`/blog/tag/${tag}`);
      });
    }

    console.log(`✅ Cache revalidated for post: ${oldSlug} → ${newSlug}`);

    return NextResponse.json({
      success: true,
      post: {
        slug: updatedPost.slug,
        title: updatedPost.title,
        status: updatedPost.status,
      },
    });
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update post',
      },
      { status: 500 }
    );
  }
}
export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Allow': 'GET, PUT, DELETE, OPTIONS',
    },
  });
}
/**
 * Delete a post
 * DELETE /api/admin/posts/[slug]
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  // Protect endpoint
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const resolvedParams = await Promise.resolve(params);
  const slug = resolvedParams.slug;

  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Supabase not configured',
        },
        { status: 500 }
      );
    }

    // Get post first to log the action
    const { data: post, error: fetchError } = await supabase!
      .from('posts')
      .select('id, title')
      .eq('slug', slug)
      .single();

    if (fetchError || !post) {
      return NextResponse.json(
        {
          success: false,
          error: 'Post not found',
        },
        { status: 404 }
      );
    }

    // Delete post (cascade will handle post_tags)
    const { error: deleteError } = await supabase!
      .from('posts')
      .delete()
      .eq('slug', slug);

    if (deleteError) {
      console.error('Error deleting post:', deleteError);
      return NextResponse.json(
        {
          success: false,
          error: deleteError.message || 'Failed to delete post',
        },
        { status: 500 }
      );
    }

    // Log admin action
    await logAdminAction({
      userEmail: session.user?.email || 'unknown',
      action: 'delete_post',
      targetType: 'post',
      targetId: post.id,
      meta: { slug, title: post.title },
    });

    // Revalidate cache after deletion
    revalidatePath(`/blog/${slug}`);
    revalidatePath('/blog');
    revalidatePath('/');
    
    console.log(`✅ Cache revalidated after deleting post: ${slug}`);

    return NextResponse.json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete post',
      },
      { status: 500 }
    );
  }
}

