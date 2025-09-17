import { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import StatsCard from '@/components/StatsCard';
import AdBanner from '@/components/AdBanner';
import VideoCard from '@/components/VideoCard';
import SourceCard from '@/components/SourceCard';
import ChartEnhanced from '@/components/ChartEnhanced';
import { YouTubeEmbed } from '@/types';
import { hardcodedYouTubeData } from '@/data/hardcoded-youtube-data';
import { hardcodedChartData } from '@/data/hardcoded-chart-data';

export const metadata: Metadata = {
  title: 'Ukraine-Russia War Personnel Losses Tracker | Real-Time Casualty Data & Statistics',
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
    url: 'https://ukrainewarlosses.org',
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

// YouTube videos now loaded dynamically from scraped data

// Hardcoded casualty totals are now imported from the data file

// Use dynamic rendering to avoid build-time data loading issues
export const dynamic = 'force-dynamic';

export default function HomePage() {
  // Derive overview totals from the same source as the chart (hardcodedChartData)
  const daily = hardcodedChartData.daily;
  const ukraineKilled = daily.reduce((sum, d) => sum + d.ukraineDeaths, 0);
  const ukraineMissing = daily.reduce((sum, d) => sum + d.ukraineMissing, 0);
  const ukraineTotal = ukraineKilled + ukraineMissing;
  const russiaKilled = daily.reduce((sum, d) => sum + d.russiaDeaths, 0);
  const russiaMissing = 0; // Russian missing are counted as dead
  const russiaTotal = russiaKilled + russiaMissing;
  const ratioTotalVsTotal = ukraineTotal > 0 ? russiaTotal / ukraineTotal : 0;
  const ratioKilledOnly = ukraineKilled > 0 ? russiaKilled / ukraineKilled : 0;

  // Structured data for the main page
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Ukraine-Russia War Personnel Losses Tracker',
    description: 'Real-time tracking of Ukraine-Russia war personnel casualties with verified data and comprehensive statistics',
    url: 'https://ukrainewarlosses.org',
    mainEntity: {
      '@type': 'Dataset',
      name: 'Ukraine-Russia War Personnel Casualties',
      description: `Current casualty data: Ukraine ${ukraineTotal.toLocaleString()} losses, Russia ${russiaTotal.toLocaleString()} losses`,
      temporalCoverage: '2022-02-24/2025-12-31',
      spatialCoverage: {
        '@type': 'Place',
        name: 'Ukraine and Russia'
      },
             variableMeasured: ['Ukrainian military casualties', 'Russian military casualties'],
       keywords: ['ukraine war', 'russia war', 'casualties', 'military losses', 'conflict data', 'historylegends', 'history legends'],
      measurementTechnique: 'Web scraping and data verification',
      creator: {
        '@type': 'Organization',
        name: 'Ukraine War Losses Tracker'
      }
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://ukrainewarlosses.org'
        }
      ]
    }
  };

  return (
    <main className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData)
        }}
      />
      <Header />
      
      {/* Header Banner Ad (Desktop) */}
      <div className="container">
        <AdBanner size="header" adSlot="1234567890" />
      </div>

      <div className="container">
        <Hero />

        {/* Killed and Missing Personnel Overview */}
        <section id="overview" className="py-8">
          <h2 className="text-2xl font-bold text-text-primary mb-6">
            Killed and Missing Personnel Overview
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            <StatsCard
              country="russia"
              casualties={russiaTotal}
              title="Russian Forces"
              breakdown={{
                dead: russiaKilled,
                missing: 'counted as dead'
              }}
            />
            <StatsCard
              country="ukraine"
              casualties={ukraineTotal}
              title="Ukrainian Forces"
              breakdown={{
                dead: ukraineKilled,
                missing: ukraineMissing
              }}
            />
          </div>

          {/* Ratios */}
          <div className="bg-card-bg border border-border-color rounded-lg p-4 mt-4">
            <p className="text-text-muted text-sm mb-2">Loss Ratios (Russian : Ukrainian)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="bg-background rounded p-3 border border-border-color">
                <div className="flex justify-between items-baseline">
                  <span className="text-text-light">Death Ratio</span>
                  <span className="text-primary font-bold">{ratioKilledOnly.toFixed(2)}:1</span>
                </div>
              </div>
              <div className="bg-background rounded p-3 border border-border-color">
                <div className="flex justify-between items-baseline">
                  <span className="text-text-light">Death Ratio</span>
                  <span className="text-primary font-bold">{ratioTotalVsTotal.toFixed(2)}:1</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* In-Content Ad */}
        <AdBanner size="content" adSlot="0987654321" />

        {/* Trends Chart Section */}
        <section id="trends" className="bg-card-bg border border-border-color rounded-lg p-4 sm:p-6 lg:p-8 my-8">
          <h2 className="text-lg sm:text-xl font-bold text-text-primary mb-4">
            📈 Personnel Casualty Trends Over Time
          </h2>
          <div className="w-full overflow-x-auto">
            <ChartEnhanced />
          </div>
        </section>

        {/* Mobile Sidebar Ad */}
        <AdBanner size="mobile" adSlot="1122334455" />

        {/* Latest Media Coverage */}
        <section id="videos" className="bg-card-bg border border-border-color rounded-lg p-8 my-8">
          <h2 className="text-xl font-bold text-text-primary mb-4">
            📺 Latest Media Coverage
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
            {hardcodedYouTubeData.videos.map((video, index) => (
              <VideoCard key={index} video={video} />
            ))}
          </div>
        </section>

        {/* Data Sources */}
        <section id="sources" className="bg-card-bg border border-border-color rounded-lg p-8 my-8">
          <h2 className="text-xl font-bold text-text-primary mb-4">
            📋 Data Sources
          </h2>
          <p className="mb-4 text-text-light">
            Our personnel casualty data is compiled from the following verified sources:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <SourceCard
              title="Zona Media"
              description="Russian personnel casualty tracking based on probate registry data and open sources"
              url="https://en.zona.media/article/2025/08/01/casualties_eng-trl"
              country="russia"
            />
            <SourceCard
              title="UA Losses"
              description="Ukrainian military personnel casualties from official and verified sources"
              url="https://ualosses.org/en/soldiers/"
              country="ukraine"
            />
          </div>
          
          <p className="mt-6 text-sm text-text-light leading-relaxed">
            Data is continuously monitored and updated from these sources. For detailed methodology information, see our{' '}
            <a href="/methodology" className="text-primary hover:text-primary-dark hover:underline transition-colors">
              methodology page
            </a>
            . We prioritize accuracy and verification over speed of reporting, focusing specifically on personnel losses.
          </p>
        </section>
      </div>

      {/* Footer Banner Ad */}
      <div className="container">
        <AdBanner size="footer" adSlot="5566778899" />
      </div>

      <Footer />
    </main>
  );
}
