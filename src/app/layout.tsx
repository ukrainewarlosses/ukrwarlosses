import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ukraine-Russia War Losses Tracker | Real-Time Casualties Data',
  description: 'Track real-time military casualties and losses in the Ukraine-Russia conflict. Updated data from verified sources including equipment losses and personnel casualties.',
  keywords: 'Ukraine war losses, Russia casualties, military losses tracker, war statistics',
  authors: [{ name: 'WarLosses.info' }],
  creator: 'WarLosses.info',
  publisher: 'WarLosses.info',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://warlosses.info'),
  openGraph: {
    title: 'Ukraine-Russia War Losses Tracker',
    description: 'Real-time tracking of military casualties and equipment losses in the Ukraine-Russia conflict',
    type: 'website',
    url: 'https://warlosses.info',
    siteName: 'WarLosses.info',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Ukraine-Russia War Losses Tracker',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ukraine-Russia War Losses Tracker',
    description: 'Real-time tracking of military casualties and equipment losses in the Ukraine-Russia conflict',
    images: ['/og-image.png'],
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
    google: 'google-site-verification-code',
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
        <link rel="canonical" href="https://warlosses.info" />
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
              name: 'WarLosses.info',
              description: 'Real-time tracking of military casualties and equipment losses in the Ukraine-Russia conflict',
              url: 'https://warlosses.info',
              author: {
                '@type': 'Organization',
                name: 'WarLosses.info'
              },
              publisher: {
                '@type': 'Organization',
                name: 'WarLosses.info'
              },
              keywords: 'Ukraine war losses, Russia casualties, military losses tracker, war statistics',
              inLanguage: 'en-US'
            })
          }}
        />
        {children}
      </body>
    </html>
  );
}
