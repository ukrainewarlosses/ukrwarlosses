'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Header() {
  const [isSticky, setIsSticky] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
            <Link href="/" className="text-primary-dark font-medium py-2 border-b-2 border-transparent hover:text-primary hover:border-primary transition-all duration-200">
              Home
            </Link>
            <Link href="/#overview" className="text-primary-dark font-medium py-2 border-b-2 border-transparent hover:text-primary hover:border-primary transition-all duration-200">
              Overview
            </Link>
            <Link href="/#trends" className="text-primary-dark font-medium py-2 border-b-2 border-transparent hover:text-primary hover:border-primary transition-all duration-200">
              Trends
            </Link>
            <Link href="/#videos" className="text-primary-dark font-medium py-2 border-b-2 border-transparent hover:text-primary hover:border-primary transition-all duration-200">
              Coverage
            </Link>
            <Link href="/#sources" className="text-primary-dark font-medium py-2 border-b-2 border-transparent hover:text-primary hover:border-primary transition-all duration-200">
              Sources
            </Link>
            <Link href="/methodology" className="text-primary-dark font-medium py-2 border-b-2 border-transparent hover:text-primary hover:border-primary transition-all duration-200">
              Methodology
            </Link>
          </nav>
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-primary-dark hover:text-primary transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border-color bg-card-bg">
            <nav className="flex flex-col py-4">
              <Link 
                href="/" 
                className="text-primary-dark font-medium py-3 px-4 hover:text-primary hover:bg-gray-800 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                href="/#overview" 
                className="text-primary-dark font-medium py-3 px-4 hover:text-primary hover:bg-gray-800 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Overview
              </Link>
              <Link 
                href="/#trends" 
                className="text-primary-dark font-medium py-3 px-4 hover:text-primary hover:bg-gray-800 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Trends
              </Link>
              <Link 
                href="/#videos" 
                className="text-primary-dark font-medium py-3 px-4 hover:text-primary hover:bg-gray-800 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Coverage
              </Link>
              <Link 
                href="/#sources" 
                className="text-primary-dark font-medium py-3 px-4 hover:text-primary hover:bg-gray-800 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sources
              </Link>
              <Link 
                href="/methodology" 
                className="text-primary-dark font-medium py-3 px-4 hover:text-primary hover:bg-gray-800 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Methodology
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
