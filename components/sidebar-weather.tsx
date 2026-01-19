'use client';

import { useEffect, useState } from 'react';

interface WeatherData {
  temp: number;
  feelsLike?: number;
  condition: string;
  description?: string;
  icon: string;
  location: string;
  humidity?: number;
  windSpeed?: number;
  pressure?: number;
  visibility?: number;
  uvIndex?: number;
}

export function SidebarWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get user's location or use a default
    if ('geolocation' in navigator) {
      console.log('🌍 Requesting geolocation...');
      
      const geoOptions = {
        enableHighAccuracy: true, // Try to get the most accurate location
        timeout: 10000, // Wait up to 10 seconds for location
        maximumAge: 60000, // Accept cached location if less than 1 minute old
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log('✅ Geolocation success:', { latitude, longitude });
          fetchWeather(latitude, longitude);
        },
        (error) => {
          // Handle different geolocation errors
          console.warn('⚠️ Geolocation error:', error);
          
          let errorMessage = 'Unable to get location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied';
              console.log('📍 User denied location permission, using fallback');
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location unavailable';
              console.log('📍 Location unavailable, using fallback');
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timeout';
              console.log('📍 Location request timed out, using fallback');
              break;
            default:
              errorMessage = 'Unknown geolocation error';
              console.log('📍 Unknown geolocation error, using fallback');
              break;
          }
          
          // Always fallback to default city if geolocation fails
          fetchWeatherByCity('New York');
        },
        geoOptions
      );
    } else {
      console.log('📍 Geolocation not supported, using fallback');
      fetchWeatherByCity('New York');
    }
  }, []);

  const fetchWeather = async (lat: number, lon: number) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🌤️ Fetching weather for location:', { lat, lon });
      
      // Try OpenWeatherMap API first (if API key is available)
      const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
      
      if (apiKey) {
        try {
          console.log('📡 Calling OpenWeatherMap API...');
          const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`;
          const response = await fetch(apiUrl);

          if (response.ok) {
            const data = await response.json();
            console.log('✅ Weather data received from OpenWeatherMap:', { location: data.name, temp: data.main?.temp });
            
            if (data && data.main && data.weather && data.weather[0]) {
              setWeather({
                temp: Math.round(data.main.temp),
                feelsLike: Math.round(data.main.feels_like),
                condition: data.weather[0].main,
                description: data.weather[0].description,
                icon: getWeatherIcon(data.weather[0].main),
                location: data.name || 'Your Location',
                humidity: data.main.humidity,
                windSpeed: Math.round(data.wind?.speed || 0),
                pressure: data.main.pressure,
                visibility: data.visibility ? Math.round(data.visibility / 1609.34) : undefined, // Convert to miles
                uvIndex: undefined, // Not available in current weather endpoint
              });
              setLoading(false);
              setError(null);
              return; // Success, exit early
            }
          }
        } catch (err) {
          console.warn('⚠️ OpenWeatherMap failed, trying fallback:', err);
          // Fall through to wttr.in fallback
        }
      }

      // Fallback to wttr.in (free, no API key required)
      console.log('📡 Using wttr.in fallback (free, no API key)...');
      const wttrUrl = `https://wttr.in/@${lat},${lon}?format=j1`;
      const response = await fetch(wttrUrl);

      if (!response.ok) {
        throw new Error(`wttr.in API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Weather data received from wttr.in');
      
      if (data && data.current_condition && data.current_condition[0]) {
        const current = data.current_condition[0];
        const location = data.nearest_area?.[0]?.areaName?.[0]?.value || 'Your Location';
        
        setWeather({
          temp: Math.round(parseFloat(current.temp_F) || 72),
          feelsLike: Math.round(parseFloat(current.FeelsLikeF) || 72),
          condition: current.weatherDesc?.[0]?.value || 'Partly Cloudy',
          description: current.weatherDesc?.[0]?.value || 'Partly Cloudy',
          icon: getWeatherIconFromCode(parseInt(current.weatherCode) || 116),
          location: location,
          humidity: parseInt(current.humidity) || undefined,
          windSpeed: Math.round(parseFloat(current.windspeedMiles) || 0),
          pressure: parseInt(current.pressure) || undefined,
          visibility: parseInt(current.visibility) || undefined,
          uvIndex: current.uvIndex || undefined,
        });
        setLoading(false);
        setError(null);
      } else {
        throw new Error('Invalid weather data from wttr.in');
      }
    } catch (err) {
      console.error('❌ All weather services failed:', err);
      // Final fallback - show default weather
      setWeather({
        temp: 72,
        condition: 'Partly Cloudy',
        icon: '⛅',
        location: 'Your Location',
      });
      setError(null);
      setLoading(false);
    }
  };

  const fetchWeatherByCity = async (city: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🌤️ Fetching weather for city:', city);
      
      // Try OpenWeatherMap API first (if API key is available)
      const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
      
      if (apiKey) {
        try {
          console.log('📡 Calling OpenWeatherMap API for city...');
          const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=imperial&appid=${apiKey}`;
          const response = await fetch(apiUrl);

          if (response.ok) {
            const data = await response.json();
            console.log('✅ Weather data received from OpenWeatherMap:', { location: data.name, temp: data.main?.temp });
            
            if (data && data.main && data.weather && data.weather[0]) {
              setWeather({
                temp: Math.round(data.main.temp),
                feelsLike: Math.round(data.main.feels_like),
                condition: data.weather[0].main,
                description: data.weather[0].description,
                icon: getWeatherIcon(data.weather[0].main),
                location: data.name || city,
                humidity: data.main.humidity,
                windSpeed: Math.round(data.wind?.speed || 0),
                pressure: data.main.pressure,
                visibility: data.visibility ? Math.round(data.visibility / 1609.34) : undefined,
              });
              setLoading(false);
              setError(null);
              return; // Success, exit early
            }
          }
        } catch (err) {
          console.warn('⚠️ OpenWeatherMap failed, trying fallback:', err);
          // Fall through to wttr.in fallback
        }
      }

      // Fallback to wttr.in (free, no API key required)
      console.log('📡 Using wttr.in fallback (free, no API key)...');
      const encodedCity = encodeURIComponent(city);
      const wttrUrl = `https://wttr.in/${encodedCity}?format=j1`;
      const response = await fetch(wttrUrl);

      if (!response.ok) {
        throw new Error(`wttr.in API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Weather data received from wttr.in');
      
      if (data && data.current_condition && data.current_condition[0]) {
        const current = data.current_condition[0];
        const location = data.nearest_area?.[0]?.areaName?.[0]?.value || city;
        
        setWeather({
          temp: Math.round(parseFloat(current.temp_F) || 72),
          condition: current.weatherDesc?.[0]?.value || 'Partly Cloudy',
          icon: getWeatherIconFromCode(parseInt(current.weatherCode) || 116),
          location: location,
        });
        setLoading(false);
        setError(null);
      } else {
        throw new Error('Invalid weather data from wttr.in');
      }
    } catch (err) {
      console.error('❌ All weather services failed:', err);
      // Final fallback - show default weather
      setWeather({
        temp: 72,
        condition: 'Partly Cloudy',
        icon: '⛅',
        location: city,
      });
      setError(null);
      setLoading(false);
    }
  };

  const getWeatherIcon = (condition: string): string => {
    const conditionLower = condition.toLowerCase();
    if (conditionLower.includes('clear')) return '☀️';
    if (conditionLower.includes('cloud')) return '☁️';
    if (conditionLower.includes('rain')) return '🌧️';
    if (conditionLower.includes('snow')) return '❄️';
    if (conditionLower.includes('storm')) return '⛈️';
    if (conditionLower.includes('mist') || conditionLower.includes('fog')) return '🌫️';
    return '⛅';
  };

  // Convert wttr.in weather codes to emoji icons
  const getWeatherIconFromCode = (code: number): string => {
    // wttr.in uses WorldWeatherOnline codes
    // Common codes: 113=sunny, 116=partly cloudy, 119/122=cloudy, 143/248=fog, 176/263/266/281/284=rain, 179/182/185/200/227/230=snow/storm
    if (code === 113) return '☀️'; // Clear/sunny
    if (code === 116) return '⛅'; // Partly cloudy
    if (code >= 119 && code <= 122) return '☁️'; // Cloudy/overcast
    if (code >= 143 && code <= 248) return '🌫️'; // Fog/mist
    if (code >= 176 && code <= 263) return '🌧️'; // Rain
    if (code >= 266 && code <= 284) return '🌧️'; // More rain
    if (code >= 200 && code <= 248) return '⛈️'; // Thunderstorm
    if (code >= 260 && code <= 263) return '🌨️'; // Freezing rain
    if (code >= 179 && code <= 230) return '❄️'; // Snow
    return '⛅'; // Default
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 rounded-xl p-5 border border-sky-200 dark:border-sky-800 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
          </svg>
          Weather
        </h3>
        <div className="animate-pulse space-y-2">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  // Always show widget, even if there's an error (fallback weather is shown)
  if (!weather) {
    return null; // Only hide if weather data is completely unavailable
  }

  return (
    <div className="bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 dark:from-sky-900/30 dark:via-blue-900/20 dark:to-cyan-900/20 rounded-xl p-5 border border-sky-200 dark:border-sky-800 shadow-lg">
      <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
        <svg className="w-4 h-4 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
        Weather
      </h3>
      
      {/* Main Weather Display */}
      <div className="flex items-start gap-4 mb-4">
        <div className="text-5xl">{weather.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <div className="text-4xl font-bold text-gray-900 dark:text-gray-100">
              {weather.temp}°
            </div>
            <div className="text-xl text-gray-600 dark:text-gray-400 font-medium">F</div>
          </div>
          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 capitalize mb-1">
            {weather.description || weather.condition}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {weather.location}
          </div>
        </div>
      </div>

      {/* Additional Weather Details */}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-sky-200/50 dark:border-sky-800/50">
        {weather.feelsLike && (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-sky-600 dark:text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Feels like</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{weather.feelsLike}°F</div>
            </div>
          </div>
        )}
        
        {weather.humidity !== undefined && (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-sky-600 dark:text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Humidity</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{weather.humidity}%</div>
            </div>
          </div>
        )}
        
        {weather.windSpeed !== undefined && (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-sky-600 dark:text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Wind</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{weather.windSpeed} mph</div>
            </div>
          </div>
        )}
        
        {weather.visibility !== undefined && (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-sky-600 dark:text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Visibility</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{weather.visibility} mi</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
