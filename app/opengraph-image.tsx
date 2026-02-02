import { ImageResponse } from 'next/og';
import { siteConfig } from '@/config/site';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const alt = siteConfig.name;
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

// Image generation
export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 60,
          background: 'linear-gradient(to bottom right, #0ea5e9, #0284c7)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          padding: '40px',
        }}
      >
        <div
          style={{
            fontSize: 80,
            fontWeight: 'bold',
            marginBottom: 20,
          }}
        >
          {siteConfig.name}
        </div>
        <div
          style={{
            fontSize: 40,
            textAlign: 'center',
            opacity: 0.9,
          }}
        >
          {siteConfig.tagline}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
