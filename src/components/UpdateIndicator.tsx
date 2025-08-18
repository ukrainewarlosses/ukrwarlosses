'use client';

import { useEffect, useState } from 'react';

export default function UpdateIndicator() {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const utcTime = now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC',
        timeZoneName: 'short'
      });
      setCurrentTime(utcTime);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-4 my-4 p-3 bg-gray-800 rounded-md border-l-4 border-primary pulse">
      <div className="text-sm text-text-muted font-medium">
        📊 Last updated: {currentTime}
      </div>
    </div>
  );
}
