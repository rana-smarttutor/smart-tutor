
import type { MetadataRoute } from "next";

import {
  COURSE_SITE_URL,
  coursePageRegistry,
  courseHubRegistry,
  getCoursePageBySlug,
} from "@/lib/course-page-registry";

/**
 * Keep this false until:
 * 1. All course and category pages have approved content.
 * 2. Their metadata no longer contains noindex.
 * 3. The final design and SEO checks pass.
 */
const COURSE_PAGES_READY_FOR_INDEXING = false;

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = COURSE_SITE_URL;

  const lastMod = new Date();
  const legalLastMod = new Date("2026-07-31");

  // Existing public website pages.
  const corePages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: lastMod,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/courses`,
      lastModified: lastMod,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/placements`,
      lastModified: lastMod,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/mock-test`,
      lastModified: lastMod,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/quiz-arena`,
      lastModified: lastMod,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/library`,
      lastModified: lastMod,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: lastMod,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: legalLastMod,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: legalLastMod,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/eula`,
      lastModified: legalLastMod,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // Do not publish unapproved, noindex course URLs
  // in the sitemap.
  if (!COURSE_PAGES_READY_FOR_INDEXING) {
    return corePages;
  }

  // Four category hub pages.
  const categoryPages: MetadataRoute.Sitemap =
    courseHubRegistry.map((hub) => ({
      url: `${baseUrl}/courses/${hub.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }));

  // Dedicated individual course pages.
  const coursePages: MetadataRoute.Sitemap =
    coursePageRegistry
      .filter(
        (course) =>
          getCoursePageBySlug(course.slug) !== null,
      )
      .map((course) => ({
        url: `${baseUrl}/courses/${course.slug}`,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      }));

  return [
    ...corePages,
    ...categoryPages,
    ...coursePages,
  ];
}
