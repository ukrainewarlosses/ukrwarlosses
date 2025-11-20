import UpdateIndicator from './UpdateIndicator';
import Image from 'next/image';

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
          
          {/* Collaboration Section */}
          <div className="mt-6 pt-6 border-t border-border-color/30">
            <p className="text-sm text-text-muted mb-4 text-center md:text-left">
              A collaboration between
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-6">
              {/* History Legends */}
              <a 
                href="https://www.youtube.com/@historylegends" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 group transition-all hover:scale-105 active:scale-95"
                title="History Legends on YouTube"
              >
                <div className="relative w-14 h-14 rounded-full overflow-hidden ring-2 ring-primary/30 group-hover:ring-primary/60 group-hover:ring-[3px] transition-all shadow-md">
                  <Image
                    src="/images/history-legends-logo.jpg"
                    alt="History Legends"
                    fill
                    className="object-cover"
                  />
                </div>
                <span className="text-base font-semibold text-text-primary group-hover:text-primary transition-colors">
                  History Legends
                </span>
              </a>

              <span className="text-text-muted hidden sm:inline">and</span>

              {/* Middle East Observer */}
              <a 
                href="https://x.com/ME_Observer_" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 group transition-all hover:scale-105 active:scale-95"
                title="Middle East Observer on X"
              >
                <div className="relative w-14 h-14 rounded-lg overflow-hidden ring-2 ring-primary/30 group-hover:ring-primary/60 group-hover:ring-[3px] transition-all shadow-md">
                  <Image
                    src="/images/middle-east-observer-logo.jpg"
                    alt="Middle East Observer"
                    fill
                    className="object-cover"
                  />
                </div>
                <span className="text-base font-semibold text-text-primary group-hover:text-primary transition-colors">
                  Middle East Observer
                </span>
              </a>
            </div>
          </div>
          
          <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-md p-4 mt-4">
            <p className="text-sm text-primary leading-relaxed">
              <strong>⚠️ Methodology Note:</strong> Casualty figures are compiled from publicly available sources including obituaries, social media reports, and official announcements. Each death is certified with the name and death date as well as social media link to funeral/obituary. Each number represents a real documented death. No speculation. Numbers represent confirmed minimum losses and actual figures may be higher due to unreported casualties and classification restrictions.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
