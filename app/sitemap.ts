import { MetadataRoute } from 'next';
import { courseLibrary } from '@/lib/course-library';

/**
 * Smart Tutors Sitemap Generator
 * Dynamically generates sitemap for SEO and AI Discovery
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://smarttutors.co.in';
  const lastMod = new Date();

  // 1. Static Core Pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: lastMod,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/courses`,
      lastModified: lastMod,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/placements`,
      lastModified: lastMod,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/mock-test`,
      lastModified: lastMod,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/digital-library`,
      lastModified: lastMod,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: lastMod,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: lastMod,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ];

  // 2. Dynamic Course Pages (if they exist as separate routes)
  // Currently /courses is a single catalog, but we can prepare for deep links
  const coursePages: MetadataRoute.Sitemap = courseLibrary.map((course) => ({
    url: `${baseUrl}/courses#${course.standardKey}`,
    lastModified: lastMod,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...staticPages, ...coursePages];
}
