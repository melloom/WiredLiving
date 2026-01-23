import { NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * Server-side geolocation proxy to avoid CSP restrictions and client-side API limits
 * Tries multiple free geolocation services in sequence
 */
export async function GET() {
  const services = [
    {
      name: 'ip-api.com',
      url: 'http://ip-api.com/json/?fields=lat,lon,city,status',
      parse: (data: any) => {
        if (data.status === 'success') {
          return { lat: data.lat, lon: data.lon, city: data.city };
        }
        throw new Error('IP API failed');
      },
    },
    {
      name: 'ipapi.co',
      url: 'https://ipapi.co/json/',
      parse: (data: any) => {
        if (data.latitude && data.longitude) {
          return {
            lat: data.latitude,
            lon: data.longitude,
            city: data.city || data.region_code,
          };
        }
        throw new Error('IPAPI.CO failed');
      },
    },
    {
      name: 'geojs.io',
      url: 'https://get.geojs.io/v1/ip/geo.json',
      parse: (data: any) => {
        if (data.latitude && data.longitude) {
          return {
            lat: parseFloat(data.latitude),
            lon: parseFloat(data.longitude),
            city: data.city,
          };
        }
        throw new Error('GeoJS failed');
      },
    },
  ];

  for (const service of services) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(service.url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'WiredLiving-Weather-Widget/1.0',
        },
      });

      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        const location = service.parse(data);

        console.log(`✅ Geolocation from ${service.name}:`, location);

        return NextResponse.json(location, {
          headers: {
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
          },
        });
      }
    } catch (err) {
      console.warn(`⚠️ ${service.name} failed:`, err);
      continue;
    }
  }

  // All services failed
  return NextResponse.json(
    { error: 'All geolocation services failed' },
    { status: 503 }
  );
}
