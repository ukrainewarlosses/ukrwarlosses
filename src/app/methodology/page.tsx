import { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdBanner from '@/components/AdBanner';
import Breadcrumb from '@/components/Breadcrumb';

export const metadata: Metadata = {
  title: 'Methodology - Ukraine-Russia War Personnel Losses Tracking | Data Sources & Analysis',
  description: 'Transparent data methodology: We aggregate from svo.rf.gd and lostarmour.info memorial databases. Sample 500+ pages monthly, scale to official totals. Learn our verification and statistical analysis processes.',
  keywords: 'ukraine russia war methodology, casualty tracking methodology, military losses data sources, war casualties verification, ukraine war statistics methodology, russia war losses methodology, conflict data collection, military personnel tracking, historylegends, history legends',
  openGraph: {
    title: 'Methodology - Ukraine-Russia War Personnel Losses Tracking',
    description: 'Data sourced from svo.rf.gd and lostarmour.info. Learn about their data collection methods, verification processes, and statistical analysis techniques.',
    type: 'website',
    url: 'https://ukrainewarlosses.org/methodology',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Methodology - Ukraine-Russia War Personnel Losses Tracking',
    description: 'Data sourced from svo.rf.gd and lostarmour.info. Learn about their methodology.',
  },
  alternates: {
    canonical: 'https://ukrainewarlosses.org/methodology'
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
  }
};

export default function MethodologyPage() {
  // FAQ schema for methodology page
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How accurate is this casualty data?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Our data comes from verified memorial databases (svo.rf.gd and lostarmour.info) that track confirmed casualties. We sample 500+ memorial pages monthly and scale to match official totals. Numbers represent confirmed minimum losses.'
        }
      },
      {
        '@type': 'Question',
        name: 'How often is the data updated?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: "Data updates are dependent on our sources capabilities to find the new data. The updates are made approximately one time per month, but it's possible to last longer depending on the sources capabilities."
        }
      },
      {
        '@type': 'Question',
        name: 'What are the data sources?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Ukrainian casualties: ualosses.org memorial database with individual death dates. Russian casualties: svo.rf.gd verified named personnel list. Both sources independently verify casualties before listing.'
        }
      },
      {
        '@type': 'Question',
        name: "What's the difference between confirmed and unconfirmed casualties?",
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Confirmed casualties have specific known death dates. Unconfirmed entries have estimated dates (shown in parentheses on memorial pages) due to delayed reporting or incomplete information.'
        }
      }
    ]
  };

  // Structured data for methodology page
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Methodology - Ukraine-Russia War Personnel Losses Tracking',
    description: 'Data sourced from svo.rf.gd and lostarmour.info. Learn about their data collection methods, verification processes, and statistical analysis techniques.',
    url: 'https://ukrainewarlosses.org/methodology',
    mainEntity: {
      '@type': 'Article',
      headline: 'Methodology for Ukraine-Russia War Personnel Losses Tracking',
      description: 'Data sourced from open-source databases. Detailed methodology explaining their data collection, verification, and statistical analysis techniques.',
      author: {
        '@type': 'Organization',
        name: 'Ukraine War Losses Tracker'
      },
      publisher: {
        '@type': 'Organization',
        name: 'Ukraine War Losses Tracker'
      },
      datePublished: '2025-01-01',
      dateModified: new Date().toISOString().split('T')[0],
      articleSection: 'Methodology',
      keywords: 'ukraine russia war methodology, casualty tracking methodology, military losses data sources, war casualties verification, historylegends, history legends'
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://ukrainewarlosses.org'
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Methodology',
          item: 'https://ukrainewarlosses.org/methodology'
        }
      ]
    }
  };

  return (
    <main className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData)
        }}
      />
      <Header />
      
      {/* Header Banner Ad */}
      {/* <div className="container">
        <AdBanner size="header" adSlot="1234567890" />
      </div> */}

      <div className="container">
        <Breadcrumb items={[
          { name: 'Home', href: '/' },
          { name: 'Methodology', href: '/methodology' }
        ]} />
        {/* Hero Section */}
        <section className="py-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
              📊 Methodology & Data Sources
            </h1>
            <p className="text-xl text-text-light max-w-3xl mx-auto">
              This website aggregates and visualizes open-source casualty data from verified independent databases tracking the Ukraine-Russia war.
            </p>
          </div>
        </section>

        {/* Data Source Attribution - NEW SECTION */}
        <section className="bg-blue-900/20 border border-blue-700/40 rounded-lg p-6 md:p-8 mb-8">
          <h2 className="text-2xl font-bold text-blue-400 mb-6">
            📋 Our Data Sources
          </h2>
          <div className="space-y-4">
            <p className="text-text-light leading-relaxed">
              This website does not collect casualty data directly. Instead, we source all data from two established open-source databases that specialize in tracking and verifying war casualties:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="bg-card-bg border border-border-color rounded-md p-4">
                <h3 className="text-lg font-semibold text-primary mb-2 flex items-center gap-2">
                  <div className="russia-flag"></div>
                  Russian Casualties
                </h3>
                <p className="text-sm text-text-light mb-2">
                  <strong>Source:</strong> <a href="https://svo.rf.gd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">svo.rf.gd</a>
                </p>
                <p className="text-sm text-text-light">
                  An independent database that tracks Russian military casualties through verified sources including obituaries, funeral announcements, and official records.
                </p>
              </div>
              
              <div className="bg-card-bg border border-border-color rounded-md p-4">
                <h3 className="text-lg font-semibold text-primary mb-2 flex items-center gap-2">
                  <div className="ukraine-flag"></div>
                  Ukrainian Casualties
                </h3>
                <p className="text-sm text-text-light mb-2">
                  <strong>Source:</strong> <a href="https://lostarmour.info/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">lostarmour.info</a>
                </p>
                <p className="text-sm text-text-light">
                  A comprehensive database tracking Ukrainian military casualties through verified memorial pages, official announcements, and documented sources.
                </p>
              </div>
            </div>

            <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-md p-4 mt-4">
              <p className="text-sm text-text-light">
                <strong>⚠️ Important:</strong> The methodology described on this page refers to the data collection and verification processes used by our source databases (svo.rf.gd and lostarmour.info). We aggregate their open-source data and present it with monthly visualizations and statistics. All credit for data collection and verification belongs to these independent sources.
              </p>
            </div>
          </div>
        </section>

        {/* Primary Sources Section */}
        <section className="bg-card-bg border border-border-color rounded-lg p-6 md:p-8 mb-8">
          <h2 className="text-2xl font-bold text-text-primary mb-6">
            🎯 Primary Data Sources
          </h2>
          <p className="text-text-light mb-6">
            The databases we source from compile their data through the following verified sources:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-primary mb-4">
                Russian Casualty Sources
              </h3>
              <div className="space-y-4">
                <div className="border-l-4 border-red-400 pl-4">
                  <h4 className="font-semibold text-text-primary">Social Media Memorials</h4>
                  <p className="text-sm text-text-light">Verified posts from family members and communities</p>
                  <ul className="text-sm text-text-light mt-2 space-y-1">
                    <li>• VKontakte death announcements</li>
                    <li>• Odnoklassniki memorial pages</li>
                    <li>• Telegram channel reports</li>
                  </ul>
                </div>
                
                <div className="border-l-4 border-red-400 pl-4">
                  <h4 className="font-semibold text-text-primary">Official Records</h4>
                  <p className="text-sm text-text-light">Government and military documentation</p>
                  <ul className="text-sm text-text-light mt-2 space-y-1">
                    <li>• Regional administration announcements</li>
                    <li>• Military unit notifications</li>
                    <li>• Funeral announcements</li>
                  </ul>
                </div>
                
                <div className="border-l-4 border-red-400 pl-4">
                  <h4 className="font-semibold text-text-primary">Independent Russian Media</h4>
                  <p className="text-sm text-text-light">Verified casualty reports from independent sources</p>
                  <ul className="text-sm text-text-light mt-2 space-y-1">
                    <li>• Regional news outlets</li>
                    <li>• Social media memorials</li>
                    <li>• Local government records</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-primary mb-4">
                Ukrainian Casualty Sources
              </h3>
              <div className="space-y-4">
                <div className="border-l-4 border-blue-400 pl-4">
                  <h4 className="font-semibold text-text-primary">Memorial Databases</h4>
                  <p className="text-sm text-text-light">Dedicated memorial platforms and registries</p>
                  <ul className="text-sm text-text-light mt-2 space-y-1">
                    <li>• National Book of Memory</li>
                    <li>• Memorial Ukraine project</li>
                    <li>• Regional memorial databases</li>
                  </ul>
                </div>
                
                <div className="border-l-4 border-blue-400 pl-4">
                  <h4 className="font-semibold text-text-primary">Official Announcements</h4>
                  <p className="text-sm text-text-light">Government and military communications</p>
                  <ul className="text-sm text-text-light mt-2 space-y-1">
                    <li>• Ministry of Defense reports</li>
                    <li>• Local authority statements</li>
                    <li>• Military unit notifications</li>
                  </ul>
                </div>
                
                <div className="border-l-4 border-blue-400 pl-4">
                  <h4 className="font-semibold text-text-primary">Media & Community</h4>
                  <p className="text-sm text-text-light">Verified reporting and community sources</p>
                  <ul className="text-sm text-text-light mt-2 space-y-1">
                    <li>• Local news media reports</li>
                    <li>• Community memorial pages</li>
                    <li>• Social media tributes</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Data Collection Methodology */}
        <section className="bg-card-bg border border-border-color rounded-lg p-6 md:p-8 mb-8">
          <h2 className="text-2xl font-bold text-text-primary mb-6">
            🔍 Source Database Verification Methodology
          </h2>
          
          <div className="space-y-6">
            <div className="bg-green-900/20 border border-green-700/40 rounded-md p-4 mb-6">
              <h3 className="text-xl font-semibold text-green-400 mb-3">
                ✅ Certification Requirements (Applied by Source Databases)
              </h3>
              <p className="text-text-light leading-relaxed mb-3">
                The source databases (svo.rf.gd and lostarmour.info) maintain strict certification standards for each casualty entry. Their verification process ensures zero tolerance for speculation or unverified claims.
              </p>
              <ul className="text-sm text-text-light space-y-2">
                <li><strong>✓ Name Verification:</strong> Each death includes the full name of the deceased individual</li>
                <li><strong>✓ Death Date Certification:</strong> Every entry requires a confirmed date of death</li>
                <li><strong>✓ Source Documentation:</strong> Each casualty has a social media link to funeral/obituary or official announcement</li>
                <li><strong>✓ Real Documented Deaths Only:</strong> Every number represents an actual, documented death - no estimates, no projections, no speculation</li>
                <li><strong>✓ Zero Speculation Policy:</strong> Only figures that can be directly traced to a verified source with name, date, and documentation link are included</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-primary mb-3">
                Multi-Source Data Compilation
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-text-primary mb-2">Source Integration</h4>
                  <ul className="text-sm text-text-light space-y-1">
                    <li>• Official military reports and statements</li>
                    <li>• Memorial databases and obituaries</li>
                    <li>• Local news and regional reporting</li>
                    <li>• Social media memorials and tributes</li>
                    <li>• Government records and announcements</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary mb-2">Data Processing</h4>
                  <ul className="text-sm text-text-light space-y-1">
                    <li>• Cross-reference verification across sources</li>
                    <li>• Duplicate detection and removal</li>
                    <li>• Date normalization and standardization</li>
                    <li>• Geographic location verification</li>
                    <li>• Military unit identification</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-primary mb-3">
                Quality Assurance Protocol
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card-bg border border-border-color rounded-md p-4">
                  <h4 className="font-semibold text-text-primary mb-2">Initial Verification</h4>
                  <ul className="text-sm text-text-light space-y-1">
                    <li>• Source authenticity check</li>
                    <li>• Documentation link validation</li>
                    <li>• Name and date verification</li>
                    <li>• Duplicate screening</li>
                  </ul>
                </div>
                <div className="bg-card-bg border border-border-color rounded-md p-4">
                  <h4 className="font-semibold text-text-primary mb-2">Ongoing Monitoring</h4>
                  <ul className="text-sm text-text-light space-y-1">
                    <li>• Regular source re-validation</li>
                    <li>• Link availability checks</li>
                    <li>• Information update tracking</li>
                    <li>• Anomaly detection</li>
                  </ul>
                </div>
                <div className="bg-card-bg border border-border-color rounded-md p-4">
                  <h4 className="font-semibold text-text-primary mb-2">Data Integrity</h4>
                  <ul className="text-sm text-text-light space-y-1">
                    <li>• Systematic error detection and correction</li>
                    <li>• Expert review and validation processes</li>
                    <li>• Data completeness and accuracy checks</li>
                    <li>• Regular update and maintenance protocols</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="bg-card-bg border border-border-color rounded-lg p-6 md:p-8 mb-8">
          <h2 className="text-2xl font-bold text-text-primary mb-6">
            ❓ Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">
                How accurate is this casualty data?
              </h3>
              <p className="text-text-light leading-relaxed">
                Our data comes from verified memorial databases (svo.rf.gd and lostarmour.info) that track confirmed casualties. We sample 500+ memorial pages monthly and scale to match official totals. Numbers represent confirmed minimum losses.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">
                How often is the data updated?
              </h3>
              <p className="text-text-light leading-relaxed">
                Data updates are dependent on our sources capabilities to find the new data. The updates are made approximately one time per month, but it's possible to last longer depending on the sources capabilities.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">
                What are the data sources?
              </h3>
              <p className="text-text-light leading-relaxed">
                Ukrainian casualties: ualosses.org memorial database with individual death dates. Russian casualties: svo.rf.gd verified named personnel list. Both sources independently verify casualties before listing.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">
                What's the difference between confirmed and unconfirmed casualties?
              </h3>
              <p className="text-text-light leading-relaxed">
                Confirmed casualties have specific known death dates. Unconfirmed entries have estimated dates (shown in parentheses on memorial pages) due to delayed reporting or incomplete information.
              </p>
            </div>
          </div>
        </section>

        {/* Statistical Analysis */}
        <section className="bg-card-bg border border-border-color rounded-lg p-6 md:p-8 mb-8">
          <h2 className="text-2xl font-bold text-text-primary mb-6">
            📈 Our Statistical Analysis & Visualization
          </h2>
          <p className="text-text-light mb-6">
            While our source databases handle data collection and verification, this website adds value through statistical analysis and data visualization:
          </p>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-primary mb-3">
                Data Processing & Aggregation
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-text-primary mb-2">Monthly Aggregation</h4>
                  <ul className="text-sm text-text-light space-y-1">
                    <li>• Date-based grouping by month</li>
                    <li>• Confirmed vs estimated categorization</li>
                    <li>• Geographic distribution analysis</li>
                    <li>• Military unit breakdown</li>
                    <li>• Temporal trend identification</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary mb-2">Statistical Analysis</h4>
                  <ul className="text-sm text-text-light space-y-1">
                    <li>• Monthly casualty rate calculations</li>
                    <li>• Trend line analysis</li>
                    <li>• Comparative statistics</li>
                    <li>• Historical pattern recognition</li>
                    <li>• Data visualization generation</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-primary mb-3">
                Transparency & Limitations
              </h3>
              <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-md p-4">
                <ul className="text-sm text-text-light space-y-2">
                  <li><strong>📊 Data Completeness:</strong> The numbers represent documented casualties with verifiable sources. Actual casualties may be higher due to unconfirmed deaths, missing records, or unreported losses.</li>
                  <li><strong>⏱️ Reporting Lag:</strong> There is an inherent delay between when casualties occur and when they are documented in public sources. Recent months may show lower numbers that will increase as more information becomes available.</li>
                  <li><strong>🔍 Verification Standards:</strong> We prioritize accuracy over speed. Only casualties meeting strict verification criteria from our source databases are included.</li>
                  <li><strong>🌐 Source Limitations:</strong> Our data is limited to what is publicly documented and verified by our source databases. Not all casualties become public knowledge.</li>
                  <li><strong>📈 Statistical Nature:</strong> This is a statistical analysis of verified public data, not an official military accounting.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Update Frequency */}
        <section className="bg-card-bg border border-border-color rounded-lg p-6 md:p-8 mb-8">
          <h2 className="text-2xl font-bold text-text-primary mb-6">
            🔄 Data Update Process
          </h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-card-bg border border-border-color rounded-md p-4">
                <h3 className="text-lg font-semibold text-primary mb-2">
                  Source Database Updates
                </h3>
                <p className="text-sm text-text-light mb-2">
                  Our source databases (svo.rf.gd and lostarmour.info) continuously monitor and update their casualty records as new verified information becomes available.
                </p>
              </div>
              
              <div className="bg-card-bg border border-border-color rounded-md p-4">
                <h3 className="text-lg font-semibold text-primary mb-2">
                  Our Update Schedule
                </h3>
                <p className="text-sm text-text-light mb-2">
                  We update our visualizations and statistics monthly, pulling the latest verified data from our source databases to ensure accuracy and timeliness.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Ethical Considerations */}
        <section className="bg-card-bg border border-border-color rounded-lg p-6 md:p-8 mb-8">
          <h2 className="text-2xl font-bold text-text-primary mb-6">
            ⚖️ Ethical Considerations
          </h2>
          
          <div className="space-y-4">
            <p className="text-text-light">
              This project, along with our source databases, handles sensitive information with the utmost respect and ethical consideration:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">Respect for the Deceased</h3>
                <ul className="text-sm text-text-light space-y-1">
                  <li>• Every number represents a human life</li>
                  <li>• Families and communities are affected</li>
                  <li>• Data is presented with dignity and respect</li>
                  <li>• No sensationalism or exploitation</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">Data Responsibility</h3>
                <ul className="text-sm text-text-light space-y-1">
                  <li>• Commitment to accuracy and verification</li>
                  <li>• Transparent methodology and sourcing</li>
                  <li>• Clear acknowledgment of limitations</li>
                  <li>• Attribution to original source databases</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Contact/Attribution Footer */}
        <section className="bg-blue-900/20 border border-blue-700/40 rounded-lg p-6 md:p-8 mb-8">
          <h2 className="text-2xl font-bold text-text-primary mb-4">
            📧 Data Sources & Attribution
          </h2>
          <p className="text-text-light mb-4">
            All casualty data is sourced from independent open-source databases. We are grateful for their meticulous work in documenting and verifying war casualties.
          </p>
          <div className="flex flex-col md:flex-row gap-4">
            <a 
              href="https://svo.rf.gd/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-card-bg border border-border-color rounded-md p-4 hover:border-primary transition-colors"
            >
              <h3 className="font-semibold text-primary mb-1">Russian Casualties Database</h3>
              <p className="text-sm text-text-light">svo.rf.gd</p>
            </a>
            <a 
              href="https://lostarmour.info/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-card-bg border border-border-color rounded-md p-4 hover:border-primary transition-colors"
            >
              <h3 className="font-semibold text-primary mb-1">Ukrainian Casualties Database</h3>
              <p className="text-sm text-text-light">lostarmour.info</p>
            </a>
          </div>
        </section>

        {/* Content Ad */}
        {/* <div className="my-8">
          <AdBanner size="content" adSlot="0987654321" />
        </div> */}
      </div>

      <Footer />
    </main>
  );
}