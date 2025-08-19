import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/scrape', '/api/test-*'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/scrape'],
      },
    ],
    sitemap: 'https://ukrainewarlosses.com/sitemap.xml',
    host: 'https://ukrainewarlosses.com',
  };
}
