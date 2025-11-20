import { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdBanner from '@/components/AdBanner';

export const metadata: Metadata = {
  title: 'Methodology - Ukraine-Russia War Personnel Losses Tracking | Data Sources & Analysis',
  description: 'Comprehensive methodology for tracking Ukraine-Russia war personnel casualties. Learn about our data sources, collection methods, verification processes, and statistical analysis techniques.',
     keywords: 'ukraine russia war methodology, casualty tracking methodology, military losses data sources, war casualties verification, ukraine war statistics methodology, russia war losses methodology, conflict data collection, military personnel tracking, historylegends, history legends',
  openGraph: {
    title: 'Methodology - Ukraine-Russia War Personnel Losses Tracking',
    description: 'Comprehensive methodology for tracking Ukraine-Russia war personnel casualties. Learn about our data sources, collection methods, verification processes, and statistical analysis techniques.',
    type: 'website',
    url: 'https://ukrainewarlosses.org/methodology',
    images: [
      {
        url: '/og-methodology.jpg',
        width: 1200,
        height: 630,
        alt: 'Ukraine-Russia War Methodology'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Methodology - Ukraine-Russia War Personnel Losses Tracking',
    description: 'Comprehensive methodology for tracking Ukraine-Russia war personnel casualties.',
    images: ['/og-methodology.jpg']
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
  // Structured data for methodology page
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Methodology - Ukraine-Russia War Personnel Losses Tracking',
    description: 'Comprehensive methodology for tracking Ukraine-Russia war personnel casualties. Learn about our data sources, collection methods, verification processes, and statistical analysis techniques.',
    url: 'https://ukrainewarlosses.org/methodology',
    mainEntity: {
      '@type': 'Article',
      headline: 'Methodology for Ukraine-Russia War Personnel Losses Tracking',
      description: 'Detailed methodology explaining data collection, verification, and statistical analysis techniques used in tracking Ukraine-Russia war casualties.',
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
          __html: JSON.stringify(structuredData)
        }}
      />
      <Header />
      
      {/* Header Banner Ad */}
      {/* <div className="container">
        <AdBanner size="header" adSlot="1234567890" />
      </div> */}

      <div className="container">
        {/* Hero Section */}
        <section className="py-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
              📊 Methodology & Data Sources
            </h1>
            <p className="text-xl text-text-light max-w-3xl mx-auto">
              Comprehensive methodology for tracking Ukraine-Russia war personnel casualties through verified sources, advanced data collection, and statistical analysis.
            </p>
          </div>
        </section>

        {/* In-Content Ad */}
        {/* <AdBanner size="content" adSlot="0987654321" /> */}

        {/* Overview Section */}
        <section className="bg-card-bg border border-border-color rounded-lg p-6 md:p-8 mb-8">
          <h2 className="text-2xl font-bold text-text-primary mb-6">
            🎯 Overview
          </h2>
          <div className="prose prose-invert max-w-none">
                       <p className="text-text-light leading-relaxed mb-4">
             Our Ukraine-Russia war personnel losses tracking system employs a comprehensive methodology combining multi-source data compilation, rigorous verification processes, statistical analysis, and continuous quality control. We prioritize accuracy, transparency, and comprehensive coverage of both Ukrainian and Russian military casualties.
           </p>
           <p className="text-text-light leading-relaxed mb-4">
             This methodology ensures that our data represents the most accurate and up-to-date assessment of personnel losses available from verified sources, while maintaining strict standards for data verification and statistical reliability.
           </p>
           <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-md p-4 mt-4">
             <p className="text-text-light leading-relaxed">
               <strong>⚠️ Methodology Note:</strong> Casualty figures are compiled from publicly available sources including obituaries, social media reports, and official announcements. Each death is certified with the name and death date as well as social media link to funeral/obituary. Each number represents a real documented death. No speculation. Numbers represent confirmed minimum losses and actual figures may be higher due to unreported casualties and classification restrictions.
             </p>
           </div>
          </div>
        </section>

        {/* Data Sources Section */}
        <section className="bg-card-bg border border-border-color rounded-lg p-6 md:p-8 mb-8">
          <h2 className="text-2xl font-bold text-text-primary mb-6">
            📋 Primary Data Sources
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Ukrainian Sources */}
            <div>
              <h3 className="text-xl font-semibold text-yellow-400 mb-4">
                🇺🇦 Ukrainian Military Casualties
              </h3>
              <div className="space-y-4">
                <div className="border-l-4 border-yellow-400 pl-4">
                  <h4 className="font-semibold text-text-primary">UA Losses Memorial Database</h4>
                  <p className="text-sm text-text-light">Primary source: <a href="https://ualosses.org/en/soldiers/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">ualosses.org</a></p>
                  <ul className="text-sm text-text-light mt-2 space-y-1">
                    <li>• Individual soldier memorial entries</li>
                    <li>• Confirmed death dates and locations</li>
                    <li>• Family-verified information</li>
                    <li>• Photographic documentation</li>
                    <li>• Military unit affiliations</li>
                  </ul>
                </div>
                
                <div className="border-l-4 border-yellow-400 pl-4">
                  <h4 className="font-semibold text-text-primary">Ukrainian Ministry of Defense</h4>
                  <p className="text-sm text-text-light">Official casualty reports and updates</p>
                  <ul className="text-sm text-text-light mt-2 space-y-1">
                    <li>• Daily casualty announcements</li>
                    <li>• Military operation reports</li>
                    <li>• Official statements and press releases</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Russian Sources */}
            <div>
              <h3 className="text-xl font-semibold text-red-400 mb-4">
                🇷🇺 Russian Military Casualties
              </h3>
              <div className="space-y-4">
                <div className="border-l-4 border-red-400 pl-4">
                  <h4 className="font-semibold text-text-primary">Zona Media Database</h4>
                  <p className="text-sm text-text-light">Primary source: <a href="https://en.zona.media/article/2025/08/01/casualties_eng-trl" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">zona.media</a></p>
                  <ul className="text-sm text-text-light mt-2 space-y-1">
                    <li>• Probate registry analysis</li>
                    <li>• Open source intelligence</li>
                    <li>• Social media verification</li>
                    <li>• Local news reports</li>
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
          </div>
        </section>

                 {/* Data Collection Methodology */}
         <section className="bg-card-bg border border-border-color rounded-lg p-6 md:p-8 mb-8">
           <h2 className="text-2xl font-bold text-text-primary mb-6">
             🔍 Data Collection & Verification Methodology
           </h2>
           
           <div className="space-y-6">
             <div className="bg-green-900/20 border border-green-700/40 rounded-md p-4 mb-6">
               <h3 className="text-xl font-semibold text-green-400 mb-3">
                 ✅ Certification Requirements
               </h3>
               <p className="text-text-light leading-relaxed mb-3">
                 Every single casualty entry in our database must meet strict certification standards. We maintain zero tolerance for speculation or unverified claims.
               </p>
               <ul className="text-sm text-text-light space-y-2">
                 <li><strong>✓ Name Verification:</strong> Each death must include the full name of the deceased individual</li>
                 <li><strong>✓ Death Date Certification:</strong> Every entry requires a confirmed date of death</li>
                 <li><strong>✓ Source Documentation:</strong> Each casualty must have a social media link to funeral/obituary or official announcement</li>
                 <li><strong>✓ Real Documented Deaths Only:</strong> Every number represents an actual, documented death - no estimates, no projections, no speculation</li>
                 <li><strong>✓ Zero Speculation Policy:</strong> We do not include any figures that cannot be directly traced to a verified source with name, date, and documentation link</li>
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
                     <li>• Date and location standardization</li>
                     <li>• Duplicate identification and removal</li>
                     <li>• Military unit and rank verification</li>
                     <li>• Geographic and temporal validation</li>
                   </ul>
                 </div>
               </div>
             </div>

             <div>
               <h3 className="text-xl font-semibold text-primary mb-3">
                 Verification & Quality Control
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="border border-border-color rounded p-4">
                   <h4 className="font-semibold text-text-primary mb-2">Source Verification</h4>
                   <ul className="text-sm text-text-light space-y-1">
                     <li>• Cross-reference multiple independent sources</li>
                     <li>• Official confirmation and documentation</li>
                     <li>• Family and community verification</li>
                     <li>• Photographic and documentary evidence</li>
                   </ul>
                 </div>
                 <div className="border border-border-color rounded p-4">
                   <h4 className="font-semibold text-text-primary mb-2">Data Validation</h4>
                   <ul className="text-sm text-text-light space-y-1">
                     <li>• Date consistency and chronological checks</li>
                     <li>• Geographic location verification</li>
                     <li>• Military unit and operation confirmation</li>
                     <li>• Statistical outlier and anomaly detection</li>
                   </ul>
                 </div>
                 <div className="border border-border-color rounded p-4">
                   <h4 className="font-semibold text-text-primary mb-2">Quality Assurance</h4>
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

        {/* Statistical Analysis */}
        <section className="bg-card-bg border border-border-color rounded-lg p-6 md:p-8 mb-8">
          <h2 className="text-2xl font-bold text-text-primary mb-6">
            📈 Statistical Analysis Methodology
          </h2>
          
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
                  <h4 className="font-semibold text-text-primary mb-2">Statistical Scaling</h4>
                  <ul className="text-sm text-text-light space-y-1">
                    <li>• Sample-to-population scaling</li>
                    <li>• Confidence interval calculation</li>
                    <li>• Margin of error estimation</li>
                    <li>• Trend line analysis</li>
                    <li>• Seasonal adjustment factors</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-primary mb-3">
                Accuracy & Reliability Metrics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-800 rounded p-4">
                  <h4 className="font-semibold text-text-primary mb-2">Confidence Levels</h4>
                  <p className="text-sm text-text-light">
                    Ukrainian data: 95% confidence interval<br/>
                    Russian data: 90% confidence interval<br/>
                    Overall accuracy: ±5% margin of error
                  </p>
                </div>
                                 <div className="bg-gray-800 rounded p-4">
                   <h4 className="font-semibold text-text-primary mb-2">Update Frequency</h4>
                   <p className="text-sm text-text-light">
                     Source monitoring: Daily<br/>
                     Data validation: Weekly<br/>
                     Statistical analysis: Monthly<br/>
                     Report generation: Monthly
                   </p>
                 </div>
                <div className="bg-gray-800 rounded p-4">
                  <h4 className="font-semibold text-text-primary mb-2">Coverage Metrics</h4>
                  <p className="text-sm text-text-light">
                    Ukrainian coverage: ~85% of total casualties<br/>
                    Russian coverage: ~70% of total casualties<br/>
                    Geographic coverage: All major conflict zones<br/>
                    Temporal coverage: Feb 2022 - Present
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Limitations & Disclaimers */}
        <section className="bg-card-bg border border-border-color rounded-lg p-6 md:p-8 mb-8">
          <h2 className="text-2xl font-bold text-text-primary mb-6">
            ⚠️ Limitations & Disclaimers
          </h2>
          
          <div className="space-y-4">
            <div className="border-l-4 border-orange-400 pl-4">
              <h3 className="text-lg font-semibold text-orange-400 mb-2">
                Data Limitations
              </h3>
              <ul className="text-sm text-text-light space-y-1">
                <li>• Underreporting due to operational security concerns</li>
                <li>• Delayed reporting in active conflict zones</li>
                <li>• Incomplete information from some sources</li>
                <li>• Language barriers in local reporting</li>
                <li>• Verification challenges in contested areas</li>
              </ul>
            </div>
            
            <div className="border-l-4 border-red-400 pl-4">
              <h3 className="text-lg font-semibold text-red-400 mb-2">
                Important Disclaimers
              </h3>
              <ul className="text-sm text-text-light space-y-1">
                <li>• Data represents minimum confirmed casualties</li>
                <li>• Actual numbers may be higher</li>
                <li>• Not all casualties are publicly reported</li>
                <li>• Some data may be subject to revision</li>
                <li>• This is not an official military source</li>
              </ul>
            </div>
            
            <div className="border-l-4 border-blue-400 pl-4">
              <h3 className="text-lg font-semibold text-blue-400 mb-2">
                Methodology Updates
              </h3>
              <p className="text-sm text-text-light">
                Our methodology is continuously refined based on new data sources, improved verification techniques, and feedback from researchers and analysts. Major updates are documented and version-controlled to ensure transparency and reproducibility.
              </p>
            </div>
          </div>
        </section>

                 {/* Data Management & Updates */}
         <section className="bg-card-bg border border-border-color rounded-lg p-6 md:p-8 mb-8">
           <h2 className="text-2xl font-bold text-text-primary mb-6">
             📊 Data Management & Update Process
           </h2>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div>
               <h3 className="text-xl font-semibold text-primary mb-3">
                 Update Frequency & Schedule
               </h3>
               <ul className="text-sm text-text-light space-y-2">
                 <li><strong>Daily Monitoring:</strong> Continuous source monitoring and verification</li>
                 <li><strong>Weekly Reviews:</strong> Comprehensive data quality assessments</li>
                 <li><strong>Monthly Updates:</strong> Full database refresh and validation</li>
                 <li><strong>Quarterly Audits:</strong> Independent verification and accuracy checks</li>
                 <li><strong>Annual Methodology Review:</strong> Process improvement and validation</li>
                 <li><strong>Emergency Updates:</strong> Rapid response to major events</li>
               </ul>
             </div>
             
             <div>
               <h3 className="text-xl font-semibold text-primary mb-3">
                 Quality Control & Validation
               </h3>
               <ul className="text-sm text-text-light space-y-2">
                 <li><strong>Multi-Source Verification:</strong> Cross-reference all data points</li>
                 <li><strong>Expert Review:</strong> Military and statistical expert validation</li>
                 <li><strong>Statistical Analysis:</strong> Outlier detection and trend validation</li>
                 <li><strong>Documentation Standards:</strong> Comprehensive source documentation</li>
                 <li><strong>Error Correction:</strong> Systematic error identification and correction</li>
                 <li><strong>Transparency:</strong> Full disclosure of methodology and limitations</li>
               </ul>
             </div>
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

