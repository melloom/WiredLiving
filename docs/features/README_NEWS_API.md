# NewsAPI Integration Setup

This blog includes a news feed powered by NewsAPI that displays technology news in the sidebar.

## Setup Instructions

### 1. Get Your NewsAPI Key

1. Visit [NewsAPI.org](https://newsapi.org/)
2. Sign up for a free account
3. Go to your dashboard to get your API key
4. Free tier includes:
   - 100 requests per day
   - Top headlines endpoint
   - Development use only

### 2. Add Environment Variable

#### For Local Development

Create or update `.env.local` in your project root:

```env
NEWS_API_KEY=your_api_key_here
```

#### For Vercel Deployment

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new variable:
   - **Key**: `NEWS_API_KEY`
   - **Value**: Your NewsAPI key
   - **Environment**: Production, Preview, Development (select all)
4. Redeploy your application

### 3. Features

- **Automatic Updates**: News refreshes every hour
- **Technology Focus**: Shows top technology headlines
- **Responsive Design**: Works on all screen sizes
- **Error Handling**: Gracefully handles missing API key
- **External Links**: Opens news articles in new tabs

### 4. Customization

You can customize the news feed by editing:

- **API Route**: `app/api/news/route.ts` - Change category, language, or number of articles
- **Component**: `components/news-feed.tsx` - Modify the display style

### 5. API Limits

The free tier of NewsAPI has limits:
- 100 requests per day
- Development use only (not for production commercial use)
- For production use, consider upgrading to a paid plan

### 6. Troubleshooting

**News feed not showing?**
- Check that `NEWS_API_KEY` is set in your environment variables
- Verify your API key is valid at [NewsAPI Dashboard](https://newsapi.org/account)
- Check browser console for errors

**Rate limit exceeded?**
- Free tier allows 100 requests per day
- News is cached for 1 hour to reduce API calls
- Consider upgrading to a paid plan for higher limits

### 7. Alternative News Sources

If you want to use a different news source, you can:
1. Modify `app/api/news/route.ts` to use a different API
2. Update the component to match the new API structure
3. Popular alternatives: RSS feeds, Reddit API, custom news aggregator


