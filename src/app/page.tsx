import { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import StatsCard from '@/components/StatsCard';
import AdBanner from '@/components/AdBanner';
import SourceCard from '@/components/SourceCard';
import ChartEnhanced from '@/components/ChartEnhanced';
import ForeignMercenaries from '@/components/ForeignMercenaries';
import { hardcodedChartData } from '@/data/hardcoded-chart-data';
import { hardcodedCasualtyData } from '@/data/hardcoded-casualty-totals';
import { translateCountry } from '@/lib/country-mapping';
import fs from 'fs/promises';
import path from 'path';

export const metadata: Metadata = {
  title: 'Ukraine-Russia War Personnel Losses Tracker | Real-Time Casualty Data & Statistics',
  description: 'Track verified Ukraine-Russia war casualties: 154,563+ Ukrainian losses (dead, missing, POWs) and 122,670+ Russian KIA from memorial databases. Updated monthly with historical trends since February 2022.',
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
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ukraine-Russia War Personnel Losses Tracker',
    description: 'Real-time tracking of Ukraine-Russia war personnel casualties with verified data and comprehensive statistics.',
    creator: '@ukrainewarlosses',
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

// Hardcoded casualty totals are now imported from the data file

// Use static rendering for Cloudflare Pages static export
export const dynamic = 'force-static';

async function loadMercenaryData() {
  try {
    // Load Russian foreign fighters data
    const russiaPath = path.join(process.cwd(), 'src', 'data', 'russia', 'russian_foreign_fighters.json');
    const russiaContent = await fs.readFile(russiaPath, 'utf-8');
    const russiaData = JSON.parse(russiaContent);
    
    // Load Ukrainian mercenaries data
    const ukrainePath = path.join(process.cwd(), 'src', 'data', 'ukraine', 'mercenaries.json');
    const ukraineContent = await fs.readFile(ukrainePath, 'utf-8');
    const ukraineData = JSON.parse(ukraineContent);

    // Process Russian data - group by regionDisplay (country)
    const russiaByCountry = new Map<string, number>();
    russiaData.forEach((fighter: any) => {
      const country = fighter.regionDisplay || fighter.region || 'Unknown';
      russiaByCountry.set(country, (russiaByCountry.get(country) || 0) + 1);
    });

    // Process Ukrainian data - group by citizenship
    const ukraineByCountry = new Map<string, number>();
    ukraineData.forEach((mercenary: any) => {
      const country = mercenary.citizenship || 'Unknown';
      ukraineByCountry.set(country, (ukraineByCountry.get(country) || 0) + 1);
    });

    // Sort by count descending and translate to English with country codes
    const russiaSorted = Array.from(russiaByCountry.entries())
      .map(([country, count]) => {
        const translated = translateCountry(country);
        return { 
          name: translated.name, 
          code: translated.code, 
          count 
        };
      })
      .sort((a, b) => b.count - a.count);

    const ukraineSorted = Array.from(ukraineByCountry.entries())
      .map(([country, count]) => {
        const translated = translateCountry(country);
        return { 
          name: translated.name, 
          code: translated.code, 
          count 
        };
      })
      .sort((a, b) => b.count - a.count);

    return {
      russia: {
        total: russiaData.length,
        byCountry: russiaSorted
      },
      ukraine: {
        total: ukraineData.length,
        byCountry: ukraineSorted
      }
    };
  } catch (error) {
    console.error('Error loading mercenary data:', error);
    return null;
  }
}

export default async function HomePage() {
  // Load mercenary data
  const mercenaryData = await loadMercenaryData();
  // Use hardcoded casualty totals (most accurate source)
  const ukraineTotal = hardcodedCasualtyData.ukraine.total_losses;
  const ukraineKilled = hardcodedCasualtyData.ukraine.dead || 0;
  const ukraineMissing = hardcodedCasualtyData.ukraine.missing || 0;
  const russiaTotal = hardcodedCasualtyData.russia.total_losses;
  const russiaKilled = russiaTotal; // Russian missing are counted as dead
  const russiaMissing = 0; // Russian missing are counted as dead
  
  // Find last date with deaths for Russia and Ukraine
  const dailyData = hardcodedChartData.daily;
  let russiaLastDate: string | null = null;
  let ukraineLastDate: string | null = null;
  
  // Iterate backwards to find the last date with deaths
  for (let i = dailyData.length - 1; i >= 0; i--) {
    const entry = dailyData[i];
    if (!russiaLastDate && entry.russiaDeaths > 0) {
      russiaLastDate = entry.isoDate;
    }
    if (!ukraineLastDate && entry.ukraineDeaths > 0) {
      ukraineLastDate = entry.isoDate;
    }
    if (russiaLastDate && ukraineLastDate) break;
  }
  
  // Calculate ratio with lowest number always 1 on left
  const calculateRatio = (left: number, right: number): { left: number; right: number } => {
    if (left === 0 || right === 0) return { left: 0, right: 0 };
    if (left <= right) {
      return { left: 1, right: Number((right / left).toFixed(2)) };
    } else {
      return { left: Number((left / right).toFixed(2)), right: 1 };
    }
  };
  
  const totalRatio = calculateRatio(russiaTotal, ukraineTotal);

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

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Ukraine War Losses Tracker',
    url: 'https://ukrainewarlosses.org',
    description: 'Independent tracker of Ukraine-Russia war personnel casualties',
    foundingDate: '2024',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'General Inquiry',
      url: 'https://ukrainewarlosses.org/contact'
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema)
        }}
      />
      <Header />
      
      {/* Header Banner Ad (Desktop) */}
      {/* <div className="container">
        <AdBanner size="header" adSlot="1234567890" />
      </div> */}

      <div className="container">
        <Hero russiaLastDate={russiaLastDate} ukraineLastDate={ukraineLastDate} />

        {/* Killed and Missing Personnel Overview */}
        <section id="overview" className="py-8">
          <h2 className="text-2xl font-bold text-text-primary mb-6">
            Killed and Missing Personnel Overview
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            <StatsCard
              country="russia"
              casualties={russiaTotal}
              title="Russian Federation Forces"
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
            <p className="text-text-muted text-sm mb-2">Loss Ratio</p>
            <div className="bg-background rounded p-3 border border-border-color text-center">
              <span className="text-primary font-bold text-lg flex items-center justify-center gap-2">
                <div className="russia-flag"></div>
                {totalRatio.left} : {totalRatio.right}
                <div className="ukraine-flag"></div>
              </span>
            </div>
          </div>
        </section>

        {/* In-Content Ad */}
        {/* <AdBanner size="content" adSlot="0987654321" /> */}

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
        {/* <AdBanner size="mobile" adSlot="1122334455" /> */}

        {/* Foreign Mercenaries Section */}
        {mercenaryData && <ForeignMercenaries data={mercenaryData} />}

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
              title="SVO RF GD"
              description="Russian personnel casualty tracking from verified open sources and official records"
              url="https://svo.rf.gd"
              country="russia"
            />
            <SourceCard
              title="Lost Armour"
              description="Ukrainian military personnel casualties from comprehensive database and verified sources"
              url="https://lostarmour.info"
              country="ukraine"
            />
          </div>
        </section>
      </div>

      {/* Footer Banner Ad */}
      {/* <div className="container">
        <AdBanner size="footer" adSlot="5566778899" />
      </div> */}

      <Footer />
    </main>
  );
}
