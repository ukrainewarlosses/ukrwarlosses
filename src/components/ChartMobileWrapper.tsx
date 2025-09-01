'use client';

import { useState, useEffect } from 'react';
import { Maximize2, X } from 'lucide-react';

interface ChartMobileWrapperProps {
  children: React.ReactNode;
  currentStats?: {
    ukraineTotal: number;
    russiaTotal: number;
    lastUpdated: string;
  };
}

export default function ChartMobileWrapper({ children, currentStats }: ChartMobileWrapperProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [modalHeight, setModalHeight] = useState(0);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const calculateModalHeight = () => {
      // window.innerHeight - 56 (header) - 32 (padding)
      const height = window.innerHeight - 56 - 32;
      setModalHeight(height);
    };
    
    calculateModalHeight();
    window.addEventListener('resize', calculateModalHeight);
    return () => window.removeEventListener('resize', calculateModalHeight);
  }, []);

  // Only show mobile features on mobile
  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Mobile Compact View */}
      {!isFullScreen && (
        <div>
          {/* Quick Stats Cards - Above existing chart */}
          {currentStats && (
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                <p className="text-xs text-gray-400 mb-1">Ukraine Total</p>
                <p className="text-lg font-bold text-blue-400">
                  {currentStats.ukraineTotal.toLocaleString()}
                </p>
              </div>
              <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                <p className="text-xs text-gray-400 mb-1">Russia Total</p>
                <p className="text-lg font-bold text-red-400">
                  {currentStats.russiaTotal.toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* Expand Button */}
          <button
            onClick={() => setIsFullScreen(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg 
                     flex items-center justify-center gap-2 transition-colors mb-4"
          >
            <Maximize2 size={18} />
            <span className="font-medium">View Full Screen</span>
          </button>

          {/* Original Chart - Unchanged */}
          <div className="mobile-compact-chart">
            {children}
          </div>
        </div>
      )}

      {/* Full Screen Modal - Renders the SAME chart in a modal */}
      {isFullScreen && (
        <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
          <div className="bg-gray-800 px-4 py-2 flex justify-between items-center border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white">Casualty Statistics</h2>
            <button
              onClick={() => setIsFullScreen(false)}
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600"
            >
              <X size={20} className="text-gray-300" />
            </button>
          </div>
          
          <div className="flex-1 p-4" style={{ height: modalHeight, width: '100%' }}>
            {children}
          </div>
        </div>
      )}
    </>
  );
}
