'use client';

import { useEffect } from 'react';
import { AdBannerProps } from '@/types';

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

const AD_SIZES = {
  header: { width: 728, height: 90, label: '728 x 90 Leaderboard Ad' },
  content: { width: 336, height: 280, label: '336 x 280 Large Rectangle Ad' },
  mobile: { width: 300, height: 250, label: '300 x 250 Medium Rectangle Ad' },
  footer: { width: 728, height: 90, label: '728 x 90 Footer Leaderboard Ad' },
};

export default function AdBanner({ size, adSlot }: AdBannerProps) {
  const adSize = AD_SIZES[size];
  
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (err) {
      console.log('AdSense error:', err);
    }
  }, []);

  const getResponsiveClasses = () => {
    switch (size) {
      case 'header':
      case 'footer':
        return 'ad-desktop-only';
      case 'mobile':
        return 'ad-mobile-only';
      default:
        return '';
    }
  };

  return (
    <div className={`bg-card-bg border border-border-color rounded-lg p-4 my-8 text-center ${getResponsiveClasses()}`}>
      <div className="text-xs text-text-light uppercase tracking-wide mb-2 font-medium">
        Advertisement
      </div>
      <div className={`ad-placeholder ${size === 'content' ? 'large' : size === 'mobile' ? 'medium' : ''}`}>
        {adSize.label}
        {/* Production AdSense code - uncomment when ready */}
        {/*
        <ins 
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID}
          data-ad-slot={adSlot}
          data-ad-format={size === 'header' || size === 'footer' ? 'horizontal' : 'rectangle'}
        />
        */}
      </div>
    </div>
  );
}
