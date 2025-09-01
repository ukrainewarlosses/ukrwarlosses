import { promises as fs } from 'fs';
import path from 'path';
import { YouTubeService } from '../src/lib/youtube';
import { YouTubeEmbed } from '../src/types';

// Load environment variables from .env file
import * as dotenv from 'dotenv';
dotenv.config({ path: path.join(process.cwd(), '.env') });

interface HardcodedYouTubeData {
  videos: YouTubeEmbed[];
  lastUpdated: string;
}

async function generateHardcodedYouTubeData(): Promise<HardcodedYouTubeData> {
  try {
    console.log('🎥 Generating hardcoded YouTube video data...');
    
    const youtubeService = new YouTubeService();
    let youtubeVideos: YouTubeEmbed[] = [];
    
    try {
      // Fetch latest videos from History Legends
      const videos = await youtubeService.getHistoryLegendsLatestVideos();
      if (videos && videos.length > 0) {
        youtubeVideos = videos.map(video => ({
          title: video.title,
          youtube_id: video.id,
          channel_name: 'History Legends'
        }));
        console.log(`📺 Successfully fetched ${youtubeVideos.length} videos from YouTube API`);
      } else {
        throw new Error('No videos returned from API');
      }
    } catch (error) {
      console.warn('⚠️ Failed to fetch from YouTube API, using fallback videos:', error);
      // Use fallback videos if API fails
      youtubeVideos = [
        {
          title: 'Ukraine War Update - Latest Military Developments',
          youtube_id: 'dQw4w9WgXcQ',
          channel_name: 'History Legends',
        },
        {
          title: 'Military Analysis: Russia vs Ukraine Forces',
          youtube_id: 'oHg5SJYRHA0',
          channel_name: 'History Legends',
        },
        {
          title: 'War Report: Current Situation Analysis',
          youtube_id: 'fC7oUOUEEi4',
          channel_name: 'History Legends',
        },
      ];
    }
    
    console.log(`📊 Generated YouTube data:`, {
      videoCount: youtubeVideos.length,
      videos: youtubeVideos.map(v => ({ title: v.title, id: v.youtube_id }))
    });
    
    const hardcodedData: HardcodedYouTubeData = {
      videos: youtubeVideos,
      lastUpdated: new Date().toISOString()
    };
    
    // Write the hardcoded data file (JSON)
    const outputPath = path.join(process.cwd(), 'src', 'data', 'hardcoded-youtube-data.json');
    await fs.writeFile(outputPath, JSON.stringify(hardcodedData, null, 2), 'utf8');
    
    console.log('✅ Hardcoded YouTube data saved to:', outputPath);
    
    // Also generate TypeScript file with the data
    const tsContent = `// Auto-generated hardcoded YouTube video data
// Last updated: ${new Date().toISOString()}

export interface YouTubeEmbed {
  title: string;
  youtube_id: string;
  channel_name: string;
}

export interface HardcodedYouTubeData {
  videos: YouTubeEmbed[];
  lastUpdated: string;
}

export const hardcodedYouTubeData: HardcodedYouTubeData = ${JSON.stringify(hardcodedData, null, 2)};
`;
    
    const tsOutputPath = path.join(process.cwd(), 'src', 'data', 'hardcoded-youtube-data.ts');
    await fs.writeFile(tsOutputPath, tsContent, 'utf8');
    
    console.log('✅ TypeScript hardcoded YouTube data saved to:', tsOutputPath);
    
    return hardcodedData;
    
  } catch (error) {
    console.error('❌ Error generating hardcoded YouTube data:', error);
    throw error;
  }
}

// Run if called directly
if (process.argv[1] && process.argv[1].includes('generate-hardcoded-youtube-data')) {
  generateHardcodedYouTubeData()
    .then(() => {
      console.log('🎉 YouTube data generation complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Failed to generate YouTube data:', error);
      process.exit(1);
    });
}

export { generateHardcodedYouTubeData };
