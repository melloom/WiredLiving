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

export async function GET(request: Request) {
  const apiKey = process.env.NEWS_API_KEY?.trim();
  const { searchParams } = new URL(request.url);
  const keywords = searchParams.get('keywords') || '';
  const limit = parseInt(searchParams.get('limit') || '3', 10);

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
      // Event Registry API (newsapi.ai / eventregistry.org)
      // Use keywords if provided, otherwise get trending news
      const requestBody: any = {
        action: 'getArticles',
        lang: 'eng',
        articlesCount: limit * 5, // Fetch more to filter for WOW content
        articlesSortBy: 'socialScore', // Sort by engagement/virality for interesting stuff
        resultType: 'articles',
        includeArticleBody: false,
        includeArticleImage: true,
        isDuplicate: 'skipDuplicates',
        apiKey: apiKey,
        // Exclude negative/boring news
        keywordListExclude: ['attack', 'crash', 'death', 'disaster', 'fail', 'collapse', 'banned', 'lawsuit', 'scandal', 'negative', 'hack', 'breach', 'threat', 'warning', 'concern', 'risk', 'disease', 'pollution', 'accident'],
      };

      // Add keyword filter if provided
      if (keywords) {
        // Extract individual keywords/tags
        const keywordArray = keywords.split(',').map(k => k.trim()).filter(Boolean);
        if (keywordArray.length > 0) {
          // Use keywordListOr for multiple keywords
          requestBody.keywordListOr = keywordArray;
        }
      }

      const response = await fetch('https://eventregistry.org/api/v1/article/getArticles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0',
        },
        body: JSON.stringify(requestBody),
        next: { revalidate: 3600 },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Event Registry API error:', response.status, errorText);
        throw new Error(`Event Registry API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Event Registry response:', JSON.stringify(data).substring(0, 500));
      
      if (data.articles && data.articles.results && Array.isArray(data.articles.results)) {
        // Filter for WOW content - interesting, innovative, breakthrough news
        const negativeKeywords = ['attack', 'crash', 'death', 'disaster', 'fail', 'collapse', 'banned', 'lawsuit', 'scandal', 'negative', 'hack', 'breach', 'threat', 'war', 'virus', 'pandemic', 'warning', 'concern', 'risk', 'accident'];
        const wowKeywords = ['breakthrough', 'innovation', 'discovery', 'first', 'new', 'record', 'achievement', 'milestone', 'amazing', 'incredible', 'stunning', 'revolutionary', 'transformed', 'launch', 'unveiled', 'artificial intelligence', 'quantum', 'space', 'nasa', 'elon musk', 'tesla', 'openai', 'google', 'apple', 'microsoft'];
        
        articles = data.articles.results
          .filter((article: any) => {
            if (!article.title || !article.url) return false;
            const titleLower = (article.title || '').toLowerCase();
            const descLower = (article.body || article.snippet || '').toLowerCase();
            // Exclude articles with negative keywords
            if (negativeKeywords.some(keyword => titleLower.includes(keyword) || descLower.includes(keyword))) {
              return false;
            }
            // Prefer wow/interesting content
            return true;
          })
          .sort((a: any, b: any) => {
            // Boost score for WOW articles
            const titleA = (a.title || '').toLowerCase();
            const titleB = (b.title || '').toLowerCase();
            const hasWowA = wowKeywords.some(kw => titleA.includes(kw)) ? 1 : 0;
            const hasWowB = wowKeywords.some(kw => titleB.includes(kw)) ? 1 : 0;
            return hasWowB - hasWowA; // Prioritize wow content
          })
          .map((article: any) => ({
            title: article.title || '',
            description: article.body?.substring(0, 150) || article.snippet || article.title || '',
            url: article.url || '',
            urlToImage: article.image || article.images?.[0] || null,
            publishedAt: article.date || article.dateTime || new Date().toISOString(),
            source: {
              name: article.source?.title || article.source?.uri || 'Unknown',
            },
          }))
          .slice(0, limit);
      } else {
        console.warn('Event Registry response structure unexpected:', Object.keys(data));
      }
    } else if (isNewsAPI) {
      // NewsAPI.org - Use everything endpoint if keywords provided, otherwise top-headlines
      let url: string;
      if (keywords) {
        // Use everything endpoint for keyword search
        const keywordArray = keywords.split(',').map(k => k.trim()).filter(Boolean);
        const searchQuery = keywordArray.length > 0 ? keywordArray[0] : keywords;
        url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(searchQuery)}&language=en&pageSize=${limit}&sortBy=relevancy&apiKey=${apiKey}`;
      } else {
        // Get trending headlines if no keywords
        url = `https://newsapi.org/v2/top-headlines?language=en&pageSize=${limit}&apiKey=${apiKey}`;
      }

      const response = await fetch(url, {
        next: { revalidate: 3600 },
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`NewsAPI error: ${response.status} - ${errorText}`);
      }

      const data: NewsAPIResponse = await response.json();

      if (data.status === 'ok') {
        // Filter for WOW content - interesting, innovative, breakthrough news
        const negativeKeywords = ['attack', 'crash', 'death', 'disaster', 'fail', 'collapse', 'banned', 'lawsuit', 'scandal', 'negative', 'hack', 'breach', 'threat', 'war', 'virus', 'pandemic', 'warning', 'concern', 'risk', 'accident'];
        const wowKeywords = ['breakthrough', 'innovation', 'discovery', 'first', 'new', 'record', 'achievement', 'milestone', 'amazing', 'incredible', 'stunning', 'revolutionary', 'transformed', 'launch', 'unveiled', 'artificial intelligence', 'quantum', 'space', 'nasa', 'elon musk', 'tesla', 'openai', 'google', 'apple', 'microsoft'];
        
        articles = data.articles
          .filter((article) => {
            if (!article.title || article.title === '[Removed]' || !article.url) return false;
            const titleLower = (article.title || '').toLowerCase();
            const descLower = (article.description || '').toLowerCase();
            // Exclude articles with negative keywords
            if (negativeKeywords.some(keyword => titleLower.includes(keyword) || descLower.includes(keyword))) {
              return false;
            }
            return true;
          })
          .sort((a, b) => {
            // Boost score for WOW articles
            const titleA = (a.title || '').toLowerCase();
            const titleB = (b.title || '').toLowerCase();
            const hasWowA = wowKeywords.some(kw => titleA.includes(kw)) ? 1 : 0;
            const hasWowB = wowKeywords.some(kw => titleB.includes(kw)) ? 1 : 0;
            return hasWowB - hasWowA; // Prioritize wow content
          })
          .slice(0, limit);
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

