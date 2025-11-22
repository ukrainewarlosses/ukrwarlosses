interface UpdateIndicatorProps {
  russiaLastDate?: string | null;
  ukraineLastDate?: string | null;
}

export default function UpdateIndicator({ russiaLastDate, ukraineLastDate }: UpdateIndicatorProps) {
  const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex items-center gap-4 my-4 p-3 bg-gray-800 rounded-md border-l-4 border-primary pulse">
      <div className="text-sm text-text-muted font-medium">
        Last recorded Fatalities:
        <span className="ml-2 text-text-primary">Russia: {formatDate(russiaLastDate)}</span>
        <span className="mx-2">|</span>
        <span className="text-text-primary">Ukraine: {formatDate(ukraineLastDate)}</span>
      </div>
    </div>
  );
}
