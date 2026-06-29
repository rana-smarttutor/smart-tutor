import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://smarttutors.co.in';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/courses',
          '/placements',
          '/mock-test',
          '/library',
          '/digital-library',
          '/contact',
          '/quiz-arena',
          '/signup',
          '/sitemap.xml',
          '/robots.txt',
        ],
        disallow: [
          '/api/',
          '/dashboard/',
          '/admin/',
          '/student-performance/',
          '/login',
          '/application-submitted',
          '/waiting-approval',
          '/*.json$',
          '/_next/',
        ],
        crawlDelay: 2,
      },
      {
        userAgent: 'GPTBot',
        allow: ['/', '/courses', '/placements', '/mock-test', '/library', '/digital-library', '/contact', '/quiz-arena', '/signup'],
        disallow: ['/dashboard/', '/api/', '/admin/', '/student-performance/', '/login'],
        crawlDelay: 5,
      },
      {
        userAgent: 'ChatGPT-User',
        allow: ['/', '/courses', '/placements', '/mock-test', '/library', '/digital-library', '/contact', '/quiz-arena', '/signup'],
        disallow: ['/dashboard/', '/api/', '/admin/', '/student-performance/', '/login'],
        crawlDelay: 5,
      },
      {
        userAgent: 'Claude-Web',
        allow: ['/', '/courses', '/placements', '/mock-test', '/library', '/digital-library', '/contact', '/quiz-arena', '/signup'],
        disallow: ['/dashboard/', '/api/', '/admin/', '/student-performance/', '/login'],
        crawlDelay: 5,
      },
      {
        userAgent: 'Google-Extended',
        allow: ['/', '/courses', '/placements', '/mock-test', '/library', '/digital-library', '/contact', '/quiz-arena', '/signup'],
        disallow: ['/dashboard/', '/api/', '/admin/', '/student-performance/', '/login'],
        crawlDelay: 1,
      },
      {
        userAgent: 'PerplexityBot',
        allow: ['/', '/courses', '/placements', '/mock-test', '/library', '/digital-library', '/contact', '/quiz-arena', '/signup'],
        disallow: ['/dashboard/', '/api/', '/admin/', '/student-performance/', '/login'],
        crawlDelay: 5,
      },
      {
        userAgent: 'Applebot',
        allow: ['/'],
        disallow: ['/api/', '/dashboard/', '/admin/'],
        crawlDelay: 2,
      },
      {
        userAgent: 'anthropic-ai',
        allow: ['/', '/courses', '/placements', '/mock-test', '/library', '/digital-library', '/contact', '/quiz-arena', '/signup'],
        disallow: ['/dashboard/', '/api/', '/admin/', '/student-performance/', '/login'],
        crawlDelay: 5,
      },
      {
        userAgent: 'Bytespider',
        allow: ['/'],
        disallow: ['/api/', '/dashboard/', '/admin/'],
        crawlDelay: 10,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
