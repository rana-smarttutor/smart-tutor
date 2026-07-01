import { MetadataRoute } from 'next';
import { courseLibrary } from '@/lib/course-library';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://smarttutors.co.in';
  const lastMod = new Date();

  const corePages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: lastMod, changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/courses`, lastModified: lastMod, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/placements`, lastModified: lastMod, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/mock-test`, lastModified: lastMod, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/quiz-arena`, lastModified: lastMod, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/contact`, lastModified: lastMod, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/library`, lastModified: lastMod, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/signup`, lastModified: lastMod, changeFrequency: 'monthly', priority: 0.6 },
  ];

  const coursePages: MetadataRoute.Sitemap = courseLibrary.map((course) => ({
    url: `${baseUrl}/courses?key=${course.standardKey}`,
    lastModified: lastMod,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...corePages, ...coursePages];
}
