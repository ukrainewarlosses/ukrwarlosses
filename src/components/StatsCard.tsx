'use client';

import { useEffect, useState, useRef } from 'react';
import { StatsCardProps } from '@/types';

export default function StatsCard({ country, casualties, title, breakdown }: StatsCardProps) {
  const [displayCount, setDisplayCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const animateCounter = (target: number) => {
    let current = 0;
    const increment = target / 80;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      setDisplayCount(Math.floor(current));
    }, 25);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
          animateCounter(casualties);
        }
      },
      { threshold: 0.3 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [casualties, isVisible]);

  const getFlagClass = () => {
    return country === 'ukraine' ? 'ukraine-flag' : 'russia-flag';
  };

  return (
    <div
      ref={cardRef}
      className="bg-card-bg border border-border-color rounded-lg p-6 transition-all duration-200 hover:border-primary hover:shadow-lg hover:shadow-primary/10"
    >
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2 text-base font-semibold text-text-muted">
          <div className={getFlagClass()}></div>
          {title}
        </div>
      </div>
      <div className="text-4xl font-black text-casualty mb-1 leading-none">
        {displayCount.toLocaleString()}
      </div>
      <div className="text-sm text-text-light uppercase tracking-wide font-semibold">
        Total Personnel Losses
      </div>
      
      {breakdown && (breakdown.dead || breakdown.missing || breakdown.prisoners) && (
        <div className="mt-3 pt-3 border-t border-border-color">
          <div className="grid grid-cols-3 gap-2 text-xs">
            {breakdown.dead && (
              <div className="text-center">
                <div className="text-red-400 font-semibold">{breakdown.dead.toLocaleString()}</div>
                <div className="text-text-light">Dead</div>
              </div>
            )}
            {breakdown.missing && (
              <div className="text-center">
                <div className="text-orange-400 font-semibold">{breakdown.missing.toLocaleString()}</div>
                <div className="text-text-light">Missing</div>
              </div>
            )}
            {breakdown.prisoners && (
              <div className="text-center">
                <div className="text-blue-400 font-semibold">{breakdown.prisoners.toLocaleString()}</div>
                <div className="text-text-light">Prisoners</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
