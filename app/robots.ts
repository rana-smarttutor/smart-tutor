import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://smarttutors.co.in';

  const allowAll = [
    '/',
    '/courses',
    '/placements',
    '/mock-test',
    '/library',
    '/contact',
    '/quiz-arena',
    '/signup',
    '/privacy',
    '/terms',
    '/eula',
  ];

  const disallowAll = [
    '/api/',
    '/dashboard/',
    '/admin/',
    '/student-performance/',
    '/login',
    '/application-submitted',
    '/waiting-approval',
    '/*.json$',
    '/_next/',
  ];

  return {
    rules: [
      {
        userAgent: '*',
        allow: allowAll,
        disallow: disallowAll,
        crawlDelay: 2,
      },
      {
        userAgent: 'Googlebot',
        allow: allowAll,
        disallow: disallowAll,
        crawlDelay: 1,
      },
      {
        userAgent: 'Googlebot-Image',
        allow: ['/', '/*.jpg', '/*.jpeg', '/*.png', '/*.webp', '/*.svg'],
      },
      {
        userAgent: 'Googlebot-Video',
        allow: ['/'],
      },
      {
        userAgent: 'GPTBot',
        allow: allowAll,
        disallow: ['/dashboard/', '/api/', '/admin/', '/student-performance/', '/login'],
        crawlDelay: 5,
      },
      {
        userAgent: 'ChatGPT-User',
        allow: allowAll,
        disallow: ['/dashboard/', '/api/', '/admin/', '/student-performance/', '/login'],
        crawlDelay: 5,
      },
      {
        userAgent: 'Claude-Web',
        allow: allowAll,
        disallow: ['/dashboard/', '/api/', '/admin/', '/student-performance/', '/login'],
        crawlDelay: 5,
      },
      {
        userAgent: 'Google-Extended',
        allow: allowAll,
        disallow: ['/dashboard/', '/api/', '/admin/', '/student-performance/', '/login'],
        crawlDelay: 1,
      },
      {
        userAgent: 'PerplexityBot',
        allow: allowAll,
        disallow: ['/dashboard/', '/api/', '/admin/', '/student-performance/', '/login'],
        crawlDelay: 5,
      },
      {
        userAgent: 'Applebot',
        allow: allowAll,
        disallow: ['/dashboard/', '/api/', '/admin/', '/student-performance/', '/login'],
        crawlDelay: 2,
      },
      {
        userAgent: 'anthropic-ai',
        allow: allowAll,
        disallow: ['/dashboard/', '/api/', '/admin/', '/student-performance/', '/login'],
        crawlDelay: 5,
      },
      {
        userAgent: 'Bytespider',
        allow: ['/'],
        disallow: ['/api/', '/dashboard/', '/admin/', '/student-performance/', '/login'],
        crawlDelay: 10,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
