'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Header() {
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`bg-card-bg border-b border-border-color sticky top-0 z-50 transition-all duration-200 ${isSticky ? 'shadow-lg shadow-black/30' : 'shadow-sm shadow-black/10'}`}>
      <div className="container">
        <div className="flex justify-between items-center py-4">
          <Link href="/" className="text-2xl font-bold text-primary no-underline hover:text-primary-dark transition-colors">
            WarLosses.info
          </Link>
          <nav className="hidden md:flex gap-8">
            <Link href="#overview" className="text-primary-dark font-medium py-2 border-b-2 border-transparent hover:text-primary hover:border-primary transition-all duration-200">
              Overview
            </Link>
            <Link href="#trends" className="text-primary-dark font-medium py-2 border-b-2 border-transparent hover:text-primary hover:border-primary transition-all duration-200">
              Trends
            </Link>
            <Link href="#videos" className="text-primary-dark font-medium py-2 border-b-2 border-transparent hover:text-primary hover:border-primary transition-all duration-200">
              Coverage
            </Link>
            <Link href="#sources" className="text-primary-dark font-medium py-2 border-b-2 border-transparent hover:text-primary hover:border-primary transition-all duration-200">
              Sources
            </Link>
          </nav>
          <div className="md:hidden flex justify-center">
            {/* Mobile menu can be added here if needed */}
          </div>
        </div>
      </div>
    </header>
  );
}
