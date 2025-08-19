import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-card-bg border-t border-border-color py-8 mt-12">
      <div className="container">
        <div className="text-center text-text-light text-sm leading-relaxed">
          <p className="font-semibold">
            <span className="text-text-primary">UkraineWarLosses.org</span> | Independent tracking of military personnel casualties in the Ukraine-Russia conflict
          </p>
          <p className="mt-2">
            Personnel data compiled from public sources • Not affiliated with any government or military organization
          </p>
          <div className="mt-4 text-xs">
            <span>Last database update: {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'UTC',
              timeZoneName: 'short'
            })}</span>
            <span className="mx-2">|</span>
            <Link href="/methodology" className="text-primary hover:text-primary-dark hover:underline transition-colors">
              Methodology
            </Link>
            <span className="mx-2">|</span>
            <Link href="/contact" className="text-primary hover:text-primary-dark hover:underline transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
