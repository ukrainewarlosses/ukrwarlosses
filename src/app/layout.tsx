import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Ukraine-Russia War Personnel Losses Tracker | Real-Time Casualty Data & Statistics',
    template: '%s | Ukraine War Losses Tracker'
  },
  description: 'Comprehensive real-time tracking of Ukraine-Russia war personnel casualties. Get accurate statistics, historical trends, and verified data from official sources. Updated daily with advanced web scraping technology.',
     keywords: 'ukraine russia war casualties, ukraine war losses, russia war losses, military casualties tracker, ukraine russia conflict statistics, war casualties data, ukraine military losses, russia military losses, conflict casualty tracking, ukraine war statistics, russia war statistics, military personnel losses, war data analysis, ukraine russia war tracker, historylegends, history legends',
  authors: [{ name: 'Ukraine War Losses Team' }],
  creator: 'Ukraine War Losses Tracker',
  publisher: 'Ukraine War Losses Tracker',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
     metadataBase: new URL('https://ukrainewarlosses.org'),
  alternates: {
         canonical: 'https://ukrainewarlosses.org',
  },
  openGraph: {
    title: 'Ukraine-Russia War Personnel Losses Tracker',
    description: 'Real-time tracking of Ukraine-Russia war personnel casualties with verified data, historical trends, and comprehensive statistics.',
    url: 'https://ukrainewarlosses.com',
    siteName: 'Ukraine War Losses Tracker',
    images: [
      {
        url: '/og-main.jpg',
        width: 1200,
        height: 630,
        alt: 'Ukraine-Russia War Casualties Tracker',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ukraine-Russia War Personnel Losses Tracker',
    description: 'Real-time tracking of Ukraine-Russia war personnel casualties with verified data and comprehensive statistics.',
    creator: '@ukrainewarlosses',
    images: ['/og-main.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
  },
  other: {
    'geo.region': 'UA',
    'geo.placename': 'Ukraine',
    'geo.position': '48.3794;31.1656',
    'ICBM': '48.3794, 31.1656',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="canonical" href="https://ukrainewarlosses.org" />
        <script 
          async 
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1234567890123456" 
          crossOrigin="anonymous"
        />
      </head>
      <body className="font-inter antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Ukraine War Losses Tracker',
              description: 'Real-time tracking of Ukraine-Russia war personnel casualties with verified data and comprehensive statistics',
              url: 'https://ukrainewarlosses.org',
              author: {
                '@type': 'Organization',
                name: 'Ukraine War Losses Tracker',
                url: 'https://ukrainewarlosses.org'
              },
              publisher: {
                '@type': 'Organization',
                name: 'Ukraine War Losses Tracker',
                url: 'https://ukrainewarlosses.org'
              },
                             keywords: 'ukraine russia war casualties, military losses tracker, war statistics, conflict data, historylegends, history legends',
              inLanguage: 'en-US',
              potentialAction: {
                '@type': 'SearchAction',
                target: 'https://ukrainewarlosses.org/search?q={search_term_string}',
                'query-input': 'required name=search_term_string'
              }
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Dataset',
              name: 'Ukraine-Russia War Personnel Casualties Dataset',
              description: 'Comprehensive dataset of Ukraine-Russia war personnel casualties with verified data from official sources',
              url: 'https://ukrainewarlosses.org',
              identifier: 'ukraine-russia-war-casualties-2022-2025',
              creator: {
                '@type': 'Organization',
                name: 'Ukraine War Losses Tracker'
              },
              publisher: {
                '@type': 'Organization',
                name: 'Ukraine War Losses Tracker'
              },
              temporalCoverage: '2022-02-24/2025-12-31',
              spatialCoverage: {
                '@type': 'Place',
                name: 'Ukraine and Russia',
                geo: {
                  '@type': 'GeoCoordinates',
                  latitude: 48.3794,
                  longitude: 31.1656
                }
              },
                             keywords: ['ukraine war', 'russia war', 'casualties', 'military losses', 'conflict data', 'historylegends', 'history legends'],
              license: 'https://creativecommons.org/licenses/by-nc/4.0/'
            })
          }}
        />
        {children}
      </body>
    </html>
  );
}
