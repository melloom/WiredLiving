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
  const apiKey = process.env.NEWS_API_KEY?.trim();

  if (!apiKey) {
    return NextResponse.json(
      {
        articles: [],
        error: 'NEWS_API_KEY not configured',
      },
      { status: 200 } // Return 200 so the UI can handle it gracefully
    );
  }

  // Detect API key format to determine which service to use
  const isEventRegistry = apiKey.includes('-'); // Event Registry uses UUID format
  const isNewsAPI = apiKey.length >= 32 && !apiKey.includes('-'); // NewsAPI uses alphanumeric

  try {
    let articles: NewsArticle[] = [];

    if (isEventRegistry) {
      // Event Registry API (newsapi.ai)
      const response = await fetch(
        `https://eventregistry.org/api/v1/article/getArticles?apiKey=${apiKey}&action=getArticles&categoryUri=dmoz/Computers/Technology&lang=eng&articlesCount=5&resultType=articles&articlesSortBy=date&includeArticleBody=false`,
        {
          next: { revalidate: 3600 },
          headers: {
            'User-Agent': 'Mozilla/5.0',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Event Registry API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.articles && data.articles.results) {
        articles = data.articles.results.map((article: any) => ({
          title: article.title || '',
          description: article.body?.substring(0, 150) || article.snippet || '',
          url: article.url || '',
          urlToImage: article.image || null,
          publishedAt: article.date || new Date().toISOString(),
          source: {
            name: article.source?.title || 'Unknown',
          },
        }));
      }
    } else if (isNewsAPI) {
      // NewsAPI.org
      const response = await fetch(
        `https://newsapi.org/v2/top-headlines?category=technology&language=en&pageSize=5&apiKey=${apiKey}`,
        {
          next: { revalidate: 3600 },
          headers: {
            'User-Agent': 'Mozilla/5.0',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`NewsAPI error: ${response.status} - ${errorText}`);
      }

      const data: NewsAPIResponse = await response.json();

      if (data.status === 'ok') {
        articles = data.articles.filter(
          (article) => article.title && article.title !== '[Removed]' && article.url
        );
      }
    } else {
      throw new Error('Invalid API key format');
    }

    if (articles.length === 0) {
      return NextResponse.json({
        articles: [],
        error: 'No articles found',
      });
    }

    return NextResponse.json({ articles });
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

