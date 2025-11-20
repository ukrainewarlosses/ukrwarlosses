'use client';

// @ts-ignore - react-emoji-flag doesn't have TypeScript definitions
import CountryFlag from 'react-emoji-flag';

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

export default function ForeignMercenaries({ data }: ForeignMercenariesProps) {
  if (!data) {
    return null;
  }

  return (
    <section id="foreign-mercenaries" className="bg-card-bg border border-border-color rounded-lg p-8 my-8">
      <h2 className="text-xl font-bold text-text-primary mb-6">
        🌍 Foreign Mercenaries Fatalities
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Russia Section */}
        <div className="bg-background border border-border-color rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="russia-flag"></div>
            <h3 className="text-lg font-bold text-text-primary">
              Russian Foreign Fighters
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
            <div className="space-y-1 max-h-64 overflow-y-auto country-list-scroll">
              {data.russia.byCountry.map((item, index) => (
                <div key={index} className="flex justify-between items-center text-sm py-1 border-b border-border-color last:border-0">
                  <span className="text-text-light flex items-center gap-2">
                    <CountryFlag countryCode={item.code} title={item.name} style={{ width: '24px', height: '18px' }} />
                    <span>{item.name}</span>
                  </span>
                  <span className="font-semibold text-text-primary">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Ukraine Section */}
        <div className="bg-background border border-border-color rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="ukraine-flag"></div>
            <h3 className="text-lg font-bold text-text-primary">
              Ukrainian Foreign Fighters
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
            <div className="space-y-1 max-h-64 overflow-y-auto country-list-scroll">
              {data.ukraine.byCountry.map((item, index) => (
                <div key={index} className="flex justify-between items-center text-sm py-1 border-b border-border-color last:border-0">
                  <span className="text-text-light flex items-center gap-2">
                    <CountryFlag countryCode={item.code} title={item.name} style={{ width: '24px', height: '18px' }} />
                    <span>{item.name}</span>
                  </span>
                  <span className="font-semibold text-text-primary">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

