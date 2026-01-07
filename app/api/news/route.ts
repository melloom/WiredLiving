import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  source: {
    name: string;
  };
}

interface NewsAPIResponse {
  status: string;
  articles: NewsArticle[];
}

export async function GET() {
  const apiKey = process.env.NEWS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        articles: [],
        error: 'NEWS_API_KEY not configured',
      },
      { status: 200 } // Return 200 so the UI can handle it gracefully
    );
  }

  try {
    // Fetch technology news
    const response = await fetch(
      `https://newsapi.org/v2/top-headlines?category=technology&language=en&pageSize=5&apiKey=${apiKey}`,
      {
        next: { revalidate: 3600 }, // Cache for 1 hour
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('NewsAPI response error:', response.status, errorText);
      throw new Error(`NewsAPI error: ${response.status} - ${errorText}`);
    }

    const data: NewsAPIResponse = await response.json();

    if (data.status === 'ok') {
      const filteredArticles = data.articles.filter(
        (article) => article.title && article.title !== '[Removed]' && article.url
      );
      
      if (filteredArticles.length === 0) {
        console.warn('No valid articles found after filtering');
      }
      
      return NextResponse.json({
        articles: filteredArticles,
      });
    }

    // Handle API errors
    if (data.status === 'error') {
      console.error('NewsAPI returned error status:', data);
      return NextResponse.json(
        {
          articles: [],
          error: 'NewsAPI returned an error',
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ articles: [] });
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json(
      {
        articles: [],
        error: error instanceof Error ? error.message : 'Failed to fetch news',
      },
      { status: 200 } // Return 200 so the UI can handle it gracefully
    );
  }
}

