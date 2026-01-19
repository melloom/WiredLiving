# How to Get a Valid NewsAPI Key

## Step 1: Get Your API Key

1. Go to [https://newsapi.org/register](https://newsapi.org/register)
2. Sign up for a free account (or log in if you already have one)
3. After logging in, go to [https://newsapi.org/account](https://newsapi.org/account)
4. You'll see your API key - it should look like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6` (32+ alphanumeric characters)

## Step 2: Add to Environment Variables

### For Local Development

1. Open `.env.local` in your project root
2. Add or update the line:
   ```env
   NEWS_API_KEY=your_actual_api_key_here
   ```
3. Make sure there are NO spaces around the `=` sign
4. Make sure there are NO quotes around the key
5. Save the file

### For Vercel Deployment

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new variable:
   - **Key**: `NEWS_API_KEY`
   - **Value**: Your API key (paste it directly, no quotes)
   - **Environment**: Select all (Production, Preview, Development)
4. Click **Save**
5. Redeploy your application

## Step 3: Restart Your Dev Server

**IMPORTANT**: After adding/updating the API key, you MUST restart your development server:

1. Stop the current server (Ctrl+C or Cmd+C)
2. Start it again:
   ```bash
   npm run dev
   ```

## Step 4: Verify It Works

1. Visit `http://localhost:3000/api/news` in your browser
2. You should see JSON with articles (not an error)
3. The news feed should appear on your homepage and blog page

## Common Issues

### "API key is invalid"
- Make sure you copied the ENTIRE key (no spaces, no quotes)
- Verify the key at [newsapi.org/account](https://newsapi.org/account)
- Make sure you restarted the dev server after adding the key

### "API key format looks wrong"
- NewsAPI keys are typically 32+ alphanumeric characters
- They should NOT look like UUIDs (with dashes)
- Example of correct format: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

### Still not working?
1. Check browser console for errors
2. Check server terminal for error messages
3. Verify the key is active at [newsapi.org/account](https://newsapi.org/account)
4. Make sure you're testing on `localhost` (free tier only works locally)

## Free Tier Limitations

- ✅ 100 requests per day
- ✅ Works on localhost
- ❌ Does NOT work on deployed sites (production)
- For production, you need a paid plan


