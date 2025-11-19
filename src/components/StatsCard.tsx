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
      className="border border-border-color rounded-lg p-6 transition-all duration-200 hover:border-primary hover:shadow-lg hover:shadow-primary/10"
      style={{ backgroundColor: '#1b1b1b' }}
    >
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2 text-base font-semibold text-text-muted">
          <div className={getFlagClass()}></div>
          {title}
        </div>
      </div>
      <div className="text-sm text-text-light mb-2">
        Total Fatalities: <span className="text-2xl font-black text-casualty">{displayCount.toLocaleString()}</span>
      </div>
      
      {country === 'ukraine' && breakdown && (breakdown.dead || (typeof breakdown.missing === 'number' && breakdown.missing > 0)) && (
        <div className="mt-2 space-y-1 text-xs">
          {breakdown.dead && (
            <div className="text-text-muted">
              Confirmed Deaths: <span className="text-text-primary font-semibold">{breakdown.dead.toLocaleString()}</span>
            </div>
          )}
          {typeof breakdown.missing === 'number' && breakdown.missing > 0 && (
            <div className="text-text-muted">
              Missing: <span className="text-text-primary font-semibold">{breakdown.missing.toLocaleString()}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
