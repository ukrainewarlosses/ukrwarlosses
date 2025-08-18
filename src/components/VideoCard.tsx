'use client';

import { VideoCardProps } from '@/types';

export default function VideoCard({ video }: VideoCardProps) {
  return (
    <div className="border border-border-color rounded-md overflow-hidden transition-all duration-200 bg-gray-800 hover:border-primary hover:shadow-lg hover:shadow-primary/10">
      <div className="relative w-full h-40 bg-border-color">
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${video.youtube_id}?rel=0&modestbranding=1`}
          title={video.title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
          loading="lazy"
        />
      </div>
      <div className="p-4">
        <div className="font-semibold text-text-primary mb-2 line-clamp-2 text-sm leading-tight">
          {video.title}
        </div>
        <div className="text-xs text-text-light">
          {video.channel_name}
        </div>
      </div>
    </div>
  );
}
