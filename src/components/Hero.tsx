import UpdateIndicator from './UpdateIndicator';

export default function Hero() {
  return (
    <section className="bg-card-bg py-8 pb-4 border-b border-border-color">
      <div className="container">
        <div className="text-left">
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-2 leading-tight">
            Ukraine-Russia War Personnel Losses Tracker
          </h1>
          <p className="text-base text-text-muted mb-4 max-w-2xl">
            Real-time tracking of military personnel casualties in the Ukraine-Russia conflict, based on verified open sources, obituaries, and official reports.
          </p>
          
          <UpdateIndicator />
          
          <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-md p-4 mt-4">
            <p className="text-sm text-primary leading-relaxed">
              <strong>⚠️ Methodology Note:</strong> Casualty figures are compiled from publicly available sources including obituaries, social media reports, and official announcements. Numbers represent confirmed minimum losses and actual figures may be higher due to unreported casualties and classification restrictions.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
