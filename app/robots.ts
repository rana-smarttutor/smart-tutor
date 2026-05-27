import { MetadataRoute } from 'next';

/**
 * Smart Tutors Robots.txt Configuration
 * Optimized for Search Engines and AI Crawlers
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://smarttutors.co.in';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/courses', '/placements', '/mock-test', '/digital-library', '/contact'],
        disallow: ['/api/', '/dashboard/', '/admin/', '/login', '/logout', '/*.json$'],
      },
      {
        userAgent: 'GPTBot',
        allow: ['/', '/courses', '/placements'],
        disallow: ['/dashboard/', '/api/'],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: ['/', '/courses', '/placements'],
        disallow: ['/dashboard/', '/api/'],
      },
      {
        userAgent: 'Claude-Web',
        allow: ['/', '/courses', '/placements'],
        disallow: ['/dashboard/', '/api/'],
      },
      {
        userAgent: 'Google-Extended',
        allow: ['/', '/courses', '/placements'],
        disallow: ['/dashboard/', '/api/'],
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
