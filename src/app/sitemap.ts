import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
             url: 'https://ukrainewarlosses.org',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
             url: 'https://ukrainewarlosses.org/methodology',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
             url: 'https://ukrainewarlosses.org/api/data',
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.6,
    },
  ];
}
