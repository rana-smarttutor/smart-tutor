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
        allow: ['/', '/courses', '/placements', '/mock-test', '/library', '/contact', '/quiz-arena'],
        disallow: ['/api/', '/dashboard/', '/admin/', '/student-performance/', '/login', '/logout', '/*.json$'],
      },
      {
        userAgent: 'GPTBot',
        allow: ['/', '/courses', '/placements', '/mock-test', '/library', '/contact', '/quiz-arena'],
        disallow: ['/dashboard/', '/api/', '/admin/', '/student-performance/'],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: ['/', '/courses', '/placements', '/mock-test', '/library', '/contact', '/quiz-arena'],
        disallow: ['/dashboard/', '/api/', '/admin/', '/student-performance/'],
      },
      {
        userAgent: 'Claude-Web',
        allow: ['/', '/courses', '/placements', '/mock-test', '/library', '/contact', '/quiz-arena'],
        disallow: ['/dashboard/', '/api/', '/admin/', '/student-performance/'],
      },
      {
        userAgent: 'Google-Extended',
        allow: ['/', '/courses', '/placements', '/mock-test', '/library', '/contact', '/quiz-arena'],
        disallow: ['/dashboard/', '/api/', '/admin/', '/student-performance/'],
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
