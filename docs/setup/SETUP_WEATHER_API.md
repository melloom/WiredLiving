# OpenWeatherMap API Setup

This blog includes a weather widget powered by OpenWeatherMap that displays local weather in the sidebar.

## Setup Instructions

### 1. Get Your OpenWeatherMap API Key

1. Visit [OpenWeatherMap.org](https://openweathermap.org/api)
2. Click **Sign Up** to create a free account (or **Sign In** if you already have one)
3. Go to your [API Keys page](https://home.openweathermap.org/api_keys)
4. Generate a new API key or use an existing one
5. Free tier includes:
   - 60 calls/minute
   - 1,000,000 calls/month
   - Current weather data
   - 5-day/3-hour forecast
   - Historical data (limited)

### 2. Add Environment Variable

#### For Local Development

Create or update `.env.local` in your project root:

```env
NEXT_PUBLIC_WEATHER_API_KEY=your_api_key_here
```

**Important Notes:**
- Use `NEXT_PUBLIC_` prefix so the key is available in client-side code
- Make sure there are NO spaces around the `=` sign
- Make sure there are NO quotes around the key
- Save the file

#### For Vercel Deployment

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new variable:
   - **Key**: `NEXT_PUBLIC_WEATHER_API_KEY`
   - **Value**: Your OpenWeatherMap API key (paste it directly, no quotes)
   - **Environment**: Select all (Production, Preview, Development)
4. Click **Save**
5. Redeploy your application

### 3. Restart Your Dev Server

**IMPORTANT**: After adding/updating the API key, you MUST restart your development server:

1. Stop the current server (Ctrl+C or Cmd+C)
2. Start it again:
   ```bash
   npm run dev
   ```

### 4. How It Works

The weather widget:
- Uses browser geolocation to get your location
- Falls back to a default location (New York) if geolocation is denied
- Displays current temperature, condition, and location
- Shows a fallback display if the API key is not configured

### 5. Features

- **Automatic Location**: Uses your browser's geolocation
- **Real-time Weather**: Fetches current weather data
- **Fallback Handling**: Shows a placeholder if API key is missing
- **Error Handling**: Gracefully handles API errors
- **Responsive Design**: Works on all screen sizes

### 6. API Limits

The free tier of OpenWeatherMap has limits:
- **60 requests per minute**
- **1,000,000 requests per month**
- For higher limits, consider upgrading to a paid plan

### 7. Troubleshooting

**Weather widget not showing?**
- Check that `NEXT_PUBLIC_WEATHER_API_KEY` is set in your environment variables
- Verify your API key is valid at [OpenWeatherMap API Keys](https://home.openweathermap.org/api_keys)
- Check browser console for errors
- Make sure you restarted the dev server after adding the key

**"Invalid API key" error?**
- Verify the key at [OpenWeatherMap API Keys](https://home.openweathermap.org/api_keys)
- Make sure you copied the ENTIRE key (no spaces, no quotes)
- Wait a few minutes after generating a new key (activation can take 10-30 minutes)

**Geolocation not working?**
- Make sure your browser allows location access
- The widget will automatically fall back to a default location (New York)
- Check browser console for geolocation errors

**Rate limit exceeded?**
- Free tier allows 60 calls per minute
- Weather data is fetched once per page load
- Consider implementing caching if you have high traffic

### 8. Security Note

The API key is exposed to the client-side because it uses the `NEXT_PUBLIC_` prefix. This is safe for OpenWeatherMap because:
- They support client-side API keys
- You can set usage limits in your OpenWeatherMap dashboard
- Free tier has built-in rate limiting

For extra security, you can:
- Set usage limits in your OpenWeatherMap account
- Monitor API usage in your dashboard
- Use a server-side API route if you prefer (requires additional setup)

### 9. Customization

You can customize the weather widget by editing:
- **Component**: `components/sidebar-weather.tsx` - Modify the display, add more data, change units
- **Default Location**: Edit the fallback city in the component
- **Units**: Change from Fahrenheit (`units=imperial`) to Celsius (`units=metric`)

### 10. Additional Resources

- [OpenWeatherMap API Documentation](https://openweathermap.org/api)
- [API Key Management](https://home.openweathermap.org/api_keys)
- [Pricing Plans](https://openweathermap.org/price)
