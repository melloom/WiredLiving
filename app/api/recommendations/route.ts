import { NextRequest, NextResponse } from 'next/server';
import { getAllPosts, getReadingHistory } from '@/lib/supabase-db';

interface Post {
  slug: string;
  title: string;
  description?: string;
  date: string;
  readingTime?: number;
  tags?: string[];
  category?: string;
  coverImage?: string;
  series?: string;
  seriesOrder?: number;
}

interface Recommendation {
  post: Post;
  score: number;
  reason: string;
}

function getUserIdentifier(): string {
  if (typeof window !== 'undefined') {
    let identifier = localStorage.getItem('user_identifier');
    if (!identifier) {
      identifier = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('user_identifier', identifier);
    }
    return identifier;
  }
  return '';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const currentSlug = searchParams.get('slug');
    const currentTags = searchParams.get('tags')?.split(',').filter(Boolean) || [];
    const currentCategory = searchParams.get('category');
    const currentSeries = searchParams.get('series');
    const userIdentifier = request.cookies.get('user_identifier')?.value || '';

    if (!currentSlug) {
      return NextResponse.json({ error: 'Missing slug parameter' }, { status: 400 });
    }

    // Get all posts
    const allPosts = await getAllPosts();
    
    // Filter out current post
    const candidatePosts = allPosts.filter(post => post.slug !== currentSlug);

    // Get user's reading history
    let readingHistory: any[] = [];
    if (userIdentifier) {
      readingHistory = await getReadingHistory(userIdentifier, 50);
    }

    // Extract patterns from reading history
    const readTags = new Set<string>();
    const readCategories = new Set<string>();
    const readSlugs = new Set<string>();

    readingHistory.forEach((item: any) => {
      if (item.posts?.slug) {
        readSlugs.add(item.posts.slug);
      }
      // Find the full post to get tags and category
      const historyPost = allPosts.find(p => p.slug === item.posts?.slug);
      if (historyPost) {
        historyPost.tags?.forEach((tag: string) => readTags.add(tag));
        if (historyPost.category) {
          readCategories.add(historyPost.category);
        }
      }
    });

    // Score each candidate post
    const recommendations: Recommendation[] = candidatePosts.map(post => {
      let score = 0;
      let reasons: string[] = [];

      // 0. Same series (very high priority - continuation)
      if (currentSeries && post.series === currentSeries) {
        score += 100;
        reasons.push('part of series');
      }

      // 1. Same category as current post (high weight)
      if (currentCategory && post.category === currentCategory) {
        score += 50;
        reasons.push('same category');
      }

      // 2. Shared tags with current post (medium-high weight)
      const sharedTags = post.tags?.filter(tag => currentTags.includes(tag)) || [];
      if (sharedTags.length > 0) {
        score += sharedTags.length * 20;
        reasons.push(`${sharedTags.length} shared topic${sharedTags.length > 1 ? 's' : ''}`);
      }

      // 3. Category matches reading history (medium weight)
      if (post.category && readCategories.has(post.category)) {
        score += 30;
        if (!reasons.includes('same category')) {
          reasons.push('based on your reading');
        }
      }

      // 4. Tags match reading history (medium weight)
      const historyMatchTags = post.tags?.filter(tag => readTags.has(tag)) || [];
      if (historyMatchTags.length > 0) {
        score += historyMatchTags.length * 15;
        if (!reasons.some(r => r.includes('reading'))) {
          reasons.push('matches your interests');
        }
      }

      // 5. Recency boost (newer posts get slight boost)
      const postDate = new Date(post.date);
      const daysSincePost = Math.floor((Date.now() - postDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSincePost < 7) {
        score += 15;
        reasons.push('recently published');
      } else if (daysSincePost < 30) {
        score += 5;
      }

      // 6. Penalize already read posts
      if (readSlugs.has(post.slug)) {
        score -= 40;
      }

      // 7. Similar reading time (slight boost for similar length)
      if (post.readingTime && candidatePosts.find(p => p.slug === currentSlug)?.readingTime) {
        const currentReadingTime = candidatePosts.find(p => p.slug === currentSlug)?.readingTime || 0;
        const timeDiff = Math.abs((post.readingTime || 0) - currentReadingTime);
        if (timeDiff < 3) {
          score += 10;
        }
      }

      return {
        post: {
          slug: post.slug,
          title: post.title,
          description: post.description,
          date: post.date,
          readingTime: post.readingTime,
          tags: post.tags,
          category: post.category,
          coverImage: post.coverImage,
        },
        score,
        reason: reasons.length > 0 ? reasons[0] : 'recommended',
      };
    });

    // Sort by score and take top 5
    const topRecommendations = recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return NextResponse.json({
      recommendations: topRecommendations,
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}
