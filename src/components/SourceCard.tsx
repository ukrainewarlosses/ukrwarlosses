interface SourceCardProps {
  title: string;
  description: string;
  url: string;
  country: 'ukraine' | 'russia';
}

export default function SourceCard({ title, description, url, country }: SourceCardProps) {
  const getFlagClass = () => {
    return country === 'ukraine' ? 'ukraine-flag source-flag' : 'russia-flag source-flag';
  };

  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="border border-border-color rounded-md p-4 flex items-center gap-4 text-inherit no-underline transition-all duration-200 bg-gray-800 hover:border-primary hover:bg-border-color"
    >
      <div className={getFlagClass()}></div>
      <div>
        <h3 className="font-semibold text-text-primary mb-1 text-sm">
          {title}
        </h3>
        <p className="text-xs text-text-light">
          {description}
        </p>
      </div>
    </a>
  );
}
