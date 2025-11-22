import { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdBanner from '@/components/AdBanner';
import Breadcrumb from '@/components/Breadcrumb';

export const metadata: Metadata = {
  title: 'Contact - Ukraine-Russia War Personnel Losses Tracker',
  description: 'Contact Ukraine War Losses Tracker for data inquiries, methodology questions, or collaboration opportunities. Independent casualty tracking project with established media partnerships.',
  keywords: 'ukraine war losses contact, russia war casualties contact, war tracking contact, historylegends, history legends',
  openGraph: {
    title: 'Contact - Ukraine-Russia War Personnel Losses Tracker',
    description: 'Contact information for Ukraine War Losses Tracker. Get in touch with questions, feedback, or data inquiries.',
    type: 'website',
    url: 'https://ukrainewarlosses.org/contact',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact - Ukraine-Russia War Personnel Losses Tracker',
    description: 'Contact information for Ukraine War Losses Tracker.',
  },
  alternates: {
    canonical: 'https://ukrainewarlosses.org/contact'
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
};

export default function ContactPage() {
  // Structured data for contact page
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Contact - Ukraine-Russia War Personnel Losses Tracker',
    description: 'Contact information for Ukraine War Losses Tracker. Get in touch with questions, feedback, or data inquiries.',
    url: 'https://ukrainewarlosses.org/contact',
    mainEntity: {
      '@type': 'Organization',
      name: 'Ukraine War Losses Tracker',
      url: 'https://ukrainewarlosses.org'
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
          name: 'Contact',
          item: 'https://ukrainewarlosses.org/contact'
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
      
      <div className="container">
        <Breadcrumb items={[
          { name: 'Home', href: '/' },
          { name: 'Contact', href: '/contact' }
        ]} />
        {/* Hero Section */}
        <section className="py-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
              📧 Contact Us
            </h1>
            <p className="text-xl text-text-light max-w-3xl mx-auto">
              Have questions, feedback, or data inquiries? We'd love to hear from you.
            </p>
          </div>
        </section>

        {/* Contact Information */}
        <section className="bg-card-bg border border-border-color rounded-lg p-6 md:p-8 mb-8">
          <h2 className="text-2xl font-bold text-text-primary mb-6">
            Get in Touch
          </h2>
          
          <div className="space-y-6">
            <div className="bg-blue-900/20 border border-blue-700/40 rounded-md p-4">
              <h3 className="text-lg font-semibold text-primary mb-2">
                About This Project
              </h3>
              <p className="text-text-light leading-relaxed">
                Ukraine War Losses Tracker is an independent project that aggregates and visualizes open-source casualty data from verified databases tracking the Ukraine-Russia war. We source all data from established open-source databases and present it with monthly visualizations and statistics.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-card-bg border border-border-color rounded-md p-4">
                <h3 className="text-lg font-semibold text-primary mb-2">
                  📊 Data Inquiries
                </h3>
                <p className="text-sm text-text-light mb-2">
                  For questions about our data sources, methodology, or statistical analysis, please refer to our <a href="/methodology" className="text-primary hover:underline">Methodology page</a>.
                </p>
              </div>
              
              <div className="bg-card-bg border border-border-color rounded-md p-4">
                <h3 className="text-lg font-semibold text-primary mb-2">
                  🔗 Data Sources
                </h3>
                <p className="text-sm text-text-light mb-2">
                  All casualty data is sourced from independent open-source databases:
                </p>
                <ul className="text-sm text-text-light space-y-1">
                  <li>• <a href="https://svo.rf.gd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">svo.rf.gd</a> - Russian casualties</li>
                  <li>• <a href="https://lostarmour.info/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">lostarmour.info</a> - Ukrainian casualties</li>
                </ul>
              </div>
            </div>

            <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-md p-4">
              <h3 className="text-lg font-semibold text-yellow-400 mb-2">
                ⚠️ Important Notice
              </h3>
              <p className="text-sm text-text-light leading-relaxed">
                This website aggregates data from publicly available open-source databases. We do not collect casualty data directly. For corrections, updates, or questions about specific casualty records, please contact the source databases directly (svo.rf.gd for Russian casualties, lostarmour.info for Ukrainian casualties).
              </p>
            </div>

            <div className="bg-card-bg border border-border-color rounded-md p-4">
              <h3 className="text-lg font-semibold text-primary mb-2">
                💡 Feedback & Suggestions
              </h3>
              <p className="text-sm text-text-light leading-relaxed">
                We welcome feedback and suggestions for improving the website, visualizations, or data presentation. However, please note that we are an independent project with limited resources, and response times may vary.
              </p>
            </div>
          </div>
        </section>

        {/* Attribution */}
        <section className="bg-blue-900/20 border border-blue-700/40 rounded-lg p-6 md:p-8 mb-8">
          <h2 className="text-2xl font-bold text-text-primary mb-4">
            🙏 Acknowledgments
          </h2>
          <p className="text-text-light mb-4">
            We are grateful to the independent open-source databases that meticulously document and verify war casualties. All credit for data collection and verification belongs to these sources:
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
      </div>

      <Footer />
    </main>
  );
}

