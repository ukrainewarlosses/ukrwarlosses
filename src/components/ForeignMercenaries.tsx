'use client';

// @ts-ignore - react-emoji-flag doesn't have TypeScript definitions
import CountryFlag from 'react-emoji-flag';
import { useEffect, useRef, useState } from 'react';

interface CountryInfo {
  name: string;
  code: string;
  count: number;
}

interface MercenaryData {
  russia: {
    total: number;
    byCountry: Array<CountryInfo>;
  };
  ukraine: {
    total: number;
    byCountry: Array<CountryInfo>;
  };
}

interface ForeignMercenariesProps {
  data: MercenaryData;
}

function ScrollableCountryList({ countries }: { countries: Array<CountryInfo> }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showFade, setShowFade] = useState(false);

  useEffect(() => {
    const checkScrollable = () => {
      if (scrollRef.current) {
        const isScrollable = scrollRef.current.scrollHeight > scrollRef.current.clientHeight;
        setShowFade(isScrollable && scrollRef.current.scrollTop < scrollRef.current.scrollHeight - scrollRef.current.clientHeight - 10);
      }
    };

    checkScrollable();
    
    const handleScroll = () => {
      if (scrollRef.current) {
        const isAtBottom = scrollRef.current.scrollHeight - scrollRef.current.scrollTop <= scrollRef.current.clientHeight + 10;
        setShowFade(!isAtBottom);
      }
    };

    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      // Check on resize as well
      window.addEventListener('resize', checkScrollable);
      
      return () => {
        scrollElement.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', checkScrollable);
      };
    }
  }, [countries]);

  return (
    <div className="relative">
      <div 
        ref={scrollRef}
        className="space-y-1 max-h-64 overflow-y-auto country-list-scroll"
      >
        {countries.map((item, index) => (
          <div key={index} className="flex justify-between items-center text-sm py-1 border-b border-border-color last:border-0 pr-2">
            <span className="text-text-light flex items-center gap-2">
              <CountryFlag countryCode={item.code} title={item.name} style={{ width: '24px', height: '18px' }} />
              <span>{item.name}</span>
            </span>
            <span className="font-semibold text-text-primary">{item.count}</span>
          </div>
        ))}
      </div>
      {showFade && <div className="country-list-fade-bottom"></div>}
    </div>
  );
}

export default function ForeignMercenaries({ data }: ForeignMercenariesProps) {
  if (!data) {
    return null;
  }

  return (
    <section id="foreign-mercenaries" className="bg-card-bg border border-border-color rounded-lg p-8 my-8">
      <h2 className="text-xl font-bold text-text-primary mb-6">
        🌍 Foreign Fighters Fatalities
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Russia Section */}
        <div className="bg-background border border-border-color rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="russia-flag"></div>
            <h3 className="text-lg font-bold text-text-primary">
              Russia
            </h3>
          </div>
          <div className="mb-6">
            <p className="text-3xl font-bold text-primary mb-2">
              {data.russia.total.toLocaleString()}
            </p>
            <p className="text-text-muted text-sm">Total Fatalities</p>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-text-primary mb-3">
              By Country:
            </h4>
            <ScrollableCountryList countries={data.russia.byCountry} />
          </div>
        </div>

        {/* Ukraine Section */}
        <div className="bg-background border border-border-color rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="ukraine-flag"></div>
            <h3 className="text-lg font-bold text-text-primary">
              Ukraine
            </h3>
          </div>
          <div className="mb-6">
            <p className="text-3xl font-bold text-primary mb-2">
              {data.ukraine.total.toLocaleString()}
            </p>
            <p className="text-text-muted text-sm">Total Fatalities</p>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-text-primary mb-3">
              By Country:
            </h4>
            <ScrollableCountryList countries={data.ukraine.byCountry} />
          </div>
        </div>
      </div>
    </section>
  );
}

